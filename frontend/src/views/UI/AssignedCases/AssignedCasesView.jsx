"use client";

import { API_BASE_URL } from "@/utils/api";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Eye,
  FileText,
  Trash2,
  LayoutGrid,
  List,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useModulePermission from "@/utils/useModulePermission";
import { getLoggedInUser } from "@/utils/auth";
import { isSensitiveCase } from "@/utils/caseSensitivity";
import AssignedCaseDetailView from "./AssignedCaseDetailView";

const getStatusSelectClass = (status) => {
  switch (status) {
    case "Completed":
    case "Judgment Delivered":
    case "Won":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
    case "Closed":
    case "Lost":
      return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
    case "In Progress":
    case "Hearing Scheduled":
    case "Hearing Completed":
    case "Case Preparation":
    case "Advocate Assigned":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "Active":
    case "Document Verified":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Under Review":
    case "Awaiting Judgment":
    case "On Hold":
    case "Document Pending":
    case "Client Consulting":
    case "Client Detail Collection":
    case "Document Data Collection":
    case "Court File":
      return "bg-amber-100 text-amber-800 border-amber-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Completed":
    case "Judgment Delivered":
    case "Won":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold";
    case "Closed":
    case "Lost":
      return "bg-rose-50 text-rose-700 border border-rose-200 font-extrabold";
    case "In Progress":
    case "Hearing Scheduled":
    case "Hearing Completed":
    case "Case Preparation":
    case "Advocate Assigned":
      return "bg-blue-50 text-blue-700 border border-blue-200 font-bold";
    case "Active":
    case "Document Verified":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold";
    case "Under Review":
    case "Awaiting Judgment":
    case "On Hold":
    case "Document Pending":
    case "Client Consulting":
    case "Client Detail Collection":
    case "Document Data Collection":
    case "Court File":
      return "bg-amber-100 text-amber-700 border border-amber-200 font-bold";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200 font-bold";
  }
};

const ITEMS_PER_PAGE = 8;

export default function AssignedCasesView() {
  const router = useRouter();
  const { perms, loading } = useModulePermission("Assigned Cases");
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const [selectedCase, setSelectedCase] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewBriefModal, setViewBriefModal] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const user = getLoggedInUser();
  const isJuniorAdvocate =
    user && user.role && user.role.toLowerCase().includes("junior");

  useEffect(() => {
    fetchAssignedCases();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchAssignedCases = async () => {
    try {
      const user = getLoggedInUser();
      const res = await fetch(
        `${API_BASE_URL}/lawfirm-management/assigned-cases`
      );
      const data = await res.json();

      let casesToShow = Array.isArray(data) ? data : [];
      casesToShow = casesToShow.filter(
        (item) => !["unassigned", "inactive", "removed"].includes((item.status || "").toLowerCase())
      );
      if (user && user.role && user.role.toLowerCase().includes("junior")) {
        casesToShow = casesToShow.filter((item) => {
          const primaryName = item.advocate_name || item.advocateName || "";
          const secondaryName = item.secondary_advocate_name || item.secondaryAdvocateName || "";
          const juniorName = item.junior_advocate || item.juniorAdvocate || item.assigned_to || "";

          const normalizedPrimary = primaryName.toLowerCase().replace(/[^a-z0-9]/g, "");
          const normalizedSecondary = secondaryName.toLowerCase().replace(/[^a-z0-9]/g, "");
          const normalizedJunior = juniorName.toLowerCase().replace(/[^a-z0-9]/g, "");
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

          const isJuniorMatch = juniorName && (
            normalizedJunior === normalizedUsername ||
            normalizedJunior === normalizedEmail ||
            normalizedUsername.includes(normalizedJunior) ||
            normalizedJunior.includes(normalizedUsername)
          );

          return isPrimaryMatch || isSecondaryMatch || isJuniorMatch;
        });
      }

      const formattedCases = casesToShow.map((item) => {
        const rawTitle = item.case_name || item.case_title || item.title || item.caseTitle || item.name || "Assigned Case";
        const isConfidential = isJuniorAdvocate && isSensitiveCase(item);
        const displayTitle = isConfidential ? "Confidential Case (Restricted)" : rawTitle;

        return {
          id: item.id,
          caseId: item.case_id,
          caseIdCode: item.client_id || item.case_id_code || item.case_number || (item.case_id ? `CASE-#${item.case_id}` : `#${item.id}`),
          title: displayTitle,
          rawTitle: rawTitle,
          caseNo: item.case_number || item.caseNo || "N/A",
          client: isConfidential ? "Confidential (Restricted)" : (item.client_name || item.client || "N/A"),
          court: item.practice_court || item.practice_area || item.court || "N/A",
          hearing: item.due_date || item.next_hearing_date || "No hearing date",
          status: item.status || "Active",
          documents: item.assigned_documents || item.documents || [],
          appearances: item.appearances || [],
          notes: item.assignment_notes || item.notes || "",
          primaryAdvocate: item.advocate_name || "",
          secondaryAdvocate: item.secondaryAdvocateName || item.secondary_advocate_name || "",
          secondary_advocate_name: item.secondaryAdvocateName || item.secondary_advocate_name || "",
          advocate_name: item.advocate_name || "",
          isConfidential: isConfidential,
        };
      });

      setCases(formattedCases);
    } catch (error) {
      console.error("Error fetching assigned cases:", error);
    }
  };

  const closeModal = () => {
    setSelectedCase(null);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/lawfirm-management/assigned-cases/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status on server");
      }

      setCases((prevCases) =>
        prevCases.map((c) =>
          c.id === id ? { ...c, status: newStatus } : c
        )
      );

      if (selectedCase && selectedCase.id === id) {
        setSelectedCase((prev) => ({
          ...prev,
          status: newStatus,
        }));
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("caseStatusUpdated"));
        try {
          localStorage.setItem("lastStatusUpdate", Date.now().toString());
        } catch (e) {}
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCases((prev) => prev.filter((c) => c.id !== id));
        setDeleteConfirm(null);
      } else {
        alert("Failed to delete case.");
      }
    } catch (e) {
      console.error("Error deleting case:", e);
      alert("Error deleting case.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCases = cases.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesStatus;
    }
    const matchesSearch =
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.caseNo && String(item.caseNo).toLowerCase().includes(query)) ||
      (item.caseIdCode && String(item.caseIdCode).toLowerCase().includes(query)) ||
      (item.caseId && String(item.caseId).toLowerCase().includes(query)) ||
      (item.id && String(item.id).toLowerCase().includes(query)) ||
      (item.client && item.client.toLowerCase().includes(query)) ||
      (item.court && item.court.toLowerCase().includes(query));
      
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations (8 items per page)
  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCases = filteredCases.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  // No view access
  if (!loading && !perms.view) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2">You do not have permission to view Assigned Cases.</p>
        </div>
      </div>
    );
  }

  // ── Render Full Case Details Page if a case is selected ──
  if (selectedCase) {
    return (
      <AssignedCaseDetailView
        selectedCase={selectedCase}
        setSelectedCase={setSelectedCase}
        onClose={closeModal}
        perms={perms}
        getStatusSelectClass={getStatusSelectClass}
        getStatusBadgeClass={getStatusBadgeClass}
        handleStatusChange={handleStatusChange}
        setCases={setCases}
      />
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6 md:space-y-8 overflow-hidden">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5 md:p-6 w-full max-w-full min-w-0">
        <h1 className="text-[#0F172A] font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight">
          Assigned Cases
        </h1>
        <p className="text-[#64748B] mt-1 text-xs sm:text-sm">
          View and manage your assigned legal cases
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0">
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow min-w-0">
          <h3 className="text-[#64748B] text-xs sm:text-sm font-medium">Total Assigned Cases</h3>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1.5">{cases.length}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow min-w-0">
          <h3 className="text-[#64748B] text-xs sm:text-sm font-medium">Active Cases</h3>
          <p className="text-2xl sm:text-3xl font-bold text-[#16A34A] mt-1.5">
            {cases.filter((c) => c.status === "Active").length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow min-w-0 sm:col-span-1">
          <h3 className="text-[#64748B] text-xs sm:text-sm font-medium">Upcoming Hearings</h3>
          <p className="text-2xl sm:text-3xl font-bold text-[#2563EB] mt-1.5">
            {cases.filter((c) => c.hearing !== "No hearing date").length}
          </p>
        </div>
      </div>

      {/* Cases Section (Grid vs List) */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden w-full max-w-full min-w-0 p-4 sm:p-6">
        <div className="pb-4 border-b border-[#E2E8F0] flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 w-full max-w-full min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] whitespace-nowrap">My Assigned Cases</h2>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto min-w-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-xs sm:text-sm text-[#0F172A] cursor-pointer bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
              <input
                type="text"
                placeholder="Search title, case no, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 md:w-64 border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* View Mode Toggle (Grid vs List) */}
              <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                    viewMode === "grid"
                      ? "bg-white text-[#2563EB] font-bold shadow-xs border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List View"
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                    viewMode === "list"
                      ? "bg-white text-[#2563EB] font-bold shadow-xs border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <List size={14} />
                  <span>List</span>
                </button>
              </div>

              <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 sm:px-3 py-1.5 rounded-full whitespace-nowrap">
                {filteredCases.length} cases
              </span>
            </div>
          </div>
        </div>

        {/* GRID VIEW */}
        {viewMode === "grid" && (
          <div className="py-4 bg-[#F8FAFC]/50 w-full min-w-0">
            {paginatedCases.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0">
                {paginatedCases.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-4 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all space-y-3.5 min-w-0"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-extrabold border border-blue-200 inline-block">
                          {item.caseIdCode}
                        </span>
                        <h3 className="font-bold text-[#0F172A] text-xs sm:text-sm mt-1.5 leading-snug break-words">
                          {item.title || item.caseTitle || "Assigned Case"}
                        </h3>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xs shrink-0 whitespace-nowrap ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status === "Won" ? "🏆 Won" : item.status === "Lost" ? "❌ Lost" : item.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#64748B] bg-[#F8FAFC] p-2.5 sm:p-3 rounded-xl border border-[#E2E8F0]/60 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#94A3B8] shrink-0">Client:</span>
                        <span className="font-bold text-[#0F172A] truncate">
                          {isJuniorAdvocate && isSensitiveCase(item)
                            ? "Confidential (Restricted)"
                            : item.client || "Not Specified"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#94A3B8] shrink-0">Court:</span>
                        <span className="font-semibold text-[#475569] truncate" title={item.court}>
                          {item.court || "Court Not Specified"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#94A3B8] shrink-0">Next Hearing:</span>
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate">
                          {item.hearing || "No hearing date"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                      {(() => {
                        try {
                          const targetId = item.caseId || item.case_id || item.id;
                          const saved = JSON.parse(localStorage.getItem(`saved_briefs_${targetId}`) || "[]");
                          if (saved && saved.length > 0) {
                            return (
                              <button
                                onClick={() => setViewBriefModal(saved[0])}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-extrabold text-xs flex items-center justify-center cursor-pointer shadow-xs shrink-0"
                                title="View Saved AI Summary"
                              >
                                <Eye size={15} />
                              </button>
                            );
                          }
                        } catch (e) {}
                        return null;
                      })()}
                      <button
                        onClick={() => setSelectedCase(item)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl transition font-bold text-xs flex items-center justify-center cursor-pointer shrink-0"
                        title="See Case Details"
                      >
                        <FileText size={15} />
                      </button>

                      {perms.delete ? (
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition text-xs font-bold flex items-center justify-center cursor-pointer shrink-0"
                          title="Delete Case"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-2 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 border border-amber-200 cursor-not-allowed opacity-75"
                          title="🔒 Delete Case Locked by Permission Settings"
                        >
                          🔒
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-14 text-center flex flex-col items-center gap-2">
                <FileText size={32} className="text-[#CBD5E1]" />
                <p className="text-[#64748B] text-sm font-medium">No matching assigned cases found.</p>
              </div>
            )}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <div className="w-full max-w-full min-w-0 py-3">
            {/* Mobile & Tablet Card List (< 768px) */}
            <div className="block md:hidden divide-y divide-[#F1F5F9] w-full min-w-0">
              {paginatedCases.length > 0 ? (
                paginatedCases.map((item, index) => (
                  <div key={index} className="p-3.5 space-y-2.5 w-full min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-extrabold border border-blue-200">
                        {item.caseIdCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusBadgeClass(item.status)}`}>
                        {item.status === "Won" ? "🏆 Won" : item.status === "Lost" ? "❌ Lost" : item.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-[#0F172A] text-xs leading-snug break-words">
                      {item.title || "Assigned Case"}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">Client</span>
                        <span className="text-slate-800 font-semibold truncate block">
                          {isJuniorAdvocate && isSensitiveCase(item) ? "Confidential" : (item.client || "N/A")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">Court</span>
                        <span className="text-slate-800 font-semibold truncate block">{item.court}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-slate-400 font-medium text-[10px]">Next Hearing:</span>
                        <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px]">
                          {item.hearing}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {(() => {
                        try {
                          const targetId = item.caseId || item.case_id || item.id;
                          const saved = JSON.parse(localStorage.getItem(`saved_briefs_${targetId}`) || "[]");
                          if (saved && saved.length > 0) {
                            return (
                              <button
                                onClick={() => setViewBriefModal(saved[0])}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs shrink-0"
                                title="View Summary"
                              >
                                <Eye size={14} />
                              </button>
                            );
                          }
                        } catch (e) {}
                        return null;
                      })()}
                      <button
                        onClick={() => setSelectedCase(item)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer shrink-0"
                        title="View Details"
                      >
                        <FileText size={14} />
                      </button>
                      {perms.delete ? (
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer shrink-0"
                          title="Delete Case"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-2 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 border border-amber-200 cursor-not-allowed opacity-75"
                          title="🔒 Delete Case Locked by Permission Settings"
                        >
                          🔒
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-500 text-xs">
                  No matching assigned cases found.
                </div>
              )}
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block w-full rounded-2xl border border-[#E2E8F0] overflow-hidden">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead className="bg-[#F8FAFC]">
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="px-2.5 sm:px-3.5 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider w-[32%]">Client ID</th>
                    <th className="px-2.5 sm:px-3.5 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider w-[18%]">Client</th>
                    <th className="px-2.5 sm:px-3.5 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider w-[18%]">Court</th>
                    <th className="px-2.5 sm:px-3.5 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider w-[14%]">Next Hearing</th>
                    <th className="px-2 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider w-[10%] text-center">Status</th>
                    <th className="px-2 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider w-[8%] text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {paginatedCases.length > 0 ? (
                    paginatedCases.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-2.5 sm:px-3.5 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-extrabold border border-blue-200 block w-fit mb-1">
                            {item.caseIdCode}
                          </span>
                          <span className="font-bold text-[#0F172A] text-xs leading-snug block break-words">
                            {item.title || "Assigned Case"}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-3.5 py-3 text-xs text-[#475569] font-medium break-words leading-snug">
                          {isJuniorAdvocate && isSensitiveCase(item) ? "Confidential" : item.client}
                        </td>
                        <td className="px-2.5 sm:px-3.5 py-3 text-xs text-[#475569] font-medium break-words leading-snug">
                          {item.court}
                        </td>
                        <td className="px-2.5 sm:px-3.5 py-3 text-xs font-bold text-[#2563EB] whitespace-nowrap">
                          {item.hearing}
                        </td>
                        <td className="px-2 py-3 text-center whitespace-nowrap">
                          <span
                            title={item.status}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-block ${getStatusBadgeClass(item.status)}`}
                          >
                            <span>{item.status === "Won" ? "🏆 Won" : item.status === "Lost" ? "❌ Lost" : item.status}</span>
                          </span>
                        </td>

                        <td className="px-2 py-3 text-center whitespace-nowrap">
                          <div className="flex gap-1.5 items-center justify-center flex-nowrap shrink-0">
                            {(() => {
                              try {
                                const targetId = item.caseId || item.case_id || item.id;
                                const saved = JSON.parse(localStorage.getItem(`saved_briefs_${targetId}`) || "[]");
                                if (saved && saved.length > 0) {
                                  return (
                                    <button
                                      onClick={() => setViewBriefModal(saved[0])}
                                      className="flex items-center justify-center p-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
                                      title="View Saved Brief Summary"
                                    >
                                      <Eye size={15} />
                                    </button>
                                  );
                                }
                              } catch (e) {}
                              return null;
                            })()}

                            <button
                              onClick={() => setSelectedCase(item)}
                              className="flex items-center justify-center p-2 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="See Case Details"
                            >
                              <FileText size={15} />
                            </button>

                            {perms.delete ? (
                              <button
                                onClick={() => setDeleteConfirm(item.id)}
                                className="flex items-center justify-center p-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Delete Case"
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="flex items-center justify-center p-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg shrink-0 cursor-not-allowed opacity-75"
                                title="🔒 Delete Case Locked by Permission Settings"
                              >
                                🔒
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={32} className="text-[#CBD5E1]" />
                          <p className="text-[#64748B] text-sm font-medium">No matching assigned cases found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8-Item Pagination Bar matching standard design */}
        {filteredCases.length > 0 && (
          <TablePagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalEntries={filteredCases.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
            itemLabel="entries"
          />
        )}
      </div>

      {/* SAVED BRIEF READER MODAL PORTAL */}
      {viewBriefModal && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewBriefModal(null)} />

          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 z-10">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                    Win Likelihood: {viewBriefModal.winProbability || 75}%
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">📜 {viewBriefModal.fileName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Downloaded: {viewBriefModal.downloadedAt}</p>
                </div>
              </div>
              <button
                onClick={() => setViewBriefModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-800">
                {viewBriefModal.fileContent}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const file = new Blob([viewBriefModal.fileContent], { type: "text/plain;charset=utf-8" });
                  const element = document.createElement("a");
                  element.href = URL.createObjectURL(file);
                  element.download = viewBriefModal.fileName;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                📥 Download File Again
              </button>
              <button
                onClick={() => setViewBriefModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deleteConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-5 sm:p-6 max-w-xs sm:max-w-sm w-full shadow-2xl z-10 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3.5">
              <Trash2 size={22} className="text-red-500 sm:w-[24px] sm:h-[24px]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1.5">Delete Assigned Case?</h3>
            <p className="text-xs sm:text-sm text-[#64748B] mb-5">
              This action cannot be undone. The case assignment will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-xs sm:text-sm hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm transition disabled:opacity-70 cursor-pointer"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-5 mt-4 border-t border-slate-100 w-full min-w-0 pb-10 sm:pb-0">
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
