"use client";

import { API_BASE_URL } from "@/utils/api";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ClientConsultationHistoryView() {
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
  });
  const [selectedTimeDate, setSelectedTimeDate] = useState(null);

  const handleTimeChange = (date) => {
    setSelectedTimeDate(date);
    if (date) {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const timeString = `${hours}:${minutes} ${ampm}`;
      setFormData((prev) => ({ ...prev, time: timeString }));
    } else {
      setFormData((prev) => ({ ...prev, time: "" }));
    }
  };

  const [successToast, setSuccessToast] = useState({ show: false, message: "" });

  const fetchHistory = async (currentUser) => {
    try {
      let url = `${API_BASE_URL}/consultations`;
      if (currentUser) {
        if (currentUser.role === "Client") {
          url += `?client_id=${currentUser.id}`;
        } 
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Show only Completed, Approved, Rescheduled, or Scheduled consultations in history
        const hist = data.filter(
          (item) =>
            item.status === "Completed" ||
            item.status === "Approved" ||
            item.status === "Rescheduled" ||
            item.status === "Scheduled"
        );
        setHistory(hist);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const loggedIn = getLoggedInUser();
    setUser(loggedIn);
    fetchHistory(loggedIn);
  }, []);

  const triggerSuccess = (message) => {
    setSuccessToast({ show: true, message });
    setTimeout(() => {
      setSuccessToast({ show: false, message: "" });
    }, 4000);
  };

  const handleReschedule = async () => {
    if (!formData.date || !formData.time) {
      alert("Please fill Date and Time");
      return;
    }

    const rescheduleData = {
      date: formData.date,
      time: formData.time,
      reason: "Rescheduled by client",
    };

    try {
      const res = await fetch(
        `${API_BASE_URL}/consultations/${rescheduleId}/reschedule`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rescheduleData),
        }
      );

      if (res.ok) {
        triggerSuccess("Rescheduled successfully");
        setShowModal(false);
        setRescheduleId(null);
        fetchHistory(user);
        setFormData({
          date: "",
          time: "",
        });
        setSelectedTimeDate(null);
      } else {
        alert("Failed to reschedule consultation");
      }
    } catch (err) {
      console.error("Error rescheduling:", err);
      alert("Error connecting to server");
    }
  };

  const handleDeleteConsultation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this consultation?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/consultations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerSuccess("Deleted successfully");
        fetchHistory(user);
      } else {
        alert("Failed to delete consultation");
      }
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Error connecting to server");
    }
  };

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 mb-8 flex items-center gap-6">
        <Link
          href="/client-consultation"
          className="flex items-center justify-center w-12 h-12 bg-[#F8FAFC] rounded-full text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Consultation History
          </h1>
          <p className="text-[#64748B] mt-2 text-lg font-medium">
            View your past and approved consultations
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden">
        <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Client</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Duration</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Summary</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-[#64748B] font-medium">
                    Loading history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-[#64748B] font-medium">
                    No previous consultations found.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 text-sm text-[#0F172A] font-bold capitalize whitespace-nowrap">{item.client_name || item.client}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{item.date}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{item.time || "N/A"}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{item.type}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{item.duration || "30 mins"}</td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        item.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'Approved'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.status === 'Rescheduled'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[#475569] max-w-xs truncate" title={item.summary || "No notes yet."}>
                      {item.summary || "No notes yet."}
                    </td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDeleteConsultation(item.id)}
                          className="px-4 py-2 bg-slate-100 hover:bg-rose-100 text-[#475569] hover:text-rose-600 rounded-full transition-colors text-xs font-bold uppercase tracking-wider active:scale-95 shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {mounted && showModal && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold text-[#0F172A]">
                Reschedule Consultation
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F8FAFC] text-[#64748B] hover:bg-rose-100 hover:text-rose-600 transition-colors"
                aria-label="Close"
              >
                <span className="text-xl font-bold">✕</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                  className="w-full border border-[#E2E8F0] rounded-xl p-3.5 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Time</label>
                <div className="w-full border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB] transition-all cursor-pointer">
                  <DatePicker
                    selected={selectedTimeDate}
                    onChange={handleTimeChange}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    placeholderText="Select Time"
                    wrapperClassName="w-full"
                    className="w-full p-3.5 text-[#0F172A] bg-transparent outline-none text-sm font-medium cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-10 pt-8 border-t border-[#F1F5F9]">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleReschedule}
                className="px-8 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* Custom Success Toast */}
      {successToast.show && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 transition-all duration-300 max-w-sm animate-in fade-in slide-in-from-top-4">
          <span className="text-xl">✅</span>
          <div className="flex-1">
            <p className="font-bold text-sm leading-tight">Notification</p>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">{successToast.message}</p>
          </div>
          <button
            onClick={() => setSuccessToast({ show: false, message: "" })}
            className="text-emerald-200 hover:text-white font-bold ml-2 text-sm leading-none focus:outline-none"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
