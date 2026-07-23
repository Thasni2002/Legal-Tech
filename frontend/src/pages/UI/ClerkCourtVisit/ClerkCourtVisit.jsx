"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  User, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle,
  Play,
  Square
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkCourtVisit() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    court_name: "",
    court_hall: "",
    judge_name: "",
    purpose_of_visit: "Cause List Followup",
    visit_status: "Pending",
    notes: "",
    visit_date: new Date().toISOString().split("T")[0]
  });

  const fetchVisits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/court-visit`);
      if (response.ok) {
        const data = await response.json();
        setVisits(data);
      }
    } catch (e) {
      console.error("Failed to load visits:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      fetchVisits().finally(() => setIsLoading(false));
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/court-visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const newVisit = await response.json();
        setVisits((prev) => [newVisit, ...prev]);
        setIsModalOpen(false);
        setFormData({
          court_name: "",
          court_hall: "",
          judge_name: "",
          purpose_of_visit: "Cause List Followup",
          visit_status: "Pending",
          notes: "",
          visit_date: new Date().toISOString().split("T")[0]
        });
      }
    } catch (err) {
      console.error("Failed to save court visit:", err);
    }
  };

  const handleCheckIn = async (visit) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/court-visit/${visit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_status: "In Court",
          check_in_time: nowStr
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setVisits((prev) => prev.map((v) => (v.id === visit.id ? updated : v)));
      }
    } catch (err) {
      console.error("Check-in error:", err);
    }
  };

  const handleCheckOut = async (visit) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/court-visit/${visit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_status: "Completed",
          check_out_time: nowStr
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setVisits((prev) => prev.map((v) => (v.id === visit.id ? updated : v)));
      }
    } catch (err) {
      console.error("Check-out error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this court visit log?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/court-visit/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setVisits((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider">
            🏛️ Daily Movement & Cause List Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Court Visit Tracker
          </h1>
          <p className="text-emerald-100 text-sm max-w-2xl font-medium">
            Schedule morning court visits, record check-in/out timestamps across judge halls, and log bench observations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
        >
          <Plus size={18} />
          Log Court Visit
        </button>
      </div>

      {/* Visit List */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
          <p className="text-slate-400 text-sm font-medium">Loading court visit logs...</p>
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Court Visits Scheduled</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Log your scheduled court hall visits to track morning attendance and check-in times.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visits.map((visit) => (
            <div key={visit.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    visit.visit_status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    visit.visit_status === 'In Court' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {visit.visit_status}
                  </span>
                  <button onClick={() => handleDelete(visit.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{visit.court_name}</h3>
                
                <div className="space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span>Court Hall: <strong>{visit.court_hall || 'Main Hall'}</strong></span>
                  </div>
                  {visit.judge_name && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span>Judge: {visit.judge_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span>Purpose: <strong>{visit.purpose_of_visit}</strong></span>
                  </div>
                </div>

                {visit.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    "{visit.notes}"
                  </p>
                )}
              </div>

              {/* Action Check In / Check Out */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>In: {visit.check_in_time || '--:--'}</span>
                  <span>Out: {visit.check_out_time || '--:--'}</span>
                </div>

                <div className="flex gap-2">
                  {visit.visit_status === 'Pending' && (
                    <button
                      onClick={() => handleCheckIn(visit)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                    >
                      <Play size={14} /> Check In Now
                    </button>
                  )}
                  {visit.visit_status === 'In Court' && (
                    <button
                      onClick={() => handleCheckOut(visit)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <Square size={14} /> Check Out & Complete
                    </button>
                  )}
                  {visit.visit_status === 'Completed' && (
                    <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200">
                      ✓ Visit Completed
                    </div>
                  )}
                </div>
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
              <h2 className="text-xl font-extrabold text-slate-900">Log Scheduled Court Visit</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Court Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Civil Court Hall 4"
                  value={formData.court_name}
                  onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Court Hall</label>
                  <input
                    type="text"
                    placeholder="Hall # 02"
                    value={formData.court_hall}
                    onChange={(e) => setFormData({ ...formData, court_hall: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Judge Name</label>
                  <input
                    type="text"
                    placeholder="Hon. Judge ABC"
                    value={formData.judge_name}
                    onChange={(e) => setFormData({ ...formData, judge_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Purpose of Visit</label>
                <select
                  value={formData.purpose_of_visit}
                  onChange={(e) => setFormData({ ...formData, purpose_of_visit: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Cause List Followup">Cause List Followup</option>
                  <option value="Filing Registry Scrutiny">Filing Registry Scrutiny</option>
                  <option value="Certified Copy Application">Certified Copy Application</option>
                  <option value="Attending Hearing Item">Attending Hearing Item</option>
                  <option value="Process Summons Delivery">Process Summons Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  Save Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
