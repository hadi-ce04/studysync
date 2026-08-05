import { useState } from "react";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import TaskDashboard from "./components/TaskDashboard";
import PomodoroTimer from "./components/PomodoroTimer";
import AnalyticsCard from "./components/AnalyticsCard";
import StudyRoom from "./components/StudyRoom";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navbar with matching onOpenAuth prop */}
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col items-center">
        {!isAuthenticated ? (
          <div className="my-auto text-center flex flex-col items-center py-16">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-100">
              Welcome to <span className="text-indigo-500">StudySync</span>
            </h1>
            <p className="text-slate-400 max-w-lg mb-8">
              Collaborative task management and study session tracking built for maximum focus.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Get Started / Sign In
            </button>
          </div>
        ) : (
          /* Live Study Room + Analytics + Focus Tools */
          <div className="w-full flex flex-col gap-6">
            <StudyRoom />
            <AnalyticsCard />
            <PomodoroTimer />
            <TaskDashboard />
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}