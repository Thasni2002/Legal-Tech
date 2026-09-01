"use client";

import { API_BASE_URL } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  Download,
  BookOpen,
  Search,
  Sparkles,
  Copy,
  Save,
  Bot,
  RefreshCw,
  FileCheck,
  Check,
  History,
  MapPin,
  Printer,
  ChevronDown,
  Bold,
  Highlighter,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { findStateAndDistrictByCourt } from "@/utils/districtCourts";
import { usePermissions } from "@/utils/usePermissions";
import { getLoggedInUser, getAuthHeaders } from "@/utils/auth";
import { isSensitiveCase } from "@/utils/caseSensitivity";
import { clearVaultSession, isVaultUnlocked, refreshVaultActivity, setVaultSession } from "@/utils/vaultSession";
import VaultPasswordModal from "@/components/vault/VaultPasswordModal";
import VaultResetModal from "@/components/vault/VaultResetModal";
import SimilarCasesClient from "@/app/case-management/similar-cases/[id]/SimilarCasesClient";
import OCRPanel from "./OCRPanel";
import DocumentViewerModal from "@/components/common/DocumentViewerModal";
import CaseTimelineView from "@/components/case/CaseTimelineView";

// Helper to compute Hearing Date alert status and days-remaining countdown
export function getHearingAlertInfo(rawHearingDate, status) {
  if (!rawHearingDate) return null;

  if (status) {
    const s = String(status).toLowerCase().trim();
    if (
      s.includes("closed") ||
      s.includes("disposed") ||
      s.includes("won") ||
      s.includes("lost") ||
      s.includes("completed") ||
      s.includes("judgment delivered")
    ) {
      return null;
    }
  }

  let hearingDate = null;
  const str = String(rawHearingDate).trim();

  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        hearingDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else if (parts[0].length === 4) {
        hearingDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
  } else if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD-MM-YYYY (e.g. 25-08-2028)
        hearingDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else if (parts[0].length === 4) {
        // YYYY-MM-DD
        hearingDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
  }

  if (!hearingDate || isNaN(hearingDate.getTime())) {
    return {
      type: "none",
      dateFormatted: str,
      title: `NEXT HEARING DATE: ${str}`,
      daysText: "",
      bannerClass: "bg-gradient-to-r from-red-600 to-rose-700 text-white border border-red-500 shadow-lg shadow-red-600/30",
      badgeClass: "bg-white text-red-700 font-black uppercase shadow-xs",
      icon: "🚨",
      tickerText: `🚨 NEXT HEARING DATE: ${str}  ·  🏛️ E-COURTS SYNCED`,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(hearingDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  const dateFormatted = hearingDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (diffDays === 0) {
    return {
      type: "today",
      diffDays,
      dateFormatted,
      bannerClass: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-2 border-red-400 shadow-xl shadow-red-600/30 animate-pulse",
      badgeClass: "bg-white text-red-700 font-black tracking-wider uppercase shadow-md animate-bounce",
      icon: "🚨",
      title: "HEARING TODAY!",
      daysText: "HEARING TODAY!",
      tickerText: `🚨 HEARING TODAY (${dateFormatted})  ·  🏛️ IMMEDIATE COURT APPEARANCE REQUIRED  ·  ⚡ CASE DOCKET READY  ·  📜 URGENT ADVOCATE NOTICE`,
    };
  }
  if (diffDays > 0 && diffDays <= 3) {
    return {
      type: "urgent",
      diffDays,
      dateFormatted,
      bannerClass: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-2 border-red-500 shadow-lg shadow-red-500/25",
      badgeClass: "bg-white text-red-700 font-black uppercase shadow-xs",
      icon: "🚨",
      title: `Next Hearing in ${diffDays} Day${diffDays > 1 ? "s" : ""}`,
      daysText: `IN ${diffDays} DAY${diffDays > 1 ? "S" : ""}`,
      tickerText: `🚨 URGENT HEARING ALERT: ${dateFormatted}  ·  📅 COUNTDOWN: ${diffDays} DAY${diffDays > 1 ? "S" : ""} REMAINING  ·  🏛️ E-COURTS SYNCED  ·  ⚡ PREPARE CASE BRIEF`,
    };
  }
  if (diffDays > 3 && diffDays <= 7) {
    return {
      type: "upcoming",
      diffDays,
      dateFormatted,
      bannerClass: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-2 border-red-500 shadow-lg shadow-red-500/20",
      badgeClass: "bg-white text-red-700 font-black uppercase shadow-xs",
      icon: "🚨",
      title: `Next Hearing in ${diffDays} Days`,
      daysText: `IN ${diffDays} DAYS`,
      tickerText: `🚨 UPCOMING HEARING ALERT: ${dateFormatted}  ·  📅 COUNTDOWN: ${diffDays} DAYS REMAINING  ·  🏛️ E-COURTS SYNCED  ·  ⚡ ADVOCATE NOTICE`,
    };
  }
  if (diffDays > 7) {
    return {
      type: "future",
      diffDays,
      dateFormatted,
      bannerClass: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-2 border-red-500 shadow-lg shadow-red-500/20",
      badgeClass: "bg-white text-red-700 font-black uppercase shadow-xs",
      icon: "🚨",
      title: `Next Hearing: ${dateFormatted}`,
      daysText: `IN ${diffDays} DAYS`,
      tickerText: `🚨 SCHEDULED HEARING DATE: ${dateFormatted}  ·  📅 COUNTDOWN: ${diffDays} DAYS REMAINING  ·  🏛️ E-COURTS RECORD VERIFIED  ·  ⚡ ADVOCATE DOCKET`,
    };
  }

  const absDays = Math.abs(diffDays);
  return {
    type: "past",
    diffDays,
    dateFormatted,
    bannerClass: "bg-gradient-to-r from-rose-700 via-red-800 to-rose-900 text-white border-2 border-red-600 shadow-md",
    badgeClass: "bg-red-200 text-red-900 font-black uppercase shadow-xs",
    icon: "🔴",
    title: `Hearing Date Passed (${absDays} Day${absDays > 1 ? "s" : ""} Ago)`,
    daysText: `${absDays} DAYS AGO`,
    tickerText: `🔴 HEARING DATE PASSED: ${dateFormatted} (${absDays} DAYS AGO)  ·  🏛️ UPDATE COURT PROCEEDINGS & STAGE  ·  ⚡ NEXT HEARING DATE ENTRY REQUIRED`,
  };
}

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

  const loggedInUser = getLoggedInUser();
  const isJuniorAdvocate =
    loggedInUser &&
    loggedInUser.role &&
    loggedInUser.role.toLowerCase().includes("junior");

  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "documents"
  const [advocates, setAdvocates] = useState([]);
  const [assignedAdvocate, setAssignedAdvocate] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [showPasswordIdx, setShowPasswordIdx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [viewBriefModal, setViewBriefModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [billingPage, setBillingPage] = useState(0);
  const billingPageSize = 10;
  // Advocates already assigned to this specific case (via Lawfirm Management)
  const [caseAssignedAdvocates, setCaseAssignedAdvocates] = useState([]);
  // Per-document assignment state
  const [docAssignAdvocate, setDocAssignAdvocate] = useState("");
  const [docAssignLoading, setDocAssignLoading] = useState(false);
  const [docAssignedSet, setDocAssignedSet] = useState(new Set());
  const [docAssignModal, setDocAssignModal] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);

  // ── Timeline State ───────────────────────────────────────────────────
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(null);
  // ─────────────────────────────────────────────────────────────────────

  // ── Confidential Vault state ────────────────────────────────────────────
  const isSeniorAdvocate = (loggedInUser?.role || "").toLowerCase().includes("senior");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showVaultReset, setShowVaultReset] = useState(false);
  // ─────────────────────────────────────────────────────────────────────


  const handleSaveOcrToCaseDocuments = async (extractedText, originalFilename, detectedDocType, digitizedHtml) => {
    if (!selectedCase || (!extractedText && !digitizedHtml)) return;
    try {
      const cleanName = (originalFilename || "Document").replace(/\.[^/.]+$/, "");
      let docName = "";
      let textBase64 = "";

      if (typeof extractedText === "string" && extractedText.startsWith("data:")) {
        const isPdf = extractedText.includes("pdf");
        const ext = isPdf ? "pdf" : "png";
        docName = `Scanned_${cleanName.replace(/[^a-zA-Z0-9_]/g, "_")}.${ext}`;
        textBase64 = extractedText;
      } else {
        const contentToSave = digitizedHtml || extractedText;
        const ext = digitizedHtml ? "html" : "txt";
        const mime = digitizedHtml ? "text/html" : "text/plain";
        docName = `OCR_${cleanName.replace(/[^a-zA-Z0-9_]/g, "_")}.${ext}`;
        textBase64 = `data:${mime};charset=utf-8;base64,${btoa(unescape(encodeURIComponent(contentToSave)))}`;
      }

      const newDocObj = {
        documentType: detectedDocType || "Scanned Document",
        advocate: getLoggedInUser()?.username || selectedCase.selected_advocate || "Advocate",
        file: docName,
        url: textBase64,
        password: ""
      };

      const updatedDocuments = [...(selectedCase.documents || []), newDocObj];

      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
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
          selectedAdvocate: selectedCase.selected_advocate,
          documents: updatedDocuments,
          nextHearingDate: selectedCase.next_hearing_date
        })
      });

      if (!res.ok) throw new Error("Failed to save OCR document to case files.");

      setSelectedCase(prev => ({
        ...prev,
        documents: updatedDocuments
      }));
    } catch (err) {
      console.error("Save OCR Document error:", err);
      alert(err.message || "Failed to save OCR document.");
    }
  };

  const handleDeleteCaseDocument = async (docIndex) => {
    if (!selectedCase || !selectedCase.documents) return;
    const docToDelete = selectedCase.documents[docIndex];
    if (!window.confirm(`Are you sure you want to delete "${docToDelete?.file || "this document"}"?`)) return;

    try {
      const updatedDocuments = selectedCase.documents.filter((_, i) => i !== docIndex);

      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
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
          selectedAdvocate: selectedCase.selected_advocate,
          documents: updatedDocuments,
          nextHearingDate: selectedCase.next_hearing_date
        })
      });

      if (!res.ok) throw new Error("Failed to delete document from case files.");

      setSelectedCase(prev => ({
        ...prev,
        documents: updatedDocuments
      }));
    } catch (err) {
      console.error("Delete Case Document error:", err);
      alert(err.message || "Failed to delete document.");
    }
  };

  // eCourts State
  const [ecourtsData, setEcourtsData] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Advocate Notes & Tasks State
  const [caseNotes, setCaseNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("Action Item");
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  // Case Fee & Billing State — real data from Finance Management
  const [caseInvoices, setCaseInvoices] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);

  // Document Generation Tab State
  const [docGenPrompt, setDocGenPrompt] = useState("");
  const [docGenLoading, setDocGenLoading] = useState(false);
  const [docGenError, setDocGenError] = useState(null);
  const [generatedDocContent, setGeneratedDocContent] = useState("");
  const [docGenEditMode, setDocGenEditMode] = useState(false);
  const [docGenEditedContent, setDocGenEditedContent] = useState("");
  const [docGenTitle, setDocGenTitle] = useState("Bail Application");
  const [docGenHistory, setDocGenHistory] = useState([]);
  const [docGenHistoryLoading, setDocGenHistoryLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveCaseDocLoading, setSaveCaseDocLoading] = useState(false);
  const [saveCaseDocSuccess, setSaveCaseDocSuccess] = useState(false);
  const [activeDocHistoryId, setActiveDocHistoryId] = useState(null);
  const [savingDocEdit, setSavingDocEdit] = useState(false);
  const [saveEditSuccess, setSaveEditSuccess] = useState(false);
  const [printFormatMenuOpen, setPrintFormatMenuOpen] = useState(false);

  // Helper to auto-fill unreplaced placeholders in templates using actual case context
  const autoFillCasePlaceholders = (text, caseObj) => {
    if (!text || typeof text !== "string" || !caseObj) return text || "";

    const todayStr = new Date().toLocaleDateString("en-GB");
    const advocateName = caseObj.selected_advocate || caseObj.advocateName || getLoggedInUser()?.username || "Advocate JEMSHIYA JAMEEL";
    const clientName = caseObj.client_name || "Client";
    const clientDistrict = caseObj.client_district || caseObj.client_address || "Ernakulam, Kerala";
    const contactNo = caseObj.contact_number || caseObj.contactNumber || "N/A";
    const emailId = caseObj.email_id || caseObj.emailId || "N/A";
    const cnrNo = caseObj.cnr_number || caseObj.cnrNumber || "N/A";
    const caseNo = caseObj.case_no || caseObj.caseNo || "N/A";
    const courtName = caseObj.court_name || caseObj.courtName || "High Court of Kerala / Labour Court";

    return text
      .replace(/\[\s*Date\s*\]/gi, todayStr)
      .replace(/\[\s*Date\/Month\/Year\s*\]/gi, todayStr)
      .replace(/\[\s*Contact Number\s*\]/gi, contactNo)
      .replace(/\[\s*Phone Number\s*\]/gi, contactNo)
      .replace(/\[\s*Email Address\s*\]/gi, emailId)
      .replace(/\[\s*Email\s*\]/gi, emailId)
      .replace(/\[\s*Chamber\s*\/\s*Office Address\s*\]/gi, `Chamber No. 402, High Court Advocates Association, High Court Building`)
      .replace(/\[\s*City,\s*Ernakulam,\s*Kerala\s*-\s*Pin Code\s*\]/gi, `${clientDistrict} - 682031`)
      .replace(/\[\s*Client Name\s*\]/gi, clientName)
      .replace(/\[\s*Court Name\s*\]/gi, courtName)
      .replace(/\[\s*CNR Number\s*\]/gi, cnrNo)
      .replace(/\[\s*Case Number\s*\]/gi, caseNo)
      .replace(/\[\s*Case No\.?\s*\]/gi, caseNo)
      .replace(/\[\s*Advocate Name\s*\]/gi, advocateName);
  };

  const [docEditFullPage, setDocEditFullPage] = useState(false);

  const applyDocTextareaFormatting = (type) => {
    const textarea = document.getElementById("doc-edit-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = docGenEditedContent;

    let selectedText = text.substring(start, end);
    let wrapped = "";

    if (type === "bold") {
      selectedText = selectedText || "Bold Text";
      wrapped = `**${selectedText}**`;
    } else if (type === "italic") {
      selectedText = selectedText || "Italic Text";
      wrapped = `*${selectedText}*`;
    } else if (type === "underline") {
      selectedText = selectedText || "Underlined Text";
      wrapped = `<u>${selectedText}</u>`;
    } else if (type === "highlight") {
      selectedText = selectedText || "Highlighted Text";
      wrapped = `==${selectedText}==`;
    } else if (type === "h1") {
      selectedText = selectedText || "Heading 1";
      wrapped = `\n# ${selectedText}\n`;
    } else if (type === "h2") {
      selectedText = selectedText || "Heading 2";
      wrapped = `\n## ${selectedText}\n`;
    } else if (type === "h3") {
      selectedText = selectedText || "Heading 3";
      wrapped = `\n### ${selectedText}\n`;
    }

    const newText = text.substring(0, start) + wrapped + text.substring(end);
    setDocGenEditedContent(newText);

    setTimeout(() => {
      textarea.focus();
      const selectOffset = (type === "bold" || type === "highlight") ? 2 : (type === "italic") ? 1 : 3;
      textarea.setSelectionRange(start + selectOffset, start + wrapped.length - selectOffset);
    }, 50);
  };

  const handlePrintDocument = (pageSize = "A4") => {
    const rawContent = docGenEditMode ? docGenEditedContent : generatedDocContent;
    if (!rawContent) return;

    const content = autoFillCasePlaceholders(rawContent, selectedCase);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups in your browser to print the document.");
      return;
    }

    const pageCss = pageSize === "Legal" ? "legal" : pageSize === "Letter" ? "letter" : "A4";
    const titleText = `${docGenTitle || "Legal Document"} — Case #${selectedCase?.case_no || ""}`;

    // Convert markdown/HTML bold, headings, and highlight tags into inline styled elements for printing
    const formattedPrintHtml = content
      .replace(/^# (.*?)$/gm, '<h1 style="font-size: 16pt; font-weight: bold; text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 16px;">$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2 style="font-size: 14pt; font-weight: bold; margin-top: 14px;">$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3 style="font-size: 12pt; font-weight: bold; margin-top: 12px;">$1</h3>')
      .replace(/==(.*?)==/g, '<mark style="background-color: #fef08a; color: #713f12; padding: 2px 5px; border-radius: 4px; font-weight: bold; border: 1px solid #fde047;">$1</mark>')
      .replace(/--(.*?)--/g, '<mark style="background-color: #fef08a; color: #713f12; padding: 2px 5px; border-radius: 4px; font-weight: bold; border: 1px solid #fde047;">$1</mark>')
      .replace(/<mark>(.*?)<\/mark>/gi, '<mark style="background-color: #fef08a; color: #713f12; padding: 2px 5px; border-radius: 4px; font-weight: bold; border: 1px solid #fde047;">$1</mark>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            @page {
              size: ${pageCss} portrait;
              margin: 20mm;
            }
            body {
              font-family: 'Times New Roman', Times, Georgia, serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
              margin: 0;
              padding: 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .header-info {
              text-align: right;
              font-size: 9pt;
              font-family: Arial, sans-serif;
              color: #666;
              border-bottom: 1px solid #ddd;
              padding-bottom: 6px;
              margin-bottom: 20px;
            }
            mark {
              background-color: #fef08a !important;
              color: #713f12 !important;
              padding: 2px 5px;
              border-radius: 4px;
              font-weight: bold;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          <div class="header-info">${titleText} | Paper Size: ${pageSize}</div>
          <div class="content">${formattedPrintHtml}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const fetchCaseDocHistory = async (caseId) => {
    if (!caseId) return;
    setDocGenHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/ai-documents/history?case_id=${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setDocGenHistory(data);
      }
    } catch (err) {
      console.error("Error fetching case doc history:", err);
    } finally {
      setDocGenHistoryLoading(false);
    }
  };

  const handleSaveDocEdit = async () => {
    setGeneratedDocContent(docGenEditedContent);

    if (activeDocHistoryId) {
      setSavingDocEdit(true);
      try {
        const res = await fetch(`${API_BASE_URL}/case-management/ai-documents/history/${activeDocHistoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: docGenEditedContent })
        });

        if (res.ok) {
          const updatedItem = await res.json();
          setDocGenHistory(prev =>
            prev.map(item => (item.id === activeDocHistoryId ? { ...item, content: updatedItem.content || docGenEditedContent } : item))
          );
        }
      } catch (err) {
        console.error("Error saving document edit to backend:", err);
      } finally {
        setSavingDocEdit(false);
      }
    }

    setDocGenEditMode(false);
    setSaveEditSuccess(true);
    setTimeout(() => setSaveEditSuccess(false), 2500);
  };

  const [deleteDocHistoryId, setDeleteDocHistoryId] = useState(null);
  const [deleteDocHistoryLoading, setDeleteDocHistoryLoading] = useState(false);

  const confirmDeleteDocHistory = async () => {
    if (!deleteDocHistoryId) return;
    setDeleteDocHistoryLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/case-management/ai-documents/history/${deleteDocHistoryId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setDocGenHistory(prev => prev.filter(item => item.id !== deleteDocHistoryId));
        setDeleteDocHistoryId(null);
      } else {
        alert("Failed to delete document history item.");
      }
    } catch (err) {
      console.error("Delete document history error:", err);
      alert("Error deleting document history item.");
    } finally {
      setDeleteDocHistoryLoading(false);
    }
  };

  const fetchTimelineEvents = async (caseId, silent = false) => {
    if (!caseId) return;
    if (!silent) setTimelineLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${caseId}/timeline`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTimelineEvents(data);
      }
    } catch (err) {
      console.error("Error fetching case timeline:", err);
    } finally {
      if (!silent) setTimelineLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "generate_doc" && selectedCase?.id) {
      fetchCaseDocHistory(selectedCase.id);
    }
    if (activeTab === "timeline" && selectedCase?.id) {
      fetchTimelineEvents(selectedCase.id);
      const interval = setInterval(() => {
        fetchTimelineEvents(selectedCase.id, true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedCase?.id]);



  const handleGenerateCaseDocument = async (customPrompt = null, docTypeLabel = null) => {
    const promptToUse = customPrompt || docGenPrompt;
    if (!selectedCase || !promptToUse || !promptToUse.trim()) {
      setDocGenError("Please enter prompt instructions or click a template.");
      return;
    }
    if (docTypeLabel) setDocGenTitle(docTypeLabel);
    setDocGenLoading(true);
    setDocGenError(null);
    setSaveCaseDocSuccess(false);

    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}/generate-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToUse })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to generate legal document.");
      }

      const data = await res.json();
      const filledDoc = autoFillCasePlaceholders(data.document || "", selectedCase);
      setGeneratedDocContent(filledDoc);
      setDocGenEditedContent(filledDoc);
      setActiveDocHistoryId(data.id || null);
      setDocGenEditMode(false);
      fetchCaseDocHistory(selectedCase.id);
    } catch (err) {
      setDocGenError(err.message);
    } finally {
      setDocGenLoading(false);
    }
  };

  const handleSaveToCaseDocuments = async () => {
    const contentToSave = docGenEditMode ? docGenEditedContent : generatedDocContent;
    if (!selectedCase || !contentToSave) return;
    setSaveCaseDocLoading(true);

    try {
      const safeCaseNo = (selectedCase.case_no || "").replace(/[^a-zA-Z0-9_]/g, "_");
      const cleanDocTitle = (docGenTitle || "Generated_Document").replace(/[^a-zA-Z0-9_]/g, "_");
      const docName = `${cleanDocTitle}_${safeCaseNo}.txt`;
      const textBase64 = `data:text/plain;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(contentToSave)))}`;

      const newDocObj = {
        documentType: docGenTitle || "AI Legal Document",
        advocate: getLoggedInUser()?.username || selectedCase.selected_advocate || "Advocate",
        file: docName,
        url: textBase64,
        password: ""
      };

      const updatedDocuments = [...(selectedCase.documents || []), newDocObj];

      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedCase.client_id || selectedCase.case_id,
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
          documents: updatedDocuments,
          nextHearingDate: selectedCase.next_hearing_date
        })
      });

      if (!res.ok) throw new Error("Failed to save document to case files.");

      setSelectedCase(prev => ({
        ...prev,
        documents: updatedDocuments
      }));
      setSaveCaseDocSuccess(true);
      setTimeout(() => setSaveCaseDocSuccess(false), 3000);
    } catch (err) {
      console.error("Save to Case Documents error:", err);
      alert(err.message || "Failed to save document to case files.");
    } finally {
      setSaveCaseDocLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const content = docGenEditMode ? docGenEditedContent : generatedDocContent;
    if (!content || !selectedCase) return;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text((docGenTitle || "Generated Document").toUpperCase(), margin, 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Case Title: ${selectedCase.case_title}`, margin, 27);
      doc.text(`Case No: ${selectedCase.case_no} | CNR: ${selectedCase.cnr_number || "N/A"} | Court: ${selectedCase.court_name || "N/A"}`, margin, 33);
      doc.text(`Client: ${selectedCase.client_name} | Date: ${new Date().toLocaleDateString("en-IN")}`, margin, 39);

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 43, margin + pageWidth, 43);

      doc.setFontSize(10);
      const cleanContent = content.replace(/[#*`_~]/g, "");
      const splitLines = doc.splitTextToSize(cleanContent, pageWidth);

      let cursorY = 51;
      splitLines.forEach((line) => {
        if (cursorY > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 5.5;
      });

      const fileName = `${(docGenTitle || "Doc").replace(/[^a-zA-Z0-9]/g, "_")}_Case_${selectedCase.case_no}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF document.");
    }
  };

  const handleDownloadOrderPDF = async (ord) => {
    if (!ord) return;
    if (ord.fileUrl && ord.fileUrl.startsWith("http")) {
      window.open(ord.fileUrl, "_blank");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

      // Header
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("IN THE COURT OF THE DISTRICT & SESSIONS JUDGE", margin, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`AT ${selectedCase?.court_name || "DISTRICT COURT COMPLEX"}`, margin, 28);

      doc.setLineWidth(0.5);
      doc.setDrawColor(37, 99, 235);
      doc.line(margin, 33, margin + pageWidth, 33);

      // Metadata Block
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`CNR NUMBER: ${selectedCase?.cnr_number || "N/A"}`, margin, 42);
      doc.text(`ORDER TYPE: ${ord.orderType || "COURT ORDER"}`, margin, 48);
      doc.text(`ORDER DATE: ${ord.orderDate || "N/A"}`, margin, 54);
      doc.text(`NEXT HEARING DATE: ${ecourtsData?.nextHearingDate || selectedCase?.next_hearing_date || "To be scheduled"}`, margin, 60);
      doc.text(`BEFORE BENCH OF: ${ord.judgeName || "HON'BLE PRESIDING JUDGE"}`, margin, 66);

      doc.setLineWidth(0.2);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 71, margin + pageWidth, 71);

      // Case Parties
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("CASE DETAILS & PARTIES:", margin, 79);
      doc.setFont("helvetica", "normal");
      doc.text(`Case Title: ${ecourtsData?.caseTitle || selectedCase?.case_title || "Court Proceeding"}`, margin, 86);
      doc.text(`Petitioner / Appellant: ${selectedCase?.client_name || ecourtsData?.petitioner || "Petitioner"}`, margin, 92);
      doc.text(`Respondent / Opposing Party: ${ecourtsData?.respondent || "State / Respondent"}`, margin, 98);

      doc.line(margin, 104, margin + pageWidth, 104);

      // Order Summary Heading
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("PROCEEDINGS & JUDGMENT ORDER RECORD:", margin, 113);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const orderText = ord.summary || "Court hearing completed. Order details and proceedings recorded on eCourts portal.";
      const splitText = doc.splitTextToSize(orderText, pageWidth);
      doc.text(splitText, margin, 121);

      // Official Stamp / Signature block at bottom
      const footerY = 250;
      doc.setLineWidth(0.2);
      doc.line(margin, footerY, margin + pageWidth, footerY);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Official Certified Copy — eCourts Judicial Portal Record", margin, footerY + 6);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin + pageWidth - 60, footerY + 6);

      const safeFileName = `Court_Order_${ord.orderDate || "Date"}_${(ord.orderType || "Order").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      doc.save(safeFileName);
    } catch (err) {
      console.error("Order PDF generation error:", err);
      alert("Downloading order document...");
    }
  };

  const handleDownloadTxt = () => {
    const content = docGenEditMode ? docGenEditedContent : generatedDocContent;
    if (!content || !selectedCase) return;
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${(docGenTitle || "Doc").replace(/[^a-zA-Z0-9]/g, "_")}_Case_${selectedCase.case_no}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyContent = () => {
    const content = docGenEditMode ? docGenEditedContent : generatedDocContent;
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchCaseInvoices = async (caseNo, clientEmail) => {
    if (!caseNo && !clientEmail) return;
    setFeeLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/finance/invoices`);
      if (res.ok) {
        const data = await res.json();
        const searchNo = (caseNo || "").trim().toLowerCase();
        const searchEmail = (clientEmail || "").trim().toLowerCase();

        const matched = data.filter((inv) => {
          const invCase = (inv.case_number || "").trim().toLowerCase();
          const invEmail = (inv.email || "").trim().toLowerCase();

          // Match by exact case number (if invoice has a case number)
          const caseMatch = searchNo && invCase !== "" && invCase === searchNo;
          // Match by exact client email (if both sides have an email and no case number on invoice)
          const emailMatch = searchEmail && invEmail !== "" && invEmail === searchEmail;

          return caseMatch || emailMatch;
        });
        setCaseInvoices(matched);
      }
    } catch (e) {
      console.error("Failed to fetch case invoices:", e);
    } finally {
      setFeeLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCase?.id) {
      const caseNo = selectedCase.case_no || selectedCase.case_id || "";
      const clientEmail = selectedCase.email_id || "";
      fetchCaseInvoices(caseNo, clientEmail);
    }
  }, [selectedCase?.id]);

  const getEffectiveInvoiceStatus = (inv) => {
    const rawStatus = (inv?.status || "Pending").trim();
    const lower = rawStatus.toLowerCase();

    if (lower === "paid") {
      return "Paid";
    }

    if (inv?.created_at) {
      try {
        const createdDate = new Date(inv.created_at);
        const now = new Date();
        const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 7) {
          return "Overdue";
        }
      } catch (e) {}
    }

    return rawStatus;
  };

  // Auto-computed fee summary from real invoices
  const totalBilled = caseInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  const totalPaid = caseInvoices
    .filter((inv) => getEffectiveInvoiceStatus(inv) === "Paid")
    .reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  const totalPending = caseInvoices
    .filter((inv) => getEffectiveInvoiceStatus(inv) !== "Paid")
    .reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  const paymentStatus =
    caseInvoices.length === 0
      ? "No Invoices"
      : totalPending === 0
        ? "Fully Paid"
        : totalPaid > 0
          ? "Partially Paid"
          : "Payment Due";

  // ── Case Notes: fetch from backend ──────────────────────────────────────
  const fetchCaseNotes = async (caseId) => {
    if (!caseId) return;
    setNotesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${caseId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setCaseNotes(data);
      }
    } catch (e) {
      console.error("Failed to fetch case notes:", e);
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCase?.id) fetchCaseNotes(selectedCase.id);
  }, [selectedCase?.id]);

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newNoteText.trim(),
          category: newNoteCategory,
          author: loggedInUser?.fullName || loggedInUser?.username || "Advocate",
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setCaseNotes((prev) => [saved, ...prev]);
        setNewNoteText("");
      }
    } catch (e) {
      console.error("Failed to save note:", e);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCaseNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  };

  const fetchECourtsData = async (cnrNo) => {
    try {
      const cnr = cnrNo || selectedCase?.cnr_number || `KLER0100${String(id).padStart(6, "0")}2026`;
      const res = await fetch(`${API_BASE_URL}/api/ecourts/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ cnrNumber: cnr }),
      });
      if (res.ok) {
        const data = await res.json();
        setEcourtsData(data);
      }
    } catch (err) {
      console.error("eCourts detail fetch error:", err);
    }
  };

  const handleSyncWithECourts = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ecourts/sync/${id}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.details) {
          setEcourtsData(data.details);
          setSelectedCase((prev) => ({
            ...prev,
            case_title: data.details.caseTitle || prev?.case_title,
            court_name: data.details.courtName || prev?.court_name,
            next_hearing_date: data.details.nextHearingDate || prev?.next_hearing_date,
            status: data.details.status || prev?.status,
          }));
        }
        alert(`✨ Case synchronized with eCourts successfully!\n\nUpdated Next Hearing: ${data.details?.nextHearingDate || "Updated"}`);
      } else {
        alert("⚠️ Failed to sync with eCourts.");
      }
    } catch (err) {
      alert("❌ Sync error.");
    } finally {
      setSyncLoading(false);
    }
  };

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      // 1. Fetch case details (auth token lets backend apply owner-level filter)
      let response = await fetch(`${API_BASE_URL}/case-management/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok && response.status === 404) {
        response = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/${id}`, {
          headers: getAuthHeaders(),
        });
      }
      if (!response.ok) {
        throw new Error("Case not found");
      }
      const rawCase = await response.json();

      // ── Confidential vault gate (Always require password entry) ──
      if (rawCase.is_confidential) {
        setVaultUnlocked(false);
        setShowVaultModal(true);
      }

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
      fetchECourtsData(rawCase.cnr_number);
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
      setVaultUnlocked(false);
      clearVaultSession(id);
      fetchCaseDetails();
      fetchAdvocates();
    }
    return () => {
      if (id) clearVaultSession(id);
    };
  }, [id]);

  // Vault modal rendering — shown before the rest of the detail view
  if (showVaultReset) {
    return (
      <VaultResetModal
        caseId={id}
        onBack={() => { setShowVaultReset(false); setShowVaultModal(true); }}
        onResetSuccess={() => { setShowVaultReset(false); setShowVaultModal(true); }}
      />
    );
  }

  if (showVaultModal && selectedCase?.is_confidential && !vaultUnlocked) {
    return (
      <VaultPasswordModal
        caseId={id}
        caseTitle={selectedCase?.case_title}
        onSuccess={(token) => {
          setVaultSession(id, token);
          setVaultUnlocked(true);
          setShowVaultModal(false);
        }}
        onForgotPassword={() => { setShowVaultModal(false); setShowVaultReset(true); }}
      />
    );
  }

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

  const hearingAlert = getHearingAlertInfo(
    ecourtsData?.nextHearingDate || selectedCase?.next_hearing_date || selectedCase?.nextHearingDate,
    selectedCase?.status
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-500 relative">
      {/* Top-Right Floating Sleek Red Hearing Alert Badge (Outside Header & Tabs) */}
      {hearingAlert && (
        <div className="flex justify-end w-full -mb-2.5 z-50 relative">
          <style jsx>{`
            @keyframes badgePulse {
              0%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.3); }
              50% { transform: scale(1.15); box-shadow: 0 20px 25px -5px rgba(220, 38, 38, 0.55); }
            }
            .animate-badge-focus {
              animation: badgePulse 1.6s ease-in-out infinite;
            }
          `}</style>
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2.5 rounded-2xl border border-red-500 shadow-xl shadow-red-600/30 animate-badge-focus cursor-pointer z-50">
            {/* Live Status Radar Ping Dot */}
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] text-red-100 font-extrabold tracking-widest uppercase">
                {hearingAlert.type === "past" ? "HEARING DATE PASSED" : "NEXT HEARING ALERT"}
              </span>
              <span className="text-xs sm:text-sm font-black tracking-wide text-white flex items-center gap-2">
                {hearingAlert.dateFormatted}
                {hearingAlert.daysText && (
                  <span className="text-[10px] font-black bg-white text-red-700 px-2 py-0.5 rounded-md uppercase shadow-xs">
                    {hearingAlert.daysText}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Page Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-4 sm:p-5 md:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full">
          <button
            onClick={() => router.push("/case-management")}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer flex items-center justify-center shrink-0"
            title="Back to Case List"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-[#0F172A] tracking-tight leading-snug break-words">
              {ecourtsData?.caseTitle || selectedCase.case_title}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5 font-mono uppercase tracking-wider">
              Case #{selectedCase.case_no}
            </p>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row xl:flex-row items-start sm:items-center xl:items-center gap-3 w-full xl:w-auto shrink-0 flex-wrap justify-end">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:flex-wrap items-center gap-2 w-full xl:w-auto shrink-0">
            {/* AI Strategic Tools Group */}
            <button
              id="btn-view-summary-header"
              onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem(`saved_briefs_${selectedCase.id}`) || "[]");
                  if (saved && saved.length > 0) {
                    setViewBriefModal(saved[0]);
                  } else {
                    router.push(`/case-management/similar-cases/${selectedCase.id}`);
                  }
                } catch (e) {
                  router.push(`/case-management/similar-cases/${selectedCase.id}`);
                }
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs hover:shadow active:scale-95 cursor-pointer text-center min-w-0"
            >
              <Eye size={14} className="shrink-0" />
              <span className="truncate">View Summary</span>
            </button>

            <button
              id="btn-similar-cases-header"
              onClick={() => router.push(`/case-management/similar-cases/${selectedCase.id}`)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-xs font-extrabold transition shadow-xs hover:shadow active:scale-95 cursor-pointer text-center min-w-0"
            >
              <Search size={14} className="shrink-0" />
              <span className="truncate">View Similar Cases</span>
            </button>

            <button
              onClick={() => router.push(`/lawfirm-management/assign-advocate?directCaseId=${selectedCase.id}`)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs hover:shadow active:scale-95 cursor-pointer text-center min-w-0"
            >
              <UserCheck size={14} className="shrink-0" />
              <span className="truncate">Direct Assign</span>
            </button>

            {/* Management Tools Group */}
            {hasPermission("Case Management", "edit") && (
              <button
                onClick={() => router.push(`/case-management/edit/${selectedCase.id}`)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shadow-2xs text-center min-w-0"
              >
                <Pencil size={13} className="text-slate-500 shrink-0" /> Edit
              </button>
            )}

            {hasPermission("Case Management", "delete") && (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer shadow-2xs text-center min-w-0"
              >
                <Trash2 size={13} className="shrink-0" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] overflow-hidden flex flex-col min-h-[500px]">
        {/* Tabs Section (Mobile Dropdown Select + Desktop Horizontal Tabs) */}
        <div className="border-b border-[#F1F5F9] bg-[#F8FAFC] p-2.5 sm:p-3">
          {/* Mobile View: Dropdown Select Menu (< 640px) */}
          <div className="block sm:hidden">
            <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1">
              Select View Section:
            </label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-black text-[#0F172A] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
            >
              {[
                { key: "overview", label: "📋 Overview" },
                { key: "documents", label: "📁 Documents" },
                { key: "timeline", label: "⏳ Timeline" },
                { key: "hearings", label: "⚖️ eCourts Hearings" },
                { key: "orders", label: "📜 Orders & Judgments" },
                { key: "notes", label: "📝 Advocate Notes" },
                { key: "fees", label: "💳 Billing" },
                { key: "generate_doc", label: "✨ Generate Document" },
              ].map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop/Tablet View: Horizontal Tab Bar (>= 640px) */}
          <div className="hidden sm:flex overflow-x-auto no-scrollbar gap-1 sm:gap-1.5 scroll-smooth">
            {[
              { key: "overview", label: "Overview" },
              { key: "documents", label: "Documents" },
              { key: "timeline", label: "Timeline" },
              { key: "hearings", label: "eCourts Hearings" },
              { key: "orders", label: "Orders & Judgments" },
              { key: "notes", label: "Advocate Notes" },
              { key: "fees", label: "Billing" },
              { key: "generate_doc", label: "✨ Generate Document" },
            ].map((tabObj) => (
              <button
                key={tabObj.key}
                onClick={() => setActiveTab(tabObj.key)}
                className={`px-3.5 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer rounded-xl whitespace-nowrap shrink-0 ${activeTab === tabObj.key
                    ? "text-[#2563EB] bg-white shadow-sm font-extrabold border border-slate-200"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100/50"
                  }`}
              >
                {tabObj.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">

              {/* Status row with editable dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={selectedCase.status} />
                  <span className="text-xs text-[#94A3B8] font-semibold tracking-wide uppercase">
                    {selectedCase.case_type && selectedCase.case_type.includes(": ")
                      ? selectedCase.case_type.replace(": ", " · ")
                      : selectedCase.case_type} · {selectedCase.court_type}
                  </span>
                </div>
                {/* Inline status change */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-between sm:justify-end">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Update Status:</label>
                  {((selectedCase.status || "").toLowerCase().includes("disposed")) ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs">
                      🔒 Disposed (Status Locked)
                    </span>
                  ) : (
                    <select
                      value={selectedCase.status || "Active"}
                      disabled={statusUpdating}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        setStatusUpdating(true);
                        try {
                          const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: newStatus }),
                          });
                          if (res.ok) {
                            setSelectedCase((prev) => ({ ...prev, status: newStatus }));
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(new Event("caseStatusUpdated"));
                              try {
                                localStorage.setItem("lastStatusUpdate", Date.now().toString());
                              } catch (err) {}
                            }
                          } else {
                            const errData = await res.json().catch(() => ({}));
                            alert(errData.detail || "Failed to update status");
                          }
                        } catch (err) {
                          console.error("Status update failed:", err);
                        } finally {
                          setStatusUpdating(false);
                        }
                      }}
                      className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {(() => {
                        const fixedStatuses = [
                          "Active",
                          "Client Consulting",
                          "Client Detail Collection",
                          "Document Pending",
                          "Document Verified",
                          "Advocate Assigned",
                          "Under Review",
                          "In Progress",
                          "Pending",
                          "Won",
                          "Lost",
                          "On Hold",
                          "Disposed",
                        ];
                        const currentStatus = selectedCase.status || "Active";
                        const allStatuses = fixedStatuses.includes(currentStatus)
                          ? fixedStatuses
                          : [currentStatus, ...fixedStatuses];
                        return allStatuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ));
                      })()}
                    </select>
                  )}
                  {statusUpdating && <span className="text-[11px] text-blue-500 font-bold animate-pulse">Saving…</span>}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#F1F5F9] space-y-4">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Case Details</h4>
                  <InfoRow icon={<Hash size={14} />} label="CNR Number" value={selectedCase.cnr_number} />
                  <InfoRow icon={<Hash size={14} />} label="Client ID" value={selectedCase.client_id || selectedCase.case_id} />
                  <InfoRow
                    icon={<Scale size={14} />}
                    label="Case Type"
                    value={
                      selectedCase.case_type && selectedCase.case_type.includes(": ")
                        ? selectedCase.case_type.replace(": ", " · ")
                        : selectedCase.case_type
                    }
                  />
                  <InfoRow
                    icon={<Clock size={14} />}
                    label="Next Hearing Date"
                    value={
                      hearingAlert ? (
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#0F172A]">{hearingAlert.dateFormatted}</span>
                          {hearingAlert.daysText && (
                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${hearingAlert.badgeClass}`}>
                              {hearingAlert.daysText}
                            </span>
                          )}
                        </span>
                      ) : (
                        selectedCase.next_hearing_date || "To be scheduled"
                      )
                    }
                  />
                </div>
                <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#F1F5F9] space-y-4">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Court Information</h4>
                  <InfoRow icon={<Building2 size={14} />} label="Court Name" value={selectedCase.court_name} />
                  <InfoRow icon={<Gavel size={14} />} label="Court Type" value={selectedCase.court_type} />
                  <InfoRow
                    icon={<MapPin size={14} />}
                    label="State / UT"
                    value={
                      selectedCase.state ||
                      selectedCase.client_state ||
                      findStateAndDistrictByCourt(selectedCase.court_name || selectedCase.client_district || "").state ||
                      "Kerala"
                    }
                  />
                </div>
                <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#F1F5F9] space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Client Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoRow icon={<User size={14} />} label="Client Name" value={isJuniorAdvocate && isSensitiveCase(selectedCase) ? "Confidential (Restricted)" : selectedCase.client_name} />
                    <InfoRow icon={<Phone size={14} />} label="Contact Number" value={isJuniorAdvocate && isSensitiveCase(selectedCase) ? "Confidential (Restricted)" : selectedCase.contact_number} />
                    <InfoRow icon={<Mail size={14} />} label="Email Address" value={isJuniorAdvocate && isSensitiveCase(selectedCase) ? "Confidential (Restricted)" : selectedCase.email_id} />
                    <InfoRow icon={<MapPin size={14} />} label="District / Location" value={selectedCase.client_district || findStateAndDistrictByCourt(selectedCase.court_name || "").district || "—"} />
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
                      <div className="bg-[#FFFBEB] border border-amber-100 rounded-2xl p-4 sm:p-5">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText size={13} /> Facts
                        </h4>
                        <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">
                          {facts}
                        </p>
                      </div>
                    )}

                    {issues && (
                      <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 sm:p-5">
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

              {/* Parties & Legal Representatives Section */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
                  <div>
                    <h3 className="font-extrabold text-lg text-[#0F172A]">Parties & Legal Representatives</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">Comprehensive overview of petitioner, respondent, opposing counsel, and bench officer.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
                    {ecourtsData?.actSection && (
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200">
                        Act: {ecourtsData.actSection}
                      </span>
                    )}
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                      CNR: {selectedCase.cnr_number || "N/A"}
                    </span>
                  </div>
                </div>

                {/* VS Layout Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Petitioner Side Card */}
                  <div className="bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] rounded-2xl p-5 sm:p-6 border border-[#BAE6FD] space-y-4 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#0284C7] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                      Petitioner Side
                    </div>
                    <div className="flex items-center gap-3 mb-2 pr-24">
                      <div className="w-10 h-10 rounded-xl bg-[#0284C7] text-white flex items-center justify-center font-bold shrink-0">
                        <User size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#0369A1] uppercase tracking-wider">Client / Petitioner</p>
                        <h4 className="text-base font-extrabold text-[#0F172A] truncate">
                          {selectedCase.client_name || ecourtsData?.petitioner || "Petitioner"}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#B9E6FE]">
                      <div className="bg-white/80 rounded-xl p-3.5 border border-sky-100">
                        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Petitioner Role</p>
                        <p className="text-xs font-bold text-[#0F172A] mt-0.5">{selectedCase.client_role || "Petitioner / Complainant"}</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-3.5 border border-sky-100">
                        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Petitioner Advocate / Legal Counsel</p>
                        <p className="text-xs font-bold text-[#0284C7] mt-0.5">
                          {ecourtsData?.petitionerAdvocate || selectedCase.selected_advocate || "Advocate (On Record)"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Respondent Side Card */}
                  <div className="bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] rounded-2xl p-5 sm:p-6 border border-[#FDBA74] space-y-4 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#EA580C] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                      Respondent Side
                    </div>
                    <div className="flex items-center gap-3 mb-2 pr-24">
                      <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center font-bold shrink-0">
                        <User size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider">Respondent / Opposing Party</p>
                        <h4 className="text-base font-extrabold text-[#0F172A] truncate">
                          {ecourtsData?.respondent || (selectedCase.case_title ? selectedCase.case_title.split(/ vs\.? | v\.? /i)[1] : "") || "State / Respondent"}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#FED7AA]">
                      <div className="bg-white/80 rounded-xl p-3.5 border border-orange-100">
                        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Respondent Role</p>
                        <p className="text-xs font-bold text-[#0F172A] mt-0.5">Respondent / Accused Party</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-3.5 border border-orange-100">
                        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Respondent Advocate / Opposing Counsel</p>
                        <p className="text-xs font-bold text-[#C2410C] mt-0.5">
                          {ecourtsData?.respondentAdvocate || "Government Pleader / Opposing Counsel"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Presiding Judicial Officer Card */}
                <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                      <Gavel size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Presiding Judicial Officer</p>
                      <h5 className="text-sm font-extrabold text-[#0F172A]">
                        {ecourtsData?.presidingJudge || "Hon'ble Presiding Judge"}
                      </h5>
                      <p className="text-xs text-[#64748B] mt-0.5">{selectedCase.court_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Previous Similar Case History ──────────────────── */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50/50 to-violet-50/30 border border-indigo-200 rounded-2xl p-5 sm:p-6 shadow-sm mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                      <BookOpen size={18} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-indigo-900 text-sm">Previous Similar Case History</h4>
                      <p className="text-xs text-indigo-600 mt-0.5">
                        View real comparable cases from our firm &amp; live eCourts database — with AI-powered win/loss analysis, loopholes, and key sections.
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-similar-cases"
                    onClick={() => router.push(`/case-management/similar-cases/${selectedCase.id}`)}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-xs font-extrabold transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer w-full sm:w-auto shrink-0"
                  >
                    <Search size={14} />
                    View Similar Cases
                  </button>
                </div>

                {/* Quick stats preview */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-indigo-200/60">
                  {[
                    { label: "Case Type", value: selectedCase.case_type || "—", color: "text-indigo-800" },
                    { label: "Court", value: selectedCase.court_name || "—", color: "text-purple-800" },
                    { label: "Status", value: selectedCase.status || "Active", color: "text-violet-800" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/70 rounded-xl p-3 border border-indigo-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className={`text-xs font-extrabold mt-0.5 ${item.color} truncate`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Saved / Downloaded Strategic Briefs Section */}
                {(() => {
                  if (typeof window === "undefined") return null;
                  try {
                    const savedBriefs = JSON.parse(localStorage.getItem(`saved_briefs_${selectedCase.id}`) || "[]");
                    if (!savedBriefs || savedBriefs.length === 0) return null;

                    return (
                      <div className="pt-4 border-t border-indigo-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={14} className="text-indigo-600" />
                            Downloaded AI Strategic Briefs ({savedBriefs.length})
                          </h5>
                          <span className="text-[10px] font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                            Saved in History
                          </span>
                        </div>
                        <div className="space-y-2">
                          {savedBriefs.slice(0, 3).map((brief, bIdx) => (
                            <div key={bIdx} className="bg-white rounded-xl p-3.5 border border-indigo-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-900 truncate">📜 {brief.fileName}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Downloaded: <span className="font-semibold text-slate-700">{brief.downloadedAt}</span> · Win Likelihood: <span className="font-extrabold text-emerald-600">{brief.winProbability}%</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setViewBriefModal(brief)}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Eye size={13} /> View Summary
                                </button>
                                <button
                                  onClick={() => {
                                    const element = document.createElement("a");
                                    const file = new Blob([brief.fileContent], { type: "text/plain;charset=utf-8" });
                                    element.href = URL.createObjectURL(file);
                                    element.download = brief.fileName;
                                    document.body.appendChild(element);
                                    element.click();
                                    document.body.removeChild(element);
                                  }}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Download size={13} /> Download File
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } catch (e) {
                    return null;
                  }
                })()}
              </div>
            </div>
          )}

          {/* TAB: DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* Case summary strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-4 border-b border-[#F1F5F9]">
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Case Title</p>
                  <p className="text-sm font-bold text-[#0F172A] mt-0.5 truncate">{ecourtsData?.caseTitle || selectedCase.case_title}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Client ID</p>
                  <p className="text-sm font-bold text-[#7C3AED] mt-0.5 font-mono truncate">{selectedCase.client_id || selectedCase.case_id || selectedCase.case_no}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Court</p>
                  <p className="text-sm font-bold text-[#0F172A] mt-0.5 truncate">{selectedCase.court_name}</p>
                </div>
                <div className="flex items-center sm:justify-end bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
                  <StatusBadge status={selectedCase.status} />
                </div>
              </div>

              {/* Assign to Junior Advocate */}
              <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
                    <UserCheck size={15} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1E40AF] text-sm">Assign to Junior Advocate</h4>
                    <p className="text-xs text-[#3B82F6]">This case will appear on the junior advocate&apos;s assigned cases page</p>
                  </div>
                </div>

                {selectedCase.selected_advocate ? (
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        {selectedCase.selected_advocate.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider leading-none">Assigned Junior Advocate</p>
                        <p className="text-sm font-bold text-[#1E40AF] mt-0.5 truncate">{selectedCase.selected_advocate}</p>
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
                      className="text-xs font-bold text-[#2563EB] hover:text-[#1d4ed8] bg-white border border-[#BFDBFE] px-3 py-1.5 rounded-lg hover:shadow-xs transition cursor-pointer self-start sm:self-auto"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={assignedAdvocate}
                      onChange={(e) => setAssignedAdvocate(e.target.value)}
                      className="flex-1 rounded-xl border border-[#BFDBFE] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition w-full"
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
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Send size={14} />
                      {assignLoading ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                )}
              </div>

              {/* OCR Extract Text from Document */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                <OCRPanel caseId={selectedCase?.id} onSaveToDocuments={handleSaveOcrToCaseDocuments} />
              </div>

              {/* Documents list table */}
              {selectedCase.documents && selectedCase.documents.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-x-auto">
                  <table className="w-full min-w-[650px]">
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
                          <td className="py-4 px-5 font-semibold text-slate-700">
                            <button
                              type="button"
                              onClick={() => setViewingDocument(doc)}
                              className="flex items-center gap-2 text-left font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors cursor-pointer group"
                              title="Click to view document content"
                            >
                              <FileText size={15} className="text-[#94A3B8] group-hover:text-[#2563EB] shrink-0" />
                              <span className="underline decoration-slate-200 underline-offset-4 group-hover:decoration-[#2563EB]">
                                {doc.file || "Unnamed File"}
                              </span>
                            </button>
                          </td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              {doc.documentType && doc.documentType.includes(": ")
                                ? doc.documentType.split(": ")[1]
                                : doc.documentType || "Other"}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1 min-w-[180px]">
                                  <input
                                    type={showPasswordIdx === idx ? "text" : "password"}
                                    placeholder="Enter 6-digit PIN"
                                    value={doc.password || ""}
                                    maxLength={6}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      handleDocPasswordChange(idx, val);
                                    }}
                                    className={`w-full rounded-xl border px-3.5 py-2 pr-9 text-xs sm:text-sm font-mono tracking-[0.3em] text-[#0F172A] placeholder:font-sans placeholder:tracking-normal placeholder:text-xs focus:outline-none focus:ring-2 transition ${doc.password && doc.password.length > 0 && doc.password.length < 6
                                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                        : "border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                                      }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswordIdx(showPasswordIdx === idx ? null : idx)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer flex items-center justify-center"
                                    title={showPasswordIdx === idx ? "Hide PIN" : "Show PIN"}
                                  >
                                    {showPasswordIdx === idx ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </div>
                                {doc.password && doc.password.length === 6 ? (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                      Set
                                    </span>
                                    <button
                                      onClick={() => handleDocPasswordChange(idx, "")}
                                      className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 px-2 py-0.5 rounded-full transition cursor-pointer"
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
                            <div className="flex items-center gap-2">
                              {/* View Button */}
                              <button
                                type="button"
                                onClick={() => setViewingDocument(doc)}
                                title="View document content"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition cursor-pointer"
                              >
                                <Eye size={13} />
                                View
                              </button>

                              {/* Assign Button */}
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

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCaseDocument(idx)}
                                title="Delete document from case"
                                className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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

          {/* TAB: TIMELINE */}
          {activeTab === "timeline" && (
            <CaseTimelineView
              selectedCase={selectedCase}
              events={timelineEvents}
              loading={timelineLoading}
              selectedEvent={selectedTimelineEvent}
              onSelectEvent={setSelectedTimelineEvent}
              onRefresh={() => fetchTimelineEvents(selectedCase.id)}
              onViewDocument={setViewingDocument}
            />
          )}

          {/* TAB: ECOURTS HEARINGS & TIMELINE */}
          {activeTab === "hearings" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Official eCourts Timeline</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    CNR: {selectedCase.cnr_number || "KLER010045212026"} • Next Hearing: {selectedCase.next_hearing_date || "To be scheduled"}
                  </p>
                </div>
                <button
                  onClick={handleSyncWithECourts}
                  disabled={syncLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 w-full sm:w-auto shrink-0"
                >
                  {syncLoading ? "Syncing..." : "Sync eCourts Now"}
                </button>
              </div>

              {/* Timeline Items */}
              {ecourtsData?.timeline && ecourtsData.timeline.length > 0 ? (
                <div className="relative pl-7 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {ecourtsData.timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[27px] sm:-left-[29px] top-1 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center text-xs font-bold ${item.status === "Completed" ? "border-emerald-500 text-emerald-600" : "border-blue-500 text-blue-600 animate-pulse"}`}>
                        {idx + 1}
                      </span>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 self-start">
                            {item.eventStage}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{item.eventDate}</span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 mt-2">{item.title}</h5>
                        <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-2">Bench: {item.benchName} ({item.courtHall})</p>
                        {item.documentUrl && (
                          <div className="mt-3">
                            <a
                              href={item.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <Download size={12} /> Download Hearing Order PDF
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
                  No live eCourts timeline milestones available yet for CNR Number {selectedCase.cnr_number || "this case"}.
                </div>
              )}
            </div>
          )}





          {/* TAB: ORDERS & JUDGMENTS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <div>
                  <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Gavel size={16} className="text-purple-600" /> Official Court Orders &amp; Judgment Documents
                  </h4>
                  <p className="text-xs text-purple-700 mt-0.5">
                    CNR: {selectedCase.cnr_number || "N/A"} • Download interim orders, daily hearing judgments, and court records fetched via eCourts.
                  </p>
                </div>
                <button
                  onClick={handleSyncWithECourts}
                  disabled={syncLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {syncLoading ? "Syncing..." : "Sync eCourts Now"}
                </button>
              </div>

              {ecourtsData?.orders && ecourtsData.orders.length > 0 ? (
                <div className="w-full overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3.5 px-4">Order Date</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Presiding Judge</th>
                        <th className="py-3.5 px-4">Order Summary / Judgment</th>
                        <th className="py-3.5 px-4 text-right">Download PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {[...ecourtsData.orders]
                        .sort((a, b) => (b.orderDate || "").localeCompare(a.orderDate || ""))
                        .map((ord, idx) => (
                          <tr key={ord.id || idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{ord.orderDate || "N/A"}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                {ord.orderType || "Court Order"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">{ord.judgeName || "Hon'ble Presiding Judge"}</td>
                            <td className="py-3.5 px-4 max-w-xs">{ord.summary || "Court judgment document"}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDownloadOrderPDF(ord)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                              >
                                <Download size={12} /> PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium space-y-2">
                  <Gavel size={24} className="mx-auto text-slate-400" />
                  <p className="font-bold text-slate-700">No judgment or court order documents uploaded yet for this CNR.</p>
                  <p className="text-slate-500 text-[11px]">Click "Sync eCourts Now" to fetch latest daily orders and signed judgment files.</p>
                </div>
              )}
            </div>
          )}





          {/* TAB: ADVOCATE NOTES & TASKS */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="font-extrabold text-lg text-[#0F172A]">Advocate Notes & Internal Tasks</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Private internal case notes and action items for advocates and firm team.</p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200 self-start sm:self-auto shrink-0">
                  {caseNotes.length} Note{caseNotes.length !== 1 ? "s" : ""} Recorded
                </span>
              </div>

              {/* New Note Form Card */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] space-y-4">
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <Pencil size={14} className="text-[#2563EB]" /> Add Internal Case Note
                </h4>
                <textarea
                  placeholder="Type internal case instructions, task details, or hearing preparation notes..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition resize-y min-h-[90px]"
                />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs font-bold text-[#64748B] shrink-0">Priority / Tag:</label>
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] flex-1 sm:flex-none"
                    >
                      <option value="Action Item">🔴 Urgent / Action Item</option>
                      <option value="Hearing Prep">🟡 Hearing Prep</option>
                      <option value="Client Call">🟢 Client Call</option>
                      <option value="General Note">🔵 General Note</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNoteText.trim() || noteSaving}
                    className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm w-full sm:w-auto shrink-0"
                  >
                    <Send size={13} /> {noteSaving ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>

              {/* Notes Feed */}
              <div className="space-y-3">
                {notesLoading ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium animate-pulse">
                    Loading advocate notes…
                  </div>
                ) : caseNotes.length > 0 ? (
                  caseNotes.map((note) => {
                    const formattedDate = note.created_at
                      ? new Date(note.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : note.date || "—";
                    return (
                      <div key={note.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-2 relative group hover:border-blue-200 transition">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${note.category === "Action Item"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : note.category === "Hearing Prep"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : note.category === "Client Call"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                            >
                              {note.category}
                            </span>
                            <span className="text-[11px] text-[#94A3B8] font-semibold">{formattedDate}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1 rounded-lg hover:bg-red-50 shrink-0"
                            title="Delete note"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        <p className="text-[11px] text-[#64748B] font-medium pt-1 border-t border-slate-100 flex items-center gap-1">
                          <User size={11} /> Logged by: <span className="font-bold text-[#0F172A]">{note.author || "Advocate"}</span>
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
                    No internal advocate notes logged yet for this case. Use the box above to record task notes!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: FEE & BILLING */}
          {activeTab === "fees" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="font-extrabold text-lg text-[#0F172A]">Fee & Billing Overview</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Real billing data from Finance Management — invoices matched for case <span className="font-bold text-[#0F172A]">{selectedCase.case_no || selectedCase.case_id}</span>.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${paymentStatus === "Fully Paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : paymentStatus === "Partially Paid"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : paymentStatus === "No Invoices"
                            ? "bg-slate-50 text-slate-500 border-slate-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                  >
                    {paymentStatus === "Fully Paid" && "🟢 "}
                    {paymentStatus === "Partially Paid" && "🟡 "}
                    {paymentStatus === "Payment Due" && "🔴 "}
                    {paymentStatus === "No Invoices" && "⚪ "}
                    {paymentStatus}
                  </span>
                  <button
                    onClick={() => {
                      const clientName = selectedCase?.client_name || "";
                      const caseNo = selectedCase?.case_no || selectedCase?.case_id || "";
                      const mobile = selectedCase?.contact_number || selectedCase?.mobile || "";
                      const email = selectedCase?.email_id || selectedCase?.email || "";
                      const caseType = selectedCase?.case_type || "";
                      const caseId = selectedCase?.id || "";
                      router.push(
                        `/finance-management?client_name=${encodeURIComponent(clientName)}&case_no=${encodeURIComponent(caseNo)}&mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}&case_type=${encodeURIComponent(caseType)}&from_case=true&case_id=${encodeURIComponent(caseId)}`
                      );
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    + Add Invoice
                  </button>
                  <button
                    onClick={() => {
                      const caseNo = selectedCase.case_no || selectedCase.case_id || "";
                      const clientEmail = selectedCase.email_id || "";
                      fetchCaseInvoices(caseNo, clientEmail);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                    title="Refresh"
                  >
                    {feeLoading ? "Refreshing..." : "↻ Refresh"}
                  </button>
                </div>
              </div>

              {feeLoading ? (
                <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">Loading billing data…</div>
              ) : (
                <>
                  {/* 3 Summary Financial Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                    {/* Total Invoiced */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                      <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2">Total Invoiced</p>
                      <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-900">
                        ₹{totalBilled.toLocaleString("en-IN")}
                      </h4>
                      <p className="text-[11px] text-blue-600/80 font-medium mt-2">
                        {caseInvoices.length} invoice{caseInvoices.length !== 1 ? "s" : ""} raised for this case
                      </p>
                    </div>

                    {/* Total Paid */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                      <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Amount Received</p>
                      <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-900">
                        ₹{totalPaid.toLocaleString("en-IN")}
                      </h4>
                      <p className="text-[11px] text-emerald-600/80 font-medium mt-2">
                        {caseInvoices.filter((inv) => inv.status === "Paid").length} paid invoice{caseInvoices.filter((inv) => inv.status === "Paid").length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Pending Balance */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs sm:col-span-2 md:col-span-1">
                      <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2">Pending / Due</p>
                      <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-900">
                        ₹{totalPending.toLocaleString("en-IN")}
                      </h4>
                      <p className="text-[11px] text-amber-600/80 font-medium mt-2">
                        {caseInvoices.filter((inv) => inv.status !== "Paid").length} outstanding invoice{caseInvoices.filter((inv) => inv.status !== "Paid").length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Invoice Records Table */}
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Invoice Records from Billing</h4>
                      <span className="text-xs font-bold text-slate-500">{caseInvoices.length} Invoice{caseInvoices.length !== 1 ? "s" : ""}</span>
                    </div>
                    {caseInvoices.length > 0 ? (
                      <>
                        {/* MOBILE CARDS VIEW (No horizontal scroll) */}
                        <div className="block sm:hidden divide-y divide-slate-100 p-3 space-y-3">
                          {caseInvoices
                            .slice(billingPage * billingPageSize, (billingPage + 1) * billingPageSize)
                            .map((inv) => {
                              const createdDate = inv.created_at
                                ? new Date(inv.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                : "—";
                              const effectiveStatus = getEffectiveInvoiceStatus(inv);
                              const statusColor =
                                effectiveStatus === "Paid"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : effectiveStatus === "Overdue"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : effectiveStatus === "Sent"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200";
                              return (
                                <div key={inv.id} className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-blue-600 text-xs">INV-{String(inv.id).padStart(4, "0")}</span>
                                      <span className="text-[11px] text-slate-500 font-medium">• {createdDate}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                      {effectiveStatus}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Client</span>
                                      <span className="text-xs font-semibold text-slate-800">{inv.client_name || "—"}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Grand Total</span>
                                      <span className="text-sm font-black text-slate-900">₹{Number(inv.grand_total || 0).toLocaleString("en-IN")}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* TABLET & DESKTOP TABLE VIEW (Full width, No horizontal scroll) */}
                        <div className="hidden sm:block w-full">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Invoice #</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3 text-right">Grand Total (₹)</th>
                                <th className="px-4 py-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {caseInvoices
                                .slice(billingPage * billingPageSize, (billingPage + 1) * billingPageSize)
                                .map((inv) => {
                                  const createdDate = inv.created_at
                                    ? new Date(inv.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                    : "—";
                                  const effectiveStatus = getEffectiveInvoiceStatus(inv);
                                  const statusColor =
                                    effectiveStatus === "Paid"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : effectiveStatus === "Overdue"
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : effectiveStatus === "Sent"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200";
                                  return (
                                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                                      <td className="px-4 py-3.5 font-bold text-blue-600 whitespace-nowrap">INV-{String(inv.id).padStart(4, "0")}</td>
                                      <td className="px-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">{createdDate}</td>
                                      <td className="px-4 py-3.5 text-slate-800 font-semibold">{inv.client_name || "—"}</td>
                                      <td className="px-4 py-3.5 text-right font-black text-slate-800 whitespace-nowrap">
                                        ₹{Number(inv.grand_total || 0).toLocaleString("en-IN")}
                                      </td>
                                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor}`}>
                                          {effectiveStatus}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>

                        {caseInvoices.length > billingPageSize && (() => {
                          const totalInvoices = caseInvoices.length;
                          const totalPages = Math.ceil(totalInvoices / billingPageSize);
                          const startIdx = billingPage * billingPageSize + 1;
                          const endIdx = Math.min((billingPage + 1) * billingPageSize, totalInvoices);

                          return (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[#E2E8F0] bg-white rounded-b-2xl">
                              <span className="text-xs text-[#64748B] font-semibold text-center sm:text-left">
                                Showing <span className="font-bold text-[#0F172A]">{startIdx}</span> to <span className="font-bold text-[#0F172A]">{endIdx}</span> of <span className="font-bold text-[#0F172A]">{totalInvoices}</span> invoices
                              </span>
                              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-full">
                                <button
                                  onClick={() => setBillingPage((p) => Math.max(0, p - 1))}
                                  disabled={billingPage === 0}
                                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                                >
                                  &lt; Prev
                                </button>

                                {Array.from({ length: totalPages }, (_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setBillingPage(idx)}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                      billingPage === idx
                                        ? "bg-[#2563EB] text-white border-[#2563EB]"
                                        : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                                    }`}
                                  >
                                    {idx + 1}
                                  </button>
                                ))}

                                <button
                                  onClick={() => setBillingPage((p) => Math.min(totalPages - 1, p + 1))}
                                  disabled={billingPage >= totalPages - 1}
                                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                                >
                                  Next &gt;
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="p-8 sm:p-10 text-center bg-slate-50">
                        <p className="text-slate-500 text-sm font-semibold mb-2">No billing invoices found for this case</p>
                        <p className="text-slate-400 text-xs mb-4">
                          Go to Finance Management → Billing and create an invoice with case number <span className="font-bold text-slate-600">{selectedCase.case_no || selectedCase.case_id}</span> to see it here.
                        </p>
                        <button
                          onClick={() => {
                            const clientName = selectedCase?.client_name || "";
                            const caseNo = selectedCase?.case_no || selectedCase?.case_id || "";
                            const mobile = selectedCase?.contact_number || selectedCase?.mobile || "";
                            const email = selectedCase?.email_id || selectedCase?.email || "";
                            const caseType = selectedCase?.case_type || "";
                            const caseId = selectedCase?.id || "";
                            router.push(
                              `/finance-management?client_name=${encodeURIComponent(clientName)}&case_no=${encodeURIComponent(caseNo)}&mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}&case_type=${encodeURIComponent(caseType)}&from_case=true&case_id=${encodeURIComponent(caseId)}`
                            );
                          }}
                          className="px-5 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
                        >
                          Go to Finance & Billing →
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: SIMILAR PRECEDENTS */}
          {activeTab === "similar_cases" && selectedCase && (
            <div className="space-y-6">
              <SimilarCasesClient caseId={selectedCase.id} />
            </div>
          )}

          {/* TAB: GENERATE DOCUMENT FOR THIS CASE */}
          {activeTab === "generate_doc" && selectedCase && (
            <div className="space-y-6">
              {/* Header Context Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#0F172A] text-base">
                      AI Legal Document Generator
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Generating document specifically for <span className="font-bold text-[#0F172A]">{selectedCase.case_title}</span> (Case #{selectedCase.case_no})
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-slate-200">
                  <span className="px-2 py-1 bg-slate-100 rounded-md">CNR: {selectedCase.cnr_number || "N/A"}</span>
                  <span className="px-2 py-1 bg-slate-100 rounded-md">Court: {selectedCase.court_name || "N/A"}</span>
                  <span className="px-2 py-1 bg-slate-100 rounded-md">Client: {selectedCase.client_name || "N/A"}</span>
                </div>
              </div>

              {/* Document Generation Input Box & Presets */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                    Select Template / Document Type Quick Presets:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "📜 Bail Application", prompt: `Draft an urgent Bail Application for case #${selectedCase.case_no} (${selectedCase.case_title}) pending before ${selectedCase.court_name}.` },
                      { label: "⚖️ Written Statement", prompt: `Draft a Written Statement / Reply for case #${selectedCase.case_no} (${selectedCase.case_title}) on behalf of client ${selectedCase.client_name}.` },
                      { label: "📢 Legal Notice", prompt: `Draft a Legal Notice for case #${selectedCase.case_no} (${selectedCase.case_title}) concerning ${selectedCase.case_description || "legal dispute"}.` },
                      { label: "📄 Affidavit", prompt: `Draft a sworn Affidavit for client ${selectedCase.client_name} in case #${selectedCase.case_no} (${selectedCase.case_title}) before ${selectedCase.court_name}.` },
                      { label: "🏛️ Writ Petition", prompt: `Draft a Writ Petition for case #${selectedCase.case_no} (${selectedCase.case_title}) under appropriate constitutional / legal jurisdiction.` },
                      { label: "📝 Case Summary & Arguments", prompt: `Generate a comprehensive Case Summary and Legal Arguments overview for case #${selectedCase.case_no} (${selectedCase.case_title}).` }
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => {
                          setDocGenPrompt(preset.prompt);
                          handleGenerateCaseDocument(preset.prompt, preset.label.replace(/^[^a-zA-Z0-9]+/, "").trim());
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-blue-300 hover:bg-blue-50/50 text-xs font-bold text-[#0F172A] transition cursor-pointer shadow-2xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Custom Prompt Instructions for Case #{selectedCase.case_no}:
                  </label>
                  <textarea
                    rows={3}
                    value={docGenPrompt}
                    onChange={(e) => setDocGenPrompt(e.target.value)}
                    placeholder={`Enter specific instructions to generate document for ${selectedCase.case_title}...`}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {docGenError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                    {docGenError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    AI models will automatically inject case facts, CNR, court name & client details.
                  </span>
                  <button
                    onClick={() => handleGenerateCaseDocument()}
                    disabled={docGenLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                  >
                    {docGenLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Generating Document...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate Document
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Generated Document Display Section */}
              {(generatedDocContent || docGenLoading) && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden space-y-0">
                  {/* Top Bar / Toolbar */}
                  <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-[#2563EB] shrink-0" />
                      <h4 className="font-extrabold text-[#0F172A] text-sm truncate">
                        {docGenTitle || "Generated Legal Document"} — Case #{selectedCase.case_no}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Print Document with Format Options */}
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => setPrintFormatMenuOpen((prev) => !prev)}
                          disabled={!generatedDocContent}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                          title="Print Document with format options (A4, Legal, Letter)"
                        >
                          <Printer size={13} /> Print <ChevronDown size={11} />
                        </button>

                        {printFormatMenuOpen && (
                          <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                              Select Paper Format:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handlePrintDocument("A4");
                                setPrintFormatMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition"
                            >
                              <span>📄 A4 Format</span>
                              <span className="text-[10px] text-slate-400 font-normal">210×297mm</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handlePrintDocument("Legal");
                                setPrintFormatMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition"
                            >
                              <span>📜 Legal Format</span>
                              <span className="text-[10px] text-slate-400 font-normal">8.5×14in</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handlePrintDocument("Letter");
                                setPrintFormatMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition"
                            >
                              <span>✉️ Letter Format</span>
                              <span className="text-[10px] text-slate-400 font-normal">8.5×11in</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Download PDF */}
                      <button
                        onClick={handleDownloadPDF}
                        disabled={!generatedDocContent}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                        title="Download as formatted PDF"
                      >
                        <Download size={13} /> PDF
                      </button>

                      {/* Download TXT */}
                      <button
                        onClick={handleDownloadTxt}
                        disabled={!generatedDocContent}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                        title="Download text file"
                      >
                        <FileText size={13} /> TXT
                      </button>

                      {/* Save to Case Documents */}
                      <button
                        onClick={handleSaveToCaseDocuments}
                        disabled={saveCaseDocLoading || !generatedDocContent}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${saveCaseDocSuccess
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                          }`}
                        title="Save directly into Case Documents folder for this case"
                      >
                        {saveCaseDocSuccess ? (
                          <>
                            <Check size={13} /> Saved to Case!
                          </>
                        ) : saveCaseDocLoading ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={13} /> Save to Case
                          </>
                        )}
                      </button>

                      {/* Copy */}
                      <button
                        onClick={handleCopyContent}
                        disabled={!generatedDocContent}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>

                      {/* Toggle Edit / Save Edit Mode */}
                      {docGenEditMode ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleSaveDocEdit}
                            disabled={savingDocEdit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                            title="Save edits permanently to document and history"
                          >
                            <Check size={13} /> {savingDocEdit ? "Saving..." : "Save Edit"}
                          </button>
                          <button
                            onClick={() => {
                              setDocGenEditedContent(generatedDocContent);
                              setDocGenEditMode(false);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {saveEditSuccess && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 animate-in fade-in duration-200">
                              ✓ Edit Saved!
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setDocGenEditedContent(generatedDocContent);
                              setDocGenEditMode(true);
                            }}
                            disabled={!generatedDocContent}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                          >
                            <Pencil size={13} /> Edit Document
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    {docGenLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-slate-600">Generating legal document using case context...</p>
                      </div>
                    ) : docGenEditMode ? (
                      <VisualLegalDocEditor
                        value={docGenEditedContent}
                        onChange={(newVal) => setDocGenEditedContent(newVal)}
                        fullPage={docEditFullPage}
                        onToggleFullPage={() => setDocEditFullPage((prev) => !prev)}
                      />
                    ) : (
                      <FormattedLegalDoc content={generatedDocContent} />
                    )}
                  </div>
                </div>
              )}

              {/* Case-specific History Section */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-[#2563EB]" />
                    <h4 className="font-extrabold text-[#0F172A] text-sm">
                      Generated Documents History for Case #{selectedCase.case_no}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {docGenHistory.length} saved
                  </span>
                </div>

                {docGenHistoryLoading ? (
                  <p className="text-xs text-slate-500 text-center py-4">Loading history for this case...</p>
                ) : docGenHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No generated documents saved for this case yet. Click "Generate Document" above to create one.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {docGenHistory.map((hItem) => (
                      <div
                        key={hItem.id}
                        onClick={() => {
                          setGeneratedDocContent(hItem.content || "");
                          setDocGenEditedContent(hItem.content || "");
                          setActiveDocHistoryId(hItem.id || null);
                          setDocGenTitle(hItem.prompt ? hItem.prompt.substring(0, 30) : "Generated Document");
                          setDocGenEditMode(false);
                        }}
                        className="group relative p-3.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl transition cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-[#0F172A] truncate flex-1 min-w-0">
                            {hItem.prompt || "Generated Legal Document"}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {hItem.created_at ? new Date(hItem.created_at).toLocaleDateString("en-IN") : ""}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDocHistoryId(hItem.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete this history item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {hItem.content ? hItem.content.replace(/[#*`_~]/g, "").substring(0, 120) + "..." : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Per-document assign modal */}
      {docAssignModal !== null && selectedCase && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setDocAssignModal(null); setDocAssignAdvocate(""); }}
          />
          <div className="relative bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <Send size={16} className="text-[#2563EB]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[#0F172A]">Assign Document</h3>
                <p className="text-xs text-[#64748B] mt-0.5 truncate max-w-[260px]">
                  {selectedCase.documents[docAssignModal]?.file || "Document"}
                </p>
              </div>
              <button
                onClick={() => { setDocAssignModal(null); setDocAssignAdvocate(""); }}
                className="ml-auto w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer shrink-0"
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl z-10 text-center animate-in fade-in zoom-in-95 duration-200">
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


      {viewBriefModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewBriefModal(null)} />

          <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10 border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-5 border-b border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                    Saved Strategic Brief
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] border border-emerald-500/30">
                    Win Likelihood: {viewBriefModal.winProbability || 75}%
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">📜 {viewBriefModal.fileName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Downloaded: {viewBriefModal.downloadedAt}</p>
              </div>
              <button
                onClick={() => setViewBriefModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto bg-slate-50 font-mono text-xs text-slate-800">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs whitespace-pre-wrap leading-relaxed">
                {viewBriefModal.fileContent || (
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm mb-2">I. KEY WINNING FORMULA</h4>
                    <p className="mb-4 text-slate-700 font-sans">{viewBriefModal.winningFormula}</p>

                    <h4 className="font-bold text-rose-900 text-sm mb-2">II. CRITICAL LOOPHOLES TO PATCH</h4>
                    <ul className="list-disc pl-5 mb-4 text-slate-700 font-sans">
                      {(viewBriefModal.keyLoopholes || []).map((l, i) => <li key={i}>{l}</li>)}
                    </ul>

                    <h4 className="font-bold text-blue-900 text-sm mb-2">III. MAIN LEGAL ARGUMENTS</h4>
                    <ul className="list-disc pl-5 mb-4 text-slate-700 font-sans">
                      {(viewBriefModal.mainArguments || []).map((a, i) => <li key={i}>{a}</li>)}
                    </ul>

                    <h4 className="font-bold text-slate-900 text-sm mb-2">IV. STATUTORY SECTIONS</h4>
                    <p className="mb-4 text-slate-700 font-sans">{(viewBriefModal.importantActs || []).join(", ")}</p>

                    <h4 className="font-bold text-purple-900 text-sm mb-2">V. TRIAL PLAYBOOK</h4>
                    <p className="text-slate-700 font-sans">{viewBriefModal.advocateRecommendation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([viewBriefModal.fileContent], { type: "text/plain;charset=utf-8" });
                  element.href = URL.createObjectURL(file);
                  element.download = viewBriefModal.fileName;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Download File Again
              </button>
              <button
                onClick={() => setViewBriefModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Modal: View Saved AI Strategic Brief */}
      {viewBriefModal && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewBriefModal(null)} />

          <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10 border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-5 border-b border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                    Saved Strategic Brief
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] border border-emerald-500/30">
                    Win Likelihood: {viewBriefModal.winProbability || 75}%
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">📜 {viewBriefModal.fileName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Downloaded: {viewBriefModal.downloadedAt}</p>
              </div>
              <button
                onClick={() => setViewBriefModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto bg-slate-50 font-mono text-xs text-slate-800">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs whitespace-pre-wrap leading-relaxed">
                {viewBriefModal.fileContent || (
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm mb-2">I. KEY WINNING FORMULA</h4>
                    <p className="mb-4 text-slate-700 font-sans">{viewBriefModal.winningFormula}</p>

                    <h4 className="font-bold text-rose-900 text-sm mb-2">II. CRITICAL LOOPHOLES TO PATCH</h4>
                    <ul className="list-disc pl-5 mb-4 text-slate-700 font-sans">
                      {(viewBriefModal.keyLoopholes || []).map((l, i) => <li key={i}>{l}</li>)}
                    </ul>

                    <h4 className="font-bold text-blue-900 text-sm mb-2">III. MAIN LEGAL ARGUMENTS</h4>
                    <ul className="list-disc pl-5 mb-4 text-slate-700 font-sans">
                      {(viewBriefModal.mainArguments || []).map((a, i) => <li key={i}>{a}</li>)}
                    </ul>

                    <h4 className="font-bold text-slate-900 text-sm mb-2">IV. STATUTORY SECTIONS</h4>
                    <p className="mb-4 text-slate-700 font-sans">{(viewBriefModal.importantActs || []).join(", ")}</p>

                    <h4 className="font-bold text-purple-900 text-sm mb-2">V. TRIAL PLAYBOOK</h4>
                    <p className="text-slate-700 font-sans">{viewBriefModal.advocateRecommendation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([viewBriefModal.fileContent], { type: "text/plain;charset=utf-8" });
                  element.href = URL.createObjectURL(file);
                  element.download = viewBriefModal.fileName;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Download File Again
              </button>
              <button
                onClick={() => setViewBriefModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete AI Document History Modal (Full-Screen Portal covering sidebar & navbar) */}
      {deleteDocHistoryId !== null && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop covering sidebar & navbar */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDeleteDocHistoryId(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
              <Trash2 size={26} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-[#0F172A]">Delete History Item</h3>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                Are you sure you want to delete this generated document history item? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteDocHistoryId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-bold text-xs hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDocHistory}
                disabled={deleteDocHistoryLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteDocHistoryLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Delete Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewerModal
          fileUrl={viewingDocument.url}
          title={viewingDocument.file}
          badge={viewingDocument.documentType}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
}

// ─── Formatted Legal Document Renderer (Headings, Bold, Italic, Underline & Highlight Support) ────
export function FormattedLegalDoc({ content }) {
  if (!content) return null;

  const lines = String(content).split("\n");

  return (
    <div className="text-xs font-sans leading-relaxed text-[#0F172A] bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-2 select-text min-h-[400px]">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-2" />;

        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={lIdx} className="text-lg font-black text-[#0F172A] border-b border-slate-200 pb-1.5 pt-3 tracking-tight">
              {renderFormattedText(trimmed.replace(/^#\s+/, ""))}
            </h1>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={lIdx} className="text-base font-extrabold text-[#0F172A] pt-2 tracking-tight">
              {renderFormattedText(trimmed.replace(/^##\s+/, ""))}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={lIdx} className="text-sm font-bold text-[#1E293B] pt-1">
              {renderFormattedText(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        }

        const isBoldRef = trimmed.startsWith("**Ref.") || trimmed.startsWith("**TO:");

        return (
          <p key={lIdx} className={isBoldRef ? "font-bold text-slate-900" : ""}>
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderFormattedText(text) {
  if (!text) return null;

  const parts = [];
  const regex = /(==(.*?)==|--(.*?)--|<mark>(.*?)<\/mark>|\*\*(.*?)\*\*|<b>(.*?)<\/b>|<strong>(.*?)<\/strong>|\*(.*?)\*|<i>(.*?)<\/i>|<em>(.*?)<\/em>|<u>(.*?)<\/u>)/gi;

  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const highlightedContent = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4];
    const boldContent = match[5] !== undefined ? match[5] : match[6] !== undefined ? match[6] : match[7];
    const italicContent = match[8] !== undefined ? match[8] : match[9] !== undefined ? match[9] : match[10];
    const underlineContent = match[11];

    if (highlightedContent !== undefined) {
      parts.push(
        <mark
          key={`hl-${keyCounter++}`}
          className="bg-yellow-200 text-yellow-950 font-bold px-1.5 py-0.5 rounded border border-yellow-300 shadow-2xs inline-block"
        >
          {renderFormattedText(highlightedContent)}
        </mark>
      );
    } else if (boldContent !== undefined) {
      parts.push(
        <strong key={`b-${keyCounter++}`} className="font-extrabold text-[#0F172A]">
          {renderFormattedText(boldContent)}
        </strong>
      );
    } else if (italicContent !== undefined) {
      parts.push(
        <em key={`i-${keyCounter++}`} className="italic font-medium text-[#1E293B]">
          {renderFormattedText(italicContent)}
        </em>
      );
    } else if (underlineContent !== undefined) {
      parts.push(
        <u key={`u-${keyCounter++}`} className="underline underline-offset-2 font-semibold">
          {renderFormattedText(underlineContent)}
        </u>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// ─── Visual WYSIWYG Document Editor Component ─────────────────────────────
import { useRef as useEditorRef } from "react";

export function VisualLegalDocEditor({ value, onChange, fullPage, onToggleFullPage }) {
  const editorRef = useEditorRef(null);
  const isUpdatingRef = useEditorRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const converted = markdownToHtml(value || "");
      if (editorRef.current.innerHTML !== converted) {
        editorRef.current.innerHTML = converted;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(htmlToMarkdown(editorRef.current.innerHTML));
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  };

  const exec = (cmd, arg = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (cmd === "highlight") {
      document.execCommand("backColor", false, "#fef08a");
      document.execCommand("hiliteColor", false, "#fef08a");
    } else {
      document.execCommand(cmd, false, arg);
    }
    handleInput();
  };

  return (
    <div className="space-y-3">
      {/* Rich WYSIWYG Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100/90 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pr-1">Format:</span>

          {/* Headings H1, H2, H3 */}
          <button
            type="button"
            onClick={() => exec("formatBlock", "<h1>")}
            className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-800 font-extrabold rounded-lg border border-slate-300 flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
            title="Heading 1"
          >
            <Heading1 size={13} className="text-indigo-600" /> H1
          </button>
          <button
            type="button"
            onClick={() => exec("formatBlock", "<h2>")}
            className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
            title="Heading 2"
          >
            <Heading2 size={13} className="text-indigo-600" /> H2
          </button>
          <button
            type="button"
            onClick={() => exec("formatBlock", "<h3>")}
            className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
            title="Heading 3"
          >
            <Heading3 size={13} className="text-indigo-600" /> H3
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Bold, Italic, Underline */}
          <button
            type="button"
            onClick={() => exec("bold")}
            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-900 font-black rounded-lg border border-slate-300 flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
            title="Bold"
          >
            <Bold size={13} /> Bold
          </button>
          <button
            type="button"
            onClick={() => exec("italic")}
            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 italic font-semibold rounded-lg border border-slate-300 flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
            title="Italic"
          >
            <Italic size={13} /> Italic
          </button>
          <button
            type="button"
            onClick={() => exec("underline")}
            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 underline font-semibold rounded-lg border border-slate-300 flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
            title="Underline"
          >
            <Underline size={13} /> Underline
          </button>
          <button
            type="button"
            onClick={() => exec("highlight")}
            className="px-2.5 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-950 font-bold rounded-lg border border-yellow-300 flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
            title="Highlight"
          >
            <Highlighter size={13} className="text-yellow-700" /> Highlight
          </button>
        </div>

        {/* Full Page Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFullPage}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
          >
            {fullPage ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            {fullPage ? "Normal View" : "Full Page View"}
          </button>
        </div>
      </div>

      {/* Visual ContentEditable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className={`w-full p-6 text-xs text-[#0F172A] bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-inner leading-relaxed transition-all overflow-y-auto ${fullPage ? "min-h-[85vh] h-[85vh]" : "min-h-[550px] lg:min-h-[650px]"
          }`}
        style={{
          fontFamily: "'Inter', sans-serif",
          outline: "none"
        }}
      />
    </div>
  );
}

export function markdownToHtml(md) {
  if (!md) return "";
  let html = String(md);

  html = html.replace(/\r\n/g, "\n");

  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$2</h2>");
  html = html.replace(/^### (.*?)$/gm, "<h3>$3</h3>");

  html = html.replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");

  html = html.replace(/==(.*?)==/g, '<mark style="background-color: #fef08a; color: #713f12; padding: 2px 4px; border-radius: 4px; font-weight: bold;">$1</mark>');
  html = html.replace(/--(.*?)--/g, '<mark style="background-color: #fef08a; color: #713f12; padding: 2px 4px; border-radius: 4px; font-weight: bold;">$1</mark>');
  html = html.replace(/<mark>(.*?)<\/mark>/gi, '<mark style="background-color: #fef08a; color: #713f12; padding: 2px 4px; border-radius: 4px; font-weight: bold;">$1</mark>');

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/<b>(.*?)<\/b>/gi, "<strong>$1</strong>");

  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/<i>(.*?)<\/i>/gi, "<em>$1</em>");

  html = html.replace(/\n/g, "<br/>");

  return html;
}

export function htmlToMarkdown(html) {
  if (!html) return "";
  let md = String(html);

  md = md.replace(/<h1>(.*?)<\/h1>/gi, "\n# $1\n");
  md = md.replace(/<h2>(.*?)<\/h2>/gi, "\n## $1\n");
  md = md.replace(/<h3>(.*?)<\/h3>/gi, "\n### $1\n");

  md = md.replace(/<mark[^>]*>(.*?)<\/mark>/gi, "==$1==");
  md = md.replace(/<span style="background-color:[^"]*">(.*?)<\/span>/gi, "==$1==");

  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**");

  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i>(.*?)<\/i>/gi, "*$1*");

  md = md.replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");

  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<div><br\/><\/div>/gi, "\n");
  md = md.replace(/<div>/gi, "\n");
  md = md.replace(/<\/div>/gi, "");
  md = md.replace(/<p>/gi, "");
  md = md.replace(/<\/p>/gi, "\n\n");

  return md.trim();
}
