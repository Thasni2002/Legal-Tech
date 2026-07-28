"use client";

import { API_BASE_URL } from "@/utils/api";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  FileText,
  Trash2,
  LayoutGrid,
  List,
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
      return "bg-amber-50 text-amber-700 border border-amber-200 font-bold";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200 font-bold";
  }
};

export default function AssignedCasesView() {
  const { perms, loading } = useModulePermission("Assigned Cases");
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const [selectedCase, setSelectedCase] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const user = getLoggedInUser();
  const isJuniorAdvocate =
    user && user.role && user.role.toLowerCase().includes("junior");

  useEffect(() => {
    fetchAssignedCases();
  }, []);

  const fetchAssignedCases = async () => {
    try {
      const user = getLoggedInUser();
      const res = await fetch(
        `${API_BASE_URL}/lawfirm-management/assigned-cases`
      );
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


      const formattedCases = casesToShow.map((item) => ({
        id: item.id,
        caseId: item.case_id,
        caseIdCode: item.case_id_code || item.case_number || (item.case_id ? `CASE-#${item.case_id}` : `#${item.id}`),
        title: item.case_title,
        caseNo: item.case_number,
        client: item.client_name || "N/A",
        court: item.practice_court || item.practice_area || "N/A",
        hearing: item.due_date || "No hearing date",
        status: item.status || "Active",
        documents: item.assigned_documents || [],
        appearances: item.appearances || [],
        notes: item.assignment_notes || "",
        primaryAdvocate: item.advocate_name || "",
        secondaryAdvocate: item.secondaryAdvocateName || item.secondary_advocate_name || "",
        secondary_advocate_name: item.secondaryAdvocateName || item.secondary_advocate_name || "",
        advocate_name: item.advocate_name || "",
      }));



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
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.title?.toLowerCase().includes(query) ||
      item.caseNo?.toLowerCase().includes(query) ||
      item.client?.toLowerCase().includes(query) ||
      item.court?.toLowerCase().includes(query);
      
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // No view access
  if (!loading && !perms.view) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 max-w-sm text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-sm mt-2">You do not have permission to view Assigned Cases.</p>
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
    <div className="w-full space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-6">
        <h1 className="text-[#0F172A] font-bold text-2xl sm:text-3xl md:text-4xl" style={{ fontWeight: 700, lineHeight: 1.2 }}>
          Assigned Cases
        </h1>
        <p className="text-[#64748B] mt-1.5 text-xs sm:text-sm">
          View and manage your assigned legal cases
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-[#64748B] text-sm font-medium">Total Assigned Cases</h3>
          <p className="text-3xl font-bold text-[#0F172A] mt-2">{cases.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-[#64748B] text-sm font-medium">Active Cases</h3>
          <p className="text-3xl font-bold text-[#16A34A] mt-2">
            {cases.filter((c) => c.status === "Active").length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-[#64748B] text-sm font-medium">Upcoming Hearings</h3>
          <p className="text-3xl font-bold text-[#2563EB] mt-2">
            {cases.filter((c) => c.hearing !== "No hearing date").length}
          </p>
        </div>
      </div>

      {/* Cases Section (Grid vs List) */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#0F172A] whitespace-nowrap">My Assigned Cases</h2>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex flex-wrap w-full sm:w-auto items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-sm text-[#0F172A] cursor-pointer bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
              <input
                type="text"
                placeholder="Search by title, case no, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 border border-[#E2E8F0] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
              />
            </div>

            {/* View Mode Toggle (Grid vs List) */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "grid"
                    ? "bg-white text-[#2563EB] font-bold shadow-xs border border-[#E2E8F0]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="List View"
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-white text-[#2563EB] font-bold shadow-xs border border-[#E2E8F0]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <List size={14} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-3 py-1.5 rounded-full whitespace-nowrap">
              {filteredCases.length} cases
            </span>
          </div>
        </div>

        {/* GRID VIEW */}
        {viewMode === "grid" && (
          <div className="p-5 bg-[#F8FAFC]/50">
            {filteredCases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCases.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-extrabold border border-blue-200">
                          {item.caseIdCode}
                        </span>
                        <h3 className="font-bold text-[#0F172A] text-sm mt-2 leading-tight">
                          {item.title || item.caseTitle || "Assigned Case"}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xs shrink-0 ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status === "Won" ? "🏆 Case Won" : item.status === "Lost" ? "❌ Case Lost" : item.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#94A3B8]">Client:</span>
                        <span className="font-bold text-[#0F172A] truncate max-w-[170px]">
                          {isJuniorAdvocate && isSensitiveCase(item)
                            ? "Confidential (Restricted)"
                            : item.client || "Not Specified"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#94A3B8]">Court:</span>
                        <span className="font-semibold text-[#475569] truncate max-w-[170px]" title={item.court}>
                          {item.court || "Court Not Specified"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#94A3B8]">Next Hearing:</span>
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {item.hearing || "No hearing date"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                      <button
                        onClick={() => setSelectedCase(item)}
                        className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl transition font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        title="See Case Details"
                      >
                        <Eye size={14} />
                        View Case Details
                      </button>

                      {perms.delete && (
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition text-xs font-bold flex items-center justify-center cursor-pointer"
                          title="Delete Case"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center flex flex-col items-center gap-2">
                <FileText size={32} className="text-[#CBD5E1]" />
                <p className="text-[#64748B] text-sm font-medium">No matching assigned cases found.</p>
              </div>
            )}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Case ID</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Court</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Next Hearing</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredCases.length > 0 ? (
                filteredCases.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-[#F8FAFC] transition-colors duration-150 group"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-[#0F172A]">
                      {item.caseIdCode}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#475569] font-medium">
                      {isJuniorAdvocate && isSensitiveCase(item) ? "Confidential (Restricted)" : (item.client || "Not Specified")}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#475569]">
                      {item.court}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg">
                        {item.hearing}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block uppercase tracking-wider shadow-xs ${getStatusBadgeClass(item.status)}`}>
                        {item.status === "Won" ? "🏆 Case Won" : item.status === "Lost" ? "❌ Case Lost" : item.status}
                      </span>
                    </td>


                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCase(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="See Case Details"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        {perms.delete && (
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            title="Delete Case"
                          >
                            <Trash2 size={14} />
                            Delete
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
        )}
      </div>

      {/* DELETE CONFIRM DIALOG */}
      {deleteConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">Delete Assigned Case?</h3>
            <p className="text-sm text-[#64748B] mb-6">
              This action cannot be undone. The case assignment will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-sm hover:bg-[#F8FAFC] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition disabled:opacity-70"
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
