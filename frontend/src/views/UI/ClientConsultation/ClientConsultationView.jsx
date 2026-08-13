"use client";

import { API_BASE_URL } from "@/utils/api";
import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
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
  Calendar,
  Video,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
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
  const [requestsPage, setRequestsPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

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

  const [canAddConsultation, setCanAddConsultation] = useState(true);
  const [clientDisplayName, setClientDisplayName] = useState("");

  const getClientDisplayName = (u) => {
    if (!u) return "";
    const fullName = [u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(" ").trim();
    if (fullName) return fullName;
    if (u.fullName) return u.fullName;
    if (u.full_name) return u.full_name;
    if (u.client_name) return u.client_name;
    if (u.clientName) return u.clientName;
    if (u.name) return u.name;
    return u.username || "";
  };

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    type: "",
  });
  const [selectedTimeDate, setSelectedTimeDate] = useState(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [generatingMeetLink, setGeneratingMeetLink] = useState(false);

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

  const generateMeetingLink = async (currentClient, currentDate, currentTime) => {
    setGeneratingMeetLink(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const client = currentClient || "Client";
      const date = currentDate || new Date().toISOString().split('T')[0];
      const time = currentTime || "12:00 PM";
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/consultations/generate-meet-link?client_name=${encodeURIComponent(client)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setMeetingLink(data.meeting_link || "");
      }
    } catch (err) {
      console.error("Failed to generate meet link:", err);
    } finally {
      setGeneratingMeetLink(false);
    }
  };

  useEffect(() => {
    if (formData.type === "Video Call" && !meetingLink && !generatingMeetLink) {
      generateMeetingLink(formData.name || clientDisplayName, formData.date, formData.time);
    }
  }, [formData.type, formData.date, formData.time]);

  const [rescheduleId, setRescheduleId] = useState(null);
  const [successToast, setSuccessToast] = useState({ show: false, message: "", type: "success" });
  const [alertModal, setAlertModal] = useState({ show: false, title: "", message: "", type: "success" });

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

  const resolveConsultationAddPermission = async (loggedInUser) => {
    if (!loggedInUser) return;
    try {
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

    setCanAddConsultation(true);
  };

  useEffect(() => {
    setMounted(true);
    const loggedIn = getLoggedInUser();
    setUser(loggedIn);
    if (loggedIn) {
      const initialName = getClientDisplayName(loggedIn);
      setClientDisplayName(initialName);
      setFormData((prev) => ({
        ...prev,
        name: initialName,
      }));

      fetch(`${API_BASE_URL}/case-management/`)
        .then((res) => (res.ok ? res.json() : []))
        .then((cases) => {
          if (Array.isArray(cases) && cases.length > 0) {
            const userEmail = (loggedIn.email || "").toLowerCase().trim();
            const userName = (loggedIn.username || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            const matchedCase = cases.find((c) => {
              const cEmail = (c.email_id || "").toLowerCase().trim();
              const cClientName = (c.client_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              return (
                (userEmail && cEmail && userEmail === cEmail) ||
                (userName && cClientName && (cClientName === userName || userName.includes(cClientName)))
              );
            });
            if (matchedCase && matchedCase.client_name) {
              setClientDisplayName(matchedCase.client_name);
              setFormData((prev) => ({
                ...prev,
                name: matchedCase.client_name,
              }));
            }
          }
        })
        .catch(() => {});
    }
    fetchConsultations(loggedIn);
    if (loggedIn) {
      resolveConsultationAddPermission(loggedIn);
    }
    const dismissed = JSON.parse(localStorage.getItem("client_dismissed_consultation_notifications") || "[]");
    setDismissedNotifications(dismissed);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paramRescheduleId = params.get("reschedule_id");
      const paramApproved = params.get("approved");

      if (paramApproved) {
        setSuccessToast({ show: true, message: "Consultation approved successfully!", type: "success" });
        setTimeout(() => {
          setSuccessToast({ show: false, message: "", type: "success" });
        }, 4000);
      }

      if (paramRescheduleId) {
        fetch(`${API_BASE_URL}/consultations/${paramRescheduleId}/public-details`)
          .then((res) => (res.ok ? res.json() : null))
          .then((item) => {
            if (item) {
              setRescheduleId(item.id);
              setFormData({
                name: item.client_name || "",
                date: item.date || "",
                time: item.time || "",
                type: item.type || "",
              });
              setMeetingLink(item.meeting_link || "");
              setShowModal(true);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const triggerSuccess = (message, type = "success") => {
    const title = type === "success" ? "Success" : type === "error" ? "Error" : "Notice";
    setAlertModal({ show: true, title, message, type });
  };

  const handleBookAppointment = async () => {
    if (!canAddConsultation) {
      setAlertModal({ show: true, title: "Access Denied", message: "You do not have permission to book a consultation." });
      return;
    }

    const resolvedClientName = formData.name || clientDisplayName || getClientDisplayName(user) || (user ? user.username : "Client");

    if (
      !resolvedClientName ||
      !formData.date ||
      !formData.time ||
      !formData.type
    ) {
      setAlertModal({ show: true, title: "Missing Information", message: "Please fill all required fields (Date, Time, and Meeting Type)." });
      return;
    }

    const bookData = {
      client_name: resolvedClientName,
      client_id: user ? user.id : null,
      client_email: user ? user.email : "",
      date: formData.date,
      time: formData.time,
      type: formData.type,
      meeting_link: formData.type === "Video Call" ? meetingLink : "",
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
          name: clientDisplayName || getClientDisplayName(user),
          date: "",
          time: "",
          type: "",
        });
        setMeetingLink("");
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
      setAlertModal({ show: true, title: "Date & Time Required", message: "Please select both a new Date and Time to request a reschedule." });
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
          name: clientDisplayName || getClientDisplayName(user),
          date: "",
          time: "",
          type: "",
        });
        setMeetingLink("");
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

  // Pending advocate action (client requested reschedule or new booking)
  const pendingRequests = appointments.filter(
    item => item.status === "Pending"
  );

  const isFutureOrTodayMeeting = (item) => {
    if (!item || !item.date) return true;
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let meetingDate = new Date(item.date);
      if (isNaN(meetingDate.getTime())) {
        const parts = String(item.date).split(/[-/.]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            meetingDate = new Date(parts[0], parts[1] - 1, parts[2]);
          } else {
            meetingDate = new Date(parts[2], parts[1] - 1, parts[0]);
          }
        }
      }

      if (isNaN(meetingDate.getTime())) return true;
      meetingDate.setHours(0, 0, 0, 0);

      return meetingDate.getTime() >= now.getTime();
    } catch (e) {
      return true;
    }
  };

  // Only confirmed/approved/scheduled future/today meetings appear in Upcoming Meetings
  // Rescheduled & Pending Client are handled in the notification action cards above
  const upcomingMeetings = appointments.filter(
    item =>
      (item.status === "Approved" ||
       item.status === "Scheduled" ||
       item.status === "Pending Advocate") &&
      isFutureOrTodayMeeting(item)
  );

  return (
    <div className="w-full max-w-full min-w-0 mx-auto space-y-5 sm:space-y-8 p-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
      {/* ── Custom Alert Warning Modal ── */}
      {alertModal.show && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            onClick={() => setAlertModal({ show: false, title: "", message: "", type: "success" })}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-md mx-4 p-6 sm:p-8 animate-in zoom-in-95 fade-in duration-200">
            {/* Icon */}
            {alertModal.type === "success" ? (
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={24} />
              </div>
            ) : alertModal.type === "error" ? (
              <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <X size={24} />
              </div>
            ) : (
              <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
            )}
            {/* Title */}
            <h3 className="text-xl font-extrabold text-[#0F172A] text-center tracking-tight mb-2">
              {alertModal.title}
            </h3>
            {/* Message */}
            <p className="text-[#475569] text-sm text-center leading-relaxed mb-6">
              {alertModal.message}
            </p>
            {/* Action */}
            <button
              onClick={() => setAlertModal({ show: false, title: "", message: "", type: "success" })}
              className={`w-full text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-colors duration-200 cursor-pointer ${
                alertModal.type === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : alertModal.type === "error"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ──── HEADER ──── */}
      <div className="mb-4 sm:mb-6 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap mb-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-xs shrink-0">
            <BookOpen size={20} className="text-white" />
          </div>
          <h1 className="text-[#0F172A] font-extrabold text-xl sm:text-3xl lg:text-4xl leading-tight truncate">
            Case Discussion
          </h1>
        </div>
        <p className="text-xs sm:text-base text-[#64748B] sm:ml-[48px]">
          Book an appointment or join a consultation
        </p>
      </div>



      {/* ──── ACTION CARDS ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6 mb-6 w-full min-w-0">
        {/* Book Appointment */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all w-full min-w-0">
          <div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 text-[#2563EB] rounded-xl flex items-center justify-center mb-3">
              <CalendarPlus size={20} />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">Book Appointment</h2>
            <p className="text-[#64748B] mt-1 text-xs sm:text-sm font-medium">Choose a date and time to meet your advocate.</p>
          </div>
          {canAddConsultation ? (
            <button
              onClick={() => {
                setRescheduleId(null);
                setFormData({
                  name: clientDisplayName || getClientDisplayName(user),
                  date: "",
                  time: "",
                  type: "",
                });
                setMeetingLink("");
                setSelectedTimeDate(null);
                setShowModal(true);
              }}
              className="w-full mt-4 sm:mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarPlus size={16} />
              <span>Book Appointment</span>
            </button>
          ) : (
            <div className="w-full mt-4 sm:mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider">
              <Lock size={16} />
              <span>Booking not permitted</span>
            </div>
          )}
        </div>

        {/* Meeting History */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all w-full min-w-0">
          <div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <History size={20} />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">Meeting History</h2>
            <p className="text-[#64748B] mt-1 text-xs sm:text-sm font-medium">View your previous meetings and logs.</p>
          </div>
          <Link
            href="/client-consultation/history"
            className="w-full mt-4 sm:mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 text-center cursor-pointer"
          >
            <History size={16} />
            <span>View History</span>
          </Link>
        </div>
      </div>

      {/* Meeting Requests Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 sm:p-6 md:p-8 mb-6 overflow-hidden w-full min-w-0">
        <h2 className="text-lg sm:text-2xl font-extrabold text-[#0F172A] mb-4 sm:mb-6 flex items-center gap-2">
          <Calendar size={20} className="text-[#2563EB]" />
          <span>Meeting Requests</span>
        </h2>

        {/* Advocate Action Cards — New Meetings (Pending Client) + Rescheduled */}
        {mounted && (() => {
          const newMeetingItems = appointments.filter(item => {
            if (dismissedNotifications.includes(item.id)) return false;
            return item.status === "Pending Client";
          });
          const rescheduledItems = appointments.filter(item => {
            if (dismissedNotifications.includes(item.id)) return false;
            return item.status === "Rescheduled";
          });
          const allRequestCards = [...newMeetingItems, ...rescheduledItems];
          if (allRequestCards.length === 0) return null;

          const requestsPerPage = 1;
          const requestsTotalPages = Math.ceil(allRequestCards.length / requestsPerPage) || 1;
          const activeRequestsPage = Math.min(requestsPage, requestsTotalPages);
          const startIndex = (activeRequestsPage - 1) * requestsPerPage;
          const paginatedRequestCards = allRequestCards.slice(startIndex, startIndex + requestsPerPage);

          return (
            <div className="space-y-4 mb-5">
              {paginatedRequestCards.map(item => {
                const isNewMeeting = item.status === "Pending Client";
                return isNewMeeting ? (
                  /* NEW MEETING card — blue theme */
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl border border-blue-200 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F8FBFF 100%)" }}
                  >
                    <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2563EB, #60A5FA)" }} />
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}>
                            <CalendarPlus size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="font-extrabold text-[#1E3A8A] text-sm sm:text-base leading-tight">
                              New Meeting Scheduled by Advocate
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white">
                                📅 Confirm Required
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-300 text-blue-700 bg-white">
                                {item.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDismissNotification(item.id)}
                          className="text-blue-300 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
                          title="Dismiss"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="bg-white rounded-xl border border-blue-100 p-3 sm:p-4 space-y-2.5">
                          <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-1">Scheduled For</p>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                              <Calendar size={13} className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Date</p>
                              <p className="font-extrabold text-[#0F172A] text-sm">{formatDateString(item.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                              <Clock size={13} className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Time</p>
                              <p className="font-extrabold text-[#0F172A] text-sm">{formatTimeString(item.time)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl border border-blue-100 p-3 sm:p-4">
                          <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-2">Note</p>
                          {item.reschedule_reason && item.reschedule_reason !== "Approved by advocate" ? (
                            <p className="text-sm text-slate-600 italic leading-relaxed">&ldquo;{item.reschedule_reason}&rdquo;</p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Your advocate has booked a meeting slot for you.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          onClick={() => handleApproveAppointment(item.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer text-white shadow-sm"
                          style={{ background: "linear-gradient(135deg, #059669, #10B981)" }}
                        >
                          <CheckCircle2 size={16} />
                          <span>✓ Confirm Appointment</span>
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleId(item.id);
                            setFormData({
                              name: item.client_name || clientDisplayName || getClientDisplayName(user),
                              date: "",
                              time: "",
                              type: item.type || "",
                            });
                            setMeetingLink("");
                            setSelectedTimeDate(null);
                            setShowModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Clock size={16} />
                          <span>Request Different Time</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* RESCHEDULED card — orange theme */
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl border border-orange-200 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 100%)" }}
                  >
                    <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #F59E0B, #FB923C)" }} />
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B, #FB923C)" }}>
                            <Calendar size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="font-extrabold text-[#92400E] text-sm sm:text-base leading-tight">
                              Senior Advocate Rescheduled Your Appointment
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white">
                                ⚡ Action Required
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-300 text-orange-700 bg-white">
                                {item.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDismissNotification(item.id)}
                          className="text-orange-300 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-100 transition-colors shrink-0 cursor-pointer"
                          title="Dismiss"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="bg-white rounded-xl border border-orange-100 p-3 sm:p-4 space-y-2.5">
                          <p className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest mb-1">Proposed Schedule</p>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                              <Calendar size={13} className="text-orange-500" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Date</p>
                              <p className="font-extrabold text-[#0F172A] text-sm">{formatDateString(item.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                              <Clock size={13} className="text-orange-500" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Time</p>
                              <p className="font-extrabold text-[#0F172A] text-sm">{formatTimeString(item.time)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl border border-orange-100 p-3 sm:p-4">
                          <p className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest mb-2">Advocate Note</p>
                          {item.reschedule_reason ? (
                            <p className="text-sm text-slate-600 italic leading-relaxed">&ldquo;{item.reschedule_reason}&rdquo;</p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No note provided.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          onClick={() => handleApproveAppointment(item.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer text-white shadow-sm"
                          style={{ background: "linear-gradient(135deg, #059669, #10B981)" }}
                        >
                          <CheckCircle2 size={16} />
                          <span>✓ Accept Proposed Date</span>
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleId(item.id);
                            setFormData({
                              name: item.client_name || clientDisplayName || getClientDisplayName(user),
                              date: "",
                              time: "",
                              type: item.type || "",
                            });
                            setMeetingLink("");
                            setSelectedTimeDate(null);
                            setShowModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Clock size={16} />
                          <span>Request Different Time</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Meeting Requests Pagination Controls */}
              {requestsTotalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0] w-full">
                  <p className="text-xs font-medium text-[#64748B]">
                    Showing request <span className="font-bold text-[#0F172A]">{activeRequestsPage}</span> of{" "}
                    <span className="font-bold text-[#0F172A]">{requestsTotalPages}</span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRequestsPage((prev) => Math.max(prev - 1, 1))}
                      disabled={activeRequestsPage === 1}
                      className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Previous Request"
                    >
                      <ChevronLeft size={16} />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: requestsTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setRequestsPage(page)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeRequestsPage === page
                              ? "bg-[#2563EB] text-white shadow-xs"
                              : "text-[#64748B] hover:bg-slate-100 border border-transparent"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setRequestsPage((prev) => Math.min(prev + 1, requestsTotalPages))}
                      disabled={activeRequestsPage === requestsTotalPages}
                      className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Next Request"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Empty state — only when no cards AND no pending table rows */}
        {pendingRequests.length === 0 && appointments.filter(i => i.status === "Rescheduled" || i.status === "Pending Client").length === 0 && (
          <div className="p-6 text-center text-[#64748B] font-medium text-xs sm:text-sm bg-slate-50 rounded-2xl border border-slate-100">
            No pending meeting requests.
          </div>
        )}

        {/* Pending requests table — only when there are actual pending items */}
        {pendingRequests.length > 0 && (
          <>
            {/* Mobile Native Cards (< 640px) */}
            <div className="block sm:hidden space-y-3 w-full min-w-0">
              {pendingRequests.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 w-full min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <h4 className="text-xs font-extrabold text-[#0F172A] capitalize truncate">{item.client_name || item.client}</h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                      <Clock size={10} />
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p>🗓️ Date: <strong>{item.date}</strong> at <strong>{item.time}</strong></p>
                    <p>💬 Type: <strong>{item.type}</strong></p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => handleApproveAppointment(item.id)}
                      className="flex-1 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
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
                        setMeetingLink(item.meeting_link || "");
                        setSelectedTimeDate(null);
                        setShowModal(true);
                      }}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Clock size={14} />
                      <span>Reschedule</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet Table (>= 640px) */}
            <div className="hidden sm:block w-full overflow-x-auto rounded-xl border border-[#E2E8F0] min-w-0">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs sm:text-sm">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Client Name</th>
                    <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Time</th>
                    <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {pendingRequests.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-[#0F172A] capitalize whitespace-nowrap">{item.client_name || item.client}</td>
                      <td className="p-3.5 sm:p-4 text-[#475569] whitespace-nowrap">{item.date}</td>
                      <td className="p-3.5 sm:p-4 text-[#475569] whitespace-nowrap font-medium">{item.time}</td>
                      <td className="p-3.5 sm:p-4 text-[#475569] whitespace-nowrap">{item.type}</td>
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                          <Clock size={11} />
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveAppointment(item.id)}
                            className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
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
                              setMeetingLink(item.meeting_link || "");
                              setSelectedTimeDate(null);
                              setShowModal(true);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Clock size={14} />
                            <span>Reschedule</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Upcoming Meetings Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 sm:p-6 md:p-8 mb-6 overflow-hidden w-full min-w-0">
        <h2 className="text-lg sm:text-2xl font-extrabold text-[#0F172A] mb-4 sm:mb-6 flex items-center gap-2">
          <Clock size={20} className="text-[#2563EB]" />
          <span>Upcoming Meetings</span>
        </h2>

        {upcomingMeetings.length === 0 ? (
          <div className="p-6 text-center text-[#64748B] font-medium text-xs sm:text-sm bg-slate-50 rounded-2xl border border-slate-100">
            No upcoming meetings.
          </div>
        ) : (() => {
          const itemsPerPage = 7;
          const upcomingTotalPages = Math.ceil(upcomingMeetings.length / itemsPerPage) || 1;
          const activeUpcomingPage = Math.min(upcomingPage, upcomingTotalPages);
          const startIndex = (activeUpcomingPage - 1) * itemsPerPage;
          const endIndex = Math.min(startIndex + itemsPerPage, upcomingMeetings.length);
          const paginatedUpcomingMeetings = upcomingMeetings.slice(startIndex, endIndex);

          return (
            <>
              {/* Mobile Native Cards (< 640px) */}
              <div className="block sm:hidden space-y-3 w-full min-w-0">
                {paginatedUpcomingMeetings.map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 w-full min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div>
                        <h4 className="text-xs font-extrabold text-[#0F172A]">{formatDateString(item.date)}</h4>
                        <p className="text-[11px] text-slate-500 font-bold">{formatTimeString(item.time)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${
                        item.status === "Approved" || item.status === "Scheduled"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        <CheckCircle2 size={10} />
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="font-bold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded-md">{item.type}</span>
                      {item.meeting_link && (item.status === "Approved" || item.status === "Scheduled" || item.status === "Completed") ? (
                        <a
                          href={item.meeting_link.startsWith("http") ? item.meeting_link : `https://${item.meeting_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center gap-1 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px]"
                        >
                          <Video size={12} />
                          <span>Google Meet</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop & Tablet Table (>= 640px) */}
              <div className="hidden sm:block w-full rounded-2xl border border-[#E2E8F0] min-w-0 overflow-hidden shadow-2xs">
                <table className="w-full text-xs md:text-sm table-fixed divide-y divide-[#E2E8F0]">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="p-2.5 sm:p-3 md:p-4 text-left text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[20%]">Date</th>
                      <th className="p-2.5 sm:p-3 md:p-4 text-left text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[14%]">Time</th>
                      <th className="p-2.5 sm:p-3 md:p-4 text-left text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[18%]">Type</th>
                      <th className="p-2.5 sm:p-3 md:p-4 text-left text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[26%]">Google Meet Link</th>
                      <th className="p-2.5 sm:p-3 md:p-4 text-right text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[22%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {paginatedUpcomingMeetings.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-2.5 sm:p-3 md:p-4 text-[#475569] font-medium whitespace-nowrap">{formatDateString(item.date)}</td>
                        <td className="p-2.5 sm:p-3 md:p-4 text-[#475569] font-medium whitespace-nowrap">{formatTimeString(item.time)}</td>
                        <td className="p-2.5 sm:p-3 md:p-4 text-[#475569] min-w-0">
                          <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider max-w-full truncate ${
                            item.type === "Video Call" || item.type === "Video Consultation"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.type === "Chat" || item.type === "Chat Consultation"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-2.5 sm:p-3 md:p-4 min-w-0">
                          {item.meeting_link && (item.status === "Approved" || item.status === "Scheduled" || item.status === "Completed") ? (
                            <a
                              href={item.meeting_link.startsWith("http") ? item.meeting_link : `https://${item.meeting_link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center gap-1.5 bg-blue-50/70 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors text-[11px] md:text-xs truncate max-w-full"
                            >
                              <Video size={13} className="shrink-0" />
                              <span className="truncate">Open Google Meet</span>
                            </a>
                          ) : (
                            <span className="text-[#94A3B8] font-medium">-</span>
                          )}
                        </td>
                        <td className="p-2.5 sm:p-3 md:p-4 align-top text-right">
                          <span className={`inline-flex items-center justify-center text-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border whitespace-nowrap ${
                            item.status === "Approved" || item.status === "Scheduled"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            <CheckCircle2 size={12} className="shrink-0" />
                            <span>{item.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar for Upcoming Meetings */}
              {upcomingMeetings.length > 0 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0] w-full min-w-0">
                  <p className="text-xs font-medium text-[#64748B]">
                    Showing <span className="font-bold text-[#0F172A]">{startIndex + 1}</span> to{" "}
                    <span className="font-bold text-[#0F172A]">{endIndex}</span> of{" "}
                    <span className="font-bold text-[#0F172A]">{upcomingMeetings.length}</span> entries
                  </p>

                  {upcomingTotalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUpcomingPage((prev) => Math.max(prev - 1, 1))}
                        disabled={activeUpcomingPage === 1}
                        className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                        title="Previous Page"
                      >
                        <ChevronLeft size={16} />
                        <span>Prev</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: upcomingTotalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setUpcomingPage(page)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeUpcomingPage === page
                                ? "bg-[#2563EB] text-white shadow-xs"
                                : "text-[#64748B] hover:bg-slate-100 border border-transparent"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setUpcomingPage((prev) => Math.min(prev + 1, upcomingTotalPages))}
                        disabled={activeUpcomingPage === upcomingTotalPages}
                        className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                        title="Next Page"
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Modal */}
      {mounted && showModal && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-3.5 sm:p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
                {rescheduleId ? "Reschedule Consultation" : "Book Appointment"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] text-[#64748B] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {!rescheduleId && (
                <div>
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">Client Name</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Enter your name"
                    value={formData.name || clientDisplayName || getClientDisplayName(user) || (user ? user.username : "")}
                    className="w-full border border-[#E2E8F0] rounded-xl p-3 text-[#0F172A] bg-[#F1F5F9] font-bold text-xs sm:text-sm outline-none cursor-not-allowed select-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">Date</label>
                <CustomDatePicker
                  selected={formData.date}
                  onChange={(dateStr) => setFormData({ ...formData, date: dateStr })}
                  minDate={new Date()}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">Time</label>
                <div className="w-full border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus-within:bg-white transition-all cursor-pointer">
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
                    className="w-full p-3 text-[#0F172A] bg-transparent outline-none text-xs sm:text-sm font-medium cursor-pointer"
                  />
                </div>
              </div>

              {!rescheduleId && (
                <div>
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({ ...formData, type: newType });
                      if (newType === "Video Call") {
                        if (!meetingLink) {
                          generateMeetingLink(formData.name || clientDisplayName, formData.date, formData.time);
                        }
                      } else {
                        setMeetingLink("");
                      }
                    }}
                    className="w-full border border-[#E2E8F0] rounded-xl p-3 text-[#0F172A] bg-[#F8FAFC] focus:bg-white text-xs sm:text-sm font-medium outline-none cursor-pointer"
                  >
                    <option value="">Meeting Type</option>
                    <option value="Video Call">Video Call</option>
                    <option value="Chat">Chat</option>
                    <option value="Person to Person">Person to Person</option>
                  </select>
                </div>
              )}

              {!rescheduleId && formData.type === "Video Call" && (
                <div>
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">Google Meet Link</label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder={generatingMeetLink ? "Generating Meet link..." : "Paste or auto-generated Google Meet link"}
                    disabled={generatingMeetLink}
                    className="w-full border border-[#E2E8F0] rounded-xl p-3 text-[#0F172A] bg-[#F8FAFC] focus:bg-white text-xs sm:text-sm font-medium outline-none transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#F1F5F9]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={rescheduleId ? handleReschedule : handleBookAppointment}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              >
                {rescheduleId ? "Reschedule" : "Book Appointment"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* Toast Notification */}
      {successToast.show && (
        <div className={`fixed top-5 right-5 z-[10000] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all max-w-sm ${
          successToast.type === "error"
            ? "bg-rose-600 text-white border-rose-500"
            : successToast.type === "warning"
            ? "bg-amber-600 text-white border-amber-500"
            : "bg-emerald-600 text-white border-emerald-500"
        }`}>
          {successToast.type === "error" ? (
            <X size={18} className="text-white shrink-0" />
          ) : successToast.type === "warning" ? (
            <Clock size={18} className="text-white shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-white shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs leading-tight">
              {successToast.type === "error" ? "Error" : successToast.type === "warning" ? "Notice" : "Success"}
            </p>
            <p className="text-[11px] font-medium mt-0.5 opacity-90 truncate">{successToast.message}</p>
          </div>
          <button
            onClick={() => setSuccessToast({ show: false, message: "", type: "success" })}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}