export default function StreakCard() {
  return (
    <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 mx-auto">
      {/* Streak Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Current Streak
          </p>
          <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
            5 🔥 <span className="text-sm font-normal text-slate-400">days</span>
          </h3>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 font-bold text-xl">
          ⚡
        </div>
      </div>

      {/* Daily Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Studied Today
          </p>
          <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">
            2.5 <span className="text-sm font-normal text-slate-400">hrs</span>
          </h3>
        </div>
        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 font-bold text-xl">
          ⏱️
        </div>
      </div>

      {/* Partner Status Card (v2/v4 ready) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Study Partner
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-lg font-bold text-white">Anastasia</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Focusing • 45m left</p>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 font-bold text-xl">
          👥
        </div>
      </div>
    </div>
  );
}