"use client";

import { API_BASE_URL } from "@/utils/api";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import { getTodayDateString } from "@/utils/dateUtils";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  BookOpen,
  CalendarPlus,
  History,
  CheckCircle2,
  Clock,
  Check,
  X,
  Lock,
  Gavel,
  Calendar,
  ArrowLeft,
  Video,
} from "lucide-react";
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

  const [formData, setFormData] = useState({
    name: "",
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
      const clientId = currentUser?.id || currentUser?.user_id || currentUser?.sub;
      if (clientId && !isNaN(Number(clientId))) {
        url += `?client_id=${clientId}`;
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
      if (err.name !== "AbortError") {
        console.warn("Could not fetch consultations:", err.message);
      }
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
            if (currentUser.role && currentUser.role.toLowerCase() === "client") {
              const clientEmailMatch = c.email_id && currentUser.email && c.email_id.toLowerCase() === currentUser.email.toLowerCase();
              const clientNameMatch = c.client_name && currentUser.username && c.client_name.toLowerCase() === currentUser.username.toLowerCase();
              return clientEmailMatch || clientNameMatch;
            } else if (
              currentUser.role && (
                currentUser.role.toLowerCase() === "senior advocate" ||
                currentUser.role.toLowerCase() === "junior advocate"
              )
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
        const roleKey = Object.keys(allPerms).find(k => k.toLowerCase() === loggedInUser.role.toLowerCase()) || loggedInUser.role;
        const rolePerms = allPerms[roleKey] || {};
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

fetchHearings(loggedIn, []);
}, []);


  const triggerSuccess = (message, type = "success") => {
    setSuccessToast({ show: true, message, type });
    setTimeout(() => {
      setSuccessToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleBookAppointment = async () => {
    if (!canAddConsultation) {
      triggerSuccess("You do not have permission to book a consultation.", "warning");
      return;
    }
    if (
      !formData.name ||
      !formData.date ||
      !formData.time ||
      !formData.type
    ) {
      triggerSuccess("Please fill all required fields.", "warning");
      return;
    }

    const bookData = {
      client_name: formData.name,
      client_id: user ? user.id : null,
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
        triggerSuccess("Booking submitted successfully!");
        setShowModal(false);
        fetchConsultations(user);
        setFormData({
          name: user ? user.username : "",
          date: "",
          time: "",
          type: "",
        });
        setSelectedTimeDate(null);
      } else {
        triggerSuccess("Failed to book appointment.", "error");
      }
    } catch (err) {
      console.error("Error booking consultation:", err);
      triggerSuccess("Error connecting to server.", "error");
    }
  };

  const handleReschedule = async () => {
    if (!formData.date || !formData.time) {
      triggerSuccess("Please select Date and Time.", "warning");
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
        triggerSuccess("Reschedule request sent successfully!");
        setRescheduleId(null);
        setShowModal(false);
        fetchConsultations(user);
        setFormData({
          name: user ? user.username : "",
          date: "",
          time: "",
          type: "",
        });
        setSelectedTimeDate(null);
      } else {
        triggerSuccess("Failed to reschedule consultation.", "error");
      }
    } catch (err) {
      console.error("Error rescheduling:", err);
      triggerSuccess("Error connecting to server.", "error");
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
        triggerSuccess("Approved successfully!");
        fetchConsultations(user);
      } else {
        triggerSuccess("Failed to approve appointment.", "error");
      }
    } catch (err) {
      console.error("Error approving:", err);
      triggerSuccess("Error connecting to server.", "error");
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
        triggerSuccess("Deleted successfully!");
        fetchConsultations(user);
      } else {
        triggerSuccess("Failed to delete consultation.", "error");
      }
    } catch (err) {
      console.error("Error deleting:", err);
      triggerSuccess("Error connecting to server.", "error");
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 max-w-7xl mx-auto">
      {/* ──── HEADER ──── */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-xs">
            <BookOpen size={20} className="text-white" />
          </div>
          <h1 className="text-[#0F172A] font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-tight">
            Case Discussion
          </h1>
        </div>
        <p className="text-sm sm:text-base lg:text-lg text-[#64748B] ml-0 sm:ml-[52px]">
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
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-amber-50/80 border-amber-200 text-amber-900"
                    }`}
                >
                  <div className="flex gap-3 items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {isApproved ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        {isApproved
                          ? `Your consultation request has been approved`
                          : `Your consultation has been rescheduled`}
                      </p>
                      <p className="text-xs mt-0.5 opacity-90 font-medium">
                        Scheduled for: <span className="font-bold">{formatDateString(item.date)}</span> at <span className="font-bold">{formatTimeString(item.time)}</span> ({item.type})
                        {!isApproved && item.reschedule_reason && (
                          <span className="block mt-1 font-semibold italic">Reason: {item.reschedule_reason}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissNotification(item.id)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 transition-colors focus:outline-none cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

      {/* ──── ACTION CARDS ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 w-full">
        {/* Book Appointment */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div>
            <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-xl flex items-center justify-center mb-4">
              <CalendarPlus size={20} />
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A]">Book Appointment</h2>
            <p className="text-[#64748B] mt-1.5 text-sm font-medium">Choose a date and time to meet your advocate.</p>
          </div>
          {canAddConsultation ? (
            <button
              onClick={() => {
                setRescheduleId(null);
                setFormData({
                  name: user ? user.username : "",
                  date: "",
                  time: "",
                  type: "",
                });
                setShowModal(true);
              }}
              className="w-full mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <CalendarPlus size={16} />
              <span>Book Appointment</span>
            </button>
          ) : (
            <div className="w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider">
              <Lock size={16} />
              <span>Booking not permitted</span>
            </div>
          )}
        </div>

        {/* Meeting History */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <History size={20} />
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A]">Meeting History</h2>
            <p className="text-[#64748B] mt-1.5 text-sm font-medium">View your previous meetings and logs.</p>
          </div>
          <Link
            href="/client-consultation/history"
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 text-center cursor-pointer active:scale-[0.98]"
          >
            <History size={16} />
            <span>View History</span>
          </Link>
        </div>
      </div>

      {/* Meeting Requests */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 mb-8 overflow-hidden">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-6 flex items-center gap-2.5">
          <Calendar size={22} className="text-[#2563EB]" />
          <span>Meeting Requests</span>
        </h2>
        <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Client Name</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white text-sm">
              {appointments.filter(
                item =>
                  item.status === "Pending Client" ||
                  item.status === "Pending"
              ).length === 0 ? (<tr>
                <td colSpan="6" className="p-8 text-center text-[#64748B] font-medium">
                  No pending meeting requests.
                </td>
              </tr>
              ) : (
appointments.filter(
  item =>
    item.status === "Pending Client" ||
    item.status === "Pending"
).map((item) => (                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 font-bold text-[#0F172A] capitalize whitespace-nowrap">{item.client_name || item.client}</td>
                    <td className="p-4 text-[#475569] whitespace-nowrap">{item.date}</td>
                    <td className="p-4 text-[#475569] whitespace-nowrap font-medium">{item.time}</td>
                    <td className="p-4 text-[#475569] whitespace-nowrap">{item.type}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        <Clock size={11} />
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveAppointment(item.id)}
                          className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl transition-colors text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleId(item.id);
                            setFormData({
                              name: item.client_name,
                              date: item.date,
                              time: item.time,
                              type: item.type,
                            });
                            setShowModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Clock size={14} />
                          <span>Reschedule</span>
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
      {/* Upcoming Meetings */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 mb-8 overflow-hidden">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-6 flex items-center gap-2.5">
          <Clock size={22} className="text-[#2563EB]" />
          <span>Upcoming Meetings</span>
        </h2>
        <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Google Meet Link</th>
                <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white text-sm">
              {appointments.filter(
                item =>
                  item.status === "Approved" ||
                  item.status === "Scheduled" ||
                  item.status === "Rescheduled" ||
                  item.status === "Pending Advocate"
              ).length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#64748B] font-medium">
                    No upcoming meetings.
                  </td>
                </tr>
              ) : (
                appointments.filter(
                  item =>
                    item.status === "Approved" ||
                    item.status === "Scheduled" ||
                    item.status === "Rescheduled" ||
                    item.status === "Pending Advocate"
                ).map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 text-[#475569] font-medium whitespace-nowrap">{formatDateString(item.date)}</td>
                    <td className="p-4 text-[#475569] font-medium whitespace-nowrap">{formatTimeString(item.time)}</td>
                    <td className="p-4 text-[#475569] whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        item.type === "Video Call" || item.type === "Video Consultation"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : item.type === "Chat" || item.type === "Chat Consultation"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm">
                      {item.meeting_link ? (
                        <a
                          href={item.meeting_link.startsWith("http") ? item.meeting_link : `https://${item.meeting_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center gap-1.5 bg-blue-50/70 border border-blue-200 px-3 py-1 rounded-lg transition-colors text-xs"
                        >
                          <Video size={14} />
                          <span>Open Google Meet</span>
                        </a>
                      ) : (
                        <span className="text-[#94A3B8] font-medium">-</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        item.status === "Approved" || item.status === "Scheduled"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        <CheckCircle2 size={11} />
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
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-[#0F172A]">
                {rescheduleId ? "Reschedule Consultation" : "Book Appointment"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F8FAFC] text-[#64748B] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
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
                      className="w-full border border-[#E2E8F0] rounded-xl p-3 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8] text-sm font-medium"
                    />
                  </div>

               
                </>
              )}

              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Date</label>
                <CustomDatePicker
                  selected={formData.date}
                  onChange={(dateStr) => setFormData({ ...formData, date: dateStr })}
                  minDate={new Date()}
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
                    className="w-full p-3 text-[#0F172A] bg-transparent outline-none text-sm font-medium cursor-pointer"
                  />
                </div>
              </div>

              {!rescheduleId && (
                <div>
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Meeting Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                    className="w-full border border-[#E2E8F0] rounded-xl p-3 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium cursor-pointer"
                  >
                    <option value="">Select Type</option>
                    <option value="Video Consultation">Video Consultation</option>
                    <option value="Chat Consultation">Chat Consultation</option>
                    <option value="Person to Person">Person to Person</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#F1F5F9]">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={rescheduleId ? handleReschedule : handleBookAppointment}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                {rescheduleId ? "Reschedule" : "Book Appointment"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* Custom Toast Notification */}
      {successToast.show && (
        <div className={`fixed top-5 right-5 z-[10000] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all duration-300 max-w-sm animate-in fade-in slide-in-from-top-4 ${
          successToast.type === "error"
            ? "bg-rose-600 text-white border-rose-500"
            : successToast.type === "warning"
            ? "bg-amber-600 text-white border-amber-500"
            : "bg-emerald-600 text-white border-emerald-500"
        }`}>
          {successToast.type === "error" ? (
            <X size={20} className="text-white shrink-0" />
          ) : successToast.type === "warning" ? (
            <Clock size={20} className="text-white shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="text-white shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold text-sm leading-tight">
              {successToast.type === "error" ? "Error" : successToast.type === "warning" ? "Notice" : "Success"}
            </p>
            <p className="text-xs font-medium mt-0.5 opacity-90">{successToast.message}</p>
          </div>
          <button
            onClick={() => setSuccessToast({ show: false, message: "", type: "success" })}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}