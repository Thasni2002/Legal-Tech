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
} from "lucide-react";
import { usePermissions } from "@/utils/usePermissions";

// ─── Status badge helper ───
function StatusBadge({ status }) {
  const map = {
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    Closed: "bg-red-50 text-red-700 border border-red-200",
  };
  const icons = {
    Active: <CheckCircle size={11} />,
    Pending: <Clock size={11} />,
    Closed: <AlertCircle size={11} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${map[status] || "bg-gray-50 text-gray-600 border border-gray-200"}`}>
      {icons[status]}
      {status}
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
      <p className={`text-3xl font-extrabold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

export default function CaseView() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "documents"
  const [advocates, setAdvocates] = useState([]);
  const [assignedAdvocate, setAssignedAdvocate] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // holds case id to delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCases();
    fetchAdvocates();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/case-management/`);
      const data = await response.json();
      setCases(
        Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAdvocates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/`);
      const data = await res.json();
      setAdvocates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await fetch(`${API_BASE_URL}/case-management/${id}`, {
        method: "DELETE",
      });
      await fetchCases();
      setDeleteConfirm(null);
      setIsModalOpen(false);
      setSelectedCase(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete the case. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenModal = (item) => {
    setSelectedCase(item);
    setActiveTab("overview");
    setAssignedAdvocate("");
    setAssignSuccess(false);
    setIsModalOpen(true);
  };

  const handleAssignDocument = async () => {
    if (!assignedAdvocate) return;
    setAssignLoading(true);
    try {
      // Save assigned case to backend
      await fetch(`${API_BASE_URL}/lawfirm-management/assign-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_name: selectedCase.case_title,
          case_number: selectedCase.case_no,
          case_title: selectedCase.case_title,
          advocate_name: assignedAdvocate,
          practice_area: selectedCase.case_type || "",
          priority: "Normal",
          due_date: selectedCase.next_hearing_date || "",
          assignment_notes: `Assigned from Case Management - Case #${selectedCase.case_no}`,
          status: "Active",
          assigned_documents: selectedCase.documents || []
        }),
      });
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to assign document.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDocCheckboxToggle = async (docIndex, action) => {
    if (!selectedCase) return;

    // Create deep copy of documents
    const updatedDocs = selectedCase.documents.map((doc, idx) => {
      if (idx === docIndex) {
        return {
          ...doc,
          [action]: !doc[action]
        };
      }
      return doc;
    });

    // Optimistically update frontend state
    const updatedCase = {
      ...selectedCase,
      documents: updatedDocs
    };
    setSelectedCase(updatedCase);

    // Update in cases list too so it's in sync
    setCases(prev => prev.map(c => c.id === selectedCase.id ? updatedCase : c));

    // Call API to save changes
    try {
      const response = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          caseId: selectedCase.case_id,
          cnrNumber: selectedCase.cnr_number,
          caseTitle: selectedCase.case_title,
          caseNo: selectedCase.case_no,
          caseType: selectedCase.case_type,
          caseDes: selectedCase.case_description,
          clientName: selectedCase.client_name,
          contactNumber: selectedCase.contact_number,
          emailId: selectedCase.email_id,
          courtName: selectedCase.court_name,
          courtType: selectedCase.court_type,
          status: selectedCase.status,
          selectedAdvocate: selectedCase.selected_advocate,
          documents: updatedDocs.map(d => ({
            documentType: d.documentType,
            advocate: d.advocate || "",
            file: d.file,
            view: d.view || false,
            upload: d.upload || false,
            edit: d.edit || false,
            delete: d.delete || false,
          })),
          nextHearingDate: selectedCase.next_hearing_date
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update document clearance");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save changes. Please try again.");
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
  const activeCases = cases.filter((c) => c.status === "Active").length;
  const pendingCases = cases.filter((c) => c.status === "Pending").length;
  const closedCases = cases.filter((c) => c.status === "Closed").length;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">

      {/* ──── HEADER ──── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
            <Scale size={20} className="text-white" />
          </div>
          <h1 className="text-[#0F172A] font-extrabold text-4xl leading-tight">
            Case Management
          </h1>
        </div>
        <p className="text-[#64748B] text-lg ml-[52px]">
          Track legal cases, hearings and case progress
        </p>
      </div>

      {/* ──── STATS ──── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Cases" value={totalCases} color="text-[#0F172A]" bg="bg-white border-[#E2E8F0]" />
        <StatCard label="Active" value={activeCases} color="text-emerald-600" bg="bg-emerald-50 border-emerald-100" />
        <StatCard label="Pending" value={pendingCases} color="text-amber-600" bg="bg-amber-50 border-amber-100" />
        <StatCard label="Closed" value={closedCases} color="text-red-600" bg="bg-red-50 border-red-100" />
      </div>

      {/* ──── QUICK ACCESS CARDS ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: "AI Legal Assistant", desc: "Get intelligent legal answers.", color: "from-[#7C3AED] to-[#6d28d9]", path: "/ai-assistant" },
          { title: "Judgment Summary", desc: "Summarize judgments & key points.", color: "from-[#16A34A] to-[#15803d]", path: "/judgment-summary" },
          { title: "Legal Research", desc: "Search laws, acts & provisions.", color: "from-[#2563EB] to-[#1d4ed8]", path: "/legal-research" },
          { title: "Document Generation", desc: "Generate legal documents with AI.", color: "from-[#D97706] to-[#b45309]", path: "/document-generation" },
        ].map((card) => (
          <button
            key={card.title}
            onClick={() => router.push(card.path)}
            className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-5 text-left hover:scale-[1.02] hover:shadow-lg transition-all duration-200 group`}
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
        <div className="p-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="font-bold text-xl text-[#0F172A]">My Cases</h2>
            <p className="text-sm text-[#64748B] mt-0.5">{filteredCases.length} case{filteredCases.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-[#E2E8F0] pl-9 pr-4 py-2.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
              />
            </div>
            {hasPermission("Case Management", "add") && (
              <button
                onClick={() => router.push("/case-management/case-add")}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition"
              >
                <Plus size={16} />
                Add Case
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                {["Case Title", "Case No", "Client", "Court", "Type", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {filteredCases.length > 0 ? (
                filteredCases.map((item) => (
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
                        {item.case_no}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475569] font-medium">{item.client_name}</td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{item.court_name}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg">
                        {item.case_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => handleOpenModal(item)}
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

      {/* ══════════════════════════════════════════════
          CASE OVERVIEW MODAL
      ══════════════════════════════════════════════ */}
      {isModalOpen && selectedCase && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">

            {/* ── Modal Header ── */}
            <div className="flex items-center justify-between p-6 border-b border-[#F1F5F9] bg-gradient-to-r from-[#2563EB] to-[#1d4ed8]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Gavel size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl leading-tight">
                    {selectedCase.case_title}
                  </h2>
                  <p className="text-white/70 text-xs mt-0.5 font-mono uppercase tracking-wider">
                    Case #{selectedCase.case_no}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit btn */}
                {hasPermission("Case Management", "edit") && (
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      router.push(`/case-management/edit/${selectedCase.id}`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                )}
                {/* Delete btn */}
                {hasPermission("Case Management", "delete") && (
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setDeleteConfirm(selectedCase.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold transition"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-[#F1F5F9] bg-[#F8FAFC]">
              {["overview", "documents"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3.5 text-sm font-bold capitalize transition-colors relative ${
                    activeTab === tab
                      ? "text-[#2563EB]"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {tab === "overview" ? "Case Overview" : "Case Documents"}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Modal Body ── */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ======= TAB: OVERVIEW ======= */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Status badge */}
                  <div className="flex items-center gap-3">
                    <StatusBadge status={selectedCase.status} />
                    <span className="text-xs text-[#94A3B8] font-medium">
                      {selectedCase.case_type} · {selectedCase.court_type}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#F1F5F9] space-y-4">
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Case Details</h4>
                      <InfoRow icon={<Hash size={14} />} label="CNR Number" value={selectedCase.cnr_number} />
                      <InfoRow icon={<Hash size={14} />} label="Case ID" value={selectedCase.case_id} />
                      <InfoRow icon={<FileText size={14} />} label="Case Number" value={selectedCase.case_no} />
                      <InfoRow icon={<Scale size={14} />} label="Case Type" value={selectedCase.case_type} />
                      <InfoRow icon={<Gavel size={14} />} label="Next Hearing Date" value={selectedCase.next_hearing_date} />
                    </div>
                    <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#F1F5F9] space-y-4">
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Court & Jurisdiction</h4>
                      <InfoRow icon={<Building2 size={14} />} label="Court Name" value={selectedCase.court_name} />
                      <InfoRow icon={<Gavel size={14} />} label="Court Type" value={selectedCase.court_type} />
                    </div>
                    <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#F1F5F9] space-y-4 sm:col-span-2">
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Client Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InfoRow icon={<User size={14} />} label="Client Name" value={selectedCase.client_name} />
                        <InfoRow icon={<Phone size={14} />} label="Contact Number" value={selectedCase.contact_number} />
                        <InfoRow icon={<Mail size={14} />} label="Email Address" value={selectedCase.email_id} />
                      </div>
                    </div>
                  </div>

                  {/* Case Description */}
                  {selectedCase.case_description && (
                    <div className="bg-[#FFFBEB] border border-amber-100 rounded-2xl p-5">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText size={13} /> Case Description
                      </h4>
                      <p className="text-sm text-[#475569] leading-relaxed">
                        {selectedCase.case_description}
                      </p>
                    </div>
                  )}

                  
                 
                </div>
              )}

              {/* ======= TAB: DOCUMENTS ======= */}
              {activeTab === "documents" && (
                <div className="space-y-5">
                  {/* Case summary strip */}
                  <div className="flex flex-wrap gap-3 pb-4 border-b border-[#F1F5F9]">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
                      <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Case Title</p>
                      <p className="text-sm font-bold text-[#0F172A] mt-0.5">{selectedCase.case_title}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2">
                      <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Case No.</p>
                      <p className="text-sm font-bold text-[#7C3AED] mt-0.5 font-mono">{selectedCase.case_no}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                      <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Court</p>
                      <p className="text-sm font-bold text-[#0F172A] mt-0.5">{selectedCase.court_name}</p>
                    </div>
                    <div className="ml-auto">
                      <StatusBadge status={selectedCase.status} />
                    </div>
                  </div>

                  {/* Assign in documents tab too */}
                  <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
                        <UserCheck size={15} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1E40AF] text-sm">Assign to Junior Advocate</h4>
                        <p className="text-xs text-[#3B82F6]">This case will appear on the junior advocate's assigned cases page</p>
                      </div>
                    </div>

                    {assignSuccess && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                        <CheckCircle size={16} className="text-green-600" />
                        <p className="text-sm text-green-700 font-semibold">
                          Assigned to <strong>{assignedAdvocate}</strong> successfully!
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <select
                        value={assignedAdvocate}
                        onChange={(e) => setAssignedAdvocate(e.target.value)}
                        className="flex-1 rounded-xl border border-[#BFDBFE] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                      >
                        <option value="">— Select Junior Advocate —</option>
                        {advocates.map((adv) => (
                          <option key={adv.id} value={adv.advocateName || adv.advocate_name}>
                            {adv.advocateName || adv.advocate_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssignDocument}
                        disabled={!assignedAdvocate || assignLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition cursor-pointer"
                      >
                        <Send size={14} />
                        {assignLoading ? "Assigning..." : "Assign"}
                      </button>
                    </div>
                  </div>

                  {/* Documents list table or placeholder */}
                  {selectedCase.documents && selectedCase.documents.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
                            <th className="py-3.5 px-5 text-left">Case Documents</th>
                            <th className="py-3.5 px-5 text-left">Doc Type</th>
                            {["view", "upload", "edit", "delete"].map((act) => (
                              <th key={act} className="py-3.5 px-5 text-center">
                                {act}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9] text-sm">
                          {selectedCase.documents.map((doc, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-5 font-semibold text-slate-700">{doc.file || "Unnamed File"}</td>
                              <td className="py-4 px-5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                  {doc.documentType || "Other"}
                                </span>
                              </td>
                              {["view", "upload", "edit", "delete"].map((act) => (
                                <td key={act} className="text-center py-4 px-5">
                                  <input
                                    type="checkbox"
                                    checked={doc[act] || false}
                                    onChange={() => handleDocCheckboxToggle(idx, act)}
                                    className="w-4 h-4 text-[#2563EB] border-slate-300 rounded focus:ring-[#2563EB]/20 cursor-pointer"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                 
                 <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center">
  <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center mx-auto mb-4 shadow-sm">
    <FileText size={24} className="text-[#94A3B8]" />
  </div>

  <h4 className="font-bold text-[#0F172A] text-sm mb-1">
    No Documents Found
  </h4>

  <p className="text-[#64748B] text-xs max-w-xs mx-auto">
    This case has no uploaded documents.
  </p>
</div>
                   
                  )}
                </div>
              )}
            </div>

            {/* ── Modal Footer ── */}
            <div className="p-5 border-t border-[#F1F5F9] bg-[#F8FAFC] flex justify-between items-center">
              <div className="text-xs text-[#94A3B8] font-medium">
                Case ID: <span className="font-mono text-[#64748B]">{selectedCase.case_id}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}