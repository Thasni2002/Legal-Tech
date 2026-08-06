"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import { isSensitiveCase } from "@/utils/caseSensitivity";
import { API_BASE_URL } from "@/utils/api";
import {
  Briefcase,
  Calendar,
  FolderOpen,
  User,
  ArrowRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gavel,
} from "lucide-react";

const ROLE_BADGE = {
  "Junior Advocate": "bg-indigo-100 text-indigo-700",
  "Senior Advocate": "bg-slate-100 text-slate-700",
  "Client": "bg-rose-100 text-rose-700",
  "Advocate": "bg-slate-100 text-slate-600",
};

const ITEMS_PER_PAGE = 6;

export default function JunAdvDashView() {
  const router = useRouter();

  const [cases, setCases] = useState([]);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({ assignedCases: 0, activeCases: 0, hearings: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);

  // Pagination states (6 items per page)
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [assignedPage, setAssignedPage] = useState(1);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user && user.username) {
      setUserName(user.username);
    }

    const fetchAssignedCases = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases`);
        const data = await res.json();

        let casesToShow = data;
        if (user && user.role && user.role.toLowerCase().includes("junior")) {
          casesToShow = data.filter((item) => {
            const primaryName = item.advocate_name || "";
            const secondaryName = item.secondary_advocate_name || item.secondaryAdvocateName || "";

            const normalizedPrimary = primaryName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const normalizedSecondary = secondaryName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const normalizedUsername = (user.username || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            const normalizedEmail = (user.email || "").toLowerCase().replace(/[^a-z0-9]/g, "");

            const isPrimaryMatch = primaryName && (
              normalizedPrimary === normalizedUsername ||
              normalizedPrimary === normalizedEmail ||
              normalizedUsername.includes(normalizedPrimary) ||
              normalizedPrimary.includes(normalizedUsername)
            );

            const isSecondaryMatch = secondaryName && (
              normalizedSecondary === normalizedUsername ||
              normalizedSecondary === normalizedEmail ||
              normalizedUsername.includes(normalizedSecondary) ||
              normalizedSecondary.includes(normalizedUsername)
            );

            return isPrimaryMatch || isSecondaryMatch;
          });
        }

        // --- Stats ---
        const todayStr = new Date().toISOString().split("T")[0];
        const assignedCasesCount = casesToShow.length;
        const activeCasesCount = casesToShow.filter(
          (item) => item.status === "Active" || item.status === "Hearing"
        ).length;
        const hearingsCount = casesToShow.filter(
          (item) => item.due_date && item.due_date !== "No date" && item.due_date.split("T")[0] >= todayStr
        ).length;

        setStats({
          assignedCases: assignedCasesCount,
          activeCases: activeCasesCount,
          hearings: hearingsCount,
        });

        const formattedCases = casesToShow.map((item) => {
          const rawTitle = item.case_name || item.case_title || item.title || item.caseTitle || item.name || "Untitled Case";
          const isConfidential = isSensitiveCase(item);
          const displayTitle = isConfidential ? "Confidential Case (Restricted)" : rawTitle;

          return {
            id: item.id,
            title: displayTitle,
            rawTitle: rawTitle,
            caseNumber: item.case_number || item.case_no || "",
            hearing: item.due_date ? item.due_date.split("T")[0] : "No date",
            status: item.status || "Active",
            clientName: isConfidential ? "Confidential (Restricted)" : (item.client_name || "N/A"),
            court: item.practice_court || item.practice_area || "Family Court",
            advocateName: item.advocate_name || "",
            secondaryAdvocateName: item.secondaryAdvocateName || item.secondary_advocate_name || "",
          };
        });

        setCases(formattedCases);
      } catch (error) {
        console.error("Error fetching dashboard cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedCases();
  }, []);

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

  const todayStr = new Date().toISOString().split("T")[0];
  const assignedCasesList = cases;
  const activeCasesList = cases.filter(
    (c) => c.status === "Active" || c.status === "Hearing"
  );
  const upcomingHearingsList = cases
    .filter((c) => c.hearing && c.hearing !== "No date" && c.hearing >= todayStr)
    .sort((a, b) => new Date(a.hearing) - new Date(b.hearing));

  const getSelectedList = () => {
    if (selectedCard === "assignedCases") return assignedCasesList;
    if (selectedCard === "activeCases") return activeCasesList;
    if (selectedCard === "upcomingHearings") return upcomingHearingsList;
    return [];
  };

  const selectedList = getSelectedList();

  // Pagination Calculations (6 items per page)
  const totalUpcomingPages = Math.ceil(upcomingHearingsList.length / ITEMS_PER_PAGE) || 1;
  const safeUpcomingPage = Math.min(upcomingPage, totalUpcomingPages);
  const paginatedUpcomingList = upcomingHearingsList.slice(
    (safeUpcomingPage - 1) * ITEMS_PER_PAGE,
    safeUpcomingPage * ITEMS_PER_PAGE
  );

  const totalAssignedPages = Math.ceil(assignedCasesList.length / ITEMS_PER_PAGE) || 1;
  const safeAssignedPage = Math.min(assignedPage, totalAssignedPages);
  const paginatedAssignedList = assignedCasesList.slice(
    (safeAssignedPage - 1) * ITEMS_PER_PAGE,
    safeAssignedPage * ITEMS_PER_PAGE
  );

  return (
    <div className="w-full max-w-full min-w-0 mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300 overflow-x-hidden">

      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight truncate">
            {greeting}, {userName ? <span className="capitalize">{userName}</span> : ""}
          </h1>
          <p className="text-[#64748B] mt-0.5 sm:mt-1 text-xs sm:text-base font-medium truncate">
            Junior Advocate {userName ? <span className="capitalize">{userName}</span> : ""}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center lg:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="text-left sm:text-right bg-[#F8FAFC] px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-[#E2E8F0] w-full sm:w-auto">
            <p className="text-[#64748B] font-bold text-[10px] sm:text-xs uppercase tracking-wider">Today&apos;s Date</p>
            <p className="text-[#0F172A] font-extrabold text-xs sm:text-base mt-0.5">{currentDate}</p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={() => router.push("/junior-calendar")}
              className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Calendar size={15} />
              <span>View Calendar</span>
            </button>
            <button
              onClick={() => router.push("/junior-leave?apply=true")}
              className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <CalendarCheck size={14} />
              <span>Apply Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 w-full min-w-0">
        <StatCard
          title="Assigned Cases"
          value={loading ? "—" : stats.assignedCases}
          icon={<Briefcase className="w-5 h-5" />}
          color="bg-blue-50 text-blue-600 border-blue-200"
          activeColor="border-blue-400 ring-2 ring-blue-200"
          isActive={selectedCard === "assignedCases"}
          onClick={() => setSelectedCard(selectedCard === "assignedCases" ? null : "assignedCases")}
          loading={loading}
        />

        <StatCard
          title="Active Cases"
          value={loading ? "—" : stats.activeCases}
          icon={<FolderOpen className="w-5 h-5" />}
          color="bg-emerald-50 text-emerald-600 border-emerald-200"
          activeColor="border-emerald-400 ring-2 ring-emerald-200"
          isActive={selectedCard === "activeCases"}
          onClick={() => setSelectedCard(selectedCard === "activeCases" ? null : "activeCases")}
          loading={loading}
        />

        <StatCard
          title="Upcoming Hearings"
          value={loading ? "—" : stats.hearings}
          icon={<Calendar className="w-5 h-5" />}
          color="bg-blue-50 text-blue-600 border-blue-200"
          activeColor="border-blue-400 ring-2 ring-blue-200"
          isActive={selectedCard === "upcomingHearings"}
          onClick={() => setSelectedCard(selectedCard === "upcomingHearings" ? null : "upcomingHearings")}
          loading={loading}
        />
      </div>

      {/* Dynamic Detail Panel (Stat Card Expansion) */}
      {selectedCard && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-[#E2E8F0] p-4 sm:p-6 md:p-8 overflow-hidden animate-in fade-in duration-200 w-full min-w-0">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-xl font-extrabold text-[#0F172A]">
              {selectedCard === "assignedCases" && "All Assigned Cases"}
              {selectedCard === "activeCases" && "Active Cases"}
              {selectedCard === "upcomingHearings" && "Upcoming Hearings"}
            </h3>
            <span className="text-xs sm:text-sm text-[#64748B] font-bold bg-slate-100 px-3 py-1 rounded-full">
              {selectedList.length} {selectedCard === "upcomingHearings" ? "hearings" : "cases"}
            </span>
          </div>

          {/* Mobile Native Card View (< 640px) for Stat Card Expansion */}
          <div className="block sm:hidden space-y-3 w-full min-w-0">
            {selectedList.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs font-semibold">No cases found in this category.</p>
            ) : (
              selectedList.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 w-full min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <h4 className="text-xs font-extrabold text-[#0F172A] break-words flex-1 min-w-0">{item.title}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${
                      item.status === "Active" || item.status === "Hearing"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {selectedCard === "upcomingHearings" ? `Hearing: ${item.hearing}` : `Client: ${item.clientName}`}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Desktop & Tablet Table (>= 640px) */}
          <div className="hidden sm:block w-full overflow-hidden rounded-2xl border border-[#E2E8F0] min-w-0">
            <table className="w-full table-fixed divide-y divide-[#E2E8F0] text-xs sm:text-sm">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="p-3.5 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[45%]">Case</th>
                  <th className="p-3.5 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[35%]">
                    {selectedCard === "upcomingHearings" ? "Hearing Date" : "Client Name"}
                  </th>
                  <th className="p-3.5 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[20%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {selectedList.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-[#94A3B8] font-medium text-xs sm:text-sm">
                      No cases found for this category.
                    </td>
                  </tr>
                ) : (
                  selectedList.map((item, index) => (
                    <tr key={index} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 text-xs sm:text-sm font-bold text-[#0F172A] leading-snug">{item.title}</td>
                      <td className="p-3.5 text-xs sm:text-sm text-[#475569] font-medium leading-snug">
                        {selectedCard === "upcomingHearings" ? item.hearing : item.clientName}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          item.status === "Active" || item.status === "Hearing"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
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
      )}

      {/* Main Content Layout */}
      <div className="space-y-4 sm:space-y-6 w-full min-w-0">

        {/* 1. Upcoming Hearing Table Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-[#E2E8F0] p-4 sm:p-6 md:p-8 w-full max-w-full min-w-0">

          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2563EB]" />
                Upcoming Hearings
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                Assigned cases scheduled for upcoming court hearings
              </p>
            </div>

            <button
              onClick={() => router.push("/junior-calendar")}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 sm:px-5 py-2 rounded-xl font-bold uppercase tracking-wider text-[11px] sm:text-xs transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Calendar size={13} />
              View Calendar
            </button>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#64748B] font-medium">Loading upcoming hearings…</p>
              </div>
            </div>
          ) : upcomingHearingsList.length === 0 ? (
            <div className="p-8 text-center text-[#94A3B8] font-medium text-xs sm:text-sm bg-slate-50 rounded-2xl border border-slate-100">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No upcoming hearings scheduled for your assigned cases.
            </div>
          ) : (
            <>
              {/* Mobile Native Card View (< 640px) */}
              <div className="block sm:hidden space-y-3 w-full min-w-0">
                {paginatedUpcomingList.map((item, index) => (
                  <div
                    key={item.id || index}
                    onClick={() => router.push("/assigned-cases")}
                    className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 rounded-2xl space-y-2 transition cursor-pointer w-full min-w-0"
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h4 className="text-xs font-extrabold text-[#0F172A] break-words flex-1 min-w-0">
                        {item.title}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${
                        item.status === "Active" || item.status === "Hearing"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5 truncate">
                        <User size={12} className="text-slate-400 shrink-0" />
                        <span>Client: <strong>{item.clientName}</strong></span>
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-blue-700 font-bold">
                        <Calendar size={12} className="text-blue-500 shrink-0" />
                        <span>Hearing Date: {item.hearing}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <Gavel size={12} className="text-slate-400 shrink-0" />
                        <span className="break-words">Court: {item.court}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-200/60 text-[10px]">
                      <span className="text-blue-600 font-bold flex items-center gap-0.5">
                        View Details <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop & Tablet Table (>= 640px) - Seamless Alignment Without Horizontal Scroll */}
              <div className="hidden sm:block w-full overflow-hidden rounded-2xl border border-[#E2E8F0] min-w-0">
                <table className="w-full table-fixed divide-y divide-[#E2E8F0] text-xs sm:text-sm">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[28%]">Case</th>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[18%]">Client Name</th>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[17%]">Hearing Date</th>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[22%]">Court / Forum</th>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[10%]">Status</th>
                      <th className="p-3.5 sm:p-4 text-center text-xs font-bold text-[#475569] uppercase tracking-wider w-[10%]">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {paginatedUpcomingList.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-[#0F172A] leading-snug break-words">
                          {item.title}
                          {item.caseNumber && <span className="block text-[11px] font-normal text-slate-400 mt-0.5">{item.caseNumber}</span>}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm text-[#475569] font-medium leading-snug break-words">
                          {item.clientName}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-blue-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                            <Calendar size={12} className="text-blue-600 shrink-0" />
                            {item.hearing}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm text-[#475569] font-medium leading-snug break-words">
                          {item.court}
                        </td>
                        <td className="p-3.5 sm:p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            item.status === "Active" || item.status === "Hearing"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => router.push("/assigned-cases")}
                            className="text-xs font-bold text-[#2563EB] hover:text-[#1d4ed8] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl transition cursor-pointer"
                          >
                            View Case
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Exact Matched Pagination Bar */}
              <TablePagination
                currentPage={safeUpcomingPage}
                totalPages={totalUpcomingPages}
                totalEntries={upcomingHearingsList.length}
                pageSize={ITEMS_PER_PAGE}
                onPageChange={(page) => setUpcomingPage(page)}
                itemLabel="entries"
              />
            </>
          )}

        </div>

        {/* 2. Assigned Cases Table Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-[#E2E8F0] p-4 sm:p-6 md:p-8 w-full max-w-full min-w-0">

          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Assigned Cases
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                All cases assigned to your advocacy profile
              </p>
            </div>

            <button
              onClick={() => router.push("/assigned-cases")}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 sm:px-5 py-2 rounded-xl font-bold uppercase tracking-wider text-[11px] sm:text-xs transition-all shadow-xs cursor-pointer shrink-0 active:scale-[0.98]"
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#64748B] font-medium">Loading cases…</p>
              </div>
            </div>
          ) : assignedCasesList.length === 0 ? (
            <div className="p-8 text-center text-[#94A3B8] font-medium text-xs sm:text-sm bg-slate-50 rounded-2xl border border-slate-100">
              No assigned cases found.
            </div>
          ) : (
            <>
              {/* Mobile Native Card View (< 640px) */}
              <div className="block sm:hidden space-y-3 w-full min-w-0">
                {paginatedAssignedList.map((item, index) => {
                  const normUser = (userName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const normSec = (item.secondaryAdvocateName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const isStandby = normSec && (normSec === normUser || normUser.includes(normSec) || normSec.includes(normUser));

                  return (
                    <div
                      key={item.id || index}
                      onClick={() => router.push("/assigned-cases")}
                      className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 rounded-2xl space-y-2 transition cursor-pointer w-full min-w-0"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <h4 className="text-xs font-extrabold text-[#0F172A] break-words flex-1 min-w-0">
                          {item.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${
                          item.status === "Active" || item.status === "Hearing"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1">
                        <p className="flex items-center gap-1.5 truncate">
                          <User size={12} className="text-slate-400 shrink-0" />
                          <span>Client: <strong>{item.clientName}</strong></span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                        {isStandby ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800">
                            🛡️ Standby Advocate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-800">
                            👤 Primary Counsel
                          </span>
                        )}
                        <span className="text-blue-600 font-bold flex items-center gap-0.5">
                          View Details <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop & Tablet Table (>= 640px) - Seamless Alignment Without Horizontal Scroll */}
              <div className="hidden sm:block w-full overflow-hidden rounded-2xl border border-[#E2E8F0] min-w-0">
                <table className="w-full table-fixed divide-y divide-[#E2E8F0] text-xs sm:text-sm">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[35%]">Case</th>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[25%]">Client Name</th>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[25%]">My Role</th>
                      <th className="p-3.5 sm:p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider w-[15%]">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {paginatedAssignedList.map((item, index) => {
                      const normUser = (userName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                      const normSec = (item.secondaryAdvocateName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                      const isStandby = normSec && (normSec === normUser || normUser.includes(normSec) || normSec.includes(normUser));

                      return (
                        <tr key={item.id || index} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-[#0F172A] leading-snug break-words">
                            {item.title}
                          </td>
                          <td className="p-3.5 sm:p-4 text-xs sm:text-sm text-[#475569] font-medium leading-snug break-words">
                            {item.clientName}
                          </td>
                          <td className="p-3.5 sm:p-4 whitespace-nowrap">
                            {isStandby ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                🛡️ Standby / Backup
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                👤 Primary Counsel
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 sm:p-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              item.status === "Active" || item.status === "Hearing"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Exact Matched Pagination Bar */}
              <TablePagination
                currentPage={safeAssignedPage}
                totalPages={totalAssignedPages}
                totalEntries={assignedCasesList.length}
                pageSize={ITEMS_PER_PAGE}
                onPageChange={(page) => setAssignedPage(page)}
                itemLabel="entries"
              />
            </>
          )}

        </div>

      </div>
    </div>
  );
}

function TablePagination({ currentPage, totalPages, totalEntries, pageSize, onPageChange, itemLabel = "entries" }) {
  const startEntry = totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endEntry = Math.min(currentPage * pageSize, totalEntries);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-5 mt-4 border-t border-slate-100 w-full min-w-0">
      <p className="text-xs sm:text-sm text-slate-500 font-medium text-center sm:text-left">
        Showing <strong className="font-bold text-slate-800">{startEntry}</strong> to{" "}
        <strong className="font-bold text-slate-800">{endEntry}</strong> of{" "}
        <strong className="font-bold text-slate-800">{totalEntries}</strong> {itemLabel}
      </p>

      <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 active:scale-95"
        >
          <ChevronLeft size={13} />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-1 text-xs font-medium text-slate-400">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                  isCurrent
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 active:scale-95"
        >
          <span>Next</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, activeColor, isActive, onClick, loading }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-xs border p-3.5 sm:p-5 hover:shadow-md transition-all cursor-pointer group ${
        isActive ? activeColor : "border-[#E2E8F0]"
      }`}
    >
      <div className={`w-9 h-9 sm:w-10 sm:h-10 ${color} rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform border`}>
        {icon}
      </div>

      <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider mb-0.5">
        {title}
      </p>

      <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
        {loading ? (
          <span className="inline-block w-12 h-7 rounded-lg bg-slate-100 animate-pulse" />
        ) : (
          value
        )}
      </h2>
    </div>
  );
}
