"use client";

import { API_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
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
  Send,
  EyeOff,
  Eye,
} from "lucide-react";
import { usePermissions } from "@/utils/usePermissions";

// Helper to get status badge styling and icon
function getStatusBadgeStyle(status) {
  const s = String(status || "").trim();
  const lower = s.toLowerCase();

  if (lower.includes("won") || lower === "completed" || lower === "judgment delivered") {
    return {
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold",
      icon: <CheckCircle size={11} />,
    };
  }
  if (lower.includes("lost") || lower === "closed" || lower.includes("reject")) {
    return {
      className: "bg-rose-50 text-rose-700 border border-rose-200 font-extrabold",
      icon: <AlertCircle size={11} />,
    };
  }
  if (
    lower === "in progress" ||
    lower === "hearing scheduled" ||
    lower === "hearing completed" ||
    lower === "case preparation" ||
    lower === "advocate assigned"
  ) {
    return {
      className: "bg-blue-50 text-blue-700 border border-blue-200 font-bold",
      icon: <Clock size={11} />,
    };
  }
  if (lower === "active" || lower === "document verified") {
    return {
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold",
      icon: <CheckCircle size={11} />,
    };
  }
  if (
    lower === "under review" ||
    lower === "awaiting judgment" ||
    lower === "on hold" ||
    lower === "document pending" ||
    lower === "client consulting" ||
    lower === "client detail collection" ||
    lower === "document data collection" ||
    lower === "court file" ||
    lower === "pending"
  ) {
    return {
      className: "bg-amber-50 text-amber-700 border border-amber-200 font-bold",
      icon: <Clock size={11} />,
    };
  }
  return {
    className: "bg-slate-100 text-slate-700 border border-slate-200 font-bold",
    icon: <Clock size={11} />,
  };
}

// Status badge helper
function StatusBadge({ status }) {
  const rawStatus = status || "Active";
  const displayStatus = rawStatus === "Won" ? "🏆 Case Won" : rawStatus === "Lost" ? "❌ Case Lost" : rawStatus;
  const style = getStatusBadgeStyle(rawStatus);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap ${style.className}`}>
      {style.icon}
      {displayStatus}
    </span>
  );
}

// Info row helper
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

export default function CaseDetailView({ id }) {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "documents"
  const [advocates, setAdvocates] = useState([]);
  const [assignedAdvocate, setAssignedAdvocate] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [showPasswordIdx, setShowPasswordIdx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Advocates already assigned to this specific case (via Lawfirm Management)
  const [caseAssignedAdvocates, setCaseAssignedAdvocates] = useState([]);
  // Per-document assignment state
  const [docAssignedSet, setDocAssignedSet] = useState(new Set()); // filenames of already-assigned docs
  const [docAssignModal, setDocAssignModal] = useState(null);    // doc index currently being assigned, or null
  const [docAssignAdvocate, setDocAssignAdvocate] = useState("");
  const [docAssignLoading, setDocAssignLoading] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      // 1. Fetch case details
      const response = await fetch(`${API_BASE_URL}/case-management/${id}`);
      if (!response.ok) {
        throw new Error("Case not found");
      }
      const rawCase = await response.json();

      // 2. Fetch assigned cases for live status mapping
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
      // Prefer matching by numeric case_id (unique), fall back to case_number only when needed
      const assigned = assignedCases.find(ac => {
        if (rawCase.id && ac.case_id) {
          return String(ac.case_id) === String(rawCase.id);
        }
        // Fallback: match by case_number only if no numeric id on either side
        return (
          ac.case_number &&
          rawCase.case_no &&
          String(ac.case_number).trim().toLowerCase() ===
            String(rawCase.case_no).trim().toLowerCase()
        );
      });
      const resolvedStatus = assigned ? assigned.status : rawCase.status;

      // 4. Collect all advocates assigned to this specific case
      // Use case_id-first matching to avoid cross-case pollution from duplicate case numbers
      const caseAssignments = assignedCases.filter(ac => {
        if (rawCase.id && ac.case_id) {
          // Both have numeric IDs — must match exactly
          return String(ac.case_id) === String(rawCase.id);
        }
        // Fallback: only use case_number match when neither side has a case_id
        if (!rawCase.id || !ac.case_id) {
          return (
            ac.case_number &&
            rawCase.case_no &&
            String(ac.case_number).trim().toLowerCase() ===
              String(rawCase.case_no || "").trim().toLowerCase()
          );
        }
        return false;
      });
      const assignedAdvNames = caseAssignments
        .flatMap(ac => [ac.advocate_name, ac.secondary_advocate_name || ac.secondaryAdvocateName])
        .filter(Boolean);
      setCaseAssignedAdvocates(assignedAdvNames);


      // 5. Build set of already-assigned document filenames
      const assignedDocFiles = new Set();
      caseAssignments.forEach(ac => {
        const docs = Array.isArray(ac.assigned_documents) ? ac.assigned_documents : [];
        docs.forEach(d => {
          if (d && d.file) assignedDocFiles.add(d.file);
        });
      });
      setDocAssignedSet(assignedDocFiles);

      setSelectedCase({
        ...rawCase,
        status: resolvedStatus || rawCase.status || "Active"
      });
    } catch (error) {
      console.error("Error loading case details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvocates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/`);
      const data = await res.json();
      setAdvocates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading advocates:", e);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCaseDetails();
      fetchAdvocates();
    }
  }, [id]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await fetch(`${API_BASE_URL}/case-management/${id}`, {
        method: "DELETE",
      });
      setDeleteConfirm(false);
      router.push("/case-management");
    } catch (error) {
      console.error(error);
      alert("Failed to delete the case. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAssignDocument = async () => {
    if (!assignedAdvocate || !selectedCase) return;
    setAssignLoading(true);
    try {
      await fetch(`${API_BASE_URL}/lawfirm-management/assign-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: selectedCase.id,
          case_name: selectedCase.case_title,
          case_number: selectedCase.case_no,
          case_title: selectedCase.case_title,
          advocate_name: assignedAdvocate,
          practice_area: selectedCase.case_type || "",
          priority: "Normal",
          due_date: selectedCase.next_hearing_date || "",
          assignment_notes: `Assigned from Case Management - Case #${selectedCase.case_no}`,
          status: "Active",
          assigned_documents: selectedCase.documents || [],
          client_name: selectedCase.client_name || ""
        }),
      });

      await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
          selectedAdvocate: assignedAdvocate,
          documents: selectedCase.documents || [],
          nextHearingDate: selectedCase.next_hearing_date
        })
      });

      setSelectedCase(prev => ({
        ...prev,
        selected_advocate: assignedAdvocate
      }));
      // Mark all docs as assigned in the set
      const allFileNames = (selectedCase.documents || []).map(d => d.file).filter(Boolean);
      setDocAssignedSet(prev => {
        const next = new Set(prev);
        allFileNames.forEach(f => next.add(f));
        return next;
      });
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to assign advocate.");
    } finally {
      setAssignLoading(false);
    }
  };

  // Assign a single document to a chosen advocate
  const handleAssignSingleDoc = async () => {
    if (docAssignModal === null || !docAssignAdvocate || !selectedCase) return;
    setDocAssignLoading(true);
    const doc = selectedCase.documents[docAssignModal];
    try {
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/assign-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: selectedCase.id,
          case_name: selectedCase.case_title,
          case_number: selectedCase.case_no,
          case_title: selectedCase.case_title,
          advocate_name: docAssignAdvocate,
          priority: "Normal",
          due_date: selectedCase.next_hearing_date || "",
          assignment_notes: `Document '${doc.file}' assigned from Case Management - Case #${selectedCase.case_no}`,
          status: "Active",
          assigned_documents: [doc],
          client_name: selectedCase.client_name || ""
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to assign document.");
        return;
      }
      // Mark this specific document as assigned
      setDocAssignedSet(prev => {
        const next = new Set(prev);
        if (doc.file) next.add(doc.file);
        return next;
      });
      setDocAssignModal(null);
      setDocAssignAdvocate("");
    } catch (e) {
      console.error(e);
      alert("Failed to assign document.");
    } finally {
      setDocAssignLoading(false);
    }
  };

  const handleDocPasswordChange = async (docIndex, newPassword) => {
    if (!selectedCase) return;

    const updatedDocs = selectedCase.documents.map((doc, idx) => {
      if (idx === docIndex) {
        return {
          ...doc,
          password: newPassword
        };
      }
      return doc;
    });

    setSelectedCase(prev => ({
      ...prev,
      documents: updatedDocs
    }));

    // Only update backend if password is empty or exactly 6 digits
    if (newPassword.length !== 0 && newPassword.length !== 6) {
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
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
            url: d.url || "",
            password: d.password || ""
          })),
          nextHearingDate: selectedCase.next_hearing_date
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748B] font-medium">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!selectedCase) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">Case Not Found</h2>
        <p className="text-[#64748B] text-sm mb-6">The requested case could not be loaded or does not exist.</p>
        <button
          onClick={() => router.push("/case-management")}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
        >
          Back to Case Management
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/case-management")}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer flex items-center justify-center"
            title="Back to Case List"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {selectedCase.case_title}
            </h1>
            <p className="text-sm text-[#64748B] mt-1 font-mono uppercase tracking-wider">
              Case #{selectedCase.case_no}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Direct Assign Advocate button */}
          <button
            onClick={() => router.push(`/lawfirm-management/assign-advocate?directCaseId=${selectedCase.id}`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <UserCheck size={14} />
            Direct Assign Advocate
          </button>

          {/* Edit btn */}
          {hasPermission("Case Management", "edit") && (
            <button
              onClick={() => router.push(`/case-management/edit/${selectedCase.id}`)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Pencil size={13} className="text-slate-500" /> Edit
            </button>
          )}

          {/* Delete btn */}
          {hasPermission("Case Management", "delete") && (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] overflow-hidden flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 border-b border-[#F1F5F9] bg-[#F8FAFC] p-3">
          <div className="flex overflow-x-auto no-scrollbar">
            {["overview", "documents"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-sm font-bold capitalize transition-colors relative cursor-pointer ${
                  activeTab === tab ? "text-[#2563EB]" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab === "overview" ? "Case Overview" : "Case Documents"}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 md:p-8">
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Status badge */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <StatusBadge status={selectedCase.status} />
                <span className="text-xs text-[#94A3B8] font-semibold tracking-wide uppercase">
                  {selectedCase.case_type && selectedCase.case_type.includes(": ")
                    ? selectedCase.case_type.replace(": ", " · ")
                    : selectedCase.case_type} · {selectedCase.court_type}
                </span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#F1F5F9] space-y-4">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Case Details</h4>
                  <InfoRow icon={<Hash size={14} />} label="CNR Number" value={selectedCase.cnr_number} />
                  <InfoRow icon={<Hash size={14} />} label="Case ID" value={selectedCase.case_id} />
                  <InfoRow
                    icon={<Scale size={14} />}
                    label="Case Type"
                    value={
                      selectedCase.case_type && selectedCase.case_type.includes(": ")
                        ? selectedCase.case_type.replace(": ", " · ")
                        : selectedCase.case_type
                    }
                  />
                </div>
                <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#F1F5F9] space-y-4">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Court & Jurisdiction</h4>
                  <InfoRow icon={<Building2 size={14} />} label="Court Name" value={selectedCase.court_name} />
                  <InfoRow icon={<Gavel size={14} />} label="Court Type" value={selectedCase.court_type} />
                </div>
                <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#F1F5F9] space-y-4 sm:col-span-2">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Client Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoRow icon={<User size={14} />} label="Client Name" value={selectedCase.client_name} />
                    <InfoRow icon={<Phone size={14} />} label="Contact Number" value={selectedCase.contact_number} />
                    <InfoRow icon={<Mail size={14} />} label="Email Address" value={selectedCase.email_id} />
                  </div>
                </div>
              </div>

              {/* Facts & Issues */}
              {selectedCase.case_description && (() => {
                let facts = "";
                let issues = "";
                const desc = selectedCase.case_description;
                if (desc && desc.startsWith("Facts:\n")) {
                  const parts = desc.split("\n\nIssues:\n");
                  facts = parts[0].replace("Facts:\n", "");
                  issues = parts[1] || "";
                } else {
                  facts = desc || "";
                }
                return (
                  <div className="space-y-4 mt-6">
                    {facts && (
                      <div className="bg-[#FFFBEB] border border-amber-100 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText size={13} /> Facts
                        </h4>
                        <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">
                          {facts}
                        </p>
                      </div>
                    )}

                    {issues && (
                      <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText size={13} /> Issues
                        </h4>
                        <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">
                          {issues}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* Case summary strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pb-4 border-b border-[#F1F5F9]">
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Case Title</p>
                  <p className="text-sm font-bold text-[#0F172A] mt-0.5">{selectedCase.case_title}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2">
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Case ID</p>
                  <p className="text-sm font-bold text-[#7C3AED] mt-0.5 font-mono">{selectedCase.case_id || selectedCase.case_no}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Court</p>
                  <p className="text-sm font-bold text-[#0F172A] mt-0.5">{selectedCase.court_name}</p>
                </div>
                <div className="flex items-center sm:justify-end">
                  <StatusBadge status={selectedCase.status} />
                </div>
              </div>

              {/* Assign to Junior Advocate */}
              <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
                    <UserCheck size={15} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1E40AF] text-sm">Assign to Junior Advocate</h4>
                    <p className="text-xs text-[#3B82F6]">This case will appear on the junior advocate&apos;s assigned cases page</p>
                  </div>
                </div>

                {selectedCase.selected_advocate ? (
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {selectedCase.selected_advocate.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider leading-none">Assigned Junior Advocate</p>
                        <p className="text-sm font-bold text-[#1E40AF] mt-0.5">{selectedCase.selected_advocate}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
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
                              selectedAdvocate: "",
                              documents: selectedCase.documents || [],
                              nextHearingDate: selectedCase.next_hearing_date
                            })
                          });
                          setSelectedCase(prev => ({
                            ...prev,
                            selected_advocate: ""
                          }));
                          setAssignedAdvocate("");
                        } catch (e) {
                          console.error("Failed to unassign advocate:", e);
                        }
                      }}
                      className="text-xs font-bold text-[#2563EB] hover:text-[#1d4ed8] bg-white border border-[#BFDBFE] px-3 py-1.5 rounded-lg hover:shadow-xs transition cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <select
                      value={assignedAdvocate}
                      onChange={(e) => setAssignedAdvocate(e.target.value)}
                      className="flex-1 rounded-xl border border-[#BFDBFE] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                    >
                      <option value="">— Select Junior Advocate —</option>
                      {caseAssignedAdvocates.length === 0 ? (
                        <option value="" disabled>
                          No advocates assigned to this case
                        </option>
                      ) : (
                        advocates
                          .filter((adv) => {
                            const advName = (adv.advocateName || adv.advocate_name || "").toLowerCase().trim();
                            return caseAssignedAdvocates.some(
                              (name) => name.toLowerCase().trim() === advName
                            );
                          })
                          .map((adv) => (
                            <option key={adv.id} value={adv.advocateName || adv.advocate_name}>
                              {adv.advocateName || adv.advocate_name}
                            </option>
                          ))
                      )}
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
                )}
              </div>

              {/* Documents list table or placeholder */}
              {selectedCase.documents && selectedCase.documents.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-5 text-left">Case Documents</th>
                        <th className="py-3.5 px-5 text-left">Doc Type</th>
                        <th className="py-3.5 px-5 text-left">Document Password</th>
                        <th className="py-3.5 px-5 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] text-sm">
                      {selectedCase.documents.map((doc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-5 font-semibold text-slate-700">{doc.file || "Unnamed File"}</td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              {doc.documentType && doc.documentType.includes(": ")
                                ? doc.documentType.split(": ")[1]
                                : doc.documentType || "Other"}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                  <input
                                    type={showPasswordIdx === idx ? "text" : "password"}
                                    placeholder="Enter 6-digit PIN (e.g. 123456)"
                                    value={doc.password || ""}
                                    maxLength={6}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      handleDocPasswordChange(idx, val);
                                    }}
                                    className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm font-mono tracking-[0.4em] text-[#0F172A] placeholder:font-sans placeholder:tracking-normal placeholder:text-xs focus:outline-none focus:ring-2 transition ${
                                      doc.password && doc.password.length > 0 && doc.password.length < 6
                                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                        : "border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswordIdx(showPasswordIdx === idx ? null : idx)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer flex items-center justify-center"
                                    title={showPasswordIdx === idx ? "Hide PIN" : "Show PIN"}
                                  >
                                    {showPasswordIdx === idx ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </div>
                                {doc.password && doc.password.length === 6 ? (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                      Set
                                    </span>
                                    <button
                                      onClick={() => handleDocPasswordChange(idx, "")}
                                      className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 px-2.5 py-1 rounded-full transition cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                              {doc.password && doc.password.length > 0 && doc.password.length < 6 && (
                                <p className="text-red-500 text-[10px] font-medium ml-1">
                                  PIN must be exactly 6 digits
                                </p>
                              )}
                            </div>
                          </td>
                          {/* Action column */}
                          <td className="py-4 px-5">
                            {docAssignedSet.has(doc.file) && doc.password && doc.password.trim().length === 6 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default select-none">
                                <CheckCircle size={12} />
                                Assigned
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setDocAssignModal(idx);
                                  setDocAssignAdvocate("");
                                }}
                                disabled={caseAssignedAdvocates.length === 0}
                                title={caseAssignedAdvocates.length === 0 ? "No advocates assigned to this case yet" : "Assign this document to a junior advocate"}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Send size={11} />
                                Assign
                              </button>
                            )}
                          </td>
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
      </div>

      {/* Per-document assign modal */}
      {docAssignModal !== null && selectedCase && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setDocAssignModal(null); setDocAssignAdvocate(""); }}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                <Send size={16} className="text-[#2563EB]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Assign Document</h3>
                <p className="text-xs text-[#64748B] mt-0.5 truncate max-w-[260px]">
                  {selectedCase.documents[docAssignModal]?.file || "Document"}
                </p>
              </div>
              <button
                onClick={() => { setDocAssignModal(null); setDocAssignAdvocate(""); }}
                className="ml-auto w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Advocate picker */}
            <label className="block text-xs font-bold text-[#0F172A] mb-2">
              Select Junior Advocate
            </label>
            {caseAssignedAdvocates.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 font-semibold mb-5">
                No advocates are assigned to this case yet. Please assign an advocate from Lawfirm Management first.
              </div>
            ) : (
              <select
                value={docAssignAdvocate}
                onChange={(e) => setDocAssignAdvocate(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition mb-5"
              >
                <option value="">— Select Junior Advocate —</option>
                {advocates
                  .filter((adv) => {
                    const advName = (adv.advocateName || adv.advocate_name || "").toLowerCase().trim();
                    return caseAssignedAdvocates.some(
                      (name) => name.toLowerCase().trim() === advName
                    );
                  })
                  .map((adv) => (
                    <option key={adv.id} value={adv.advocateName || adv.advocate_name}>
                      {adv.advocateName || adv.advocate_name}
                    </option>
                  ))}
              </select>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setDocAssignModal(null); setDocAssignAdvocate(""); }}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-sm hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSingleDoc}
                disabled={!docAssignAdvocate || docAssignLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send size={13} />
                {docAssignLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl z-10 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">Delete Case?</h3>
            <p className="text-sm text-[#64748B] mb-6">Are you sure you want to delete this case? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-sm hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition disabled:opacity-70 cursor-pointer"
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
