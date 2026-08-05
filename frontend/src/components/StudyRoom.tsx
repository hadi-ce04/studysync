import { useState, useRef, useEffect } from "react";
import { soundManager } from "../utils/sound";
import AmbientSoundboard from "./AmbientSoundboard";
import FloatingHearts from "./FloatingHearts";
import SharedMusicPlayer from "./SharedMusicPlayer";

interface Message {
  sender: string;
  text?: string;
  image?: string;
  type: "CHAT" | "IMAGE" | "TIMER_SYNC" | "GOAL_SYNC" | "REACTION" | "NUDGE";
}

interface SharedGoal {
  id: string;
  title: string;
  completed: boolean;
}

interface MemorySnap {
  id: string;
  sender: string;
  imageUrl: string;
  timestamp: string;
  caption?: string;
}

export default function StudyRoom() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<"ROOM" | "MEMORIES">("ROOM");

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");

  // --- Reaction & Nudge States ---
  const [heartTrigger, setHeartTrigger] = useState<string | null>(null);
  const [isNudged, setIsNudged] = useState(false);

  // --- Streak & Memories Log ---
  const [totalMinutes, setTotalMinutes] = useState(150); // Default study hours start
  const [sessionsCompleted, setSessionsCompleted] = useState(6);
  const [memories, setMemories] = useState<MemorySnap[]>([
    {
      id: "1",
      sender: "Hadi",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60",
      timestamp: "Yesterday, 10:30 PM",
      caption: "Completed 50m focus session together! ☕✨",
    },
  ]);

  // --- Shared Goals State ---
  const [goals, setGoals] = useState<SharedGoal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  // --- Synced Timer States ---
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Local Timer Ticker Effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            soundManager.playTimerCompleteSound();

            // Auto log session time!
            setTotalMinutes((m) => m + 25);
            setSessionsCompleted((s) => s + 1);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !roomId.trim()) return;

    const cleanRoomCode = roomId.trim().toLowerCase().replace(/\s+/g, "-");
    const ws = new WebSocket(`ws://localhost:8000/ws/room/${cleanRoomCode}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setJoined(true);
      ws.send(
        JSON.stringify({
          type: "CHAT",
          sender: "Cupid 🏹",
          text: `${userName} slipped into the room... 💕`,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "CHAT" || data.type === "IMAGE") {
        setMessages((prev) => [
          ...prev,
          { sender: data.sender, text: data.text, image: data.image, type: data.type },
        ]);

        if (data.type === "IMAGE" && data.image) {
          // Auto-add images into Memories Gallery!
          const newSnap: MemorySnap = {
            id: Date.now().toString(),
            sender: data.sender,
            imageUrl: data.image,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            caption: "Late night study memory 📸",
          };
          setMemories((prev) => [newSnap, ...prev]);
        }

        if (data.sender !== userName) {
          soundManager.playNotificationSound();
        }
      }

      // Handle Heart Animations
      if (data.type === "REACTION") {
        setHeartTrigger(data.reaction);
        setTimeout(() => setHeartTrigger(null), 100);
      }

      // Handle Nudge / Poke
      if (data.type === "NUDGE") {
        if (data.sender !== userName) {
          soundManager.playNotificationSound();
          setIsNudged(true);
          setTimeout(() => setIsNudged(false), 800);
        }
      }

      // Handle Synced Timers
      if (data.type === "TIMER_SYNC") {
        if (data.action === "START") {
          setTimeLeft(data.timeLeft);
          setIsRunning(true);
        } else if (data.action === "PAUSE" || data.action === "RESET") {
          setTimeLeft(data.timeLeft);
          setIsRunning(false);
        }
      }

      // Handle Shared Goals Sync
      if (data.type === "GOAL_SYNC") {
        setGoals(data.goals);
      }
    };

    ws.onclose = () => setJoined(false);
  };

  const sendTimerAction = (action: "START" | "PAUSE" | "RESET", newTime?: number) => {
    const targetTime = newTime !== undefined ? newTime : timeLeft;

    if (action === "START") setIsRunning(true);
    if (action === "PAUSE") setIsRunning(false);
    if (action === "RESET") {
      setIsRunning(false);
      setTimeLeft(targetTime);
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "TIMER_SYNC",
          sender: userName,
          action: action,
          timeLeft: targetTime,
        })
      );
    }
  };

  // --- Broadcast Reactions / Nudges ---
  const sendReaction = (reactionType: "KISS" | "LOVE") => {
    setHeartTrigger(reactionType);
    setTimeout(() => setHeartTrigger(null), 100);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "REACTION",
          sender: userName,
          reaction: reactionType,
        })
      );
    }
  };

  const sendNudge = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "NUDGE",
          sender: userName,
        })
      );
      sendMessage(undefined, "👉 *poked you! Pay attention~* 🙈");
    }
  };

  const broadcastGoals = (updatedGoals: SharedGoal[]) => {
    setGoals(updatedGoals);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "GOAL_SYNC",
          sender: userName,
          goals: updatedGoals,
        })
      );
    }
  };

  const addSharedGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: SharedGoal = {
      id: Date.now().toString(),
      title: newGoalTitle.trim(),
      completed: false,
    };

    broadcastGoals([...goals, newGoal]);
    setNewGoalTitle("");
  };

  const toggleSharedGoal = (id: string) => {
    const updated = goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g
    );
    broadcastGoals(updated);
  };

  const deleteSharedGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    broadcastGoals(updated);
  };

  const sendMessage = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({
        type: "CHAT",
        sender: userName,
        text: textToSend,
      })
    );
    if (!customText) setInputMsg("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socketRef.current) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Please select an image smaller than 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      socketRef.current?.send(
        JSON.stringify({
          type: "IMAGE",
          sender: userName,
          image: reader.result,
        })
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const leaveRoom = () => {
    if (socketRef.current) socketRef.current.close();
    setJoined(false);
    setMessages([]);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto p-6 bg-gradient-to-b from-rose-950 to-zinc-950 border border-rose-900/40 rounded-3xl shadow-2xl shadow-rose-900/20 flex flex-col gap-6 font-sans transition-transform ${
        isNudged ? "animate-bounce ring-4 ring-pink-500" : ""
      }`}
    >
      <FloatingHearts trigger={heartTrigger} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-rose-100 mb-0.5 flex items-center gap-2">
            <span>✨</span> Our Secret Study Spot
          </h3>
          <p className="text-xs text-rose-300/70">
            Lock in, stay close, and reach your goals together. 💌
          </p>
        </div>

        {joined && (
          <div className="flex bg-rose-950/60 p-1 rounded-2xl border border-rose-900/50">
            <button
              onClick={() => setActiveTab("ROOM")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "ROOM"
                  ? "bg-pink-600 text-white shadow-md"
                  : "text-rose-300 hover:text-white"
              }`}
            >
              Room 🏠
            </button>
            <button
              onClick={() => setActiveTab("MEMORIES")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "MEMORIES"
                  ? "bg-pink-600 text-white shadow-md"
                  : "text-rose-300 hover:text-white"
              }`}
            >
              Memories 📸
            </button>
          </div>
        )}
      </div>

      {!joined ? (
        <form onSubmit={joinRoom} className="flex flex-col gap-5 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1.5">
                Who are you?
              </label>
              <input
                type="text"
                placeholder="e.g. Hadi"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-rose-950/30 border border-rose-800/50 rounded-2xl px-4 py-3 text-sm text-rose-50 placeholder-rose-700 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1.5">
                Our Room Code
              </label>
              <input
                type="text"
                placeholder="e.g. forever-us"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-rose-950/30 border border-rose-800/50 rounded-2xl px-4 py-3 text-sm text-rose-50 placeholder-rose-700 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-rose-600/30 mt-2 transform hover:scale-[1.01]"
          >
            Enter Our Room 💕
          </button>
        </form>
      ) : activeTab === "MEMORIES" ? (
        /* --- MEMORIES & STREAK TAB --- */
        <div className="flex flex-col gap-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-900/50 text-center">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                Total Hours Together ⏱️
              </span>
              <span className="text-2xl font-black text-rose-100">
                {(totalMinutes / 60).toFixed(1)} hrs
              </span>
            </div>
            <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-900/50 text-center">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                Completed Sessions 🔥
              </span>
              <span className="text-2xl font-black text-pink-400">
                {sessionsCompleted} Pomodoros
              </span>
            </div>
          </div>

          {/* Snap Gallery */}
          <div className="bg-zinc-950/50 p-4 rounded-3xl border border-rose-900/40 flex flex-col gap-3">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>📸</span> Shared Study Snaps
            </span>

            {memories.length === 0 ? (
              <p className="text-xs text-rose-700/80 italic text-center py-6">
                No memory snaps saved yet. Send a photo in chat during study sessions!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {memories.map((snap) => (
                  <div
                    key={snap.id}
                    className="relative group bg-rose-950/20 border border-rose-900/40 rounded-2xl overflow-hidden"
                  >
                    <img
                      src={snap.imageUrl}
                      alt="Study memory"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2.5">
                      <div className="flex justify-between items-center text-[10px] text-rose-400/80">
                        <span>{snap.sender}</span>
                        <span>{snap.timestamp}</span>
                      </div>
                      {snap.caption && (
                        <p className="text-xs text-rose-200 mt-1 truncate">
                          {snap.caption}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- MAIN STUDY ROOM TAB --- */
        <div className="flex flex-col gap-6">
          {/* Active Status Bar */}
          <div className="flex justify-between items-center bg-rose-950/40 p-3.5 rounded-2xl border border-rose-900/50">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
              <span className="text-sm font-medium text-rose-200">
                Cozy in <span className="text-pink-400 font-semibold tracking-wide">{roomId}</span>
              </span>
            </div>
            <button
              onClick={leaveRoom}
              className="text-xs text-rose-400/80 hover:text-rose-300 font-semibold px-3 py-1.5 rounded-xl bg-rose-950/50 border border-rose-900/50 transition-all"
            >
              Step Away 🚪
            </button>
          </div>

          {/* --- GLOWING LOVE TIMER --- */}
          <div className="bg-gradient-to-b from-rose-900/20 to-zinc-900/40 p-6 rounded-3xl border border-rose-800/40 flex flex-col items-center justify-center gap-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50"></div>

            <span className="text-xs font-bold text-pink-400 uppercase tracking-[0.2em]">
              Together Time ⏳
            </span>
            <div
              className={`text-6xl font-black tracking-tighter transition-all duration-500 ${
                isRunning
                  ? "text-pink-300 drop-shadow-[0_0_15px_rgba(244,114,182,0.4)]"
                  : "text-rose-200/50"
              }`}
            >
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-3 mt-2">
              {!isRunning ? (
                <button
                  onClick={() => sendTimerAction("START")}
                  className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 py-2.5 rounded-2xl text-xs transition-all shadow-lg shadow-pink-600/30 flex items-center gap-2"
                >
                  ▶ Focus With Me
                </button>
              ) : (
                <button
                  onClick={() => sendTimerAction("PAUSE")}
                  className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 font-bold px-6 py-2.5 rounded-2xl text-xs transition-all flex items-center gap-2"
                >
                  ⏸ Pause For a Bit
                </button>
              )}
              <button
                onClick={() => sendTimerAction("RESET", 25 * 60)}
                className="bg-transparent hover:bg-rose-950/50 text-rose-400/70 font-semibold px-4 py-2.5 rounded-2xl text-xs transition-all"
              >
                ↺ Reset
              </button>
            </div>
          </div>

          {/* --- AMBIENT SOUNDBOARD WIDGET --- */}
          <AmbientSoundboard />

          {/* --- PASTE SHARED MUSIC PLAYER HERE --- */}
          <SharedMusicPlayer socketRef={socketRef} userName={userName} />

          {/* --- COUPLE'S GOALS --- */}
          <div className="bg-rose-950/20 p-5 rounded-3xl border border-rose-900/40 flex flex-col gap-4">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center gap-2">
              <span>💌</span> Our Promises Today
            </span>
...

            <form onSubmit={addSharedGoal} className="flex gap-2">
              <input
                type="text"
                placeholder="What are we finishing today? ✨"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="flex-1 bg-zinc-950/50 border border-rose-900/50 rounded-xl px-4 py-2 text-sm text-rose-100 placeholder-rose-800 focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                className="bg-rose-800/50 hover:bg-rose-700/50 border border-rose-700/50 text-rose-200 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
              >
                Add
              </button>
            </form>

            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
              {goals.length === 0 ? (
                <span className="text-xs text-rose-700/80 italic text-center py-2">
                  No targets set yet. Let's conquer something together!
                </span>
              ) : (
                goals.map((g) => (
                  <div
                    key={g.id}
                    className="flex justify-between items-center bg-zinc-950/40 px-4 py-2.5 rounded-xl border border-rose-900/30 group hover:border-pink-900/50 transition-all"
                  >
                    <label className="flex items-center gap-3 cursor-pointer text-sm flex-1">
                      <input
                        type="checkbox"
                        checked={g.completed}
                        onChange={() => toggleSharedGoal(g.id)}
                        className="rounded-full border-rose-700 text-pink-500 focus:ring-pink-500/50 h-4 w-4 bg-zinc-950 cursor-pointer transition-all"
                      />
                      <span
                        className={`transition-all ${
                          g.completed
                            ? "line-through text-rose-700"
                            : "text-rose-200"
                        }`}
                      >
                        {g.title}
                      </span>
                    </label>
                    <button
                      onClick={() => deleteSharedGoal(g.id)}
                      className="text-rose-800 hover:text-rose-400 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* --- CHAT & REACTION CONTROLS --- */}
          <div className="flex flex-col gap-3">
            <div className="h-52 overflow-y-auto bg-zinc-950/60 p-5 rounded-3xl border border-rose-900/40 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="text-rose-800 text-xs text-center my-auto italic">
                  It's quiet... send a sweet note to start! 🌸
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`text-sm flex flex-col ${
                      msg.sender === userName ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest mb-1 px-1">
                      {msg.sender}
                    </span>
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-[85%] ${
                        msg.sender === "Cupid 🏹"
                          ? "bg-transparent text-pink-400 italic text-center w-full"
                          : msg.sender === userName
                          ? "bg-pink-600 text-white rounded-tr-sm"
                          : "bg-zinc-800 text-rose-100 rounded-tl-sm"
                      }`}
                    >
                      {msg.type === "CHAT" ? (
                        <span>{msg.text}</span>
                      ) : (
                        <img
                          src={msg.image}
                          alt="Shared snap"
                          className="max-w-[200px] max-h-40 rounded-xl object-cover shadow-md mt-1 border border-white/10"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Micro Interaction Buttons */}
            <div className="flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => sendReaction("KISS")}
                className="bg-rose-950/50 hover:bg-rose-900/70 text-rose-200 border border-rose-800/50 text-xs px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 active:scale-95"
                title="Burst Kiss Hearts"
              >
                <span>💋</span> <span className="text-[11px]">Kiss</span>
              </button>
              <button
                type="button"
                onClick={() => sendReaction("LOVE")}
                className="bg-rose-950/50 hover:bg-rose-900/70 text-rose-200 border border-rose-800/50 text-xs px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 active:scale-95"
                title="Burst Pink Hearts"
              >
                <span>💖</span> <span className="text-[11px]">Love</span>
              </button>
              <button
                type="button"
                onClick={sendNudge}
                className="bg-pink-950/50 hover:bg-pink-900/70 text-pink-300 border border-pink-800/50 text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1 active:scale-95 ml-auto"
                title="Send screen nudge"
              >
                <span>👉</span> <span className="text-[11px] font-semibold">Nudge</span>
              </button>
            </div>

            {/* Chat Input Form */}
            <form onSubmit={(e) => sendMessage(e)} className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-zinc-900 hover:bg-zinc-800 text-rose-300 font-semibold px-4 py-3 rounded-2xl text-sm border border-rose-900/40 transition-all flex items-center justify-center"
                title="Send Photo"
              >
                📸
              </button>
              <input
                type="text"
                placeholder="Send a sweet note..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-zinc-950 border border-rose-900/40 rounded-2xl px-5 py-3 text-sm text-rose-100 placeholder-rose-800 focus:outline-none focus:border-pink-500 transition-all"
              />
              <button
                type="submit"
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-pink-600/20"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}