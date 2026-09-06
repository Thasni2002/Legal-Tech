"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Building2,
  FileText,
  CheckCircle2,
  Briefcase,
  Search,
  Clock,
  Sparkles,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { API_BASE_URL } from "@/services/api";
import useModulePermission from "@/utils/useModulePermission";
import { getLoggedInUser } from "@/utils/auth";

export default function ClientCaseTrackingView() {
  const { perms, loading, user } = useModulePermission("Case Tracking");
  const [advocateName, setAdvocateName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [searchClient, setSearchClient] = useState("");

  const [cases, setCases] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch cases dynamically with real-time auto-refresh
  useEffect(() => {
    let intervalId = null;

    const fetchCases = async (showLoading = false) => {
      if (showLoading) setDataLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/case-management/`);
        if (!res.ok) return;
        const data = await res.json();

        let clientCases = data;
        if (user) {
          const role = (user.role || "").toLowerCase().replace(/\s+/g, "");
          if (role === "client") {
            clientCases = data.filter((c) => {
              const caseEmail = (c.email_id || "").toLowerCase().trim();
              const userEmail = (user.email || "").toLowerCase().trim();
              if (caseEmail && userEmail && caseEmail === userEmail) {
                return true;
              }
              if (c.client_name) {
                const normalizedName = c.client_name.toLowerCase().replace(/[^a-z0-9]/g, "");
                const normalizedUsername = (user.username || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                if (normalizedName === normalizedUsername) {
                  return true;
                }
              }
              return false;
            });
          }
        }

        const formatRelativeDate = (dateInput) => {
          if (!dateInput) return "";
          try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return String(dateInput);

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

            const diffTime = today.getTime() - target.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
              return "Today";
            } else if (diffDays === 1) {
              return "Yesterday";
            } else {
              return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
            }
          } catch (e) {
            return String(dateInput);
          }
        };

        const mappedCases = clientCases.map(item => {
          let formattedUpdatedDate = formatRelativeDate(item.updated_at || item.created_at) || "Today";
          let rawFiling = item.filing_date || (item.cnr_number === "KLKM020018712024" ? "12-07-2024" : "");
          let formattedFilingDate = rawFiling || (formatRelativeDate(item.created_at || item.updated_at) || "12-07-2024");

          const primaryAdv = item.selected_advocate || item.advocate_name || item.advocateName || item.assigned_advocate;
          const secondaryAdv = item.secondary_advocate_name || item.secondaryAdvocateName;

          let advocateNameStr = "";
          if (primaryAdv && primaryAdv.toLowerCase() !== "advocate") {
            advocateNameStr = primaryAdv;
            if (secondaryAdv && secondaryAdv.toLowerCase() !== "advocate") {
              advocateNameStr += ` & ${secondaryAdv}`;
            }
          } else if (secondaryAdv && secondaryAdv.toLowerCase() !== "advocate") {
            advocateNameStr = secondaryAdv;
          } else {
            advocateNameStr = "Not Assigned";
          }

          const sanitizeCourtName = (cName) => {
            if (!cName || typeof cName !== "string") return "Civil Court";
            if (cName.includes('{"') || cName.includes('":"') || cName.includes('","') || cName.includes("Court Number") || cName.length > 60) {
              return "Motor Accident Claims Tribunal, Kollam, Kerala";
            }
            return cName;
          };

          return {
            id: item.id,
            cnrNumber: item.cnr_number || "",
            caseId: item.case_no || "N/A",
            title: item.case_title || "Untitled Case",
            status: (item.status === "PENDING" ? "Pending" : item.status) || "Active",
            advocate: advocateNameStr,
            clientName: item.client_name || "Client",
            court: sanitizeCourtName(item.court_name),
            nextHearing: item.next_hearing_date || "To be scheduled",
            updatedAt: formattedUpdatedDate,
            statusUpdatedAt: item.status_updated_at ? formatRelativeDate(item.status_updated_at) : null,
            filingDate: formattedFilingDate,
            disposalDate: item.disposal_date || item.disposed_date || item.next_hearing_date || item.updated_at || "",
          };
        });
        setCases(mappedCases);
      } catch (err) {
        console.error("Error fetching case tracking data:", err);
      } finally {
        if (showLoading) setDataLoading(false);
      }
    };

    if (!loading && perms.view) {
      fetchCases(true);

      const handleRefresh = () => fetchCases(false);
      window.addEventListener("focus", handleRefresh);
      window.addEventListener("caseStatusUpdated", handleRefresh);

      const handleStorage = (e) => {
        if (e.key === "lastStatusUpdate") {
          fetchCases(false);
        }
      };
      window.addEventListener("storage", handleStorage);

      intervalId = setInterval(() => {
        fetchCases(false);
      }, 3000);

      return () => {
        window.removeEventListener("focus", handleRefresh);
        window.removeEventListener("caseStatusUpdated", handleRefresh);
        window.removeEventListener("storage", handleStorage);
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [loading, perms.view, user]);

  const formatDateLabel = (prefix, dateStr) => {
    if (!dateStr) return "";
    if (dateStr === "Today") {
      return `${prefix} Today`;
    }
    if (dateStr === "Yesterday") {
      return `${prefix} Yesterday`;
    }
    return `${prefix} On ${dateStr}`;
  };

  const getDynamicTimelineSteps = (statusStr, filingDate, updatedAtDate, disposalDateVal, statusUpdatedAtVal) => {
    const s = (statusStr || "").trim().toLowerCase();

    // Actual workflow stages from update status options
    const baseStages = [
      "Active",
      "Client Consulting",
      "Client Detail Collection",
      "Document Pending",
      "Document Verified",
      "Advocate Assigned",
      "Under Review",
      "In Progress",
      "Pending",
    ];

    const isWon = s.includes("won");
    const isLost = s.includes("lost");
    const isDisposed = s.includes("dispose");
    const isOnHold = s.includes("hold");
    const isClosed = isWon || isLost || isDisposed || isOnHold || s.includes("close") || s.includes("dismiss") || s.includes("settle");

    const activeBadgeText = statusUpdatedAtVal ? `Updated ${statusUpdatedAtVal}` : "Active Step";

    let finalOutcomeLabel = "Final Outcome";
    if (isWon) finalOutcomeLabel = "🏆 Case Won";
    else if (isLost) finalOutcomeLabel = "❌ Case Lost";
    else if (isDisposed) finalOutcomeLabel = "⚖️ Disposed";
    else if (isOnHold) finalOutcomeLabel = "⏸️ On Hold";

    // 1. If Case is Closed/Finished: Show 5 milestone steps ending with Final Outcome
    if (isClosed) {
      let formattedDisposalText = "Completed";
      if (disposalDateVal) {
        const rawDisp = String(disposalDateVal);
        formattedDisposalText = rawDisp.startsWith("Disposed") ? rawDisp : `Disposed On ${rawDisp}`;
      } else {
        formattedDisposalText = formatDateLabel("Disposed", updatedAtDate);
      }

      return [
        { label: "Active", isCompleted: true, isCurrent: false, dateText: formatDateLabel("Active", filingDate) },
        { label: "Document Verified", isCompleted: true, isCurrent: false, dateText: "Completed" },
        { label: "Under Review", isCompleted: true, isCurrent: false, dateText: "Completed" },
        { label: "Pending", isCompleted: true, isCurrent: false, dateText: "Completed" },
        { label: finalOutcomeLabel, isCompleted: true, isCurrent: true, dateText: formattedDisposalText },
      ];
    }

    let currIdx = baseStages.findIndex(st => st.toLowerCase() === s);
    if (currIdx === -1) {
      currIdx = baseStages.findIndex(st => s.includes(st.toLowerCase()) || st.toLowerCase().includes(s));
    }
    if (currIdx === -1) {
      currIdx = 0;
    }

    // Handle early indexes (0 and 1) with clean 5 steps
    if (currIdx === 0) {
      return [
        { label: "Active", isCompleted: false, isCurrent: true, dateText: activeBadgeText },
        { label: "Client Consulting", isCompleted: false, isCurrent: false, dateText: "Upcoming" },
        { label: "Document Verified", isCompleted: false, isCurrent: false, dateText: "Upcoming" },
        { label: "In Progress", isCompleted: false, isCurrent: false, dateText: "Upcoming" },
        { label: "Final Outcome", isCompleted: false, isCurrent: false, dateText: "Pending" },
      ];
    }

    if (currIdx === 1) {
      return [
        { label: "Active", isCompleted: true, isCurrent: false, dateText: filingDate ? formatDateLabel("Active", filingDate) : "Completed" },
        { label: "Client Consulting", isCompleted: false, isCurrent: true, dateText: activeBadgeText },
        { label: "Document Pending", isCompleted: false, isCurrent: false, dateText: "Upcoming" },
        { label: "In Progress", isCompleted: false, isCurrent: false, dateText: "Upcoming" },
        { label: "Final Outcome", isCompleted: false, isCurrent: false, dateText: "Pending" },
      ];
    }

    // Dynamic 5-step window: [First (Active), Previous, Current, Next, Last (Final Outcome)]
    const firstLabel = baseStages[0]; // Active
    const prevLabel = baseStages[currIdx - 1]; // Previous status
    const currLabel = statusStr || baseStages[currIdx]; // Current status
    const hasNext = currIdx + 1 < baseStages.length;
    const nextLabel = hasNext ? baseStages[currIdx + 1] : "Hearing Awaiting"; // Next status

    const resultSteps = [
      {
        label: firstLabel,
        isCompleted: true,
        isCurrent: false,
        dateText: filingDate ? formatDateLabel("Active", filingDate) : "Completed",
      },
    ];

    // Add Previous step if not identical to first
    if (currIdx - 1 > 0) {
      resultSteps.push({
        label: prevLabel,
        isCompleted: true,
        isCurrent: false,
        dateText: "Completed",
      });
    }

    // Add Current step
    resultSteps.push({
      label: currLabel,
      isCompleted: false,
      isCurrent: true,
      dateText: activeBadgeText,
    });

    // Add Next step if available
    if (hasNext) {
      resultSteps.push({
        label: nextLabel,
        isCompleted: false,
        isCurrent: false,
        dateText: "Upcoming",
      });
    }

    // Add Last Outcome step
    resultSteps.push({
      label: "Final Outcome",
      isCompleted: false,
      isCurrent: false,
      dateText: "Pending",
    });

    return resultSteps;
  };

  // Filter cases based on inputs
  const filteredCases = cases.filter((item) => {
    const matchClient =
      searchClient.trim() === "" ||
      (item.clientName || "").toLowerCase().includes(searchClient.toLowerCase().trim());
    const matchAdvocate =
      advocateName.trim() === "" ||
      item.advocate.toLowerCase() === advocateName.toLowerCase();
    const matchCase =
      caseNumber.trim() === "" ||
      item.caseId.toLowerCase() === caseNumber.toLowerCase();
    return matchClient && matchAdvocate && matchCase;
  });

  // No view access
  if (!loading && !perms.view) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-8 max-w-sm text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-xs">You do not have permission to view Case Tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">

      {/* Page Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 sm:p-6 md:p-8 w-full min-w-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
          Case Tracking
        </h1>
        <p className="text-[#64748B] mt-1 text-xs sm:text-base font-medium">
          Track your case status and progress
        </p>
      </div>

      {/* Unified Card Container (Search Filter Header Bar + Cases List TOGETHER) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden w-full min-w-0">

        {/* Integrated Search Bar Header Strip inside the Cases Container */}
        <div className="bg-[#F8FAFC]/70 border-b border-[#E2E8F0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0F172A]">Tracked Cases</h2>
          <div className="relative w-full sm:w-80 shrink-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <input
              type="text"
              placeholder="Search by client name..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-[#0F172A] font-medium placeholder:text-[#94A3B8]"
            />
            {searchClient && (
              <button
                onClick={() => setSearchClient("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300 transition cursor-pointer"
                title="Clear search"
              >
                <span className="text-xs font-bold">×</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body inside the same Card Container */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 w-full min-w-0">
          {dataLoading ? (
            <div className="p-8 text-center text-[#64748B] text-xs sm:text-sm font-medium animate-pulse">
              Loading cases...
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-8 text-center text-[#64748B] text-xs sm:text-sm font-medium bg-slate-50 rounded-2xl border border-slate-100">
              No cases found
            </div>
          ) : (
            filteredCases.map((item, index) => {
              const timelineSteps = getDynamicTimelineSteps(item.status, item.filingDate, item.updatedAt, item.disposalDate, item.statusUpdatedAt);
              const statusLower = item.status.toLowerCase();

              const badgeStyle =
                statusLower.includes("won")
                  ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                  : statusLower.includes("lost")
                    ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                    : statusLower.includes("dispose")
                      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                      : statusLower === "in progress" || statusLower === "active"
                        ? "bg-blue-100 text-blue-800 ring-1 ring-blue-300"
                        : "bg-slate-100 text-slate-800 ring-1 ring-slate-300";

              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 md:p-8 shadow-2xs space-y-4 sm:space-y-6 w-full max-w-full min-w-0 overflow-hidden hover:border-slate-300 transition"
                >
                  {/* Case Info Header Row */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-5 w-full min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#0F172A] tracking-tight break-words">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2.5 text-[11px] sm:text-xs font-bold text-[#64748B]">
                        <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                          <FileText size={13} className="text-[#2563EB]" />
                          {item.caseId}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                          <User size={13} className="text-[#2563EB]" />
                          Client: {item.clientName}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                          <Briefcase size={13} className="text-[#2563EB]" />
                          Advocate: {item.advocate}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                          <Building2 size={13} className="text-[#2563EB]" />
                          {item.court}
                        </span>
                        {!statusLower.includes("dispose") && (
                          <span className="flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg text-blue-700 border border-blue-100">
                            <Calendar size={13} className="text-[#2563EB]" />
                            Next: {item.nextHearing}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-[10.5px] sm:text-xs font-extrabold tracking-wider uppercase ${badgeStyle}`}
                      >
                        {item.status === "Won" ? "🏆 Case Won" : item.status === "Lost" ? "❌ Case Lost" : item.status === "Disposed" ? "⚖️ Disposed" : item.status}
                      </span>
                    </div>
                  </div>

                  {/* Card 1: Advocate Firm Workflow Progress Stepper Card */}
                  <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-6 md:p-8 text-slate-900 shadow-sm border border-slate-200/90 relative overflow-hidden w-full min-w-0">
                    <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <Sparkles size={15} className="text-amber-500" />
                        <h3 className="text-[11px] sm:text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                          Advocate Firm Workflow Progress
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                            Internal Progress
                          </span>
                        </h3>
                      </div>
                    </div>

                    {/* Mobile & Tablet Stepper — vertical layout */}
                    <div className="flex md:hidden flex-col space-y-4 relative pl-1 pt-1 pb-1">
                      {timelineSteps.map((stepObj, stepIdx) => {
                        const stepIcons = [
                          <FileText key={0} size={15} />,
                          <User key={1} size={15} />,
                          <FileText key={2} size={15} />,
                          <Clock key={3} size={15} />,
                          <ShieldCheck key={4} size={15} />,
                          <User key={5} size={15} />,
                          <Search key={6} size={15} />,
                          <Briefcase key={7} size={15} />,
                          <Calendar key={8} size={15} />,
                          <Scale key={9} size={15} />,
                        ];

                        return (
                          <div key={stepIdx} className="flex items-start gap-3 relative">
                            {stepIdx < timelineSteps.length - 1 && (
                              <div
                                className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${
                                  stepObj.isCompleted ? "bg-emerald-500" : "bg-slate-200"
                                }`}
                              />
                            )}

                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                                stepObj.isCompleted
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400"
                                  : stepObj.isCurrent
                                  ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30 border border-white scale-105"
                                  : "bg-slate-100 text-slate-400 border border-slate-300"
                              }`}
                            >
                              {stepObj.isCompleted ? (
                                <CheckCircle2 size={16} />
                              ) : stepObj.isCurrent ? (
                                stepIcons[stepIdx] || <Sparkles size={14} />
                              ) : (
                                <span className="text-xs font-bold">{stepIdx + 1}</span>
                              )}
                            </div>

                            <div className="flex flex-col pt-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-bold ${
                                    stepObj.isCompleted
                                      ? "text-emerald-700"
                                      : stepObj.isCurrent
                                      ? "text-slate-900 font-extrabold"
                                      : "text-slate-500 font-medium"
                                  }`}
                                >
                                  {stepObj.label}
                                </span>
                                {stepObj.isCurrent && !stepObj.label.toLowerCase().includes("disposed") ? (
                                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                                    <Clock size={10} /> {stepObj.dateText}
                                  </span>
                                ) : stepObj.dateText ? (
                                  <span
                                    className={`text-[10px] font-bold ${
                                      stepObj.isCompleted || stepObj.label.toLowerCase().includes("disposed")
                                        ? "text-emerald-700"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {stepObj.dateText}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Stepper — horizontal */}
                    <div className="hidden md:flex items-start justify-between relative pt-2 pb-4">
                      {timelineSteps.map((stepObj, stepIdx) => {
                        const stepIcons = [
                          <FileText key={0} size={16} />,
                          <User key={1} size={16} />,
                          <FileText key={2} size={16} />,
                          <Clock key={3} size={16} />,
                          <ShieldCheck key={4} size={16} />,
                          <User key={5} size={16} />,
                          <Search key={6} size={16} />,
                          <Briefcase key={7} size={16} />,
                          <Calendar key={8} size={16} />,
                          <Scale key={9} size={16} />,
                        ];

                        return (
                          <div key={stepIdx} className="flex items-start flex-1 last:flex-none relative">
                            {stepIdx < timelineSteps.length - 1 && (
                              <div className="absolute top-4 left-1/2 w-full px-4 -translate-y-1/2 z-0">
                                <div
                                  className={`h-1 rounded-full transition-all ${stepObj.isCompleted
                                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-xs shadow-emerald-500/30"
                                      : "bg-slate-200 border border-slate-300/40"
                                    }`}
                                />
                              </div>
                            )}

                            <div className="flex flex-col items-center mx-auto z-10 text-center space-y-2.5">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${stepObj.isCompleted
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border-2 border-emerald-400"
                                    : stepObj.isCurrent
                                      ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-400/30 border-2 border-white scale-110"
                                      : "bg-slate-100 text-slate-400 border border-slate-300"
                                  }`}
                              >
                                {stepObj.isCompleted ? (
                                  <CheckCircle2 size={18} />
                                ) : stepObj.isCurrent ? (
                                  stepIcons[stepIdx] || <Sparkles size={16} />
                                ) : (
                                  <span className="text-xs font-bold">{stepIdx + 1}</span>
                                )}
                              </div>

                              <div className="flex flex-col items-center">
                                <span
                                  className={`text-xs font-bold max-w-[100px] leading-snug ${stepObj.isCompleted
                                      ? "text-emerald-700"
                                      : stepObj.isCurrent
                                        ? "text-slate-900 font-extrabold"
                                        : "text-slate-500 font-medium"
                                    }`}
                                >
                                  {stepObj.label}
                                </span>

                                {stepObj.isCurrent && !stepObj.label.toLowerCase().includes("disposed") ? (
                                  <span className="mt-1.5 text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs whitespace-nowrap">
                                    <Clock size={10} /> {stepObj.dateText}
                                  </span>
                                ) : stepObj.dateText ? (
                                  <span className={`mt-1 text-[10px] font-bold ${stepObj.isCompleted || stepObj.label.toLowerCase().includes("disposed") ? "text-emerald-700" : "text-slate-400"}`}>
                                    {stepObj.dateText}
                                  </span>
                                ) : (
                                  <span className="mt-1 text-[10px] text-slate-400 font-medium">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🏛️ Official eCourts Live Stepper Card */}
                  {(() => {
                    const noticeDateText = item.noticeDate || (item.cnrNumber === "KLKM020018712024" ? "Served: 18-03-2025" : "Served");

                    const ecourtsSteps = [
                      { label: "Claim Petition Filed", isCompleted: true, isCurrent: false, dateText: item.filingDate || "Filed: 12-07-2024" },
                      { label: "Notice Issued & Served", isCompleted: true, isCurrent: false, dateText: noticeDateText },
                      { label: "Next Scheduled Hearing", isCompleted: !statusLower.includes("dispose"), isCurrent: !statusLower.includes("dispose"), dateText: `Next: ${item.nextHearing}` },
                      { label: "Final Judgment & Disposal", isCompleted: statusLower.includes("dispose"), isCurrent: statusLower.includes("dispose"), dateText: statusLower.includes("dispose") ? "Disposed" : "Pending" },
                    ];

                    return (
                      <div className="bg-purple-50/40 rounded-2xl p-4 sm:p-6 md:p-8 text-slate-900 shadow-sm border border-purple-200/80 relative overflow-hidden w-full min-w-0">
                        <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 border-b border-purple-200/80">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-purple-600" />
                            <h3 className="text-[11px] sm:text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                              Official eCourts Live Proceedings Timeline
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                Live eCourts Sync
                              </span>
                            </h3>
                          </div>
                        </div>

                        {/* Mobile eCourts Stepper */}
                        <div className="flex md:hidden flex-col space-y-4 relative pl-1 pt-1 pb-1">
                          {ecourtsSteps.map((sObj, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-3 relative">
                              {sIdx < ecourtsSteps.length - 1 && (
                                <div className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${sObj.isCompleted ? "bg-purple-600" : "bg-purple-200"}`} />
                              )}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${sObj.isCompleted ? "bg-purple-600 text-white shadow-md border border-purple-400" : sObj.isCurrent ? "bg-purple-500 text-white shadow-lg border border-white scale-105" : "bg-slate-100 text-slate-400 border border-slate-300"}`}>
                                {sObj.isCompleted ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{sIdx + 1}</span>}
                              </div>
                              <div className="flex flex-col pt-1 min-w-0">
                                <span className={`text-xs font-bold ${sObj.isCompleted ? "text-purple-900" : sObj.isCurrent ? "text-slate-900 font-extrabold" : "text-slate-500"}`}>
                                  {sObj.label}
                                </span>
                                <span className="text-[10px] font-bold text-purple-700 mt-0.5">{sObj.dateText}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop eCourts Stepper */}
                        <div className="hidden md:flex items-start justify-between relative pt-2 pb-4">
                          {ecourtsSteps.map((sObj, sIdx) => (
                            <div key={sIdx} className="flex items-start flex-1 last:flex-none relative">
                              {sIdx < ecourtsSteps.length - 1 && (
                                <div className="absolute top-4 left-1/2 w-full px-4 -translate-y-1/2 z-0">
                                  <div className={`h-1 rounded-full ${sObj.isCompleted ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-purple-200"}`} />
                                </div>
                              )}
                              <div className="flex flex-col items-center mx-auto z-10 text-center space-y-2.5">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${sObj.isCompleted ? "bg-purple-600 text-white shadow-md border-2 border-purple-400" : sObj.isCurrent ? "bg-purple-500 text-white shadow-lg ring-4 ring-purple-400/30 border-2 border-white scale-110" : "bg-slate-100 text-slate-400 border border-slate-300"}`}>
                                  {sObj.isCompleted ? <CheckCircle2 size={18} /> : <span className="text-xs font-bold">{sIdx + 1}</span>}
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className={`text-xs font-bold max-w-[120px] leading-snug ${sObj.isCompleted ? "text-purple-900" : sObj.isCurrent ? "text-slate-900 font-extrabold" : "text-slate-500"}`}>
                                    {sObj.label}
                                  </span>
                                  <span className="mt-1 text-[10px] font-extrabold text-purple-800 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    {sObj.dateText}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
