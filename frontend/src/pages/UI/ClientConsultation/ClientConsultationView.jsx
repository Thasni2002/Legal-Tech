"use client";

import { API_BASE_URL } from "@/utils/api";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ClientConsultationView() {
  const [showModal, setShowModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const [hearings, setHearings] = useState([]);

  const formatDateString = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTimeString = (timeStr) => {
    if (!timeStr) return "N/A";
    return timeStr;
  };

  const handleDismissNotification = (id) => {
    const newDismissed = [...dismissedNotifications, id];
    setDismissedNotifications(newDismissed);
    localStorage.setItem("client_dismissed_consultation_notifications", JSON.stringify(newDismissed));
  };

  // Permission state for Consultation module
  const [canAddConsultation, setCanAddConsultation] = useState(true); // default allow until loaded
  const [advocates, setAdvocates] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    advocate: "",
    date: "",
    time: "",
    type: "",
  });
  const [selectedTimeDate, setSelectedTimeDate] = useState(null);

  const handleTimeChange = (date) => {
    setSelectedTimeDate(date);
    if (date) {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeString = `${hours}:${minutes} ${ampm}`;
      setFormData((prev) => ({ ...prev, time: timeString }));
    } else {
      setFormData((prev) => ({ ...prev, time: "" }));
    }
  };

  const [rescheduleId, setRescheduleId] = useState(null);
  const [successToast, setSuccessToast] = useState({ show: false, message: "" });

  const fetchConsultations = async (currentUser) => {
    try {
      let url = `${API_BASE_URL}/consultations`;
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
        const upcoming = data.filter(
          (item) =>
            item.status === "Pending" ||
            item.status === "Approved" ||
            item.status === "Rescheduled" ||
            item.status === "Scheduled" ||
            item.status === "Pending Client" ||
            item.status === "Pending Advocate"
        );
        const hist = data.filter(
          (item) =>
            item.status === "Completed" ||
            item.status === "Approved" ||
            item.status === "Pending" ||
            item.status === "Rescheduled" ||
            item.status === "Scheduled" ||
            item.status === "Pending Client" ||
            item.status === "Pending Advocate"
        );
        setAppointments(upcoming);
        setHistory(hist);
      }
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
    }
  };

  const fetchHearings = async (currentUser, currentAdvocates = []) => {
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((c) => {
          if (!c.next_hearing_date || c.next_hearing_date === "N/A") {
            return false;
          }
          if (currentUser) {
            if (currentUser.role === "Client") {
              const clientEmailMatch = c.email_id && currentUser.email && c.email_id.toLowerCase() === currentUser.email.toLowerCase();
              const clientNameMatch = c.client_name && currentUser.username && c.client_name.toLowerCase() === currentUser.username.toLowerCase();
              return clientEmailMatch || clientNameMatch;
            } else if (
              currentUser.role === "Senior Advocate" ||
              currentUser.role === "Junior Advocate"
            ) {
              let advocateName = currentUser.username;
              const matchingAdv = currentAdvocates.find(
                (a) => (a.email_address || a.email) && currentUser.email && 
                       (a.email_address || a.email).toLowerCase() === currentUser.email.toLowerCase()
              );
              if (matchingAdv) {
                advocateName = matchingAdv.advocate_name || matchingAdv.advocateName;
              }
              
              const advocateNameMatch = c.selected_advocate && advocateName && c.selected_advocate.toLowerCase() === advocateName.toLowerCase();
              const advocateUsernameMatch = c.selected_advocate && currentUser.username && c.selected_advocate.toLowerCase() === currentUser.username.toLowerCase();
              return advocateNameMatch || advocateUsernameMatch;
            }
          }
          return true;
        });

        const mapped = filtered.map((c) => ({
          caseNo: c.case_no || "N/A",
          type: c.case_title || c.case_type || "N/A",
          hearing: c.next_hearing_date,
          advocate: c.selected_advocate || "N/A",
          status: c.status || "Active",
        }));

        setHearings(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch hearings:", err);
    }
  };

  // Resolve effective permission for Consultation → add
  const resolveConsultationAddPermission = async (loggedInUser) => {
    if (!loggedInUser) return;
    try {
      // 1. Try user's custom permissions first
      const resUser = await fetch(`${API_BASE_URL}/permissions/users/${loggedInUser.id}`);
      if (resUser.ok) {
        const userData = await resUser.json();
        const custom = userData.customPermissions || {};
        if (custom["Consultation"] !== undefined) {
          setCanAddConsultation(custom["Consultation"].add === true);
          return;
        }
      }
    } catch (_) { }

    try {
      // 2. Fall back to role defaults
      const resPerms = await fetch(`${API_BASE_URL}/permissions`);
      if (resPerms.ok) {
        const allPerms = await resPerms.json();
        const rolePerms = allPerms[loggedInUser.role] || {};
        const consultPerm = rolePerms["Consultation"];
        if (consultPerm !== undefined) {
          setCanAddConsultation(consultPerm.add === true);
          return;
        }
      }
    } catch (_) { }

    // 3. Default: allow (no restriction configured)
    setCanAddConsultation(true);
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
    if (loggedIn) {
      resolveConsultationAddPermission(loggedIn);
    }
    const dismissed = JSON.parse(localStorage.getItem("client_dismissed_consultation_notifications") || "[]");
    setDismissedNotifications(dismissed);

    const loadAdvocates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lawfirm-management/`);
        if (res.ok) {
          const advList = await res.json();
          setAdvocates(advList);
          fetchHearings(loggedIn, advList);
        } else {
          fetchHearings(loggedIn, []);
        }
      } catch (err) {
        console.error("Failed to fetch advocates:", err);
        fetchHearings(loggedIn, []);
      }
    };
    loadAdvocates();
  }, []);


  const triggerSuccess = (message) => {
    setSuccessToast({ show: true, message });
    setTimeout(() => {
      setSuccessToast({ show: false, message: "" });
    }, 4000);
  };

  const handleBookAppointment = async () => {
    if (!canAddConsultation) {
      alert("You do not have permission to book a consultation.");
      return;
    }
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
      const res = await fetch(`${API_BASE_URL}/consultations/book`, {
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
        setSelectedTimeDate(null);
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
      reason: "Requested by client",
      status: "Pending Advocate"
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
        triggerSuccess("Reschedule request sent successfully");
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
        setSelectedTimeDate(null);
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
      const res = await fetch(`${API_BASE_URL}/consultations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });

      if (res.ok) {
        triggerSuccess("Approved successfully");
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
      const res = await fetch(`${API_BASE_URL}/consultations/${id}`, {
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
    <div className="w-full space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
          Case Discussion
        </h1>
        <p className="text-[#64748B] mt-2 text-lg font-medium">
          Book an appointment or join a consultation
        </p>
      </div>

      {/* Notifications */}
      {mounted && appointments.filter(item => {
        if (dismissedNotifications.includes(item.id)) return false;
        const isApprovedByAdvocate = item.status === "Approved" && item.reschedule_reason === "Approved by advocate";
        const isRescheduledByAdvocate = item.status === "Rescheduled" && item.reschedule_reason?.includes("advocate");
        return isApprovedByAdvocate || isRescheduledByAdvocate;
      }).length > 0 && (
          <div className="space-y-3 mb-6">
            {appointments.filter(item => {
              if (dismissedNotifications.includes(item.id)) return false;
              const isApprovedByAdvocate = item.status === "Approved" && item.reschedule_reason === "Approved by advocate";
              const isRescheduledByAdvocate = item.status === "Rescheduled" && item.reschedule_reason?.includes("advocate");
              return isApprovedByAdvocate || isRescheduledByAdvocate;
            }).map(item => {
              const isApproved = item.status === "Approved";
              return (
                <div
                  key={item.id}
                  className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-300 ${isApproved
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                >
                  <div className="flex gap-3 items-center">
                    <span className="text-xl">{isApproved ? "✅" : "🗓️"}</span>
                    <div>
                      <p className="font-semibold text-sm">
                        {isApproved
                          ? `Your consultation request has been approved`
                          : `Your consultation has been rescheduled`}
                      </p>
                      <p className="text-xs mt-0.5 opacity-90">
                        Scheduled for: <span className="font-medium">{formatDateString(item.date)}</span> at <span className="font-medium">{formatTimeString(item.time)}</span> ({item.type})
                        {!isApproved && item.reschedule_reason && (
                          <span className="block mt-1 font-medium italic">Reason: {item.reschedule_reason}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissNotification(item.id)}
                    className="text-gray-400 hover:text-gray-700 font-bold ml-4 text-sm leading-none focus:outline-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full">
        {/* Book Appointment */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300">
          <div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-xl mb-4">📅</div>
            <h2 className="text-xl font-extrabold text-[#0F172A]">Book Appointment</h2>
            <p className="text-[#64748B] mt-2 text-sm font-medium">Choose a date and time to meet your advocate.</p>
          </div>
          {canAddConsultation ? (
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
              className="w-full mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Book Appointment
            </button>
          ) : (
            <div className="w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-red-50 border border-red-200 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
              <span>🔒</span>
              <span>Booking not permitted</span>
            </div>
          )}
        </div>



        {/* Consultation History */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300">
          <div>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-xl mb-4">📜</div>
            <h2 className="text-xl font-extrabold text-[#0F172A]">Consultation History</h2>
            <p className="text-[#64748B] mt-2 text-sm font-medium">View your previous consultations and logs.</p>
          </div>
          <Link
            href="/client-consultation/history"
            className="w-full mt-6 bg-[#D97706] hover:bg-[#B45309] text-white py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-colors shadow-md hover:shadow-lg active:scale-[0.98] text-center"
          >
            View History
          </Link>
        </div>
      </div>

      {/* Consultation Requests */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 mb-8 overflow-hidden">
        <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">Consultation Requests</h2>
        <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Client Name</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Advocate</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {appointments.filter(
                item =>
                  item.status === "Pending Client" ||
                  item.status === "Rescheduled"
              ).length === 0 ? (<tr>
                <td colSpan="8" className="p-8 text-center text-[#64748B] font-medium">
                  No pending consultation requests.
                </td>
              </tr>
              ) : (
appointments.filter(
  item =>
    item.status === "Pending Client" ||
    item.status === "Rescheduled"
).map((item) => (                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 font-bold text-[#0F172A] capitalize whitespace-nowrap">{item.client_name || item.client}</td>
                    <td className="p-4 text-sm text-[#475569] capitalize whitespace-nowrap font-medium">{item.advocate_name || item.advocate}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{item.date}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{item.time}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{item.type}</td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveAppointment(item.id)}
                          className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-full transition-colors text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95"
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
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95"
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
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 mb-8 overflow-hidden">
        <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">Upcoming Hearings</h2>
        <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Case No</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Next Hearing</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Advocate</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {hearings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#64748B] font-medium">
                    No upcoming hearings.
                  </td>
                </tr>
              ) : (
                hearings.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 font-bold text-[#0F172A] whitespace-nowrap">{item.caseNo}</td>
                    <td className="p-4 text-[#475569] text-sm whitespace-nowrap">{item.type}</td>
                    <td className="p-4 text-[#475569] text-sm font-medium whitespace-nowrap">{formatDateString(item.hearing)}</td>
                    <td className="p-4 text-[#475569] text-sm whitespace-nowrap font-medium">{item.advocate}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${item.status === 'Active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
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
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold text-[#0F172A]">
                {rescheduleId ? "Reschedule Consultation" : "Book Appointment"}
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
              {!rescheduleId && (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Client Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      className="w-full border border-[#E2E8F0] rounded-xl p-3.5 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8] text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Advocate Name</label>
                    <select
                      value={formData.advocate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          advocate: e.target.value,
                        })
                      }
                      className="w-full border border-[#E2E8F0] rounded-xl p-3.5 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                    >
                      <option value="">Select Advocate</option>
                      {advocates.map((adv) => {
                        const advName = adv.advocateName || adv.advocate_name || "Unknown Advocate";
                        return (
                          <option key={adv.id} value={advName}>
                            {advName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

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

              {!rescheduleId && (
                <div>
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Consultation Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                    className="w-full border border-[#E2E8F0] rounded-xl p-3.5 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                  >
                    <option value="">Select Type</option>
                    <option value="Video Consultation">Video Consultation</option>
                    <option value="Chat Consultation">Chat Consultation</option>
                    <option value="Person to Person">Person to Person</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-10 pt-8 border-t border-[#F1F5F9]">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={rescheduleId ? handleReschedule : handleBookAppointment}
                className="px-8 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                {rescheduleId ? "Reschedule" : "Book Appointment"}
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