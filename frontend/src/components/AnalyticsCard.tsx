import { useState, useEffect } from "react";
import axios from "axios";

interface AnalyticsData {
  current_streak: number;
  total_sessions: number;
  total_minutes: number;
}

export default function AnalyticsCard() {
  const [data, setData] = useState<AnalyticsData>({
    current_streak: 0,
    total_sessions: 0,
    total_minutes: 0,
  });

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/analytics/streak");
      setData(response.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalHours = (data.total_minutes / 60).toFixed(1);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📊</span> Focus Analytics & Streaks
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {/* Streak Counter */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col items-center">
          <span className="text-2xl mb-1">🔥</span>
          <span className="text-2xl font-black text-amber-400">
            {data.current_streak} {data.current_streak === 1 ? "Day" : "Days"}
          </span>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
            Current Streak
          </span>
        </div>

        {/* Total Focus Hours */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col items-center">
          <span className="text-2xl mb-1">⌛</span>
          <span className="text-2xl font-black text-indigo-400">{totalHours} hrs</span>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
            Total Time
          </span>
        </div>

        {/* Sessions Completed */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col items-center">
          <span className="text-2xl mb-1">🎯</span>
          <span className="text-2xl font-black text-emerald-400">
            {data.total_sessions}
          </span>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
            Sessions Done
          </span>
        </div>
      </div>
    </div>
  );
}