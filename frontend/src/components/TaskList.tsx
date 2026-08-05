import { useState, useEffect } from "react";
import axios from "axios";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const API_URL = "http://localhost:8000/api/tasks";

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Fetch tasks from PostgreSQL backend on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks from DB:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Add new task to PostgreSQL backend
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await axios.post(API_URL, {
        title: newTaskTitle.trim(),
      });
      setTasks((prev) => [...prev, response.data]);
      setNewTaskTitle("");
    } catch (error) {
      console.error("Error saving task to DB:", error);
    }
  };

  // Toggle local completion state
  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4 text-white">
      <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-between">
        🎯 Daily Tasks
        <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
          {tasks.filter((t) => t.completed).length}/{tasks.length} Done
        </span>
      </h2>

      {/* Input Form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new goal..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all"
        >
          Add
        </button>
      </form>

      {/* Task List */}
      <div className="flex flex-col gap-2 mt-2 max-h-60 overflow-y-auto">
        {loading ? (
          <p className="text-center text-slate-500 text-sm py-4">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-4">
            No tasks yet. Add one above!
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                task.completed
                  ? "bg-slate-950/50 border-slate-900 text-slate-500"
                  : "bg-slate-950 border-slate-800 text-slate-200"
              }`}
            >
              <div
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span
                  className={`text-sm ${
                    task.completed ? "line-through text-slate-500" : ""
                  }`}
                >
                  {task.title}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}