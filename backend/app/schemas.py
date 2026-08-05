from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    streak_count: int

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Study Session Schemas ---
class SessionCreate(BaseModel):
    duration_minutes: int

class SessionResponse(BaseModel):
    id: str
    duration_minutes: int
    completed_at: datetime
    owner_id: str

    class Config:
        from_attributes = True

class SessionStats(BaseModel):
    total_sessions: int
    total_minutes: int