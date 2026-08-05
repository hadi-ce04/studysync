import { useState, useEffect } from "react";
import axios from "axios";

interface Stats {
  total_sessions: number;
  total_minutes: number;
}

// Dynamic backend URL to prevent production requests from hitting localhost
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://studysync-backend-br2b.onrender.com";

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<Stats>({ total_sessions: 0, total_minutes: 0 });

  // Fetch study statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sessions/stats`);
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch session stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Timer countdown logic
  useEffect(() => {
    // ✅ Fix: Use ReturnType<typeof setInterval> instead of NodeJS.Timeout
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleCompleteSession();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Log completed 25-minute session to backend
  const handleCompleteSession = async () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
    try {
      await axios.post(`${API_BASE_URL}/api/sessions`, {
        duration_minutes: 25,
      });
      fetchStats();
    } catch (err) {
      console.error("Failed to log session:", err);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center">
      <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
        <span>⏱️</span> Pomodoro Focus Timer
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Focus deeply for 25 minutes to lock in a study session.
      </p>

      {/* Timer Clock */}
      <div className="text-6xl font-extrabold tracking-wider text-indigo-400 font-mono my-4 bg-slate-950 px-8 py-4 rounded-2xl border border-slate-800 shadow-inner">
        {formatTime(timeLeft)}
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={toggleTimer}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {isRunning ? "Pause" : "Start Focus"}
        </button>
        <button
          onClick={resetTimer}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all border border-slate-700"
        >
          Reset
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-slate-800 text-center">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
            Completed Sessions
          </span>
          <span className="text-2xl font-extrabold text-white">
            {stats.total_sessions}
          </span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
            Total Focus Time
          </span>
          <span className="text-2xl font-extrabold text-indigo-400">
            {stats.total_minutes} <span className="text-xs text-slate-400">mins</span>
          </span>
        </div>
      </div>
    </div>
  );
}
