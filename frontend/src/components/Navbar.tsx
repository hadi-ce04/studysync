import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  onOpenAuth: () => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="w-full border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="font-extrabold text-xl tracking-tight text-white">
            StudySync
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-slate-700"
            >
              Logout
            </button>
          ) : (
            <>
              <button
                onClick={onOpenAuth}
                className="text-sm font-semibold text-slate-300 hover:text-white transition-all px-3 py-1.5"
              >
                Sign In
              </button>
              <button
                onClick={onOpenAuth}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}