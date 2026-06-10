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

    const appointments = [
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
    ];

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

                        <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl transition">
                            View History
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
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAppointment(item);
                                                            setShowAcceptModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg"
                                                    >
                                                        Accept
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedAppointment(item);
                                                            setShowDeclineModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                            className="w-full border border-gray-300 rounded-xl p-3 text-black placeholder:text-gray-500"
                        />

                        <select className="w-full border border-gray-300 rounded-xl p-3 text-black">
                            <option>Consultation Type</option>
                            <option>Video Call</option>
                            <option>Chat</option>
                            <option>Person to Person</option>
                        </select>

                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-xl p-3 text-black"
                        />

                        <input
                            type="time"
                            className="w-full border border-gray-300 rounded-xl p-3 text-black"
                        />
                    </div>

                    <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition">
                        Start Consultation
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500">Total Consultations</p>

                        <h3 className="text-3xl font-bold mt-2 text-gray-800">
                            28
                        </h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500">Video Calls</p>

                        <h3 className="text-3xl font-bold mt-2 text-gray-800">
                            16
                        </h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500">Chat Consultations</p>

                        <h3 className="text-3xl font-bold mt-2 text-gray-800">
                            12
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
                                    onClick={() => setShowAcceptModal(false)}
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