"use client";

import { API_BASE_URL } from "@/utils/api";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getLoggedInUser } from "@/utils/auth";
import {
    Users,
    Briefcase,
    FolderOpen,
    Gavel,
    FileText,
    RefreshCw,
    Upload,
    PlusCircle,
    ClipboardList,
    UserCheck,
    Phone,
} from "lucide-react";


// ─── Role badge colours ─────────────────────────────────────
const ROLE_BADGE = {
    "Junior Advocate": "bg-indigo-100 text-indigo-700",
    "Senior Advocate": "bg-slate-100 text-slate-700",
    "Client": "bg-rose-100 text-rose-700",
    "Advocate": "bg-slate-100 text-slate-600",
};

export default function AdvDashboardView() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setIsRefreshing(true);

        try {
            const loggedIn = getLoggedInUser();
            if (!user && loggedIn) setUser(loggedIn);

            const advParam = loggedIn && loggedIn.id ? `?advocate_id=${loggedIn.id}` : "";

            const [resUsers, resCases] = await Promise.all([
                fetch(`${API_BASE_URL}/permissions/users`),
                fetch(`${API_BASE_URL}/case-management/`),
            ]);

            if (!resUsers.ok || !resCases.ok) {
                throw new Error("Failed to fetch dashboard data from backend resources");
            }

            const [users, cases] = await Promise.all([
                resUsers.json(),
                resCases.json(),
            ]);


            // Documents — fetched separately so backend restart isn't required
            let documents = [];
            try {
                const resDocs = await fetch(`${API_BASE_URL}/dashboard/recent-documents?limit=8`);
                if (resDocs.ok) documents = await resDocs.json();
            } catch (e) {
                console.warn("Recent documents endpoint not available:", e.message);
            }

            // 1. Total advocates count
            const total_advocates = users.filter(u => u.role && u.role.toLowerCase().includes("advocate")).length;

            // 2. Cases stats
            const active_cases = cases.filter(c => c.status === "Active" || c.status === "Hearing").length;
            const pending_cases = cases.filter(c => c.status === "Pending").length;
            const closed_cases = cases.filter(c => c.status === "Closed").length;

            // 3. Upcoming hearings count
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            const extractedHearings = [];
            cases.forEach(c => {
                if (c.next_hearing_date) {
                    const isIso = c.next_hearing_date.includes('T');
                    const datePart = isIso ? c.next_hearing_date.split('T')[0] : c.next_hearing_date.split(' ')[0];

                    if (datePart >= todayStr) {
                        extractedHearings.push({
                            date: datePart,
                            case_title: c.case_title,
                            court: c.court_name,
                            advocate_name: c.selected_advocate || ""
                        });
                    }
                }
            });

            const upcoming_hearings_count = extractedHearings.length;

            // 4. Case Overview list
            const casesList = [...cases]
                .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
                .slice(0, 5)
                .map(c => ({
                    case_no: c.case_no,
                    client_name: c.client_name,
                    type: c.case_type,
                    court: c.court_name,
                    status: c.status
                }));

            // 5. Hearings list
            const formatHearingDate = (dateStr) => {
                if (!dateStr) return "";
                const parts = dateStr.split("-");
                if (parts.length !== 3) return dateStr;
                const dNum = parseInt(parts[2], 10);
                const mNum = parseInt(parts[1], 10) - 1;
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return `${dNum} ${months[mNum]}`;
            };

            const hearingsList = [...extractedHearings]
                .sort((a, b) => {
                    if (a.date !== b.date) return a.date.localeCompare(b.date);
                    return (a.time || "").localeCompare(b.time || "");
                })
                .slice(0, 5)
                .map(h => ({
                    date: formatHearingDate(h.date),
                    case_title: h.case_title,
                    court: h.court,
                    advocate_name: h.advocate_name || "",
                }));

            setData({
                stats: {
                    total_advocates,
                    active_cases,
                    pending_cases,
                    closed_cases,
                    upcoming_hearings_count
                },
                cases: casesList,
                hearings: hearingsList,
                documents,
            });

            setLastRefreshed(new Date());
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            if (!data) setError(err.message); // Only show full error on first load
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loggedIn = getLoggedInUser();
        setUser(loggedIn);
        fetchDashboardData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchDashboardData]);

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
        : "";

    const displayRole = user ? user.role : "";

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
        <div className="w-full space-y-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">

            {/* Page Header */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                        {greeting}, {displayName}
                    </h1>
                    <p className="text-[#64748B] mt-2 text-lg font-medium">
                        {displayRole}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="text-left md:text-right bg-[#F8FAFC] px-6 py-4 rounded-2xl border border-[#E2E8F0]">
                        <p className="text-[#475569] font-bold text-sm uppercase tracking-wider">Today's Date</p>
                        <p className="text-[#0F172A] font-extrabold text-lg mt-1">{currentDate}</p>
                    </div>
                    {/* Refresh button */}
                    <button
                        onClick={() => fetchDashboardData(true)}
                        disabled={isRefreshing}
                        title="Refresh dashboard"
                        className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                        {isRefreshing ? "Refreshing…" : lastRefreshed
                            ? `Last updated ${lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                            : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((item, index) => {
                    const Icon = item.icon;
                    const colors = [
                        { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
                        { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
                        { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
                        { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
                    ];
                    const color = colors[index % colors.length];

                    return (
                        <div
                            key={index}
                            className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-6 md:p-8 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer group"
                        >
                            <div className={`w-14 h-14 md:w-16 md:h-16 ${color.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border ${color.border}`}>
                                <Icon className={`w-7 h-7 md:w-8 md:h-8 ${color.text}`} />
                            </div>

                            <p className="text-[#475569] text-xs font-bold uppercase tracking-wider mb-2">
                                {item.title}
                            </p>

                            <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight">
                                {item.value}
                            </h2>
                        </div>
                    );
                })}
            </div>

            {/* Case Overview */}
            <div className="grid grid-cols-12 gap-8">

                <div className="col-span-12 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-extrabold text-[#0F172A]">
                            Case Overview
                        </h2>
                        <button className="text-xs font-bold text-[#2563EB] uppercase tracking-wider hover:text-[#1d4ed8] transition-colors">
                            View All
                        </button>
                    </div>

                    <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0]">
                        <table className="min-w-full divide-y divide-[#E2E8F0]">
                            <thead className="bg-[#F8FAFC]">
                                <tr>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Case No</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Client</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Type</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Court</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E2E8F0] bg-white">
                                {data && data.cases.length > 0 ? (
                                    data.cases.map((c, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-[#F8FAFC] transition-colors duration-150"
                                        >
                                            <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">{c.case_no}</td>
                                            <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{c.client_name}</td>
                                            <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{c.type}</td>
                                            <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{c.court}</td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${c.status === "Hearing"
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                    : c.status === "Active"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-sm font-medium text-[#64748B]">
                                            No cases found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


            </div>

            {/* Upcoming Hearings + Recent Documents */}
            <div className="grid grid-cols-12 gap-8">

                <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-extrabold text-[#0F172A]">
                            Upcoming Hearings
                        </h2>
                        <button
                            onClick={() => router.push("/calendar")}
                            className="text-xs font-bold text-[#2563EB] uppercase tracking-wider hover:text-[#1d4ed8] transition-colors cursor-pointer"
                        >
                            View Calendar
                        </button>
                    </div>

                    <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0]">
                        <table className="min-w-full divide-y divide-[#E2E8F0]">
                            <thead className="bg-[#F8FAFC]">
                                <tr>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Date</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Case</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Court</th>
                                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Advocate</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E2E8F0] bg-white">
                                {data && data.hearings.length > 0 ? (
                                    data.hearings.map((h, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-[#F8FAFC] transition-colors duration-150"
                                        >
                                            <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">
                                                <div className="bg-[#F1F5F9] px-3 py-1.5 rounded-lg inline-block text-center border border-[#E2E8F0]">
                                                    {h.date}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{h.case_title}</td>
                                            <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{h.court}</td>
                                            <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{h.advocate_name}</td>
                                            <td className="p-4 text-sm font-bold text-[#2563EB] whitespace-nowrap">{h.time}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-sm font-medium text-[#64748B]">
                                            No upcoming hearings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── Recent Documents Panel ─── */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-extrabold text-[#0F172A]">
                            Recent Documents
                        </h2>
                        {isRefreshing && (
                            <RefreshCw className="w-4 h-4 text-[#2563EB] animate-spin" />
                        )}
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px]">
                        {data && data.documents.length > 0 ? (
                            data.documents.map((doc, index) => {
                                const roleBadgeClass = ROLE_BADGE[doc.uploaded_by_role] || "bg-slate-100 text-slate-600";
                                return (
                                    <div
                                        key={doc.id || index}
                                        className="p-4 rounded-2xl bg-[#F8FAFC] hover:bg-white border border-transparent hover:border-[#E2E8F0] hover:shadow-md transition-all duration-300 cursor-pointer group"
                                    >
                                        {/* Top row: icon + filename + view button */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#1E293B] group-hover:text-[#2563EB] transition-colors truncate leading-tight">
                                                    {doc.filename}
                                                </p>

                                                {/* Doc type badge */}
                                                {doc.document_type && doc.document_type !== "File" && (
                                                    <span className="inline-block mt-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                        {doc.document_type}
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();

                                                    localStorage.setItem(
                                                        "clientData",
                                                        JSON.stringify({
                                                            clientId: doc.client_name,
                                                            fullName: doc.client_name,
                                                        })
                                                    );

                                                    router.push("/client-management/view-history");
                                                }}
                                                className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                View Case
                                            </button>
                                        </div>

                                        {/* Case name */}
                                        {doc.case_title && (
                                            <p className="text-[10px] text-[#475569] font-medium mt-2 truncate">
                                                📁 {doc.case_title}
                                                {doc.case_no && <span className="text-[#94A3B8] ml-1">({doc.case_no})</span>}
                                            </p>
                                        )}

                                        {/* Uploader + time row */}
                                        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                                            <div className="flex items-center flex-wrap gap-1">
                                                <span className="text-[10px] text-[#94A3B8]">
                                                    by
                                                </span>

                                                <span className="text-[10px] font-semibold text-[#0F172A]">
                                                    {doc.uploaded_by && doc.uploaded_by !== "Unknown"
                                                        ? doc.uploaded_by
                                                        : "Unknown"}
                                                </span>

                                                <span className="text-[#CBD5E1] text-[10px]">
                                                    ·
                                                </span>

                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeClass}`}
                                                >
                                                    {doc.uploaded_by_role || "Advocate"}
                                                </span>
                                            </div>

                                            <span className="text-[10px] text-[#94A3B8] font-medium">
                                                {doc.timestamp_display || "Recently"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center p-8 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                                <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
                                <p className="text-sm font-medium text-[#64748B]">No documents uploaded yet.</p>
                                <p className="text-xs text-[#94A3B8] mt-1">Documents uploaded via cases will appear here.</p>
                            </div>
                        )}
                    </div>

                    {/* Auto-refresh indicator */}
                    <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <p className="text-[10px] font-medium text-[#94A3B8]">Auto-refreshes every 30 seconds</p>
                    </div>
                </div>

            </div>

        </div>
    );
}