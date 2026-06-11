"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ConsultationsView() {
    const [showAppointments, setShowAppointments] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showAcceptModal, setShowAcceptModal] = useState(false);

    const [showHistory, setShowHistory] = useState(false);
    const [clientName, setClientName] = useState("");
    const [consultationType, setConsultationType] = useState("Consultation Type");
    const [consultationDate, setConsultationDate] = useState("");
    const [consultationTime, setConsultationTime] = useState("");

    const [history, setHistory] = useState([
        { id: 1, client: "Rajesh Shrivastav", date: "01 May 2026", time: "10:00 AM", type: "Video Call", status: "Completed" },
        { id: 2, client: "Kirti Azad", date: "01 May 2026", time: "11:30 AM", type: "Chat", status: "Completed" },
        { id: 3, client: "Sanjay Dutt", date: "02 May 2026", time: "09:00 AM", type: "Video Call", status: "Completed" },
        { id: 4, client: "Nisha Patel", date: "02 May 2026", time: "03:00 PM", type: "Chat", status: "Completed" },
        { id: 5, client: "Rohan Mehra", date: "03 May 2026", time: "11:00 AM", type: "Video Call", status: "Completed" },
        { id: 6, client: "Meera Nair", date: "03 May 2026", time: "04:30 PM", type: "Chat", status: "Completed" },
        
    ]);

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
        const [hoursStr, minutesStr] = timeStr.split(":");
        let hours = parseInt(hoursStr, 10);
        const minutes = minutesStr;
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutesFormatted = minutes.length === 1 ? `0${minutes}` : minutes;
        return `${hours}:${minutesFormatted} ${ampm}`;
    };

    const handleStartConsultation = () => {
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

        const formattedDate = formatDateString(consultationDate);
        const formattedTime = formatTimeString(consultationTime);

        const newConsultation = {
            id: Date.now(),
            client: clientName,
            date: formattedDate,
            time: formattedTime,
            type: consultationType,
            status: "Scheduled"
        };

        setHistory([newConsultation, ...history]);
        setClientName("");
        setConsultationType("Consultation Type");
        setConsultationDate("");
        setConsultationTime("");
        setShowHistory(true);
    };

    const totalConsultations = history.length;
    const videoCalls = history.filter(item => item.type === "Video Call").length;
    const chatConsultations = history.filter(item => item.type === "Chat").length;

    const [appointments, setAppointments] = useState([
        {
            id: 1,
            client: "Rajesh Kumar",
            date: "14 May 2026",
            time: "11:00 AM",
            type: "Video Call",
            issue: "Civil Dispute",
            fee: "₹500",
            status: "Pending",
        },
        {
            id: 2,
            client: "Priya Singh",
            date: "14 May 2026",
            time: "04:00 PM",
            type: "Chat",
            issue: "Family Law",
            fee: "₹500",
            status: "Pending",
        },
        {
            id: 3,
            client: "Amit Verma",
            date: "15 May 2026",
            time: "10:30 AM",
            type: "Video Call",
            issue: "Criminal Law",
            fee: "₹600",
            status: "Pending",
        },
    ]);

    return (
        <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                        Consultation Management
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Dashboard &gt; Consultation Management
                    </p>
                </div>

                {/* Top Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Accept Appointments
                        </h3>

                        <p className="text-gray-500 text-sm mt-2">
                            View and manage consultation requests
                        </p>

                        <button
                            onClick={() => setShowAppointments(!showAppointments)}
                            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition"
                        >
                            View Appointments
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Video / Chat Consultation
                        </h3>

                        <p className="text-gray-500 text-sm mt-2">
                            Start a new consultation
                        </p>

                        <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition">
                            Start Consultation
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sm:col-span-2 xl:col-span-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Consultation History
                        </h3>

                        <p className="text-gray-500 text-sm mt-2">
                            View previous consultations
                        </p>

                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl transition"
                        >
                            {showHistory ? "Hide History" : "View History"}
                        </button>
                    </div>
                </div>

                {/* Appointment Requests */}
                {showAppointments && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">
                            Appointment Requests
                        </h2>

                        <div className="w-full overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="p-3 text-left whitespace-nowrap">
                                            Client
                                        </th>
                                        <th className="p-3 text-left whitespace-nowrap">
                                            Date & Time
                                        </th>
                                        <th className="p-3 text-left whitespace-nowrap">
                                            Type
                                        </th>
                                        <th className="p-3 text-left whitespace-nowrap">
                                            Issue
                                        </th>
                                        <th className="p-3 text-left whitespace-nowrap">
                                            Fee
                                        </th>
                                        <th className="p-3 text-left whitespace-nowrap">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {appointments.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-gray-200"
                                        >
                                            <td className="p-3 whitespace-nowrap">
                                                {item.client}
                                            </td>

                                            <td className="p-3 whitespace-nowrap">
                                                {item.date}
                                                <br />
                                                {item.time}
                                            </td>

                                            <td className="p-3 whitespace-nowrap">
                                                {item.type}
                                            </td>

                                            <td className="p-3 whitespace-nowrap">
                                                {item.issue}
                                            </td>

                                            <td className="p-3 text-green-600 font-semibold whitespace-nowrap">
                                                {item.fee}
                                            </td>

                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {item.status === "Approved" ? (
                                                        <button
                                                            disabled
                                                            className="px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg cursor-not-allowed font-medium"
                                                        >
                                                            Approved
                                                        </button>
                                                    ) : item.status === "Rescheduled" ? (
                                                        <button
                                                            disabled
                                                            className="px-4 py-2 bg-amber-100 text-amber-700 border border-amber-300 rounded-lg cursor-not-allowed font-medium"
                                                        >
                                                            Rescheduled
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(item);
                                                                    setShowAcceptModal(true);
                                                                }}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                            >
                                                                Accept
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(item);
                                                                    setShowDeclineModal(true);
                                                                }}
                                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                            >
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Consultation History */}
                {showHistory && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center justify-between">
                            <span>Consultation History</span>
                            <span className="text-sm font-normal text-gray-500">{history.length} total</span>
                        </h2>

                        {history.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No consultations found. Start a new one below.
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-gray-200">
                                            <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                                Client
                                            </th>
                                            <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                                Date & Time
                                            </th>
                                            <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                                Type
                                            </th>
                                            <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {history.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="p-4 whitespace-nowrap font-medium text-gray-800">
                                                    {item.client}
                                                </td>

                                                <td className="p-4 whitespace-nowrap text-sm text-gray-600">
                                                    {item.date}
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    {item.time}
                                                </td>

                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                        item.type === "Video Call"
                                                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                            : item.type === "Chat"
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
                                                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Consultation */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                        Consultation
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Client Name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl p-3 text-black placeholder:text-gray-500"
                        />

                        <select
                            value={consultationType}
                            onChange={(e) => setConsultationType(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl p-3 text-black"
                        >
                            <option>Consultation Type</option>
                            <option>Video Call</option>
                            <option>Chat</option>
                            <option>Person to Person</option>
                        </select>

                        <input
                            type="date"
                            value={consultationDate}
                            onChange={(e) => setConsultationDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl p-3 text-black"
                        />

                        <input
                            type="time"
                            value={consultationTime}
                            onChange={(e) => setConsultationTime(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl p-3 text-black"
                        />
                    </div>

                    <button
                        onClick={handleStartConsultation}
                        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
                    >
                        Start Consultation
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500">Total Consultations</p>

                        <h3 className="text-3xl font-bold mt-2 text-gray-800">
                            {totalConsultations}
                        </h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500">Video Calls</p>

                        <h3 className="text-3xl font-bold mt-2 text-gray-800">
                            {videoCalls}
                        </h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500">Chat Consultations</p>

                        <h3 className="text-3xl font-bold mt-2 text-gray-800">
                            {chatConsultations}
                        </h3>
                    </div>
                </div>
                {showAcceptModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center text-4xl">
                                    ✅
                                </div>

                                <h2 className="text-2xl font-bold text-gray-800 mt-4">
                                    Appointment Approved
                                </h2>

                                {selectedAppointment && (
                                    <p className="text-gray-600 mt-3">
                                        Appointment request from{" "}
                                        <span className="font-semibold">
                                            {selectedAppointment.client}
                                        </span>{" "}
                                        has been approved successfully.
                                    </p>
                                )}

                                <button
                                    onClick={() => {
                                        setAppointments(prev => prev.map(app => app.id === selectedAppointment.id ? {...app, status: 'Approved'} : app));
                                        setShowAcceptModal(false);
                                    }}
                                    className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showDeclineModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                Reschedule Appointment
                            </h2>

                            {selectedAppointment && (
                                <div className="mb-4 p-3 bg-slate-100 rounded-lg">
                                    <p className="font-medium">
                                        Client: {selectedAppointment.client}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2 font-medium text-gray-700">
                                        Next Available Date
                                    </label>

                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-xl p-3 text-black"
                                    />

                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        showTimeSelect
                                        timeIntervals={15}
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        className="w-full border border-gray-300 rounded-xl p-3 text-black"
                                    />

                                </div>
                                <div>
                                    <label className="block mb-2 font-medium text-gray-700">
                                        Message
                                    </label>

                                    <textarea
                                        rows="4"
                                        placeholder="Enter reason for rescheduling..."
                                        className="w-full border border-gray-300 rounded-xl p-3 text-black"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowDeclineModal(false)}
                                    className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => {
                                        setAppointments(prev => prev.map(app => app.id === selectedAppointment.id ? {...app, status: 'Rescheduled'} : app));
                                        alert("Reschedule request sent");
                                        setShowDeclineModal(false);
                                    }}
                                    className="px-5 py-2 bg-red-600 text-white rounded-lg"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>


                )}
            </div>
        </div>
    );
}