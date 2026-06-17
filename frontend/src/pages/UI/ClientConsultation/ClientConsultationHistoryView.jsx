"use client";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";

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
  const [successToast, setSuccessToast] = useState({ show: false, message: "" });

  useEffect(() => {
    setMounted(true);
    const loggedIn = getLoggedInUser();
    setUser(loggedIn);
    fetchHistory(loggedIn);
  }, []);

  const fetchHistory = async (currentUser) => {
    try {
      let url = "http://localhost:8000/consultations";
      if (currentUser) {
        if (currentUser.role === "Client") {
          url += `?client_id=${currentUser.id}`;
        } else if (
          currentUser.role === "Senior Advocate" ||
          currentUser.role === "Junior Advocate"
        ) {
          url += `?advocate_id=${currentUser.id}`;
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
        `http://localhost:8000/consultations/${rescheduleId}/reschedule`,
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
      const res = await fetch(`http://localhost:8000/consultations/${id}`, {
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
    <div className="w-full space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 flex items-center gap-4">
        <Link
          href="/client-consultation"
          className="flex items-center justify-center w-10 h-10 bg-white border border-[#E2E8F0] rounded-xl shadow-sm text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-[#0F172A] font-bold" style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2 }}>
            Consultation History
          </h1>
          <p className="text-[#64748B] mt-1" style={{ fontSize: "16px" }}>
            View your past and approved consultations
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="p-4 font-semibold text-[#0F172A]">Date</th>
                <th className="p-4 font-semibold text-[#0F172A]">Time</th>
                <th className="p-4 font-semibold text-[#0F172A]">Advocate</th>
                <th className="p-4 font-semibold text-[#0F172A]">Type</th>
                <th className="p-4 font-semibold text-[#0F172A]">Duration</th>
                <th className="p-4 font-semibold text-[#0F172A]">Fee</th>
                <th className="p-4 font-semibold text-[#0F172A]">Status</th>
                <th className="p-4 font-semibold text-[#0F172A]">Summary</th>
                <th className="p-4 font-semibold text-[#0F172A]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500">
                    Loading history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500">
                    No previous consultations found.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 text-sm text-[#1E293B] font-medium">{item.date}</td>
                    <td className="p-4 text-sm text-[#64748B]">{item.time || "N/A"}</td>
                    <td className="p-4 text-sm text-[#1E293B] font-medium">{item.advocate_name || item.advocate}</td>
                    <td className="p-4 text-sm text-[#64748B]">{item.type}</td>
                    <td className="p-4 text-sm text-[#64748B]">{item.duration || "30 mins"}</td>
                    <td className="p-4 text-sm text-[#16A34A] font-semibold">{item.fee || "₹500"}</td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        item.status === 'Completed'
                          ? 'bg-green-50 text-green-700 border-green-200/50'
                          : item.status === 'Approved'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/50'
                          : item.status === 'Rescheduled'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                          : 'bg-slate-50 text-slate-700 border-slate-200/50'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[#64748B] max-w-xs truncate" title={item.summary || "No notes yet."}>
                      {item.summary || "No notes yet."}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-3">
                        {item.status === "Approved" ? (
                          <span className="text-blue-600 font-semibold">Approved</span>
                        ) : item.status === "Rescheduled" ? (
                          <span className="text-[#D97706] font-semibold">Rescheduled</span>
                        ) : (
                          <span className="text-gray-400 text-xs">No Action</span>
                        )}
                        <button
                          onClick={() => handleDeleteConsultation(item.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors text-xs font-medium cursor-pointer"
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
        <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-[#64748B] transition-colors cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-[#0F172A]">
                Reschedule Consultation
              </h2>
            </div>

            <div className="space-y-4">
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-[#0F172A]"
              />

              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    time: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-[#0F172A]"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleReschedule}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl cursor-pointer"
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
