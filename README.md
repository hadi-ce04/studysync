# ⏱️ StudySync — Collaborative Focus & Study Platform

StudySync is a real-time collaborative study web application designed to help students and focus groups study together, track focus sessions, sync lo-fi music, and manage tasks seamlessly.

🔗 **Live Frontend:**    [https://studysync-henna-delta.vercel.app](https://studysync-henna-delta.vercel.app/)  
⚙️ **Live API Backend:** [https://studysync-backend-br2b.onrender.com](https://studysync-backend-br2b.onrender.com)

---

## ✨ Features

* ⏱️ **Pomodoro Focus Timer:** Track individual study sessions with automated session logging and stats.
* 🎧 **Shared Lo-Fi Music Player:** Sync YouTube audio playback across all participants in a study room.
* 💬 **Real-Time Study Rooms:** Instant chat, nudges, reactions, and automated AI study assistant integration (`@ai`).
* 📋 **Task Management:** Create, toggle, and manage personal tasks directly within your dashboard.
* 📈 **Analytics & Streaks:** Track completed sessions and overall study streaks.
* 🔐 **Secure Authentication:** JWT-based user signup and login flow.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React + TypeScript (Vite)
* **Styling:** Tailwind CSS
* **Components & Libs:** `react-youtube`, `axios`
* **Hosting:** Vercel

### **Backend**
* **Framework:** FastAPI (Python)
* **Real-time Engine:** WebSockets
* **Database & ORM:** SQLite / PostgreSQL + SQLAlchemy
* **AI Integration:** Groq / Ollama API
* **Hosting:** Render

---

## 🚀 Local Setup & Installation

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)

### 1. Clone the Repository

git clone https://github.com/hadi-ce04/studysync.git

cd studysync


### 2. Backend Setup

cd backend

python -m venv venv
# On Windows use: venv\Scripts\activate
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload

*Backend runs on `http://localhost:8000`*

### 3. Frontend Setup

cd frontend

npm install

npm run dev

*Frontend runs on `http://localhost:5173`*

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
