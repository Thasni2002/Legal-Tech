"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Eye,
  Briefcase,
  CheckCircle,
  ArrowLeft,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Users,
  Building,
  Search,
  Calendar,
  Sparkles,
  Upload,
  Trash2,
  CheckCircle2,
  Share2,
  Printer,
  Copy,
  FileCheck,
  ListChecks,
  Check,
  Plus,
  User,
  Clock,
  Folder,
  Gavel
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api";
import DocumentViewerModal from "@/components/common/DocumentViewerModal";

// ---------- status colour helper ----------
function statusBadge(status) {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "in progress")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("pending") || s.includes("review") || s.includes("consulting"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "closed" || s === "won" || s === "lost")
    return "bg-red-50 text-red-700 border-red-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

const STATUS_OPTIONS = [
  "Active",
  "Client Consulting",
  "Client Detail Collection",
  "Document Data Collection",
  "Document Pending",
  "Document Verified",
  "Advocate Assigned",
  "Under Review",
  "Case Preparation",
  "Court File",
  "In Progress",
  "Hearing Scheduled",
  "Hearing Completed",
  "Awaiting Judgment",
  "Judgment Delivered",
  "Won",
  "Lost",
  "On Hold",
  "Closed",
];

export default function CaseTracking() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // which client card is expanded (shows the inline cases table)
  const [expandedClient, setExpandedClient] = useState(null);

  // which case is open in the detail modal
  const [selectedCase, setSelectedCase] = useState(null);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Dedicated Page Tab State ("details" vs "notes")
  const [detailsTab, setDetailsTab] = useState("details");

  // Case Notes & AI Brief State
  const [caseNotes, setCaseNotes] = useState([]);
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAiSummaryCard, setShowAiSummaryCard] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Note Form
  const [noteForm, setNoteForm] = useState({
    subject: "",
    description: "",
    meeting_mode: "In-Person",
    advocate_name: "",
    action_items: "",
    tags: "",
    meeting_date: new Date().toISOString().slice(0, 10),
    proof_file: null
  });

  // Note Filters
  const [noteDateFilter, setNoteDateFilter] = useState("");
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [noteModeFilter, setNoteModeFilter] = useState("all");

  const fetchCaseNotes = async (caseNo) => {
    if (!caseNo) return;
    setIsFetchingNotes(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clients/notes/by-case/${encodeURIComponent(caseNo)}`);
      if (res.ok) {
        const data = await res.json();
        setCaseNotes(data);
      }
    } catch (err) {
      console.error("Failed to fetch case notes:", err);
    } finally {
      setIsFetchingNotes(false);
    }
  };

  const handleGenerateAiSummaryByCase = async () => {
    if (!selectedCase?.case_no) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clients/notes/ai-summary-by-case/${encodeURIComponent(selectedCase.case_no)}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data);
        setShowAiSummaryCard(true);
      }
    } catch (err) {
      console.error("Failed to generate case AI summary:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddCaseNote = async (e) => {
    e.preventDefault();
    if (!selectedCase?.case_no || !noteForm.subject || !noteForm.description) return;

    const formData = new FormData();
    formData.append("subject", noteForm.subject);
    formData.append("description", noteForm.description);
    formData.append("client_id", selectedCase.clientName || selectedCase.client_name || "Client");
    if (noteForm.meeting_mode) formData.append("meeting_mode", noteForm.meeting_mode);
    if (noteForm.advocate_name) formData.append("advocate_name", noteForm.advocate_name);
    if (noteForm.action_items) formData.append("action_items", noteForm.action_items);
    if (noteForm.tags) formData.append("tags", noteForm.tags);
    if (noteForm.meeting_date) formData.append("meeting_date", noteForm.meeting_date);
    if (noteForm.proof_file) formData.append("proof_file", noteForm.proof_file);

    try {
      const res = await fetch(`${API_BASE_URL}/clients/notes/by-case/${encodeURIComponent(selectedCase.case_no)}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowAddNoteModal(false);
        setNoteForm({
          subject: "",
          description: "",
          meeting_mode: "In-Person",
          advocate_name: "",
          action_items: "",
          tags: "",
          meeting_date: new Date().toISOString().slice(0, 10),
          proof_file: null
        });
        fetchCaseNotes(selectedCase.case_no);
      }
    } catch (err) {
      console.error("Failed to add case meeting note:", err);
    }
  };

  const handleToggleActionStatus = async (noteId) => {
    try {
      setCaseNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === noteId
            ? { ...n, action_status: n.action_status === "Completed" ? "Pending" : "Completed" }
            : n
        )
      );

      const res = await fetch(`${API_BASE_URL}/clients/notes/${noteId}/toggle-action-status`, {
        method: "PATCH"
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.id === noteId ? { ...n, action_status: updated.action_status } : n
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle action status:", err);
    }
  };

  const handleDeleteCaseNote = async (noteId) => {
    if (!confirm("Are you sure you want to delete this meeting note?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/clients/notes/${noteId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (selectedCase?.case_no) fetchCaseNotes(selectedCase.case_no);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleSelectCase = (cItem) => {
    setSelectedCase(cItem);
    setDetailsTab("details");
    setAiSummary(null);
    setShowAiSummaryCard(false);
    if (cItem?.case_no) {
      fetchCaseNotes(cItem.case_no);
    }
  };

  // ── load cases ──────────────────────────────────────────────
  async function loadCases() {
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/`);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
    setMounted(true);
  }, []);

  // ── group cases by client_name ───────────────────────────────
  const clients = useMemo(() => {
    const map = {};
    cases.forEach((c) => {
      const name = (c.client_name || "Unknown Client").trim();
      if (!map[name]) {
        map[name] = {
          id: `CL-${name.replace(/\s+/g, "").substring(0, 5).toUpperCase()}-${c.contact_number || "000"}`,
          name,
          contact: c.contact_number || "N/A",
          email: c.email_id || "N/A",
          cases: [],
        };
      }
      map[name].cases.push({
        id: c.case_id || `C-${c.id}`,
        dbId: c.id,
        name: c.case_title,
        status: c.status,
        court: c.court_name,
        hearing: c.next_hearing_date || "N/A",
        selected_advocate: c.selected_advocate,
        case_no: c.case_no,
        documents: c.documents || [],
      });
    });
    return Object.values(map);
  }, [cases]);

  // ── auto-select targeted case when navigating via "Track Case" ──
  useEffect(() => {
    if (!clients || clients.length === 0) return;

    let targetParam = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      targetParam = params.get("case_id");
    }

    let storedData = null;
    try {
      const raw = localStorage.getItem("trackCaseData");
      if (raw) storedData = JSON.parse(raw);
    } catch (e) {}

    const searchTarget = (
      targetParam ||
      storedData?.case_id ||
      storedData?.case_no ||
      storedData?.dbId ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    if (searchTarget) {
      for (const cl of clients) {
        const match = cl.cases.find((cItem) => {
          const idStr = (cItem.id || "").toString().toLowerCase();
          const dbIdStr = (cItem.dbId || "").toString().toLowerCase();
          const caseNoStr = (cItem.case_no || "").toString().toLowerCase();
          const nameStr = (cItem.name || "").toString().toLowerCase();
          return (
            idStr === searchTarget ||
            dbIdStr === searchTarget ||
            caseNoStr === searchTarget ||
            (searchTarget.length > 3 && nameStr.includes(searchTarget))
          );
        });

        if (match) {
          setExpandedClient(cl.id);
          handleSelectCase(match);
          if (storedData) localStorage.removeItem("trackCaseData");
          break;
        }
      }
    }
  }, [clients]);

  // ── search filter — matches on client name or case title/id ──
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const q = searchTerm.toLowerCase();
    return clients.filter((cl) => {
      const matchesName = cl.name.toLowerCase().includes(q) || cl.id.toLowerCase().includes(q);
      const matchesCases = cl.cases.some(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.court && c.court.toLowerCase().includes(q))
      );
      return matchesName || matchesCases;
    });
  }, [clients, searchTerm]);

  // ── status update ────────────────────────────────────────────
  async function handleStatusChange(caseDbId, newStatus) {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${caseDbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCases((prev) =>
          prev.map((c) =>
            c.id === caseDbId ? { ...c, status: newStatus } : c
          )
        );
        if (selectedCase && selectedCase.dbId === caseDbId) {
          setSelectedCase((prev) => ({ ...prev, status: newStatus }));
        }
      } else {
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── loading skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-xl border border-[#E2E8F0]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#64748B] font-medium">Loading cases…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-6 md:space-y-8 pb-16 md:pb-10">
      {selectedCase ? (
        /* Full page Case View with Back button and 2 Tabs */
        <div className="space-y-6 animate-fade-in">
          {/* Top Page Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedCase(null); setAiSummary(null); setShowAiSummaryCard(false); }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Return to case list"
              >
                <ArrowLeft size={16} />
                <span>Back to Cases</span>
              </button>
              <div>
                <h2 className="font-extrabold text-[#0F172A] text-lg sm:text-xl leading-tight">
                  {selectedCase.name}
                </h2>
                <p className="text-xs text-[#64748B] font-mono mt-0.5">
                  Case No: <strong className="text-[#0F172A]">{selectedCase.case_no || "N/A"}</strong> &bull; Client: <strong className="text-[#0F172A]">{selectedCase.clientName || selectedCase.client_name || "Client"}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${statusBadge(selectedCase.status)}`}>
                {selectedCase.status}
              </span>
            </div>
          </div>

          {/* Dedicated Page Tabs Bar */}
          <div className="flex items-center border-b border-[#E2E8F0] bg-white rounded-t-2xl px-4 sm:px-6 gap-2 text-xs sm:text-sm font-bold shadow-xs">
            <button
              type="button"
              onClick={() => setDetailsTab("details")}
              className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                detailsTab === "details"
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Briefcase size={16} />
              <span>Case Overview & Documents</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailsTab("notes")}
              className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                detailsTab === "notes"
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <FileText size={16} />
              <span>Client Notes & AI Court Brief</span>
              {caseNotes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
                  {caseNotes.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: CASE DETAILS & DOCUMENTS */}
          {detailsTab === "details" && (
            <div className="bg-white rounded-b-2xl border border-t-0 border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* Left — case info */}
                <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-5 space-y-3 shadow-2xs">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-2 mb-3">
                    Case Parameters
                  </h3>
                  {[
                    ["Case ID", selectedCase.id],
                    ["Case Title", selectedCase.name],
                    ["Case No.", selectedCase.case_no || "N/A"],
                    ["Advocate", selectedCase.selected_advocate || "N/A"],
                    ["Court", selectedCase.court],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="grid grid-cols-3 gap-2 border-b border-slate-200/40 pb-2.5 last:border-0 items-center text-xs"
                    >
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                        {label}
                      </span>
                      <span className="col-span-2 text-[#0F172A] font-semibold text-xs sm:text-sm break-words">
                        {val}
                      </span>
                    </div>
                  ))}

                  {/* Status row */}
                  <div className="grid grid-cols-3 gap-2 pt-1 items-center">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Status
                    </span>
                    <span className="col-span-2">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${statusBadge(
                          selectedCase.status
                        )}`}
                      >
                        {selectedCase.status}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right — docs */}
                {(() => {
                  const validDocs = (selectedCase.documents || []).filter(
                    (doc) => doc && (doc.file || doc.url || doc.filename || doc.name || doc.document_name)
                  );
                  return (
                    <div className="space-y-4">
                      <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/80 shadow-2xs flex flex-col">
                        <div className="flex items-center justify-between gap-2 font-bold text-sm text-[#0F172A] mb-3 pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <Briefcase size={16} className="text-[#2563EB]" />
                            <span>Case Documents</span>
                          </div>
                          <span className="text-[11px] text-[#2563EB] font-bold bg-white px-2.5 py-0.5 rounded-full border border-indigo-100 shadow-2xs">
                            {validDocs.length} {validDocs.length === 1 ? "File" : "Files"}
                          </span>
                        </div>

                        <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-300">
                          {validDocs.length > 0 ? (
                            validDocs.map((doc, idx) => {
                              const fileName = doc.file || doc.filename || doc.name || doc.document_name || doc.url || "Document";
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-200 shadow-2xs transition-colors gap-2"
                                >
                                  <span className="text-slate-800 flex items-center gap-2 font-semibold text-xs truncate min-w-0 flex-1">
                                    <FileText size={15} className="text-indigo-500 shrink-0" />
                                    <span className="truncate" title={fileName}>
                                      {fileName}
                                    </span>
                                  </span>
                                  <button
                                    onClick={() =>
                                      setSelectedDoc({
                                        fileUrl: doc.url || null,
                                        title: fileName,
                                        badge: doc.documentType || "Document",
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:text-white bg-indigo-50 hover:bg-[#2563EB] border border-indigo-200/80 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
                                  >
                                    <Eye size={12} />
                                    <span>View Document</span>
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center text-slate-400 italic text-xs">
                              No documents uploaded for this case
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Update Status */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Update Case Status
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <CheckCircle
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer bg-white shadow-2xs disabled:opacity-60"
                      value={selectedCase.status || ""}
                      disabled={updatingStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          selectedCase.dbId,
                          e.target.value
                        )
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {updatingStatus && (
                    <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                      Saving status…
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENT NOTES & AI COURT BRIEF */}
          {detailsTab === "notes" && (
            <div className="bg-white rounded-b-2xl border border-t-0 border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-6">
              {/* Header Toolbar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="text-[#2563EB]" size={20} />
                    <h3 className="font-extrabold text-[#0F172A] text-base sm:text-lg">
                      Case Meeting Notes & AI Court Brief
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
                      {caseNotes.length} Notes Logged
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Record client consultation notes, meeting mode, & proof files specifically for Case <strong>{selectedCase.case_no}</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                  <button
                    type="button"
                    onClick={handleGenerateAiSummaryByCase}
                    disabled={isGeneratingAi || caseNotes.length === 0}
                    className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                      isGeneratingAi
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : caseNotes.length === 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-200"
                    }`}
                  >
                    <Sparkles size={15} className={isGeneratingAi ? "animate-spin" : ""} />
                    <span>{isGeneratingAi ? "Analyzing Case Notes..." : "Generate AI Court Brief"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddNoteModal(true)}
                    className="py-2 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>+ Add Case Meeting Note</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar: Search + Specific Date Picker + Mode Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    placeholder="Search notes, subject..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 font-medium"
                  />
                  {noteSearchQuery && (
                    <button
                      onClick={() => setNoteSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Date Picker Lookup */}
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={noteDateFilter}
                    onChange={(e) => setNoteDateFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 font-medium"
                    title="Select specific date to find notes"
                  />
                  {noteDateFilter && (
                    <button
                      onClick={() => setNoteDateFilter("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="Clear date filter"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Mode filter */}
                <div>
                  <select
                    value={noteModeFilter}
                    onChange={(e) => setNoteModeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="all">All Meeting Modes</option>
                    <option value="In-Person">In-Person Office</option>
                    <option value="Virtual">Virtual / Video Call</option>
                    <option value="Phone Call">Phone Consultation</option>
                    <option value="Court Premise">Court Premises</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(noteSearchQuery || noteDateFilter || noteModeFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => { setNoteSearchQuery(""); setNoteDateFilter(""); setNoteModeFilter("all"); }}
                    className="py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X size={13} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              {/* AI Summary Banner Card */}
              {showAiSummaryCard && aiSummary && (
                <div className="bg-white text-slate-900 rounded-2xl border border-indigo-200 p-5 shadow-md space-y-4 animate-fade-in relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base tracking-wide text-slate-900">
                            AI Court Preparation Digest — {selectedCase.case_no}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                            Court Ready
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Synthesized from {aiSummary.total_notes || caseNotes.length} case meeting records
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const briefText = `AI COURT PREPARATION BRIEF\nCase: ${selectedCase.name} (${selectedCase.case_no})\nClient: ${selectedCase.clientName || selectedCase.client_name}\n\nEXECUTIVE SUMMARY:\n${aiSummary.executive_summary}\n\nRECOMMENDED ARGUMENTS:\n${(aiSummary.recommended_arguments || []).map((a, i) => `${i+1}. ${a}`).join('\n')}\n\nPENDING ACTIONS:\n${(aiSummary.pending_action_items || []).map((act) => act).join('\n')}`;
                          navigator.clipboard.writeText(briefText);
                          setCopiedBrief(true);
                          setTimeout(() => setCopiedBrief(false), 2000);
                        }}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                        title="Copy brief text to clipboard"
                      >
                        {copiedBrief ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copiedBrief ? "Copied!" : "Copy Brief"}</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                        title="Print court brief"
                      >
                        <Printer size={14} />
                        <span>Print</span>
                      </button>

                      <button
                        onClick={() => setShowAiSummaryCard(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
                    <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck size={14} className="text-indigo-600" />
                      <span>Executive Summary</span>
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {aiSummary.executive_summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Timeline */}
                    {aiSummary.timeline && aiSummary.timeline.length > 0 && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={14} className="text-indigo-600" />
                          <span>Meeting Chronology</span>
                        </h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {aiSummary.timeline.map((item, idx) => (
                            <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs text-xs space-y-0.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-indigo-700">{item.date}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                                  {item.mode}
                                </span>
                              </div>
                              <p className="font-bold text-slate-900 text-xs">{item.subject}</p>
                              <p className="text-[11px] text-slate-600 line-clamp-2">{item.summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Arguments */}
                    {aiSummary.recommended_arguments && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Gavel size={14} className="text-indigo-600" />
                          <span>Recommended Arguments for Court</span>
                        </h5>
                        <ul className="space-y-2 text-xs">
                          {aiSummary.recommended_arguments.map((arg, idx) => (
                            <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-slate-800 leading-snug">{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Pending Action Items */}
                  {aiSummary.pending_action_items && aiSummary.pending_action_items.length > 0 && (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1.5">
                      <h5 className="font-bold uppercase text-[11px] text-amber-900 flex items-center gap-1.5">
                        <ListChecks size={14} className="text-amber-700" />
                        <span>Pending Evidence & Follow-up Action Items</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {aiSummary.pending_action_items.map((act, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-800 font-medium">
                            <CheckCircle2 size={13} className="text-amber-600 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Case Notes Feed */}
              <div className="space-y-4">
                {isFetchingNotes ? (
                  <div className="text-center py-12 text-[#64748B]">
                    <Clock size={28} className="mx-auto mb-2 text-[#94A3B8] animate-spin" />
                    <p className="text-xs font-semibold">Loading case meeting notes...</p>
                  </div>
                ) : caseNotes.filter((n) => {
                  if (noteModeFilter !== "all" && n.meeting_mode !== noteModeFilter) return false;
                  if (noteDateFilter) {
                    const nDate = n.meeting_date ? new Date(n.meeting_date).toISOString().split("T")[0] : "";
                    if (nDate !== noteDateFilter) return false;
                  }
                  if (noteSearchQuery.trim()) {
                    const q = noteSearchQuery.toLowerCase();
                    const sub = (n.subject || "").toLowerCase();
                    const desc = (n.description || "").toLowerCase();
                    if (!sub.includes(q) && !desc.includes(q)) return false;
                  }
                  return true;
                }).length === 0 ? (
                  <div className="text-center py-12 text-[#64748B] space-y-2 border border-dashed border-slate-200 rounded-2xl p-6">
                    <FileText size={32} className="mx-auto text-[#94A3B8]" />
                    <p className="text-sm font-bold text-[#0F172A]">No meeting notes found for this case</p>
                    <p className="text-xs text-[#64748B]">
                      {noteSearchQuery || noteDateFilter || noteModeFilter !== "all"
                        ? "No notes matched your selected filter criteria."
                        : "Click '+ Add Case Meeting Note' to log client consultations for this case."}
                    </p>
                    {noteSearchQuery || noteDateFilter || noteModeFilter !== "all" ? (
                      <button
                        onClick={() => { setNoteSearchQuery(""); setNoteDateFilter(""); setNoteModeFilter("all"); }}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition inline-block mt-1 cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {caseNotes
                      .filter((n) => {
                        if (noteModeFilter !== "all" && n.meeting_mode !== noteModeFilter) return false;
                        if (noteDateFilter) {
                          const nDate = n.meeting_date ? new Date(n.meeting_date).toISOString().split("T")[0] : "";
                          if (nDate !== noteDateFilter) return false;
                        }
                        if (noteSearchQuery.trim()) {
                          const q = noteSearchQuery.toLowerCase();
                          const sub = (n.subject || "").toLowerCase();
                          const desc = (n.description || "").toLowerCase();
                          if (!sub.includes(q) && !desc.includes(q)) return false;
                        }
                        return true;
                      })
                      .map((note) => {
                        const mDate = note.meeting_date ? new Date(note.meeting_date) : new Date();
                        const dateFormatted = mDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                        const timeFormatted = mDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

                        const modeColors = {
                          "In-Person": "bg-emerald-50 text-emerald-700 border-emerald-200",
                          "Virtual": "bg-indigo-50 text-indigo-700 border-indigo-200",
                          "Phone Call": "bg-amber-50 text-amber-700 border-amber-200",
                          "Court Premise": "bg-purple-50 text-purple-700 border-purple-200"
                        };
                        const modeBadgeClass = modeColors[note.meeting_mode] || "bg-slate-50 text-slate-700 border-slate-200";

                        return (
                          <div
                            key={note.id}
                            className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3.5 hover:border-indigo-200 hover:shadow-md transition-all duration-200 shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject:</span>
                                  <h5 className="font-extrabold text-[#0F172A] text-sm sm:text-base leading-tight">
                                    {note.subject || "General Discussion"}
                                  </h5>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${modeBadgeClass}`}>
                                    {note.meeting_mode || "In-Person"}
                                  </span>
                                </div>
                                {note.advocate_name && (
                                  <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 pt-0.5">
                                    <User size={13} className="text-[#2563EB]" />
                                    <span>Advocate: <strong className="text-[#0F172A]">{note.advocate_name}</strong></span>
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <Calendar size={13} className="text-[#2563EB] shrink-0" />
                                  <span>{dateFormatted}</span>
                                  <span className="text-slate-300">•</span>
                                  <Clock size={13} className="text-[#2563EB] shrink-0" />
                                  <span>{timeFormatted}</span>
                                </div>

                                <button
                                  onClick={() => handleDeleteCaseNote(note.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete note"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Description Body */}
                            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 shadow-2xs">
                              {note.description}
                            </div>

                            {/* Action Items Box */}
                            {note.action_items && (
                              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                                note.action_status === "Completed"
                                  ? "bg-emerald-50/80 border-emerald-200"
                                  : "bg-amber-50/70 border-amber-200/80"
                              }`}>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className={`flex items-center gap-1.5 font-bold uppercase text-[11px] tracking-wider ${
                                    note.action_status === "Completed" ? "text-emerald-900" : "text-amber-900"
                                  }`}>
                                    <ListChecks size={14} className={note.action_status === "Completed" ? "text-emerald-600" : "text-amber-600"} />
                                    <span>Action Items / Next Steps</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleActionStatus(note.id)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs border ${
                                      note.action_status === "Completed"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                                        : "bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                                    }`}
                                    title={note.action_status === "Completed" ? "Click to mark as pending" : "Click to mark work as completed"}
                                  >
                                    <CheckCircle2 size={13} className={note.action_status === "Completed" ? "text-white" : "text-emerald-500"} />
                                    <span>{note.action_status === "Completed" ? "Work Completed" : "Mark as Completed"}</span>
                                  </button>
                                </div>

                                <p className={`font-semibold text-xs leading-relaxed ${
                                  note.action_status === "Completed" ? "text-emerald-950 line-through opacity-80" : "text-slate-900"
                                }`}>
                                  {note.action_items}
                                </p>
                              </div>
                            )}

                            {/* Proof Document Attachment Card */}
                            {note.proof_document_path && (
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between bg-blue-50/60 p-3 rounded-xl border border-blue-100 gap-3">
                                <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                                    <FileText size={16} />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-[#0F172A] truncate">
                                      {note.proof_document_name || "Meeting Proof Document"}
                                    </p>
                                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                                      Attached Meeting Proof Document
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => setSelectedDoc({
                                    fileUrl: `${API_BASE_URL}${note.proof_document_path}`,
                                    title: note.proof_document_name || "Meeting Proof Document",
                                    badge: "Proof of Meeting"
                                  })}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-white bg-white hover:bg-[#2563EB] border border-blue-200 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs shrink-0"
                                >
                                  <Eye size={13} />
                                  <span>View Document</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Original Cases & Clients list view */
        <div className="space-y-6">
          {/* Header & Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link
                href="/client-management"
                className="flex items-center justify-center w-9 h-9 bg-white border border-[#E2E8F0] rounded-xl shadow-xs text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors shrink-0 cursor-pointer"
                title="Back to Client Management"
              >
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight truncate">
                  Case Tracking
                </h1>
                <p className="text-xs text-[#64748B] mt-0.5 truncate">
                  Monitor litigation milestones, document trails, and client case notes.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search Client / Case…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Client Accordion List */}
          {filteredClients.length === 0 ? (
            <div className="text-center bg-white py-16 px-4 rounded-2xl border border-[#E2E8F0] text-sm text-[#64748B] shadow-xs">
              <Users size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">No matching client or case found.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => {
                const isExpanded = expandedClient === client.id;
                return (
                  <div
                    key={client.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() =>
                        setExpandedClient(isExpanded ? null : client.id)
                      }
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 select-none">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                            {client.name}
                          </h2>
                          <span className="text-[11px] text-[#64748B] font-mono block mt-0.5 truncate">
                            ID: {client.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        {/* Case Count Badge */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#2563EB] border border-indigo-100 shadow-2xs">
                          <Briefcase size={12} />
                          <span>{client.cases.length}</span>
                          <span className="hidden sm:inline">{client.cases.length === 1 ? "Case" : "Cases"}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp
                            size={18}
                            className="text-[#64748B] shrink-0"
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                            className="text-[#64748B] shrink-0"
                          />
                        )}
                      </div>
                    </button>

                    {/* Inline cases content — Desktop Table vs Mobile Cards */}
                    {isExpanded && (
                      <div className="border-t border-[#F1F5F9] bg-[#F8FAFC]/50">
                        {/* Desktop Table View (>= md screens) */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                <th className="px-5 py-3">#</th>
                                <th className="px-5 py-3">Case ID</th>
                                <th className="px-5 py-3">Case Title</th>
                                <th className="px-5 py-3">Court</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9] bg-white">
                              {client.cases.map((item, idx) => (
                                <tr
                                  key={item.dbId || `${item.id}-${idx}`}
                                  className="hover:bg-[#F8FAFC] transition-colors"
                                >
                                  <td className="px-5 py-3.5 text-xs text-[#94A3B8] font-bold">
                                    {idx + 1}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs font-mono font-semibold text-[#1E293B]">
                                    {item.id}
                                  </td>
                                  <td className="px-5 py-3.5 text-sm text-[#1E293B] max-w-[220px]">
                                    <span className="font-semibold block leading-tight">{item.name}</span>
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-[#64748B]">
                                    {item.court || "—"}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge(
                                        item.status
                                      )}`}
                                    >
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    <button
                                      onClick={() => handleSelectCase(item)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                                    >
                                      <Eye size={13} />
                                      <span>View Details</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile & Tablet Card View (< md screens) */}
                        <div className="block md:hidden p-3.5 space-y-3">
                          {client.cases.map((item, idx) => (
                            <div
                              key={item.dbId || `${item.id}-${idx}`}
                              className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 space-y-2.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <span className="text-xs font-mono font-bold text-slate-800">
                                  #{idx + 1} &bull; {item.id}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge(
                                    item.status
                                  )}`}
                                >
                                  {item.status}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                                  {item.name}
                                </h4>
                                {item.court && (
                                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                    <Building size={12} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{item.court}</span>
                                  </p>
                                )}
                              </div>

                              <div className="pt-1 border-t border-slate-100">
                                <button
                                  onClick={() => handleSelectCase(item)}
                                  className="w-full py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Eye size={13} />
                                  <span>View Details</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Case Meeting Note Modal */}
      {showAddNoteModal && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[10000] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-[#2563EB]" size={18} />
                <h3 className="font-extrabold text-[#0F172A] text-base">
                  Log Meeting Note for Case: {selectedCase?.case_no}
                </h3>
              </div>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCaseNote} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#0F172A] text-xs">
                    Meeting Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={noteForm.subject}
                    onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                    placeholder="e.g. Evidence Collection & Witness Briefing"
                    className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0F172A] text-xs">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    value={noteForm.meeting_date}
                    onChange={(e) => setNoteForm({ ...noteForm, meeting_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0F172A] text-xs">
                    Meeting Mode
                  </label>
                  <select
                    value={noteForm.meeting_mode}
                    onChange={(e) => setNoteForm({ ...noteForm, meeting_mode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="In-Person">In-Person Office</option>
                    <option value="Virtual">Virtual / Video Call</option>
                    <option value="Phone Call">Phone Consultation</option>
                    <option value="Court Premise">Court Premises</option>
                  </select>
                </div>

              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0F172A] text-xs">
                  Meeting Summary & Detailed Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  value={noteForm.description}
                  onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                  placeholder="Enter detailed points discussed, client claims, facts agreed upon, and strategy planned for this case..."
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0F172A] text-xs">
                  Action Items / Next Steps (Optional)
                </label>
                <input
                  type="text"
                  value={noteForm.action_items}
                  onChange={(e) => setNoteForm({ ...noteForm, action_items: e.target.value })}
                  placeholder="e.g. Collect certified copies of title deed before Friday"
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* File Upload for Proof of Meeting */}
              <div className="space-y-1">
                <label className="font-bold text-[#0F172A] text-xs flex items-center justify-between">
                  <span>Proof of Meeting / Document Attachment</span>
                  <span className="text-[10px] text-slate-500 font-normal">Signed notes, photos, audio, PDFs</span>
                </label>
                <div className="p-3 bg-slate-50 border-2 border-dashed border-[#E2E8F0] rounded-xl text-center space-y-1 hover:border-blue-400 transition cursor-pointer relative">
                  <Upload size={18} className="mx-auto text-[#2563EB]" />
                  <p className="text-xs font-bold text-[#0F172A]">
                    {noteForm.proof_file ? noteForm.proof_file.name : "Click to attach proof file"}
                  </p>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNoteForm({ ...noteForm, proof_file: e.target.files[0] });
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#1D4ED8] text-white bg-[#2563EB] rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save Meeting Note
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Document Viewer ── */}
      {selectedDoc && (
        <DocumentViewerModal
          fileUrl={selectedDoc.fileUrl}
          title={selectedDoc.title}
          badge={selectedDoc.badge}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}