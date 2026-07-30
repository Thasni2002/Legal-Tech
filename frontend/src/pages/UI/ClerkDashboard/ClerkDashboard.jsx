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
  Sparkles,
  CheckCircle2,
  Folder,
  ChevronRight,
  Scale,
  Briefcase,
  FileSpreadsheet
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [courtVisits, setCourtVisits] = useState([]);
  const [physicalFiles, setPhysicalFiles] = useState([]);
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
        setTasks(data || []);
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
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const fetchCourtVisits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/court-visit`);
      if (response.ok) {
        const data = await response.json();
        setCourtVisits(data || []);
      }
    } catch (e) {
      console.error("Failed to load court visits:", e);
    }
  };

  const fetchPhysicalFiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/format-physical-file/`);
      if (response.ok) {
        const data = await response.json();
        setPhysicalFiles(data || []);
      }
    } catch (e) {
      console.error("Failed to load physical files:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      Promise.all([fetchTasks(), fetchStats(), fetchCourtVisits(), fetchPhysicalFiles()]).finally(() => {
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

  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            🏛️ Clerk Workspace
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Welcome back, <span className="capitalize text-[#2563EB]">{user.firstName || user.username || "Clerk"}</span>
          </h1>
          <p className="text-[#64748B] text-sm font-medium">
            Manage daily court visits, physical file formatting, tasks, and leave applications.
          </p>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <Building2 size={20} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase">Court Visits Logged</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{courtVisits.length || stats.court_visits || 0} Halls</h3>
          <p className="text-slate-500 text-xs mt-1">Active court cause lists</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
            <ClipboardList size={20} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase">Active Pending Tasks</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{pendingTasksCount} Tasks</h3>
          <p className="text-slate-500 text-xs mt-1">To-do list items pending</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3">
            <FolderCheck size={20} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase">Cabinets & Files Indexed</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{physicalFiles.length || stats.cabinets || 0} Files</h3>
          <p className="text-slate-500 text-xs mt-1">Physical shelf index records</p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols): Tasks Checklist & Court Visit Feed */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Clerk Tasks Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Clerk Action Checklist</h2>
                  <p className="text-xs text-slate-500">Track daily filing tasks, certified copies, and court room errands</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                {pendingTasksCount} Pending
              </span>
            </div>

            {/* Form to add task */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new task (e.g. File bundle in Hall 3, Collect certified copy)..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1 transition shadow-sm"
              >
                <Plus size={16} />
                Add
              </button>
            </form>

            {/* Task list */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <CheckCircle2 size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">No tasks added yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add your daily errands and filing tasks above to keep track.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      task.completed ? "bg-slate-50 border-slate-200 opacity-75" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                      <button
                        onClick={() => toggleTask(task.id, task.completed)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          task.completed
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 hover:border-blue-500 bg-white"
                        }`}
                      >
                        {task.completed && <CheckSquare size={14} />}
                      </button>
                      <span
                        className={`text-sm truncate font-medium ${
                          task.completed ? "line-through text-slate-400" : "text-slate-800"
                        }`}
                      >
                        {task.text || task.title}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Court Visits & Cause List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Active Court Visits & Cause List</h2>
                  <p className="text-xs text-slate-500">Real-time status of assigned court halls & hearing progress</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/clerk/court-visit")}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>

            {courtVisits.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No court visits recorded for today</p>
                <p className="text-xs text-slate-400 mt-1">Log court hall attendance and cause list items via Court Visit section.</p>
                <button
                  onClick={() => router.push("/clerk/court-visit")}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
                >
                  <Plus size={14} /> Log New Court Visit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courtVisits.slice(0, 4).map((visit, index) => (
                  <div key={visit.id || index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2 hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {visit.court_name || visit.courtName || "Court Hall"}
                      </span>
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                        (visit.status || "").toLowerCase().includes("completed") || (visit.status || "").toLowerCase().includes("attended")
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {visit.status || "Pending"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {visit.case_title || visit.caseTitle || `Item #${visit.item_number || visit.itemNo || index + 1}`}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Advocate: {visit.advocate_name || visit.advocateName || "Assigned"}</span>
                      <span>Item #{visit.item_number || visit.itemNo || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1 col): Physical Files Summary */}
        <div className="space-y-8">
          
          {/* Physical File Cabinet Index Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <FolderCheck size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Physical Files Indexed</h3>
              </div>
              <button
                onClick={() => router.push("/clerk/format-physical-file")}
                className="text-xs text-purple-600 hover:text-purple-700 font-bold"
              >
                Manage
              </button>
            </div>

            {physicalFiles.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Folder size={28} className="mx-auto text-slate-300 mb-1" />
                <p className="text-xs text-slate-500">No physical files formatted yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {physicalFiles.slice(0, 3).map((pf, idx) => (
                  <div key={pf.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{pf.caseTitle || pf.notes || "Case File"}</p>
                      <p className="text-slate-500 text-[11px]">{pf.cabinet || "Cabinet A"} • {pf.shelf || "Shelf 1"}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded text-[10px]">
                      {pf.fileNumber || `#${pf.id}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

