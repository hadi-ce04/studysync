import { useState, useRef, useEffect } from "react";

interface Track {
  id: string;
  name: string;
  icon: string;
  url: string;
}

const TRACKS: Track[] = [
  {
    id: "rain",
    name: "Soft Rain",
    icon: "🌧️",
    url: "https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3",
  },
  {
    id: "fire",
    name: "Cozy Fireplace",
    icon: "🔥",
    url: "https://assets.mixkit.co/active_storage/sfx/2522/2522-preview.mp3",
  },
  {
    id: "cafe",
    name: "Quiet Cafe",
    icon: "☕",
    url: "https://assets.mixkit.co/active_storage/sfx/301/301-preview.mp3",
  },
  {
    id: "lofi",
    name: "Lo-Fi Beats",
    icon: "🎵",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
  },
];

export default function AmbientSoundboard() {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Object
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle Play / Switch Track
  const toggleTrack = (track: Track) => {
    if (!audioRef.current) return;

    if (activeTrackId === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    } else {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(console.error);
      setActiveTrackId(track.id);
      setIsPlaying(true);
    }
  };

  const activeTrack = TRACKS.find((t) => t.id === activeTrackId);

  return (
    <div className="bg-rose-950/30 p-4 rounded-3xl border border-rose-900/40 flex flex-col gap-3.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center gap-2">
          <span>🎧</span> Cozy Background Soundboard
        </span>

        {isPlaying && activeTrack && (
          <span className="text-[11px] font-semibold text-pink-400 bg-pink-950/60 border border-pink-800/50 px-2.5 py-0.5 rounded-full animate-pulse">
            Playing: {activeTrack.name}
          </span>
        )}
      </div>

      {/* Track Selection Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {TRACKS.map((track) => {
          const isSelected = activeTrackId === track.id && isPlaying;
          return (
            <button
              key={track.id}
              onClick={() => toggleTrack(track)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all border ${
                isSelected
                  ? "bg-pink-600/90 border-pink-400 text-white shadow-lg shadow-pink-600/30 transform scale-[1.02]"
                  : "bg-zinc-950/50 border-rose-900/30 text-rose-200 hover:bg-rose-950/40 hover:border-rose-800/50"
              }`}
            >
              <span>{track.icon}</span>
              <span>{track.name}</span>
            </button>
          );
        })}
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-3 pt-1 px-1">
        <span className="text-xs text-rose-400/80">🔈</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-pink-500"
        />
        <span className="text-xs text-rose-400/80">🔊</span>
        <span className="text-[10px] font-mono text-rose-400/70 min-w-[28px]">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}