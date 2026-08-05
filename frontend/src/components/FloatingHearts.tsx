import { useEffect, useState } from "react";

interface FloatingHeartsProps {
  trigger: string | null; // e.g., "KISS" | "LOVE"
}

interface Particle {
  id: number;
  emoji: string;
  left: number;
  size: number;
  duration: number;
}

export default function FloatingHearts({ trigger }: FloatingHeartsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const emoji = trigger === "KISS" ? "💋" : "💖";
    const newParticles: Particle[] = Array.from({ length: 18 }).map((_, i) => ({
      id: Date.now() + i,
      emoji,
      left: Math.random() * 90 + 5, // random X position %
      size: Math.random() * 1.5 + 1.2, // size multiplier
      duration: Math.random() * 1.5 + 2, // animation speed in seconds
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    // Cleanup particles after animation finishes
    const timer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 3500);

    return () => clearTimeout(timer);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-float-up text-2xl drop-shadow-lg"
          style={{
            left: `${p.left}%`,
            bottom: "-20px",
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.8) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-50vh) scale(1.2) rotate(15deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-105vh) scale(1) rotate(-15deg);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp ease-out forwards;
        }
      `}</style>
    </div>
  );
}