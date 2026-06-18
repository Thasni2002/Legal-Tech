"use client";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import {
    Users,
    Briefcase,
    FolderOpen,
    Gavel,
    FileText,
} from "lucide-react";

export default function AdvDashboardView() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    const hour = new Date().getHours();
    let greeting = "";

    if (hour >= 5 && hour < 12) {
        greeting = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good Evening";
    } else {
        greeting = "Good Night";
    }

    const currentDate = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    useEffect(() => {
        const loggedIn = getLoggedInUser();
        setUser(loggedIn);

        const fetchDashboardData = async () => {
            try {
                let url = "http://localhost:8000/advocate/dashboard";
                if (loggedIn && loggedIn.id) {
                    url += `?advocate_id=${loggedIn.id}`;
                }
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard data");
                }
                const resData = await response.json();
                setData(resData);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-96 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2563EB]"></div>
                <p className="text-[#64748B] text-sm animate-pulse">Loading dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto mt-12">
                <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Dashboard</h3>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const displayName = user
        ? user.username
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
        : "Rahul Sharma";

    const displayRole = user ? user.role : "Senior Advocate";

    const stats = [
        {
            title: "Total Advocates",
            value: data ? String(data.stats.total_advocates) : "0",
            icon: Users,
        },
        {
            title: "Active Cases",
            value: data ? String(data.stats.active_cases) : "0",
            icon: Briefcase,
        },
        {
            title: "Pending Cases",
            value: data ? String(data.stats.pending_cases) : "0",
            icon: FolderOpen,
        },
        {
            title: "Upcoming Hearings",
            value: data ? String(data.stats.upcoming_hearings_count) : "0",
            icon: Gavel,
        },
    ];

    return (
        <div className="w-full space-y-6 md:space-y-8 animate-fade-in">

            {/* Page Header */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
                        {greeting}, {displayName}
                    </h1>
                    <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
                        {displayRole}
                    </p>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-[#64748B] font-medium" style={{ fontSize: '16px' }}>{currentDate}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl border border-[#E2E8F0] p-5 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                        >
                            <div className="w-11 h-11 md:w-12 md:h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mb-4">
                                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>

                            <p className="text-[#64748B] text-sm md:text-base">
                                {item.title}
                            </p>

                            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-[#0F172A]">
                                {item.value}
                            </h2>
                        </div>
                    );
                })}
            </div>

            {/* Case Overview + Activities */}
            <div className="grid grid-cols-12 gap-6">

                <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[#0F172A]">
                        Case Overview
                    </h2>

                    <div className="overflow-x-auto -mx-5 md:mx-0">
                        <div className="inline-block min-w-full align-middle px-5 md:px-0">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0]">
                                        <th className="text-left py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Case No</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Client</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Type</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Court</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data && data.cases.length > 0 ? (
                                        data.cases.map((c, index) => (
                                            <tr 
                                                key={index}
                                                className={`hover:bg-[#F8FAFC] transition-colors duration-150 ${
                                                    index !== data.cases.length - 1 ? "border-b border-[#F1F5F9]" : ""
                                                }`}
                                            >
                                                <td className="py-4 text-sm text-[#0F172A]">{c.case_no}</td>
                                                <td className="text-sm text-[#1E293B]">{c.client_name}</td>
                                                <td className="text-sm text-[#64748B]">{c.type}</td>
                                                <td className="text-sm text-[#64748B]">{c.court}</td>
                                                <td className="py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        c.status === "Hearing" 
                                                            ? "bg-[#2563EB]/10 text-[#2563EB]" 
                                                            : c.status === "Active" 
                                                            ? "bg-[#16A34A]/10 text-[#16A34A]" 
                                                            : "bg-[#D97706]/10 text-[#D97706]"
                                                    }`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-sm text-[#64748B]">
                                                No cases found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[#0F172A]">
                        Recent Activities
                    </h2>

                    <div className="space-y-4 md:space-y-5">
                        {data && data.activities.length > 0 ? (
                            data.activities.map((act, index) => {
                                let borderColor = "border-[#2563EB]";
                                if (act.type === "hearing") {
                                    borderColor = "border-[#D97706]";
                                } else if (act.type === "meeting") {
                                    borderColor = "border-[#16A34A]";
                                }
                                return (
                                    <div key={index} className={`border-l-[3px] ${borderColor} pl-4`}>
                                        <h4 className="font-medium text-sm md:text-base text-[#0F172A]">
                                            {act.title}
                                        </h4>
                                        <p className="text-xs md:text-sm text-[#64748B]">
                                            {act.timestamp_str}
                                        </p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-[#64748B]">No recent activities.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Upcoming Hearings + Documents */}
            <div className="grid grid-cols-12 gap-6">

                <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[#0F172A]">
                        Upcoming Hearings
                    </h2>

                    <div className="overflow-x-auto -mx-5 md:mx-0">
                        <div className="inline-block min-w-full align-middle px-5 md:px-0">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0]">
                                        <th className="text-left py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Date</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Case</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Court</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Advocate</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data && data.hearings.length > 0 ? (
                                        data.hearings.map((h, index) => (
                                            <tr 
                                                key={index} 
                                                className={`hover:bg-[#F8FAFC] transition-colors duration-150 ${
                                                    index !== data.hearings.length - 1 ? "border-b border-[#F1F5F9]" : ""
                                                }`}
                                            >
                                                <td className="py-4 text-sm text-[#0F172A] font-medium">{h.date}</td>
                                                <td className="text-sm text-[#1E293B]">{h.case_title}</td>
                                                <td className="text-sm text-[#64748B]">{h.court}</td>
                                                <td className="text-sm text-[#1E293B]">{h.advocate_name}</td>
                                                <td className="text-sm text-[#64748B]">{h.time}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-sm text-[#64748B]">
                                                No upcoming hearings found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[#0F172A]">
                        Recent Documents
                    </h2>

                    <div className="space-y-2 md:space-y-3">
                        {data && data.documents.length > 0 ? (
                            data.documents.map((doc, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <FileText className="w-5 h-5 text-[#64748B] shrink-0" />
                                        <span className="truncate text-sm text-[#1E293B]">{doc.filename}</span>
                                    </div>

                                    <button className="font-medium text-sm text-[#2563EB] hover:text-[#1d4ed8] ml-2 shrink-0 transition-colors duration-150">
                                        View
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-[#64748B] p-2">No recent documents.</p>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}