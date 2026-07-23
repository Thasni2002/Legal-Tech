"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardList, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  MessageSquare,
  Trash2
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkTaskAssignment() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee_role: "Typist",
    assignee_name: "",
    due_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    priority: "Medium",
    status: "Pending",
    comments: ""
  });

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/task-assignment`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Failed to load assigned tasks:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      fetchTasks().finally(() => setIsLoading(false));
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/task-assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const newRecord = await response.json();
        setTasks((prev) => [newRecord, ...prev]);
        setIsModalOpen(false);
        setFormData({
          title: "",
          description: "",
          assignee_role: "Typist",
          assignee_name: "",
          due_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          priority: "Medium",
          status: "Pending",
          comments: ""
        });
      }
    } catch (err) {
      console.error("Save task error:", err);
    }
  };

  const handleUpdateStatus = async (task, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/task-assignment/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const updated = await response.json();
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      }
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/task-assignment/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setTasks((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
            📋 Office Task Delegation & Workflows
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Clerk Task Assignment
          </h1>
          <p className="text-indigo-100 text-sm max-w-2xl font-medium">
            Delegate typing jobs, document stitching, and registry followups to Typists, Junior Advocates, and Office Staff.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
        >
          <Plus size={18} />
          Delegate New Task
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-400 text-sm font-medium">Loading delegated tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Delegated Tasks</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Click "Delegate New Task" to assign work to office staff, typists, or junior advocates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                    task.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {task.priority} Priority
                  </span>
                  <button onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                
                <div className="space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-slate-400" />
                    <span>Role: <strong>{task.assignee_role}</strong> {task.assignee_name ? `(${task.assignee_name})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span>Due Date: <strong>{task.due_date}</strong></span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateStatus(task, e.target.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    task.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xl font-extrabold text-slate-900">Delegate Task to Staff</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Type Plaint Index & Stitch Brief File"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assignee Role *</label>
                  <select
                    value={formData.assignee_role}
                    onChange={(e) => setFormData({ ...formData, assignee_role: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Typist">Typist / Document Specialist</option>
                    <option value="Junior Advocate">Junior Advocate</option>
                    <option value="Office Staff">Office Staff / Attendant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assignee Name</label>
                  <input
                    type="text"
                    placeholder="Person Name"
                    value={formData.assignee_name}
                    onChange={(e) => setFormData({ ...formData, assignee_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Task instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Delegate Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
