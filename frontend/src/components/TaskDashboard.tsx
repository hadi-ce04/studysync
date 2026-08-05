import { useState, useEffect } from "react";
import axios from "axios";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  owner_id: string;
}

export default function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch tasks on load
  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/tasks");
      setTasks(response.data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await axios.post("http://localhost:8000/api/tasks", {
        title: newTitle,
      });
      setTasks([response.data, ...tasks]);
      setNewTitle("");
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  // Toggle Complete Status
  const handleToggle = async (id: string) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/tasks/${id}/toggle`);
      setTasks(tasks.map((t) => (t.id === id ? response.data : t)));
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  // Delete Task
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/tasks/${id}`);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <span>📋</span> My Focus Tasks
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Organize your work items before jumping into a study session.
      </p>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg"
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">Loading workspace...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
          No tasks found. Create one above to get started!
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all group"
            >
              <div
                onClick={() => handleToggle(task.id)}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    task.completed
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  {task.completed && <span className="text-xs">✓</span>}
                </div>
                <span
                  className={`text-sm ${
                    task.completed ? "line-through text-slate-500" : "text-slate-200"
                  }`}
                >
                  {task.title}
                </span>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 rounded transition-all opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}