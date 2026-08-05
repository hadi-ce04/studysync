import { useState, useRef } from "react";
import YouTube, { type YouTubeEvent } from "react-youtube";

interface SharedMusicPlayerProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  userName: string;
}

export default function SharedMusicPlayer({ socketRef, userName }: SharedMusicPlayerProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("5qap5aO4i9A"); // Default lofi girl stream
  
  const playerRef = useRef<any>(null);

  // Extract YouTube ID from various link formats
  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handlePlayTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const extractedId = extractVideoId(videoUrl);
    if (!extractedId) {
      alert("Please paste a valid YouTube video link!");
      return;
    }

    setVideoId(extractedId);
    setVideoUrl("");

    // Broadcast change to room
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "MUSIC_SYNC",
          sender: userName,
          videoId: extractedId,
          action: "PLAY",
        })
      );
    }
  };

  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const opts = {
    height: "180",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
    },
  };

  return (
    <div className="bg-rose-950/30 p-4 rounded-3xl border border-rose-900/40 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center gap-2">
          <span>🎧</span> Shared Lo-Fi & Music Sync
        </span>
        <span className="text-[10px] font-semibold text-pink-400 bg-pink-950/60 border border-pink-800/50 px-2.5 py-0.5 rounded-full">
          Synced Live 📻
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden border border-rose-900/40 bg-zinc-950">
        <YouTube videoId={videoId} opts={opts} onReady={onPlayerReady} />
      </div>

      <form onSubmit={handlePlayTrack} className="flex gap-2 mt-1">
        <input
          type="text"
          placeholder="Paste YouTube Lo-Fi Link..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="flex-1 bg-zinc-950 border border-rose-900/40 rounded-xl px-4 py-2 text-xs text-rose-100 placeholder-rose-800 focus:outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
        >
          Stream Together
        </button>
      </form>
    </div>
  );
}
