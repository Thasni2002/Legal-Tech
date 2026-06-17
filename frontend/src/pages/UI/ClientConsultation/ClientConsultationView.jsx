"use client";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";

const hearings = [
  {
    caseNo: "CIV/101",
    type: "Property Dispute",
    hearing: "20 June 2026",
    advocate: "Rahul Sharma",
    status: "Active",
  },
  {
    caseNo: "CR/202",
    type: "Criminal Case",
    hearing: "25 June 2026",
    advocate: "Priya Nair",
    status: "Hearing",
  },
];

export default function ClientConsultationView() {
  const [showModal, setShowModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    advocate: "",
    date: "",
    time: "",
    type: "",
  });

  const [rescheduleId, setRescheduleId] = useState(null);
  const [successToast, setSuccessToast] = useState({ show: false, message: "" });

  const fetchConsultations = async (currentUser) => {
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
        // Separate appointments (upcoming: Pending, Approved, Rescheduled, Scheduled, Pending Client) and history
        const upcoming = data.filter(
          (item) =>
            item.status === "Pending" ||
            item.status === "Approved" ||
            item.status === "Rescheduled" ||
            item.status === "Scheduled" ||
            item.status === "Pending Client"
        );
        const hist = data.filter(
          (item) =>
            item.status === "Completed" ||
            item.status === "Approved" ||
            item.status === "Pending" ||
            item.status === "Rescheduled" ||
            item.status === "Scheduled"
        );
        setAppointments(upcoming);
        setHistory(hist);
      }
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
    }
  };

  // Load user details on mount and fetch consultations
  useEffect(() => {
    setMounted(true);
    const loggedIn = getLoggedInUser();
    setUser(loggedIn);
    if (loggedIn) {
      setFormData((prev) => ({
        ...prev,
        name: loggedIn.username,
      }));
    }
    fetchConsultations(loggedIn);
  }, []);

  const triggerSuccess = (message) => {
    setSuccessToast({ show: true, message });
    setTimeout(() => {
      setSuccessToast({ show: false, message: "" });
    }, 4000);
  };

  const handleBookAppointment = async () => {
    if (
      !formData.name ||
      !formData.advocate ||
      !formData.date ||
      !formData.time ||
      !formData.type
    ) {
      alert("Please fill all fields");
      return;
    }

    const bookData = {
      client_name: formData.name,
      client_id: user ? user.id : null,
      advocate_name: formData.advocate,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      issue: "Consultation Request",
      fee: "₹500",
    };

    try {
      const res = await fetch("http://localhost:8000/consultations/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
      });

      if (res.ok) {
        triggerSuccess("booking successfully");
        setShowModal(false);
        fetchConsultations(user);
        setFormData({
          name: user ? user.username : "",
          advocate: "",
          date: "",
          time: "",
          type: "",
        });
      } else {
        alert("Failed to book appointment");
      }
    } catch (err) {
      console.error("Error booking consultation:", err);
      alert("Error connecting to server");
    }
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
        triggerSuccess("booking successfully");
        setRescheduleId(null);
        setShowModal(false);
        fetchConsultations(user);
        setFormData({
          name: user ? user.username : "",
          advocate: "",
          date: "",
          time: "",
          type: "",
        });
      } else {
        alert("Failed to reschedule consultation");
      }
    } catch (err) {
      console.error("Error rescheduling:", err);
      alert("Error connecting to server");
    }
  };

  const handleApproveAppointment = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/consultations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });

      if (res.ok) {
        triggerSuccess("booking successfully");
        fetchConsultations(user);
      } else {
        alert("Failed to approve appointment");
      }
    } catch (err) {
      console.error("Error approving:", err);
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
        triggerSuccess("deleted successfully");
        fetchConsultations(user);
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
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: "40px", fontWeight: 700, lineHeight: 1.2 }}>
          Consultations
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: "18px" }}>
          Book an appointment or join a consultation
        </p>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Book Appointment */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">Book Appointment</h2>
          <p className="text-[#64748B] mt-3">Choose a date and time to meet your advocate.</p>
          <button
            onClick={() => {
              setRescheduleId(null);
              setFormData({
                name: user ? user.username : "",
                advocate: "",
                date: "",
                time: "",
                type: "",
              });
              setShowModal(true);
            }}
            className="mt-6 bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-xl cursor-pointer"
          >
            Book Appointment
          </button>
        </div>

        {/* Video Consultation */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">Video Consultation</h2>
          <p className="text-[#64748B] mt-3">Join a video consultation with your advocate.</p>
          <button className="mt-6 bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-xl cursor-pointer">
            Join Consultation
          </button>
        </div>

        {/* Consultation History */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">Consultation History</h2>
          <p className="text-[#64748B] mt-3">View your previous consultations and logs.</p>
          <Link
            href="/client-consultation/history"
            className="inline-block mt-6 bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-xl transition cursor-pointer"
          >
            View History
          </Link>
        </div>
      </div>

      {/* Consultation Requests */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-6">Consultation Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="p-3 font-semibold text-[#0F172A]">Client Name</th>
                <th className="p-3 font-semibold text-[#0F172A]">Advocate</th>
                <th className="p-3 font-semibold text-[#0F172A]">Date</th>
                <th className="p-3 font-semibold text-[#0F172A]">Time</th>
                <th className="p-3 font-semibold text-[#0F172A]">Type</th>
                <th className="p-3 font-semibold text-[#0F172A]">Fee</th>
                <th className="p-3 font-semibold text-[#0F172A]">Status</th>
                <th className="p-3 font-semibold text-[#0F172A]">Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.filter(item => item.status === "Pending Client").length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-slate-500">
                    No pending consultation requests.
                  </td>
                </tr>
              ) : (
                appointments.filter(item => item.status === "Pending Client").map((item) => (
                  <tr key={item.id} className="border-b hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-3 font-medium text-[#1E293B] capitalize">{item.client_name || item.client}</td>
                    <td className="p-3 text-sm text-[#64748B] capitalize">{item.advocate_name || item.advocate}</td>
                    <td className="p-3 text-sm text-[#64748B]">{item.date}</td>
                    <td className="p-3 text-sm text-[#64748B]">{item.time}</td>
                    <td className="p-3 text-sm text-[#64748B]">{item.type}</td>
                    <td className="p-3 text-sm text-[#16A34A] font-semibold">{item.fee || "₹500"}</td>
                    <td className="p-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-purple-50 text-purple-700 border-purple-200/50">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveAppointment(item.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleId(item.id);
                            setFormData({
                              name: item.client_name,
                              advocate: item.advocate_name || item.advocate,
                              date: item.date,
                              time: item.time,
                              type: item.type,
                            });
                            setShowModal(true);
                          }}
                          className="px-3 py-1.5 bg-[#D97706] hover:bg-[#b45309] text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
                        >
                          Reschedule
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

      {/* Upcoming Hearings */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-6">Upcoming Hearings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="p-3 text-left">Case No</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Next Hearing</th>
                <th className="p-3 text-left">Advocate</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {hearings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    No upcoming hearings.
                  </td>
                </tr>
              ) : (
                hearings.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium text-[#1E293B]">{item.caseNo}</td>
                    <td className="p-3">{item.type}</td>
                    <td className="p-3">{item.hearing}</td>
                    <td className="p-3">{item.advocate}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-200/50'
                          : 'bg-blue-50 text-blue-700 border-blue-200/50'
                      }`}>
                        {item.status}
                      </span>
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
                {rescheduleId ? "Reschedule Consultation" : "Book Appointment"}
              </h2>
            </div>

            <div className="space-y-4">
              {!rescheduleId && (
                <>
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl p-3 text-[#0F172A]"
                  />

                  <input
                    type="text"
                    placeholder="Advocate Name"
                    value={formData.advocate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advocate: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl p-3 text-[#0F172A]"
                  />
                </>
              )}

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

              {!rescheduleId && (
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3 text-[#0F172A]"
                >
                  <option value="">Select Consultation Type</option>
                  <option value="Video Consultation">Video Consultation</option>
                  <option value="Chat Consultation">Chat Consultation</option>
                  <option value="Person to Person">Person to Person</option>
                </select>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={rescheduleId ? handleReschedule : handleBookAppointment}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl cursor-pointer"
              >
                {rescheduleId ? "Reschedule" : "Book"}
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