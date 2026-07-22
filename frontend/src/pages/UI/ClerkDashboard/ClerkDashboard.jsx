"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderOpen, User, CheckSquare, Plus, Trash2, AlertCircle } from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [stats, setStats] = useState({ templates: 12, cabinets: 4, objections: 2 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/dashboard/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Failed to load tasks:", e);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/dashboard/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      Promise.all([fetchTasks(), fetchStats()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [router]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/dashboard/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTaskText.trim(), completed: false })
      });
      if (response.ok) {
        const newTask = await response.json();
        setTasks((prev) => [...prev, newTask]);
        setNewTaskText("");
      }
    } catch (e) {
      console.error("Failed to add task:", e);
    }
  };

  const toggleTask = async (id, currentCompleted) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/dashboard/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted })
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      }
    } catch (e) {
      console.error("Failed to toggle task:", e);
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/dashboard/tasks/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete task:", e);
    }
  };

  if (!user) {
    return (
      <div className="w-full h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 text-sm animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-40 -mr-16 -mt-16"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold uppercase tracking-wider">
            🏛️ Clerk Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Welcome back, <span className="capitalize">{user.firstName || user.username || "Clerk"}</span>
          </h1>
          <p className="text-[#64748B] font-medium max-w-xl">
            Access court drafting tools and manage physical file shelf indices.
          </p>
        </div>

        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => router.push("/profile-management")}
            className="flex items-center gap-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-sm px-5 py-3 rounded-xl transition duration-200"
          >
            <User size={16} />
            My Profile
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-blue-100">
            <FileText size={22} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Templates & Drafts</p>
          <h3 className="text-2xl font-extrabold text-[#0F172A] mt-2">{stats.templates} Registered</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
            <FolderOpen size={22} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Shelf Cabinets</p>
          <h3 className="text-2xl font-extrabold text-[#0F172A] mt-2">{stats.cabinets} Cabinets</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 border border-amber-100">
            <AlertCircle size={22} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Objections</p>
          <h3 className="text-2xl font-extrabold text-[#0F172A] mt-2">{stats.objections} Objections</h3>
        </div>
      </div>

      {/* Checklist for interactive feel */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <h2 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
            <CheckSquare size={20} className="text-blue-600" />
            Clerk Checklist & Task Tracker
          </h2>
          <form onSubmit={handleAddTask} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Add new task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 sm:w-64 rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition duration-200 shadow-sm flex items-center gap-1 active:scale-95"
            >
              <Plus size={14} />
              Add
            </button>
          </form>
        </div>

        <div className="divide-y divide-[#F1F5F9] font-medium text-sm text-[#334155]">
          {isLoading ? (
            <div className="py-6 text-center text-slate-400 font-medium animate-pulse">
              Loading checklist...
            </div>
          ) : (
            <>
              {tasks.map((task) => (
                <div key={task.id} className="py-3.5 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className={task.completed ? "line-through text-slate-400" : ""}>
                      {task.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition duration-200"
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="py-6 text-center text-slate-400 font-medium">
                  No tasks logged. Add a new task above!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
