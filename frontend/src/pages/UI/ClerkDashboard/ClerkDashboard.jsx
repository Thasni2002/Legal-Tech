"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  Building2, 
  FolderCheck, 
  Globe, 
  FileText, 
  Send, 
  ClipboardList, 
  User, 
  CheckSquare, 
  Plus, 
  Trash2, 
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [stats, setStats] = useState({
    templates: 0,
    cabinets: 0,
    court_visits: 0,
    physical_filings: 0,
    efilings: 0,
    orders_awaiting: 0,
    next_postings: 0,
    assigned_tasks: 0,
    urgent_tasks: 0
  });
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

  const quickNav = [
    { title: "Next Posting", path: "/clerk/next-posting", icon: CalendarIcon, color: "from-blue-600 to-indigo-600", desc: "Update hearing dates & notify counsel" },
    { title: "Court Visit", path: "/clerk/court-visit", icon: Building2, color: "from-emerald-600 to-teal-600", desc: "Daily cause list & check-in tracker" },
    { title: "Physical Filing", path: "/clerk/physical-filing", icon: FolderCheck, color: "from-purple-600 to-indigo-600", desc: "Checklist, court fee & scrutiny status" },
    { title: "Online e-Filing", path: "/clerk/efiling", icon: Globe, color: "from-cyan-600 to-blue-600", desc: "Digital portal uploads & SR receipts" },
    { title: "Court Order Collection", path: "/clerk/order-collection", icon: FileText, color: "from-amber-600 to-orange-600", desc: "Awaiting bench orders & CC tracker" },
    { title: "Client Notice", path: "/clerk/client-notice", icon: Send, color: "from-teal-600 to-emerald-600", desc: "WhatsApp, SMS & Speed Post RPAD" },
    { title: "Task Assignment", path: "/clerk/task-assignment", icon: ClipboardList, color: "from-indigo-600 to-blue-700", desc: "Delegate to typists & office staff" }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
            🏛️ Advocate Clerk Command Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, <span className="capitalize text-blue-300">{user.firstName || user.username || "Clerk"}</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-xl font-medium">
            Manage daily court hall movements, next hearing postings, physical/online filings, court orders, and office tasks.
          </p>
        </div>


      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <CalendarIcon size={20} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase">Upcoming Hearings</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.next_postings} Registered</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <Building2 size={20} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase">Court Visits Logged</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.court_visits} Halls</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
            <FileText size={20} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase">Awaiting Bench Orders</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.orders_awaiting} Cases</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3">
            <FolderCheck size={20} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase">Total Filings</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.physical_filings + stats.efilings} Filed</h3>
        </div>
      </div>




    </div>
  );
}
