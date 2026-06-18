"use client";

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

    const fetchConsultations = async (currentUser) => {
        try {
            let url = "http://localhost:8000/consultations";
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
                    item.status === "Pending"
                );

                // History: Approved, Rescheduled, or Pending Client
                const hist = mappedData.filter(item =>
                    item.status === "Approved" || item.status === "Rescheduled" || item.status === "Pending Client"
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

        const startData = {
            client_name: clientName,
            type: consultationType,
            date: consultationDate,
            time: consultationTime,
            status: "Pending Client"
        };

        try {
            let url = "http://localhost:8000/consultations/start";
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
                setSelectedTimeDate(null);
                setShowHistory(true);
                fetchConsultations(user);
            } else {
                alert("Failed to start/schedule consultation");
            }
        } catch (err) {
            console.error("Error creating consultation:", err);
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
                fetchConsultations(user);
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
        <div className="w-full space-y-6 md:space-y-8">
            {/* Page Header */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
                <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
                    Consultations
                </h1>
                <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
                    Schedule and manage client consultations
                </p>
            </div>

            {/* Notifications */}
            {mounted && history.filter(item => {
                if (dismissedNotifications.includes(item.id)) return false;
                const isApprovedByClient = item.status === "Approved" && item.reschedule_reason === "Approved by client";
                const isRescheduledByClient = item.status === "Rescheduled" && item.reschedule_reason?.includes("client");
                return isApprovedByClient || isRescheduledByClient;
            }).length > 0 && (
                <div className="space-y-3 mb-6">
                    {history.filter(item => {
                        if (dismissedNotifications.includes(item.id)) return false;
                        const isApprovedByClient = item.status === "Approved" && item.reschedule_reason === "Approved by client";
                        const isRescheduledByClient = item.status === "Rescheduled" && item.reschedule_reason?.includes("client");
                        return isApprovedByClient || isRescheduledByClient;
                    }).map(item => {
                        const isApproved = item.status === "Approved";
                        return (
                            <div
                                key={item.id}
                                className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-300 ${
                                    isApproved 
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
                                                : `Client ${item.client} rescheduled the consultation`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-[#0F172A]">
                        Accept Appointments
                    </h3>
                    <p className="text-[#64748B] text-sm mt-2">
                        View and manage consultation requests
                    </p>
                    <button
                        onClick={() => setShowAppointments(!showAppointments)}
                        className="w-full mt-4 bg-[#16A34A] hover:bg-[#15803d] text-white py-3 rounded-xl transition"
                    >
                        {showAppointments ? "Hide Appointments" : "View Appointments"}
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-[#0F172A]">
                        Video / Chat Consultation
                    </h3>
                    <p className="text-[#64748B] text-sm mt-2">
                        Start a new consultation
                    </p>
                    <button className="w-full mt-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-3 rounded-xl transition">
                        Start Consultation
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm sm:col-span-2 xl:col-span-1">
                    <h3 className="text-lg font-semibold text-[#0F172A]">
                        Consultation History
                    </h3>
                    <p className="text-[#64748B] text-sm mt-2">
                        View previous consultations
                    </p>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full mt-4 bg-[#D97706] hover:bg-[#b45309] text-white py-3 rounded-xl transition"
                    >
                        {showHistory ? "Hide History" : "View History"}
                    </button>
                </div>
            </div>

            {/* Appointment Requests */}
            {showAppointments && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
                        Appointment Requests
                    </h2>
                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-[#F8FAFC]">
                                    <th className="p-3 text-left whitespace-nowrap">Client Name</th>
                                    <th className="p-3 text-left whitespace-nowrap">Date</th>
                                    <th className="p-3 text-left whitespace-nowrap">Time</th>
                                    <th className="p-3 text-left whitespace-nowrap">Type</th>
                                    <th className="p-3 text-left whitespace-nowrap">Issue</th>
                                    <th className="p-3 text-left whitespace-nowrap">Fee</th>
                                    <th className="p-3 text-left whitespace-nowrap">Status</th>
                                    <th className="p-3 text-left whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-4 text-center text-slate-500">
                                            No pending appointment requests.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((item) => (
                                        <tr key={item.id} className="border-b border-[#E2E8F0]">
                                            <td className="p-3 whitespace-nowrap capitalize">{item.client}</td>
                                            <td className="p-3 whitespace-nowrap">{formatDateString(item.date)}</td>
                                            <td className="p-3 whitespace-nowrap">{formatTimeString(item.time)}</td>
                                            <td className="p-3 whitespace-nowrap">{item.type}</td>
                                            <td className="p-3 whitespace-nowrap">{item.issue || "General Consultation"}</td>
                                            <td className="p-3 text-[#16A34A] font-semibold whitespace-nowrap">{item.fee || "₹500"}</td>
                                            <td className="p-3 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/50">
                                                    {item.status || "Pending"}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAppointment(item);
                                                            setShowAcceptModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAppointment(item);
                                                            setShowDeclineModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-white rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        Reschedule
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteConsultation(item.id)}
                                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors text-xs font-medium"
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

            {/* Consultation History */}
            {showHistory && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-8 transition-all duration-300">
                    <h2 className="text-xl font-semibold text-[#0F172A] mb-6 flex items-center justify-between">
                        <span>Consultation History</span>
                        <span className="text-sm font-normal text-[#64748B]">{history.length} total</span>
                    </h2>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-[#64748B]">
                            No consultations found. Start a new one below.
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="p-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Client Name</th>
                                        <th className="p-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Date</th>
                                        <th className="p-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Time</th>
                                        <th className="p-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Type</th>
                                        <th className="p-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th className="p-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map((item) => (
                                        <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-4 whitespace-nowrap font-medium text-[#0F172A] capitalize">{item.client}</td>
                                            <td className="p-4 whitespace-nowrap text-sm text-[#64748B]">{formatDateString(item.date)}</td>
                                            <td className="p-4 whitespace-nowrap text-sm text-[#64748B]">{formatTimeString(item.time)}</td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    item.type === "Video Call" || item.type === "Video Consultation"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                        : item.type === "Chat" || item.type === "Chat Consultation"
                                                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                                }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    item.status === "Completed"
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
                                                    onClick={() => handleDeleteConsultation(item.id)}
                                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors text-xs font-medium"
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
            )}

            {/* Consultation Form */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
                    Consultation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Client Name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full border border-[#E2E8F0] rounded-xl p-3 text-black placeholder:text-[#64748B]"
                    />
                    <select
                        value={consultationType}
                        onChange={(e) => setConsultationType(e.target.value)}
                        className="w-full border border-[#E2E8F0] rounded-xl p-3 text-black"
                    >
                        <option>Consultation Type</option>
                        <option value="Video Call">Video Call</option>
                        <option value="Chat">Chat</option>
                        <option value="Person to Person">Person to Person</option>
                    </select>
                    <input
                        type="date"
                        value={consultationDate}
                        onChange={(e) => setConsultationDate(e.target.value)}
                        className="w-full border border-[#E2E8F0] rounded-xl p-3 text-black"
                    />
                    <DatePicker
                        selected={selectedTimeDate}
                        onChange={handleTimeChange}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        placeholderText="Select Time"
                        className="w-full border border-[#E2E8F0] rounded-xl p-3 text-black"
                    />
                </div>
                <button
                    onClick={handleStartConsultation}
                    className="mt-6 bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-xl transition"
                >
                    Start Consultation
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                    <p className="text-[#64748B]">Total Consultations</p>
                    <h3 className="text-3xl font-bold mt-2 text-[#0F172A]">
                        {totalConsultations}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                    <p className="text-[#64748B]">Video Calls</p>
                    <h3 className="text-3xl font-bold mt-2 text-[#0F172A]">
                        {videoCalls}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                    <p className="text-[#64748B]">Chat Consultations</p>
                    <h3 className="text-3xl font-bold mt-2 text-[#0F172A]">
                        {chatConsultations}
                    </h3>
                </div>
            </div>

            {/* Accept Approval Modal */}
            {mounted && showAcceptModal && typeof document !== "undefined" ? createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center text-4xl">
                                ✅
                            </div>
                            <h2 className="text-2xl font-bold text-[#0F172A] mt-4">
                                Appointment Approved
                            </h2>
                            {selectedAppointment && (
                                <p className="text-[#64748B] mt-3">
                                    Appointment request from{" "}
                                    <span className="font-semibold">
                                        {selectedAppointment.client}
                                    </span>{" "}
                                    has been approved successfully.
                                </p>
                            )}
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`http://localhost:8000/consultations/${selectedAppointment.id}/status`, {
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
                                className="mt-6 px-6 py-3 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-xl"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            ) : null}

            {/* Decline/Reschedule Modal */}
            {mounted && showDeclineModal && typeof document !== "undefined" ? createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-2xl font-bold text-[#0F172A] mb-6">
                            Reschedule Appointment
                        </h2>
                        {selectedAppointment && (
                            <div className="mb-4 p-3 bg-[#F8FAFC] rounded-lg">
                                <p className="font-medium">
                                    Client: {selectedAppointment.client}
                                </p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 font-medium text-gray-700">
                                    Next Available Date & Time
                                </label>
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={(date) => setSelectedDate(date)}
                                    showTimeSelect
                                    timeIntervals={15}
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className="w-full border border-[#E2E8F0] rounded-xl p-3 text-black"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 font-medium text-gray-700">
                                    Message / Reason
                                </label>
                                <textarea
                                    rows="4"
                                    placeholder="Enter reason for rescheduling..."
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    className="w-full border border-[#E2E8F0] rounded-xl p-3 text-black"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowDeclineModal(false);
                                    setRescheduleReason("");
                                }}
                                className="px-5 py-2 bg-gray-300 text-[#0F172A] rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!selectedDate) {
                                        alert("Please select a valid date.");
                                        return;
                                    }
                                    // Extract components safely
                                    const yyyy = selectedDate.getFullYear();
                                    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                    const dd = String(selectedDate.getDate()).padStart(2, '0');
                                    const formattedDate = `${yyyy}-${mm}-${dd}`;
                                    
                                    const hours = String(selectedDate.getHours()).padStart(2, '0');
                                    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                                    const formattedTime = `${hours}:${minutes}`;

                                    try {
                                        const res = await fetch(`http://localhost:8000/consultations/${selectedAppointment.id}/reschedule`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                date: formattedDate,
                                                time: formattedTime,
                                                reason: rescheduleReason || "Rescheduled by advocate"
                                            })
                                        });
                                        if (res.ok) {
                                            alert("Reschedule request sent");
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
                                className="px-5 py-2 bg-red-600 text-white rounded-lg"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            ) : null}
        </div>
    );
}