import asyncio
from datetime import date, timedelta
from typing import Dict, List
import re
import json

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from dotenv import load_dotenv

# Load environment variables (.env)
load_dotenv()

from .database import engine, Base, get_db
from . import models, schemas, auth
from ai_service import generate_ai_response

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StudySync API",
    description="Backend API for StudySync collaborative learning platform",
    version="1.0.0",
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "StudySync API is up and running 🚀"}

# --- Auth Endpoints ---
@app.post("/api/auth/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    hashed_pwd = auth.hash_password(user_data.password)
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Protected Task Endpoints ---
@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Task).filter(models.Task.owner_id == current_user.id).all()

@app.post("/api/tasks", response_model=schemas.TaskResponse)
def create_task(
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = models.Task(title=task.title, owner_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.put("/api/tasks/{task_id}/toggle", response_model=schemas.TaskResponse)
def toggle_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db_task.completed = not db_task.completed
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

# --- Protected Study Session Endpoints ---
@app.post("/api/sessions", response_model=schemas.SessionResponse)
def create_session(
    session: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_session = models.StudySession(
        duration_minutes=session.duration_minutes,
        owner_id=current_user.id
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@app.get("/api/sessions/stats", response_model=schemas.SessionStats)
def get_session_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    user_sessions = db.query(models.StudySession).filter(
        models.StudySession.owner_id == current_user.id
    )
    
    total_sessions = user_sessions.count()
    total_minutes = db.query(func.coalesce(func.sum(models.StudySession.duration_minutes), 0)).filter(
        models.StudySession.owner_id == current_user.id
    ).scalar()

    return {
        "total_sessions": total_sessions,
        "total_minutes": total_minutes
    }

# --- Analytics & Streak Endpoint ---
@app.get("/api/analytics/streak")
def get_user_streak(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sessions = db.query(models.StudySession).filter(
        models.StudySession.owner_id == current_user.id
    ).order_by(models.StudySession.completed_at.desc()).all()

    if not sessions:
        return {"current_streak": 0, "total_sessions": 0, "total_minutes": 0}

    session_dates = {s.completed_at.date() for s in sessions}
    today = date.today()
    streak = 0
    check_date = today

    if check_date not in session_dates:
        check_date = today - timedelta(days=1)

    while check_date in session_dates:
        streak += 1
        check_date -= timedelta(days=1)

    total_minutes = sum(s.duration_minutes for s in sessions)

    return {
        "current_streak": streak,
        "total_sessions": len(sessions),
        "total_minutes": total_minutes,
    }

# --- WebSocket Room Manager ---
class ConnectionManager:
    def __init__(self):
        # Maps room_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)

manager = ConnectionManager()

# --- Single WebSocket Endpoint with Groq AI & Music Sync ---
@app.websocket("/ws/room/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # 1. Broadcast original message (Chat, Timer, Reaction, Goal, Nudge, MUSIC_SYNC)
            await manager.broadcast(room_id, data)

            # 2. Catch @ai commands
            text = data.get("text", "")
            if data.get("type") == "CHAT" and "@ai" in text.lower():
                # Extract prompt and strip '@ai'
                prompt = re.sub(r'@ai', '', text, flags=re.IGNORECASE).strip()
                
                if not prompt:
                    prompt = "Give us a quick encouraging study quote!"

                # Generate AI answer using Groq / Ollama hybrid service
                ai_reply = await generate_ai_response(prompt)

                # Broadcast AI response back into room
                await manager.broadcast(room_id, {
                    "type": "CHAT",
                    "sender": "🤖 Study Bot",
                    "text": ai_reply
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await manager.broadcast(room_id, {
            "type": "USER_LEFT", 
            "message": "A partner left the room"
        })