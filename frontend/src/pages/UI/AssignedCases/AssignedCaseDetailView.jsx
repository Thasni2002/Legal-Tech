"use client";

import { API_BASE_URL } from "@/utils/api";
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Calendar,
  X,
  User,
  Building2,
  Briefcase,
  Gavel,
  Lock,
  Upload,
  CheckCircle,
  ArrowLeft,
  Plus,
  Clock,
  Scale,
  Pencil,
  Trash2,
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import DocumentViewerModal from "@/components/common/DocumentViewerModal";

export default function AssignedCaseDetailView({
  selectedCase,
  setSelectedCase,
  onClose,
  perms,
  getStatusSelectClass,
  getStatusBadgeClass,
  handleStatusChange,
  setCases,
}) {
  const [caseTab, setCaseTab] = useState("overview"); // "overview" | "documents" | "appearances"
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Document password/lock states
  const [docPasswordModal, setDocPasswordModal] = useState(null); // { doc, callback }
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Appearance Modal state (handles both Add and Edit)
  const [appearanceModal, setAppearanceModal] = useState(false);
  const [editingAppearanceIdx, setEditingAppearanceIdx] = useState(null);
  const [appearanceLoading, setAppearanceLoading] = useState(false);
  const [appearanceForm, setAppearanceForm] = useState({
    appearanceDate: new Date().toISOString().split("T")[0],
    advocateName: "",
    courtBench: "",
    stage: "Hearing / Arguments",
    summary: "",
    nextDate: "",
  });

  const loggedInUser = getLoggedInUser();
  const isJuniorAdvocate =
    loggedInUser &&
    loggedInUser.role &&
    loggedInUser.role.toLowerCase().includes("junior");

  // Filter visible documents for junior advocate
  const getVisibleDocs = (docs = []) => {
    if (!isJuniorAdvocate) return docs;
    return docs.filter((d) => d.password && d.password.trim().length > 0);
  };

  const visibleDocs = getVisibleDocs(selectedCase?.documents || []);

  const caseAllowsUpload = (caseItem) => {
    if (!caseItem || !caseItem.documents) return false;
    return caseItem.documents.some((d) => d.upload === true);
  };

  // View document with base64/URL normalization
  const handleViewDocument = (doc) => {
    let rawUrl = doc.fileUrl || doc.file_url || doc.url || "";
    let fileTitle = doc.file || doc.documentType || "Assigned Document";

    if (rawUrl.startsWith("data:") || rawUrl.length > 500) {
      try {
        const parts = rawUrl.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mimeType });
        const bUrl = URL.createObjectURL(blob);

        setSelectedDoc({
          fileUrl: bUrl,
          title: fileTitle,
          badge: doc.documentType || "Document",
        });
        return;
      } catch (e) {
        console.error("Failed to parse base64 for preview:", e);
      }
    }

    let normalized = rawUrl;
    if (typeof window !== "undefined") {
      if (window.location.hostname === "127.0.0.1") {
        normalized = rawUrl.replace("localhost:8000", "127.0.0.1:8000");
      } else {
        normalized = rawUrl.replace("127.0.0.1:8000", "localhost:8000");
      }
    }

    setSelectedDoc({
      fileUrl: normalized,
      title: fileTitle,
      badge: doc.documentType || "Document",
    });
  };

  // Handle document upload
  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedCase) return;

    setUploadLoading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(
        `${API_BASE_URL}/lawfirm-management/assigned-cases/upload-document`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        throw new Error("Failed to upload document file");
      }

      const uploadData = await uploadRes.json();
      const newDocObj = {
        file: file.name,
        documentType: "Uploaded File",
        upload: true,
        fileUrl: uploadData.file_url,
      };

      const updatedDocs = [...(selectedCase.documents || []), newDocObj];

      const saveRes = await fetch(
        `${API_BASE_URL}/lawfirm-management/assigned-cases/${selectedCase.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assigned_documents: updatedDocs,
          }),
        }
      );

      if (!saveRes.ok) {
        throw new Error("Failed to save document to assigned case");
      }

      setSelectedCase((prev) => ({
        ...prev,
        documents: updatedDocs,
      }));

      setCases((prevCases) =>
        prevCases.map((c) =>
          c.id === selectedCase.id ? { ...c, documents: updatedDocs } : c
        )
      );

      setUploadSuccess(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading document. Please try again.");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Open appearance modal for CREATE
  const handleOpenCreateAppearance = () => {
    const user = getLoggedInUser();
    setEditingAppearanceIdx(null);
    setAppearanceForm({
      appearanceDate: new Date().toISOString().split("T")[0],
      advocateName: user?.full_name || user?.username || selectedCase?.advocate_name || "",
      courtBench: selectedCase?.court || "",
      stage: "Hearing / Arguments",
      summary: "",
      nextDate: "",
    });
    setAppearanceModal(true);
  };

  // Open appearance modal for EDIT
  const handleOpenEditAppearance = (app, idx) => {
    setEditingAppearanceIdx(idx);
    setAppearanceForm({
      appearanceDate: app.appearanceDate || new Date().toISOString().split("T")[0],
      advocateName: app.advocateName || "",
      courtBench: app.courtBench || "",
      stage: app.stage || "Hearing / Arguments",
      summary: app.summary || "",
      nextDate: app.nextDate || "",
    });
    setAppearanceModal(true);
  };

  // Save (Create or Update) court appearance entry
  const handleSaveAppearance = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setAppearanceLoading(true);

    const isEdit = editingAppearanceIdx !== null;
    const endpoint = isEdit
      ? `${API_BASE_URL}/lawfirm-management/assigned-cases/${selectedCase.id}/appearances/${editingAppearanceIdx}`
      : `${API_BASE_URL}/lawfirm-management/assigned-cases/${selectedCase.id}/appearances`;

    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appearanceForm),
      });

      if (!res.ok) throw new Error("Failed to save court appearance");
      const updatedCase = await res.json();

      const newAppearances = updatedCase.appearances || [];
      const updatedHearing = updatedCase.due_date || selectedCase.hearing;

      setSelectedCase((prev) => ({
        ...prev,
        appearances: newAppearances,
        hearing: updatedHearing,
      }));

      setCases((prevCases) =>
        prevCases.map((c) =>
          c.id === selectedCase.id
            ? { ...c, appearances: newAppearances, hearing: updatedHearing }
            : c
        )
      );

      setAppearanceModal(false);
      setEditingAppearanceIdx(null);
    } catch (err) {
      console.error("Error saving appearance:", err);
      alert("Error saving court appearance.");
    } finally {
      setAppearanceLoading(false);
    }
  };

  // Delete court appearance entry
  const handleDeleteAppearance = async (idx) => {
    if (!selectedCase || !window.confirm("Are you sure you want to delete this appearance entry?")) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/lawfirm-management/assigned-cases/${selectedCase.id}/appearances/${idx}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete appearance entry");
      const updatedCase = await res.json();

      const newAppearances = updatedCase.appearances || [];

      setSelectedCase((prev) => ({
        ...prev,
        appearances: newAppearances,
      }));

      setCases((prevCases) =>
        prevCases.map((c) =>
          c.id === selectedCase.id ? { ...c, appearances: newAppearances } : c
        )
      );
    } catch (err) {
      console.error("Error deleting appearance:", err);
      alert("Failed to delete court appearance entry.");
    }
  };

  if (!selectedCase) return null;

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 animate-in fade-in duration-200">
      {/* Unified Single Main Container Box */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Case Header Section */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl font-bold transition flex items-center gap-2 cursor-pointer text-sm shadow-xs"
              title="Back to Assigned Cases"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-blue-50 text-[#2563EB] p-2 rounded-xl border border-blue-100 shadow-xs">
                  <Gavel size={20} />
                </span>
                <h1 className="text-[#0F172A] font-extrabold text-2xl sm:text-3xl tracking-tight">
                  {selectedCase.title}
                </h1>
              </div>
              <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mt-1.5 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                  Case No: {selectedCase.caseNo || "N/A"}
                </span>
                <span>•</span>
                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-mono">
                  ID: #{selectedCase.id}
                </span>
              </p>
            </div>
          </div>



        </div>

        {/* Top Segmented Tab Navigation */}
        <div className="border-b border-[#E2E8F0] bg-slate-50/50 p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="inline-flex bg-slate-200/60 p-1.5 rounded-xl gap-1 border border-slate-200">
            <button
              onClick={() => setCaseTab("overview")}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                caseTab === "overview"
                  ? "bg-white text-[#2563EB] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Briefcase size={15} />
              <span>Overview & Strategy</span>
            </button>

            <button
              onClick={() => setCaseTab("documents")}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                caseTab === "documents"
                  ? "bg-white text-[#2563EB] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <FileText size={15} />
              <span>Assigned Documents</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                caseTab === "documents"
                  ? "bg-blue-100 text-[#2563EB]"
                  : "bg-slate-300/60 text-slate-700"
              }`}>
                {visibleDocs.length}
              </span>
            </button>

            <button
              onClick={() => setCaseTab("appearances")}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                caseTab === "appearances"
                  ? "bg-white text-[#2563EB] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Scale size={15} />
              <span>Case Appearances</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                caseTab === "appearances"
                  ? "bg-blue-100 text-[#2563EB]"
                  : "bg-slate-300/60 text-slate-700"
              }`}>
                {(selectedCase.appearances || []).length}
              </span>
            </button>
          </div>

          {/* Quick Action Button inside Tab Header */}
          {caseTab === "documents" && caseAllowsUpload(selectedCase) && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                id="doc-upload-input"
                onChange={handleUploadFile}
              />
              <label
                htmlFor="doc-upload-input"
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm ${
                  uploadLoading
                    ? "bg-[#E2E8F0] text-[#94A3B8]"
                    : "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                }`}
              >
                <Upload size={14} />
                {uploadLoading ? "Uploading..." : "Upload Document"}
              </label>
            </div>
          )}

          {caseTab === "appearances" && (
            <button
              onClick={handleOpenCreateAppearance}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Log Court Appearance</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8">
          {/* ── Tab 1: Overview & Strategy ── */}
          {caseTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Standby Advocate Alert Banner */}
              {(() => {
                const normUser = (loggedInUser?.username || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const normSec = (selectedCase.secondaryAdvocate || selectedCase.secondary_advocate_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const isStandby = normSec && (normSec === normUser || normUser.includes(normSec) || normSec.includes(normUser));
                if (!isStandby) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3.5 text-amber-900 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xl font-bold">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">You are assigned as Standby / Backup Advocate</h4>
                      <p className="text-xs text-amber-800 font-medium mt-0.5">
                        Primary Counsel: <span className="font-bold">{selectedCase.primaryAdvocate || selectedCase.advocate_name || "N/A"}</span>. You have full proxy access to manage hearings, log court appearances, and view records if the primary advocate is absent.
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#64748B] mb-4 flex items-center gap-2">
                  <Building2 size={16} className="text-[#2563EB]" />
                  <span>Case Forum & Assigned Counsel</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Client Name
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB] shrink-0">
                        <User size={16} />
                      </div>
                      <span className="text-sm font-bold text-[#0F172A] truncate">
                        {selectedCase.client || "Not Specified"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Primary Advocate
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-black text-xs">
                        PA
                      </div>
                      <span className="text-sm font-bold text-[#0F172A] truncate">
                        {(() => {
                          const p = selectedCase.primaryAdvocate || selectedCase.advocate_name || selectedCase.advocateName;
                          if (!p) return "Not Specified";
                          return p.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Standby Advocate
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 font-black text-xs">
                        SA
                      </div>
                      <span className="text-sm font-bold text-[#0F172A] truncate">
                        {(() => {
                          const s = selectedCase.secondaryAdvocate || selectedCase.secondary_advocate_name || selectedCase.secondaryAdvocateName;
                          if (!s || s === "None") return "None";
                          return s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                        })()}
                      </span>
                    </div>
                  </div>


                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Court / Forum
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <Building2 size={16} />
                      </div>
                      <span className="text-sm font-bold text-[#0F172A] truncate">
                        {selectedCase.court || "Not Specified"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Next Hearing Date
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <Calendar size={16} />
                      </div>
                      <span className="text-sm font-bold text-[#0F172A] truncate">
                        {selectedCase.hearing || "No hearing date"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                      <span>Current Status</span>
                      <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">Update Status</span>
                    </span>
                    <div className="mt-1">
                      <select
                        value={selectedCase.status || "Active"}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (handleStatusChange && selectedCase.id) {
                            handleStatusChange(selectedCase.id, newStatus);
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border outline-none cursor-pointer transition-all shadow-xs ${
                          getStatusSelectClass ? getStatusSelectClass(selectedCase.status) : "bg-white text-slate-800 border-slate-200"
                        }`}
                      >
                        <option value="Active" className="bg-white text-slate-800">Active</option>
                        <option value="Client Consulting" className="bg-white text-slate-800">Client Consulting</option>
                        <option value="Client Detail Collection" className="bg-white text-slate-800">Client Detail Collection</option>
                        <option value="Document Data Collection" className="bg-white text-slate-800">Document Data Collection</option>
                        <option value="Document Pending" className="bg-white text-slate-800">Document Pending</option>
                        <option value="Document Verified" className="bg-white text-slate-800">Document Verified</option>
                        <option value="Advocate Assigned" className="bg-white text-slate-800">Advocate Assigned</option>
                        <option value="Under Review" className="bg-white text-slate-800">Under Review</option>
                        <option value="Case Preparation" className="bg-white text-slate-800">Case Preparation</option>
                        <option value="Court File" className="bg-white text-slate-800">Court File</option>
                        <option value="In Progress" className="bg-white text-slate-800">In Progress</option>
                        <option value="Hearing Scheduled" className="bg-white text-slate-800">Hearing Scheduled</option>
                        <option value="Hearing Completed" className="bg-white text-slate-800">Hearing Completed</option>
                        <option value="Awaiting Judgment" className="bg-white text-slate-800">Awaiting Judgment</option>
                        <option value="Judgment Delivered" className="bg-white text-slate-800">Judgment Delivered</option>
                        <option value="Won" className="bg-white text-emerald-700 font-bold">🏆 Case Won</option>
                        <option value="Lost" className="bg-white text-rose-700 font-bold">❌ Case Lost</option>
                        <option value="On Hold" className="bg-white text-slate-800">On Hold</option>
                        <option value="Closed" className="bg-white text-slate-800">Closed</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>


              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#64748B] mb-4 flex items-center gap-2">
                  <Briefcase size={16} className="text-amber-500" />
                  <span>Case Strategy & Advocate Notes</span>
                </h3>

                <div className="border-l-4 border-amber-400 bg-amber-50/50 p-6 rounded-r-2xl border-y border-r border-amber-200/60 shadow-xs">
                  <p className="text-[#334155] text-sm font-medium leading-relaxed italic">
                    "{selectedCase.notes || "No strategy notes provided for this assigned case."}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Assigned Documents ── */}
          {caseTab === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {uploadSuccess && (
                <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <p className="text-sm font-bold text-green-800">Document uploaded successfully!</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleDocs.length === 0 ? (
                  <div className="col-span-full text-center py-14 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-slate-700 font-bold text-sm">No documents found</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                        {isJuniorAdvocate
                          ? "No PIN-protected or assigned documents have been shared with you yet."
                          : "No documents attached to this case assignment."}
                      </p>
                    </div>
                  </div>
                ) : (
                  visibleDocs.map((doc, idx) => {
                    const isSelected = selectedDocument?.file === doc.file;
                    const isLocked = doc.password && doc.password.trim().length > 0;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-4 transition-all flex items-center justify-between gap-4 ${
                          isLocked
                            ? "bg-slate-50/80 border-slate-200 hover:border-slate-300"
                            : isSelected
                            ? "bg-blue-50/60 border-blue-200 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {isLocked ? (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0 shadow-xs">
                              <Lock size={18} />
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                              isSelected ? "bg-blue-100 border-blue-200 text-[#2563EB]" : "bg-slate-100 border-slate-200 text-[#64748B]"
                            }`}>
                              <FileText size={18} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate text-[#0F172A]">
                              {doc.file}
                            </p>
                            <p className="text-xs text-[#64748B] mt-0.5">{doc.documentType}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (isLocked) {
                              setDocPasswordModal({
                                doc: doc,
                                callback: () => handleViewDocument(doc),
                              });
                              setPasswordInput("");
                              setPasswordError("");
                            } else {
                              handleViewDocument(doc);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            isLocked
                              ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#DBEAFE]"
                              : isSelected
                              ? "bg-[#2563EB] text-white shadow-sm hover:bg-blue-700"
                              : "bg-slate-100 text-[#475569] hover:bg-slate-200"
                          }`}
                        >
                          {isLocked ? "Unlock & View" : "View"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── Tab 3: Case Appearances ── */}
          {caseTab === "appearances" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Court Appearance Log ({(selectedCase.appearances || []).length})
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Track advocate court appearances, proceedings summary, and hearing schedules
                  </p>
                </div>
              </div>

              {(selectedCase.appearances || []).length === 0 ? (
                <div className="text-center py-14 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#2563EB]">
                    <Scale size={24} />
                  </div>
                  <div>
                    <p className="text-slate-800 font-bold text-sm">No court appearances logged yet</p>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                      Record advocate court appearances, proceedings notes, and next hearing dates.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateAppearance}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer mt-2"
                  >
                    <Plus size={14} />
                    <span>Log First Appearance</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(selectedCase.appearances || []).map((app, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                            <Calendar size={16} />
                          </span>
                          <div>
                            <span className="text-sm font-extrabold text-[#0F172A]">
                              {app.appearanceDate || "Date N/A"}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#64748B]">
                              <User size={13} className="text-[#2563EB]" />
                              <span className="font-semibold">{app.advocateName || "Assigned Advocate"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {app.stage && (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200/60 rounded-full text-xs font-bold">
                              {app.stage}
                            </span>
                          )}
                          {app.courtBench && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                              {app.courtBench}
                            </span>
                          )}

                          {/* EDIT & DELETE Action Buttons */}
                          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                            <button
                              onClick={() => handleOpenEditAppearance(app, idx)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Appearance Entry"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteAppearance(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Appearance Entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {app.summary && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-[#334155] leading-relaxed font-medium">
                          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Proceedings Summary</p>
                          "{app.summary}"
                        </div>
                      )}

                      {app.nextDate && (
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50/70 border border-blue-200/60 px-3.5 py-2 rounded-xl inline-flex">
                          <Clock size={14} className="text-[#2563EB]" />
                          <span>Next Hearing Date Fixed: {app.nextDate}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          fileUrl={selectedDoc.fileUrl}
          title={selectedDoc.title}
          badge={selectedDoc.badge}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {/* Document PIN prompt modal */}
      {docPasswordModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDocPasswordModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto shadow-sm">
              <Lock size={24} className="text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">Enter Document PIN</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Please enter the 6-digit PIN set by the senior advocate to view this file.
              </p>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                pattern="\d{6}"
                maxLength={6}
                placeholder="••••••"
                value={passwordInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPasswordInput(val);
                  setPasswordError("");
                }}
                className="w-32 mx-auto rounded-xl border border-[#E2E8F0] px-4 py-3 text-center text-lg font-mono tracking-[0.75em] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-red-500 font-semibold">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDocPasswordModal(null)}
                className="flex-1 py-2 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-xs hover:bg-[#F8FAFC] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (passwordInput === docPasswordModal.doc.password) {
                    docPasswordModal.callback();
                    setDocPasswordModal(null);
                  } else {
                    setPasswordError("Incorrect 6-digit PIN");
                  }
                }}
                disabled={passwordInput.length !== 6}
                className="flex-1 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs transition disabled:opacity-50"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Add / Edit Court Appearance Modal */}
      {appearanceModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAppearanceModal(false)} />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                  <Scale size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">
                    {editingAppearanceIdx !== null ? "Edit Court Appearance" : "Log Court Appearance"}
                  </h3>
                  <p className="text-xs text-[#64748B]">Record hearing details & proceedings summary</p>
                </div>
              </div>
              <button
                onClick={() => setAppearanceModal(false)}
                className="p-2 text-[#64748B] hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAppearance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Appearance Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={appearanceForm.appearanceDate}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, appearanceDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Appeared Advocate *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Advocate Name"
                    value={appearanceForm.advocateName}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, advocateName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Court / Bench
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. High Court / Sub Court"
                    value={appearanceForm.courtBench}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, courtBench: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Stage of Proceeding
                  </label>
                  <select
                    value={appearanceForm.stage}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, stage: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer"
                  >
                    <option value="Hearing / Arguments">Hearing / Arguments</option>
                    <option value="Counter Affidavit">Counter Affidavit Filing</option>
                    <option value="Witness Examination">Witness Examination</option>
                    <option value="Motion / Interim Order">Motion / Interim Order</option>
                    <option value="Bail Application">Bail Application</option>
                    <option value="Final Hearing">Final Hearing / Judgment</option>
                    <option value="Adjourned">Adjourned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Proceedings Summary / Advocate Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter summary of proceedings, court orders, or instructions..."
                  value={appearanceForm.summary}
                  onChange={(e) => setAppearanceForm({ ...appearanceForm, summary: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Next Hearing Date (Updates Case Hearing)
                </label>
                <input
                  type="date"
                  value={appearanceForm.nextDate}
                  onChange={(e) => setAppearanceForm({ ...appearanceForm, nextDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAppearanceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appearanceLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {appearanceLoading ? "Saving..." : editingAppearanceIdx !== null ? "Update Appearance" : "Save Appearance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
