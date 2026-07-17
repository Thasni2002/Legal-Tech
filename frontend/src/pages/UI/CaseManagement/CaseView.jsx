"use client";

import { API_BASE_URL } from "@/utils/api";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Scale,
  User,
  Building2,
  FileText,
  Phone,
  Mail,
  Hash,
  Gavel,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Send,
  EyeOff,
} from "lucide-react";
import { usePermissions } from "@/utils/usePermissions";

// Helper to normalize status capitalization
function getNormalizedStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "in progress") return "In Progress";
  if (s === "pending") return "Pending";
  if (s === "closed" || s === "completed") return "Completed";
  if (s === "to do") return "To Do";
  return "Active";
}

// ─── Status badge helper ───
function StatusBadge({ status }) {
  const displayStatus = getNormalizedStatus(status);
  const map = {
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    Completed: "bg-red-50 text-red-700 border border-red-200",
    "To Do": "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]",
  };
  const icons = {
    Active: <CheckCircle size={11} />,
    "In Progress": <Clock size={11} />,
    Pending: <Clock size={11} />,
    Completed: <AlertCircle size={11} />,
    "To Do": <Clock size={11} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${map[displayStatus] || "bg-gray-50 text-gray-600 border border-gray-200"}`}>
      {icons[displayStatus]}
      {displayStatus}
    </span>
  );
}

// ─── Info row ───
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#2563EB] flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-[#0F172A] mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-5 border`}>
      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wide">{label}</p>
      <p className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

export default function CaseView() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [casesPage, setCasesPage] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // holds case id to delete
  const [deleteLoading, setDeleteLoading] = useState(false);



  const fetchCases = async () => {
    try {
      // 1. Fetch cases
      const response = await fetch(`${API_BASE_URL}/case-management/`);
      const data = await response.json();
      const rawCases = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.data)
            ? data.data
            : [];

      // 2. Fetch assigned cases to get the live status from AssignedCasesView.jsx
      let assignedCases = [];
      try {
        const assignedRes = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases`);
        if (assignedRes.ok) {
          assignedCases = await assignedRes.json();
        }
      } catch (err) {
        console.error("Error fetching assigned cases status:", err);
      }

      // 3. Map status from Assigned Cases
      const normalizedCases = rawCases.map(c => {
        // Find corresponding assigned case by case number/no
        const assigned = assignedCases.find(
          ac => String(ac.case_number || "").trim().toLowerCase() === String(c.case_no || "").trim().toLowerCase()
        );
        const resolvedStatus = assigned ? assigned.status : c.status;
        return {
          ...c,
          status: getNormalizedStatus(resolvedStatus)
        };
      });

      setCases(normalizedCases);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await fetch(`${API_BASE_URL}/case-management/${id}`, {
        method: "DELETE",
      });
      await fetchCases();
      setDeleteConfirm(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete the case. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCases = cases.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.case_title?.toLowerCase().includes(term) ||
      item.case_no?.toLowerCase().includes(term) ||
      item.client_name?.toLowerCase().includes(term) ||
      item.court_name?.toLowerCase().includes(term)
    );
  });

  const totalCases = cases.length;
  const activeCases = cases.filter((c) => getNormalizedStatus(c.status) === "Active").length;
  const pendingCases = cases.filter((c) => {
    const s = getNormalizedStatus(c.status);
    return s === "Pending" || s === "In Progress" || s === "To Do";
  }).length;
  const completedCases = cases.filter((c) => {
    const s = getNormalizedStatus(c.status);
    return s === "Closed" || s === "Completed";
  }).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

      {/* ──── HEADER ──── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
            <Scale size={20} className="text-white" />
          </div>
          <h1 className="text-[#0F172A] font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-tight break-words">
            Case Management
          </h1>
        </div>
        <p className="text-sm sm:text-base lg:text-lg text-[#64748B] ml-0 sm:ml-[52px]">
          Track legal cases, hearings and case progress
        </p>
      </div>

      {/* ──── STATS ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Cases" value={totalCases} color="text-[#0F172A]" bg="bg-white border-[#E2E8F0]" />
        <StatCard label="Active" value={activeCases} color="text-emerald-600" bg="bg-emerald-50 border-emerald-100" />
        <StatCard label="Pending" value={pendingCases} color="text-amber-600" bg="bg-amber-50 border-amber-100" />
        <StatCard label="Completed" value={completedCases} color="text-red-600" bg="bg-red-50 border-red-100" />
      </div>

      {/* ──── QUICK ACCESS CARDS ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { title: "AI Legal Assistant", desc: "Get intelligent legal answers.", color: "from-[#7C3AED] to-[#6d28d9]", path: "/ai-assistant" },
          { title: "Document Generation", desc: "Generate legal documents with AI.", color: "from-[#D97706] to-[#b45309]", path: "/document-generation" },
        ].map((card) => (
          <button
            key={card.title}
            onClick={() => router.push(card.path)}
            className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-4 sm:p-5 lg:p-6 text-left hover:scale-[1.02] hover:shadow-lg transition-all duration-200 group`}
          >
            <h3 className="font-bold text-sm mb-1">{card.title}</h3>
            <p className="text-white/75 text-xs">{card.desc}</p>
            <div className="mt-3 flex justify-end">
              <ChevronRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>

      {/* ──── CASES TABLE ──── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-[#F1F5F9] flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h2 className="font-bold text-xl text-[#0F172A]">My Cases</h2>
            <p className="text-sm text-[#64748B] mt-0.5">{filteredCases.length} case{filteredCases.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCasesPage(0);
                }}
                className="rounded-xl border border-[#E2E8F0] pl-9 pr-4 py-2.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
              />
            </div>
            {hasPermission("Case Management", "add") && (
              <button
                onClick={() => router.push("/case-management/case-add")}
                className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Plus size={16} />
                Add Case
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                {["Case Name", "Case ID", "Client", "Court", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {filteredCases.length > 0 ? (
                filteredCases.slice(casesPage * 5, (casesPage + 1) * 5).map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F8FAFC] transition-colors duration-150 group"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#0F172A] max-w-[200px] truncate">{item.case_title}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{item.case_type}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-lg">
                        {item.case_id || item.case_no}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475569] font-medium">{item.client_name}</td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{item.court_name}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => router.push(`/case-management/view/${item.id}`)}
                          title="View Case"
                          className="p-2 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>




                        {/* Delete */}
                        {hasPermission("Case Management", "delete") && (
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            title="Delete Case"
                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
                        <Scale size={24} className="text-[#CBD5E1]" />
                      </div>
                      <p className="text-[#64748B] font-medium">No cases found</p>
                      <p className="text-[#94A3B8] text-sm">Try adding a new case or adjusting your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredCases.length > 5 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC]/50">
            <span className="text-xs text-[#64748B] font-semibold">
              Page {casesPage + 1} of {Math.ceil(filteredCases.length / 5)}
            </span>
            <button
              onClick={() => setCasesPage(p => Math.max(0, p - 1))}
              disabled={casesPage === 0}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#2563EB] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer select-none font-bold text-xs"
            >
              &lt;
            </button>
            <button
              onClick={() => setCasesPage(p => Math.min(Math.ceil(filteredCases.length / 5) - 1, p + 1))}
              disabled={(casesPage + 1) * 5 >= filteredCases.length}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#2563EB] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer select-none font-bold text-xs"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          DELETE CONFIRM DIALOG
      ══════════════════════════════════════════════ */}
      {deleteConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">Delete Case?</h3>
            <p className="text-sm text-[#64748B] mb-6">
              This action cannot be undone. The case and all associated data will be permanently removed.
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
        </div>,
        document.body
      )}

    </div>
  );
}