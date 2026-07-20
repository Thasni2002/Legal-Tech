"use client";

import { API_BASE_URL } from "@/utils/api";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  FileText,
  Trash2,
} from "lucide-react";
import useModulePermission from "@/utils/useModulePermission";
import { getLoggedInUser } from "@/utils/auth";
import AssignedCaseDetailView from "./AssignedCaseDetailView";

const getStatusSelectClass = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "Closed":
      return "bg-red-100 text-red-700 border-red-200";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "To Do":
      return "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-50 text-green-700 border border-green-100";
    case "Closed":
      return "bg-red-50 text-red-700 border border-red-100";
    case "In Progress":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "Active":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "To Do":
      return "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]";
    default:
      return "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]";
  }
};

export default function AssignedCasesView() {
  const { perms, loading } = useModulePermission("Assigned Cases");
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCase, setSelectedCase] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
          if (!item.advocate_name) return false;
          const normalizedAssignedName = item.advocate_name.toLowerCase().replace(/[^a-z0-9]/g, "");
          const normalizedUsername = (user.username || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const normalizedEmail = (user.email || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            normalizedAssignedName === normalizedUsername ||
            normalizedAssignedName === normalizedEmail ||
            normalizedUsername.includes(normalizedAssignedName) ||
            normalizedAssignedName.includes(normalizedUsername)
          );
        });
      }

      const formattedCases = casesToShow.map((item) => ({
        id: item.id,
        caseId: item.case_id,
        title: item.case_title,
        caseNo: item.case_number,
        client: item.client_name || "N/A",
        court: item.practice_area,
        hearing: item.due_date || "No hearing date",
        status: item.status || "Active",
        documents: item.assigned_documents || [],
        appearances: item.appearances || [],
        notes: item.assignment_notes || "",
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
    if (!perms.edit) return;

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

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#0F172A] whitespace-nowrap">My Assigned Cases</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex w-full sm:w-auto items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto border border-[#E2E8F0] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-sm text-[#0F172A] cursor-pointer bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
              <input
                type="text"
                placeholder="Search by case title, case no, client or court..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-72 border border-[#E2E8F0] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
              />
            </div>
            <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-3 py-1.5 rounded-full whitespace-nowrap self-end sm:self-auto">
              {filteredCases.length} cases
            </span>
          </div>
        </div>

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
                      #{item.id}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#475569] font-medium">
                      {item.client}
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
                      {perms.edit ? (
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 cursor-pointer transition-colors ${getStatusSelectClass(item.status)}`}
                        >
                          <option value="Closed" className="bg-white text-[#0F172A]">Completed</option>
                          <option value="In Progress" className="bg-white text-[#0F172A]">In Progress</option>
                          <option value="Active" className="bg-white text-[#0F172A]">Active</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      )}
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
