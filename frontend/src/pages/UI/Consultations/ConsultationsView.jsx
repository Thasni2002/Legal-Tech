"use client";

import { API_BASE_URL } from "@/utils/api";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createPortal } from "react-dom";

export default function ConsultationsView() {
    const [showAppointments, setShowAppointments] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [rescheduleReason, setRescheduleReason] = useState("");
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [showHistory, setShowHistory] = useState(false);
    const [clientName, setClientName] = useState("");
    const [consultationType, setConsultationType] = useState("Consultation Type");
    const [consultationDate, setConsultationDate] = useState("");
    const [consultationTime, setConsultationTime] = useState("");
    const [selectedTimeDate, setSelectedTimeDate] = useState(null);

    const [history, setHistory] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [dismissedNotifications, setDismissedNotifications] = useState([]);
    const [clients, setClients] = useState([]);
    const [meetingLink, setMeetingLink] = useState("");
    const [showScheduleSuccess, setShowScheduleSuccess] = useState(false);
    const [showRescheduleSuccess, setShowRescheduleSuccess] = useState(false);
    const fetchConsultations = async (currentUser) => {
        try {
            let url = `${API_BASE_URL}/consultations`;
            if (currentUser) {
                if (currentUser.role === "Senior Advocate" || currentUser.role === "Junior Advocate") {
                    url += `?advocate_id=${currentUser.id}`;
                } else if (currentUser.role === "Client") {
                    url += `?client_id=${currentUser.id}`;
                }
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();

                // Mapped to match original component client name display
                const mappedData = data.map(item => ({
                    ...item,
                    client: item.client_name,
                }));

                // Appointments for advocate to action: Pending
                const appts = mappedData.filter(item =>
                    item.status === "Pending" ||
                    item.status === "Pending Advocate"
                );

                // History: Approved, Rescheduled, or Pending Client
                const hist = mappedData.filter(item =>
                    item.status === "Approved" || item.status === "Pending Advocate" || item.status === "Pending Client" || item.status === "Rescheduled"
                );

                setAppointments(appts);
                setHistory(hist);
            }
        } catch (err) {
            console.error("Failed to fetch consultations:", err);
        }
    };

    const handleDismissNotification = (id) => {
        const updated = [...dismissedNotifications, id];
        setDismissedNotifications(updated);
        localStorage.setItem("dismissed_consultation_notifications", JSON.stringify(updated));
    };

    // Fetch user and consultations on mount
    useEffect(() => {
        setMounted(true);
        const loggedIn = getLoggedInUser();
        setUser(loggedIn);
        fetchConsultations(loggedIn);
        const dismissed = JSON.parse(localStorage.getItem("dismissed_consultation_notifications") || "[]");
        setDismissedNotifications(dismissed);

        const loadClients = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/case-management/`);
                if (res.ok) {
                    const casesData = await res.json();
                    const uniqueClientsMap = new Map();
                    casesData.forEach(c => {
                        const cName = c.clientName || c.client_name;
                        if (cName && !uniqueClientsMap.has(cName)) {
                            uniqueClientsMap.set(cName, {
                                id: cName, // use name as unique id since we dedupe by name
                                clientName: cName,
                                emailId: c.emailId || c.email_id || ""
                            });
                        }
                    });
                    setClients(Array.from(uniqueClientsMap.values()));
                }
            } catch (err) {
                console.error("Failed to fetch clients:", err);
            }
        };
        loadClients();
    }, []);

    const formatDateString = (dateStr) => {
        if (!dateStr) return "";
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return dateStr;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = dateObj.getDate();
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const formatTimeString = (timeStr) => {
        if (!timeStr) return "";
        if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
        const parts = timeStr.split(":");
        if (parts.length < 2) return timeStr;
        const [hoursStr, minutesStr] = parts;
        let hours = parseInt(hoursStr, 10);
        const minutes = minutesStr;
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutesFormatted = minutes.length === 1 ? `0${minutes}` : minutes;
        return `${hours}:${minutesFormatted} ${ampm}`;
    };

    const handleTimeChange = (date) => {
        setSelectedTimeDate(date);
        if (date) {
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const timeString = `${hours}:${minutes} ${ampm}`;
            setConsultationTime(timeString);
        } else {
            setConsultationTime("");
        }
    };

    const handleStartConsultation = async () => {
        if (!clientName.trim()) {
            alert("Please enter a client name.");
            return;
        }
        if (consultationType === "Consultation Type") {
            alert("Please select a consultation type.");
            return;
        }
        if (!consultationDate) {
            alert("Please select a date.");
            return;
        }
        if (!consultationTime) {
            alert("Please select a time.");
            return;
        }

        if (!meetingLink.trim()) {
            alert("Please enter Google Meet link.");
            return;
        }

        const selectedClient = clients.find(c => c.clientName === clientName);
        const clientEmail = selectedClient ? selectedClient.emailId : "";

        const startData = {
            client_name: clientName,
            client_email: clientEmail,
            type: consultationType,
            date: consultationDate,
            time: consultationTime,
            meeting_link: meetingLink,
            status: "Pending Client"
        };

        try {
            let url = `${API_BASE_URL}/consultations/start`;
            const params = [];
            if (user) {
                params.push(`advocate_id=${user.id}`);
                params.push(`advocate_name=${encodeURIComponent(user.username)}`);
            }
            if (params.length > 0) {
                url += "?" + params.join("&");
            }

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(startData)
            });

            if (res.ok) {
                setClientName("");
                setConsultationType("Consultation Type");
                setConsultationDate("");
                setConsultationTime("");
                setMeetingLink("");
                setSelectedTimeDate(null);
                fetchConsultations(user);
                setShowScheduleSuccess(true);

            } else {
                alert("Failed to start/schedule consultation");
            }
        } catch (err) {
            console.error("Error creating consultation:", err);
            alert("Error connecting to server");
        }



    };

    const handleDeleteConsultation = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/consultations/${deleteId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchConsultations(user);
                setShowDeleteModal(false);
                setDeleteId(null);
            } else {
                alert("Failed to delete consultation");
            }
        } catch (err) {
            console.error("Error deleting:", err);
            alert("Error connecting to server");
        }
    };

    const totalConsultations = history.length;
    const videoCalls = history.filter(item => item.type === "Video Call" || item.type === "Video Consultation").length;
    const chatConsultations = history.filter(item => item.type === "Chat" || item.type === "Chat Consultation").length;

    return (
        <div className="w-full space-y-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                    Case Discussion
                </h1>
                <p className="text-[#64748B] mt-2 text-lg font-medium">
                    Schedule and manage client consultations
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">📊</div>
                        <p className="text-[#64748B] font-bold uppercase tracking-wider text-xs">Total Consultations</p>
                    </div>
                    <h3 className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
                        {totalConsultations}
                    </h3>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xl">📹</div>
                        <p className="text-[#64748B] font-bold uppercase tracking-wider text-xs">Video Calls</p>
                    </div>
                    <h3 className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
                        {videoCalls}
                    </h3>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl">💬</div>
                        <p className="text-[#64748B] font-bold uppercase tracking-wider text-xs">Chat Consultations</p>
                    </div>
                    <h3 className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
                        {chatConsultations}
                    </h3>
                </div>
            </div>

            {/* Notifications */}
            {mounted && history.filter(item => {
                if (dismissedNotifications.includes(item.id)) return false;
                const isApprovedByClient = item.status === "Approved" && item.reschedule_reason === "Approved by client";
                const isRescheduledByClient = item.status === "Pending Advocate" && item.reschedule_reason?.includes("client");
                return isApprovedByClient || isRescheduledByClient;
            }).length > 0 && (
                    <div className="space-y-3 mb-6">
                        {history.filter(item => {
                            if (dismissedNotifications.includes(item.id)) return false;
                            const isApprovedByClient = item.status === "Approved" && item.reschedule_reason === "Approved by client";
                            const isRescheduledByClient = item.status === "Pending Advocate" && item.reschedule_reason?.includes("client");
                            return isApprovedByClient || isRescheduledByClient;
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
                                                    ? `Client ${item.client} approved your consultation request`
                                                    : `Client ${item.client} requested a reschedule`}
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

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full">
                {/* Accept Appointments */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 flex flex-col justify-between h-full transition-transform hover:scale-[1.02] duration-300">
                    <div>
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-xl mb-4">
                            📅
                        </div>
                        <h3 className="text-xl font-extrabold text-[#0F172A]">
                            Accept Appointments
                        </h3>
                        <p className="text-[#64748B] text-sm mt-2 font-medium">
                            View and manage consultation requests
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAppointments(!showAppointments)}
                        className="w-full mt-6 bg-[#16A34A] hover:bg-[#15803d] text-white py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                        {showAppointments ? "Hide Appointments" : "View Appointments"}
                    </button>
                </div>

                {/* Consultation History */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 flex flex-col justify-between h-full transition-transform hover:scale-[1.02] duration-300">
                    <div>
                        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-xl mb-4">
                            📜
                        </div>
                        <h3 className="text-xl font-extrabold text-[#0F172A]">
                            Consultation History
                        </h3>
                        <p className="text-[#64748B] text-sm mt-2 font-medium">
                            View previous consultations
                        </p>
                    </div>

                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full mt-6 bg-[#D97706] hover:bg-[#b45309] text-white py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                        {showHistory ? "Hide History" : "View History"}
                    </button>
                </div>

            </div>

            {/* Appointment Requests */}
            {showAppointments && (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 mb-8 overflow-hidden">
                    <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">
                        Appointment Requests
                    </h2>

                    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
                        <table className="min-w-full divide-y divide-[#E2E8F0]">
                            <thead className="bg-[#F8FAFC]">
                                <tr>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase">Client Name</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase">Date</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase">Time</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase">Type</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase">Issue</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase">Status</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E2E8F0] bg-white">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-[#64748B] font-medium">
                                            No pending appointment requests.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((item) => (
                                        <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-4 font-bold text-[#0F172A] capitalize">
                                                {item.client}
                                            </td>

                                            <td className="p-4 text-sm text-[#475569]">
                                                {formatDateString(item.date)}
                                            </td>

                                            <td className="p-4 text-sm text-[#475569] font-medium">
                                                {formatTimeString(item.time)}
                                            </td>

                                            <td className="p-4 text-sm text-[#475569]">
                                                {item.type}
                                            </td>

                                            <td className="p-4 text-sm text-[#475569]">
                                                {item.issue || "General Consultation"}
                                            </td>

                                            <td className="p-4">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === "Pending Advocate"
                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                        : "bg-purple-50 text-purple-700 border border-purple-200"
                                                        }`}
                                                >
                                                    {item.status || "Pending"}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex gap-2 items-center">

                                                    {/* Normal appointment request */}
                                                    {item.status === "Pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(item);
                                                                    setShowAcceptModal(true);
                                                                }}
                                                                className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-full text-xs font-bold"
                                                            >
                                                                Accept
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(item);
                                                                    setShowDeclineModal(true);
                                                                }}
                                                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold"
                                                            >
                                                                Reschedule
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Client requested reschedule */}
                                                    {item.status === "Pending Advocate" && (
                                                        <>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await fetch(
                                                                            `${API_BASE_URL}/consultations/${item.id}/status`,
                                                                            {
                                                                                method: "PUT",
                                                                                headers: {
                                                                                    "Content-Type": "application/json",
                                                                                },
                                                                                body: JSON.stringify({
                                                                                    status: "Approved",
                                                                                    reason: "Approved client reschedule"
                                                                                }),
                                                                            }
                                                                        );

                                                                        if (res.ok) {
                                                                            fetchConsultations(user);
                                                                            alert("Client reschedule approved");
                                                                        }
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    }
                                                                }}
                                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold"
                                                            >
                                                                Accept Client Date
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(item);
                                                                    setShowDeclineModal(true);
                                                                }}
                                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-bold"
                                                            >
                                                                Give Another Date
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => {
                                                            setDeleteId(item.id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-slate-100 hover:bg-rose-100 text-[#475569] hover:text-rose-600 rounded-full text-xs font-bold"
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
            )}

            {/* Consultation History Modal */}
            {mounted && showHistory && typeof document !== "undefined" ? createPortal(
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 md:p-10 border border-[#E2E8F0] animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-extrabold text-[#0F172A] flex items-center gap-4">
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F8FAFC] text-[#64748B] hover:bg-slate-200 hover:text-[#0F172A] transition-colors"
                                    aria-label="Back"
                                >
                                    <span className="text-xl font-bold">←</span>
                                </button>
                                <span>Consultation History</span>
                                <span className="text-sm font-bold bg-[#F1F5F9] text-[#64748B] px-4 py-1.5 rounded-full">{history.length} total</span>
                            </h2>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F8FAFC] text-[#64748B] hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                aria-label="Close"
                            >
                                <span className="text-xl font-bold">✕</span>
                            </button>
                        </div>
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-[#64748B] font-medium bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E2E8F0]">
                                No consultations found. Start a new one below.
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
                                <table className="min-w-full divide-y divide-[#E2E8F0]">
                                    <thead className="bg-[#F8FAFC]">
                                        <tr>
                                            <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Client Name</th>
                                            <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Date</th>
                                            <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Time</th>
                                            <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Type</th>
                                            <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
                                            <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E2E8F0] bg-white">
                                        {history.map((item) => (
                                            <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="p-4 whitespace-nowrap font-bold text-[#0F172A] capitalize">{item.client}</td>
                                                <td className="p-4 whitespace-nowrap text-sm text-[#475569]">{formatDateString(item.date)}</td>
                                                <td className="p-4 whitespace-nowrap text-sm font-medium text-[#475569]">{formatTimeString(item.time)}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.type === "Video Call" || item.type === "Video Consultation"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                        : item.type === "Chat" || item.type === "Chat Consultation"
                                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === "Completed"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : item.status === "Approved"
                                                            ? "bg-green-50 text-green-700 border border-green-200"
                                                            : item.status === "Rescheduled"
                                                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                : item.status === "Pending Client"
                                                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => {
                                                            setDeleteId(item.id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-slate-100 hover:bg-rose-100 text-[#475569] hover:text-rose-600 rounded-full transition-colors text-xs font-bold uppercase tracking-wider active:scale-95 shadow-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            ) : null}

            {/* Consultation Form */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 mb-8">
                <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">
                    Schedule Consultation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Client Name</label>
                        <select
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full border border-[#E2E8F0] rounded-xl p-3.5 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                        >
                            <option value="">Select Client</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.clientName}>
                                    {client.clientName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Type</label>
                        <select
                            value={consultationType}
                            onChange={(e) => setConsultationType(e.target.value)}
                            className="w-full border border-[#E2E8F0] rounded-xl p-3.5 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium cursor-pointer"
                        >
                            <option>Consultation Type</option>
                            <option value="Video Call">Video Call</option>
                            <option value="Chat">Chat</option>
                            <option value="Person to Person">Person to Person</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Date</label>
                        <input
                            type="date"
                            value={consultationDate}
                            onChange={(e) => setConsultationDate(e.target.value)}
                            className="w-full border border-[#E2E8F0] rounded-xl p-3.5 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium cursor-pointer"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Time</label>
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
                                className="w-full p-3.5 text-[#0F172A] bg-transparent outline-none text-sm font-medium cursor-pointer"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                            Google Meet Link
                        </label>
                        <input
                            type="url"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            placeholder="Paste Google Meet link"
                            className="w-full border border-[#E2E8F0] rounded-xl p-3.5 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                        />
                    </div>

                </div>
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleStartConsultation}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-lg hover:shadow-xl active:scale-95 w-full md:w-auto"
                    >
                        Schedule Consultation
                    </button>
                </div>
            </div>

            {mounted && showScheduleSuccess && typeof document !== "undefined"
                ? createPortal(
                    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center border border-[#E2E8F0] animate-in fade-in zoom-in duration-200">

                            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                                ✅
                            </div>

                            <h2 className="text-2xl font-extrabold text-[#0F172A]">
                                Consultation Scheduled
                            </h2>

                            <p className="text-[#64748B] mt-4 font-medium leading-relaxed">
                                Your consultation has been scheduled successfully.
                                The client will receive the meeting details and can approve it.
                            </p>

                            <button
                                onClick={() => setShowScheduleSuccess(false)}
                                className="mt-8 w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-lg active:scale-95"
                            >
                                OK
                            </button>
                        </div>
                    </div>,
                    document.body
                )
                : null}





            {/* Delete Confirmation Modal */}
            {mounted && showDeleteModal && typeof document !== "undefined" ? createPortal(
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center border border-[#E2E8F0] animate-in fade-in zoom-in duration-200">
                        <div className="w-20 h-20 mx-auto bg-rose-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner text-rose-500">
                            🗑️
                        </div>
                        <h2 className="text-2xl font-extrabold text-[#0F172A]">
                            Delete Consultation
                        </h2>
                        <p className="text-[#64748B] mt-4 font-medium leading-relaxed">
                            Are you sure you want to delete this consultation? This action cannot be undone.
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteId(null);
                                }}
                                className="w-1/2 py-4 bg-slate-100 hover:bg-slate-200 text-[#475569] rounded-full font-bold uppercase tracking-wider text-xs transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConsultation}
                                className="w-1/2 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-lg active:scale-95"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            ) : null}

            {/* Accept Approval Modal */}
            {mounted && showAcceptModal && typeof document !== "undefined" ? createPortal(
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center border border-[#E2E8F0]">
                        <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                            ✅
                        </div>
                        <h2 className="text-2xl font-extrabold text-[#0F172A]">
                            Appointment Approved
                        </h2>
                        {selectedAppointment && (
                            <p className="text-[#64748B] mt-4 font-medium leading-relaxed">
                                Appointment request from{" "}
                                <span className="font-bold text-[#0F172A]">
                                    {selectedAppointment.client}
                                </span>{" "}
                                has been approved successfully.
                            </p>
                        )}
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch(`${API_BASE_URL}/consultations/${selectedAppointment.id}/status`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "Approved" })
                                    });
                                    if (res.ok) {
                                        fetchConsultations(user);
                                    } else {
                                        alert("Failed to approve appointment");
                                    }
                                } catch (err) {
                                    console.error(err);
                                }
                                setShowAcceptModal(false);
                            }}
                            className="mt-8 w-full py-4 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-lg active:scale-95"
                        >
                            OK, Continue
                        </button>
                    </div>
                </div>,
                document.body
            ) : null}

            {mounted && showRescheduleSuccess && typeof document !== "undefined"
                ? createPortal(
                    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center border border-[#E2E8F0] animate-in fade-in zoom-in duration-200">

                            <div className="w-20 h-20 mx-auto bg-amber-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                                📅
                            </div>

                            <h2 className="text-2xl font-extrabold text-[#0F172A]">
                                Reschedule Sent
                            </h2>

                            <p className="text-[#64748B] mt-4 font-medium leading-relaxed">
                                Your reschedule request has been sent successfully to the client.
                            </p>

                            <button
                                onClick={() => setShowRescheduleSuccess(false)}
                                className="mt-8 w-full py-4 bg-[#D97706] hover:bg-[#b45309] text-white rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-lg active:scale-95"
                            >
                                OK
                            </button>
                        </div>
                    </div>,
                    document.body
                )
                : null}


            {/* Decline/Reschedule Modal */}
            {mounted && showDeclineModal && typeof document !== "undefined" ? createPortal(
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-[#E2E8F0]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-extrabold text-[#0F172A]">
                                Reschedule Appointment
                            </h2>
                            <button
                                onClick={() => {
                                    setShowDeclineModal(false);
                                    setRescheduleReason("");
                                }}
                                className="w-10 h-10 rounded-full bg-[#F8FAFC] text-[#64748B] hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedAppointment && (
                            <div className="mb-8 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                                <p className="font-bold text-[#0F172A] text-sm">
                                    <span className="text-[#64748B] font-semibold uppercase tracking-wider text-xs mr-2">Client:</span>
                                    {selectedAppointment.client}
                                </p>
                            </div>
                        )}
                        <div className="space-y-6">
                            <div>
                                <label className="block mb-2 font-bold text-xs uppercase tracking-wider text-[#475569]">
                                    Next Available Date & Time
                                </label>
                                <div className="w-full border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB] transition-all cursor-pointer">
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        showTimeSelect
                                        timeIntervals={15}
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        className="w-full p-4 text-[#0F172A] bg-transparent outline-none text-sm font-medium cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2 font-bold text-xs uppercase tracking-wider text-[#475569]">
                                    Message / Reason
                                </label>
                                <textarea
                                    rows="4"
                                    placeholder="Enter reason for rescheduling..."
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    className="w-full border border-[#E2E8F0] rounded-xl p-4 text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-medium placeholder:text-[#94A3B8]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#F1F5F9]">
                            <button
                                onClick={() => {
                                    setShowDeclineModal(false);
                                    setRescheduleReason("");
                                }}
                                className="px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!selectedDate) {
                                        alert("Please select a valid date.");
                                        return;
                                    }
                                    const yyyy = selectedDate.getFullYear();
                                    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                    const dd = String(selectedDate.getDate()).padStart(2, '0');
                                    const formattedDate = `${yyyy}-${mm}-${dd}`;

                                    const hours = String(selectedDate.getHours()).padStart(2, '0');
                                    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                                    const formattedTime = `${hours}:${minutes}`;

                                    try {
                                        const res = await fetch(`${API_BASE_URL}/consultations/${selectedAppointment.id}/reschedule`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                date: formattedDate,
                                                time: formattedTime,
                                                reason: rescheduleReason || "Rescheduled by advocate",
                                                status: "Rescheduled"
                                            })
                                        });
                                        if (res.ok) {
                                            setShowRescheduleSuccess(true);
                                            fetchConsultations(user);
                                        } else {
                                            alert("Failed to reschedule");
                                        }
                                    } catch (err) {
                                        console.error(err);
                                    }
                                    setShowDeclineModal(false);
                                    setRescheduleReason("");
                                }}
                                className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-lg active:scale-95"
                            >
                                Submit Reschedule
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            ) : null}
        </div>
    );
}