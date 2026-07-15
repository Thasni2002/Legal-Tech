"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";
import { getLoggedInUser } from "@/utils/auth";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Download,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Upload,
  ExternalLink,
  ChevronRight,
  LayoutList,
  Wand2,
} from "lucide-react";

const BASE_URL = API_BASE_URL || "http://127.0.0.1:8000";

// ─── Document requirements per case type ────────────────────────────────────
const CASE_TYPE_DOCUMENTS = {
  Criminal: [
    { name: "FIR Copy", description: "First Information Report filed with police — the primary complaint document.", icon: "📋", canGenerate: false },
    { name: "Identity Proof", description: "Aadhaar Card, Passport, Voter ID, or any government-issued photo ID.", icon: "🪪", canGenerate: false },
    { name: "Bail Order", description: "Court-issued bail order if bail has been granted to the accused.", icon: "⚖️", canGenerate: false },
    { name: "Charge Sheet", description: "Copy of the charge sheet submitted by police detailing offences charged.", icon: "📄", canGenerate: false },
    { name: "Witness Statements", description: "Signed affidavits or recorded statements from witnesses in the case.", icon: "🗣️", canGenerate: false },
    { name: "Police Remand Report", description: "Police custody and remand details if arrest occurred.", icon: "📑", canGenerate: false },
    { name: "Medical / Forensic Reports", description: "Doctor's reports or forensic evidence (required in assault / accident cases).", icon: "🏥", canGenerate: false },
    { name: "Vakalatnama", description: "Power of attorney authorising your advocate to represent you in court.", icon: "✍️", canGenerate: true, templateKey: "vakalatnama" },
  ],
  Civil: [
    { name: "Plaint / Written Statement", description: "The main pleading document setting out your claim or defence.", icon: "📝", canGenerate: false },
    { name: "Identity Proof", description: "Aadhaar Card, Passport, Voter ID, or any government-issued photo ID.", icon: "🪪", canGenerate: false },
    { name: "Agreement / Contract Copy", description: "The signed contract or agreement at the heart of the civil dispute.", icon: "📃", canGenerate: false },
    { name: "Court Summons / Notice", description: "Any court notice or summons received relating to this case.", icon: "📬", canGenerate: false },
    { name: "Property Documents", description: "Sale deed, title deed, or land records if the dispute involves property.", icon: "🏠", canGenerate: false },
    { name: "Payment Receipts / Bills", description: "Proof of transactions — invoices, receipts, or bank statements.", icon: "🧾", canGenerate: false },
    { name: "Correspondence Records", description: "Relevant emails, letters, or messages exchanged with the opposing party.", icon: "📧", canGenerate: false },
    { name: "Vakalatnama", description: "Power of attorney authorising your advocate to represent you in court.", icon: "✍️", canGenerate: true, templateKey: "vakalatnama" },
  ],
  Family: [
    { name: "Marriage Certificate", description: "Registered marriage certificate — primary proof of the marriage.", icon: "💍", canGenerate: false },
    { name: "Birth Certificates (Children)", description: "Birth certificates of children for custody or maintenance claims.", icon: "👶", canGenerate: false },
    { name: "Identity Proof", description: "Aadhaar Card, Passport, Voter ID, or any government-issued photo ID.", icon: "🪪", canGenerate: false },
    { name: "Income Proof / Salary Slips", description: "Last 3–6 months' salary slips or income tax returns for maintenance / alimony.", icon: "💰", canGenerate: false },
    { name: "Medical Records", description: "Hospital / doctor records in domestic violence or cruelty-related cases.", icon: "🏥", canGenerate: false },
    { name: "Property / Bank Statements", description: "Joint or individual assets and bank account statements for division.", icon: "🏦", canGenerate: false },
    { name: "Separation / Settlement Agreement", description: "Any existing separation agreement or mutual consent terms if applicable.", icon: "📑", canGenerate: false },
    { name: "Vakalatnama", description: "Power of attorney authorising your advocate to represent you in court.", icon: "✍️", canGenerate: true, templateKey: "vakalatnama" },
  ],
  Property: [
    { name: "Sale Deed / Title Deed", description: "Registered sale deed or title deed proving current ownership.", icon: "📜", canGenerate: false },
    { name: "Encumbrance Certificate", description: "EC from the sub-registrar's office confirming the property is free of liens.", icon: "🏛️", canGenerate: false },
    { name: "Patta / Khata Document", description: "Revenue land records (Patta in Tamil Nadu, Khata in Karnataka etc.).", icon: "📗", canGenerate: false },
    { name: "Survey / Sketch Plan", description: "Survey sketch or FMB showing exact boundary demarcation of the land.", icon: "🗺️", canGenerate: false },
    { name: "Property Tax Receipts", description: "Paid property tax receipts as evidence of possession and payment.", icon: "🧾", canGenerate: false },
    { name: "Mutation Records", description: "Revenue records showing transfer of ownership history.", icon: "📋", canGenerate: false },
    { name: "Identity Proof", description: "Aadhaar Card, Passport, Voter ID, or any government-issued photo ID.", icon: "🪪", canGenerate: false },
    { name: "Vakalatnama", description: "Power of attorney authorising your advocate to represent you in court.", icon: "✍️", canGenerate: true, templateKey: "vakalatnama" },
  ],
  Labour: [
    { name: "Employment Contract", description: "The signed appointment letter or employment agreement.", icon: "📋", canGenerate: false },
    { name: "Termination / Resignation Letter", description: "The termination order or resignation letter forming the dispute basis.", icon: "✉️", canGenerate: false },
    { name: "Pay Slips (Last 6 Months)", description: "Salary pay slips for the last 6 months as wage evidence.", icon: "💵", canGenerate: false },
    { name: "PF / ESI Records", description: "Provident Fund or Employee State Insurance contribution records.", icon: "🏦", canGenerate: false },
    { name: "HR Correspondence", description: "Emails, notices, warning letters, or communications received from HR / management.", icon: "📧", canGenerate: false },
    { name: "Identity Proof", description: "Aadhaar Card, Passport, Voter ID, or any government-issued photo ID.", icon: "🪪", canGenerate: false },
    { name: "Vakalatnama", description: "Power of attorney authorising your advocate to represent you in court.", icon: "✍️", canGenerate: true, templateKey: "vakalatnama" },
  ],
  Consumer: [
    { name: "Bounced Cheque (Original)", description: "The original dishonoured cheque — primary evidence in cheque-bounce cases.", icon: "🏧", canGenerate: false },
    { name: "Bank Return Memo", description: "Dishonour memo issued by the bank explaining the reason for return.", icon: "🏛️", canGenerate: false },
    { name: "Legal Notice (Sent / Received)", description: "Demand notice sent to the drawer / received from the payee.", icon: "📬", canGenerate: false },
    { name: "Invoice / Receipt", description: "Invoice or receipt proving the underlying transaction for which the cheque was issued.", icon: "🧾", canGenerate: false },
    { name: "Identity Proof", description: "Aadhaar Card, Passport, Voter ID, or any government-issued photo ID.", icon: "🪪", canGenerate: false },
    { name: "Vakalatnama", description: "Power of attorney authorising your advocate to represent you in court.", icon: "✍️", canGenerate: true, templateKey: "vakalatnama" },
  ],
  Other: [
    { name: "Identity Proof", description: "Aadhaar Card, Passport, Voter ID, or any government-issued photo ID.", icon: "🪪", canGenerate: false },
    { name: "Relevant Supporting Documents", description: "Any documents directly related to the nature of your case.", icon: "📁", canGenerate: false },
    { name: "General Affidavit", description: "A sworn statement declaring facts relevant to your case.", icon: "📝", canGenerate: true, templateKey: "general_affidavit" },
    { name: "Vakalatnama", description: "Power of attorney authorising your advocate to represent you in court.", icon: "✍️", canGenerate: true, templateKey: "vakalatnama" },
  ],
};

// ─── Case type display config (colour + label) ───────────────────────────────
const CASE_TYPE_CONFIG = {
  Criminal: { color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  Civil:    { color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  Family:   { color: "bg-pink-100 text-pink-700 border-pink-200", dot: "bg-pink-500" },
  Property: { color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Labour:   { color: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  Consumer: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Other:    { color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

// ─── Document format templates ───────────────────────────────────────────────
const TEMPLATE_METADATA = {
  name_change_affidavit: {
    name: "Name Change Affidavit",
    description: "An official affidavit declaring a change of name, commonly required for government gazette records.",
    template: `AFFIDAVIT FOR CHANGE OF NAME

I, [Your_Name], daughter of [Father_Name] and wife of [Husband_Name], aged [Your_Age], residing at [Your_Address] hereby solemnly affirm and declare as follows:

That my maiden name is [Maiden_Name].
That I got married to [Husband_Name] on [Marriage_Date] at [Marriage_Place].
That after marriage, my name is [New_Name_After_Marriage].
That my AADHAR number is [AADHAR_Number], which remains unchanged before and after my marriage.
That my PAN number is [PAN_Number], which remains unchanged before and after my marriage.

I state that [Maiden_Name] and [New_Name_After_Marriage] refer to one and the same person, which is myself.

Place: [Place_Name]
Date: [Date]
Signature of Affiant: [Your_Name]
`
  },
  vakalatnama: {
    name: "Vakalatnama (Power of Attorney)",
    description: "A formal document authorizing a specific advocate to represent and plead your case in court.",
    template: `VAKALATNAMA

IN THE COURT OF [Court_Name]
Case No. [Case_Number] of 2026

Between:
[Client_Name] ... Petitioner/Plaintiff
AND
[Opposite_Party] ... Respondent/Defendant

I, [Client_Name], do hereby appoint and authorize Advocate [Advocate_Name] to appear, plead, and act for me in the above-mentioned case.
`
  },
  general_affidavit: {
    name: "General Affidavit",
    description: "A sworn statement used to declare facts under oath for various legal and administrative purposes.",
    template: `GENERAL AFFIDAVIT

I, [Affiant_Name], son/daughter of [Father_Name], aged [Affiant_Age], residing at [Affiant_Address], hereby solemnly affirm and declare as follows:

That I am making this affidavit to declare the following facts or intentions related to [Purpose_of_Affidavit]:
1. [Fact_or_Declaration_1]
2. [Fact_or_Declaration_2]
3. [Fact_or_Declaration_3]

Place: [Place_Name]
Date: [Date]
Signature of Affiant: [Affiant_Name]
`
  }
};

// ─── Helper: fuzzy match case type to a CASE_TYPE_DOCUMENTS key ──────────────
function resolveCaseType(rawType = "") {
  const t = rawType.toLowerCase().trim();
  if (t.includes("criminal") || t.includes("fir") || t.includes("ipc")) return "Criminal";
  if (t.includes("civil") || t.includes("contract") || t.includes("suit")) return "Civil";
  if (t.includes("family") || t.includes("matrimon") || t.includes("divorce") || t.includes("custody")) return "Family";
  if (t.includes("property") || t.includes("land") || t.includes("real estate") || t.includes("eviction")) return "Property";
  if (t.includes("labour") || t.includes("labor") || t.includes("employment") || t.includes("cheque")) return "Labour";
  if (t.includes("consumer") || t.includes("bounce") || t.includes("dishonour")) return "Consumer";
  return "Other";
}

// ─── Helper: check if a doc name is already uploaded in the case ─────────────
function isDocUploaded(docName, caseDocs = []) {
  if (!Array.isArray(caseDocs) || caseDocs.length === 0) return false;
  const needle = docName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return caseDocs.some((d) => {
    const haystack = ((d.documentType || d.file || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
    return haystack.includes(needle.slice(0, 6)) || needle.includes(haystack.slice(0, 6));
  });
}

// ============================================================================
// Main Component
// ============================================================================
export default function DocumentFormatGenerateView() {
  const router = useRouter();

  // Tab: "checklist" | "generate"
  const [activeTab, setActiveTab] = useState("checklist");

  // ── Shared state ────────────────────────────────────────────────────────────
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState("");

  // ── Generate tab state ──────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ── Fetch cases on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const user = getLoggedInUser();
    const name = user?.username || user?.name || "";

    const fetchCases = async () => {
      try {
        const response = await fetch(`${BASE_URL}/case-management/`);
        if (response.ok) {
          const casesData = await response.json();
          const clientCases = Array.isArray(casesData)
            ? user
              ? casesData.filter((c) => {
                  const caseEmail = (c.email_id || "").toLowerCase().trim();
                  const userEmail = (user.email || "").toLowerCase().trim();
                  if (caseEmail && userEmail && caseEmail === userEmail) return true;
                  if (c.client_name) {
                    const normalizedName = c.client_name.toLowerCase().replace(/[^a-z0-9]/g, "");
                    const normalizedUsername = name.toLowerCase().replace(/[^a-z0-9]/g, "");
                    if (normalizedName === normalizedUsername) return true;
                  }
                  return false;
                })
              : casesData
            : [];
          setCases(clientCases);
          if (clientCases.length > 0) setSelectedCase(clientCases[0].id.toString());
        }
      } catch (err) {
        console.error("Error fetching cases", err);
      }
    };
    fetchCases();
  }, []);

  // ── Derived: selected case object ───────────────────────────────────────────
  const selectedCaseObj = cases.find((c) => c.id.toString() === selectedCase) || null;
  const resolvedType = selectedCaseObj ? resolveCaseType(selectedCaseObj.case_type || "") : null;
  const requiredDocs = resolvedType ? (CASE_TYPE_DOCUMENTS[resolvedType] || CASE_TYPE_DOCUMENTS.Other) : [];
  const uploadedDocs = selectedCaseObj?.documents || [];
  const uploadedCount = requiredDocs.filter((d) => isDocUploaded(d.name, uploadedDocs)).length;
  const progress = requiredDocs.length > 0 ? Math.round((uploadedCount / requiredDocs.length) * 100) : 0;

  const caseTypeConfig = resolvedType ? (CASE_TYPE_CONFIG[resolvedType] || CASE_TYPE_CONFIG.Other) : null;

  // ── Generate tab handlers ───────────────────────────────────────────────────
  const handleSelectTemplate = (key, caseId = "") => {
    setSelectedTemplate(key);
    setDraftText(TEMPLATE_METADATA[key].template);
    setGeneratedContent("");
    setSuccess(false);
    setError(null);
    if (caseId) setSelectedCase(caseId);
    setActiveTab("generate");
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedCase) {
      setError("Please select a case to attach the generated document.");
      return;
    }
    if (!draftText.trim()) {
      setError("Please enter or edit the format text before generating.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    setGeneratedContent("");

    try {
      const response = await fetch(`${BASE_URL}/case-management/generate-format-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: parseInt(selectedCase),
          template_key: selectedTemplate,
          draft_text: draftText,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to generate document.");
      }
      const data = await response.json();
      setGeneratedContent(data.document);
      setFileUrl(data.file_url);
      setFilename(data.filename);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!generatedContent) return;
    const doc = new jsPDF();
    const cleanText = generatedContent.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#/g, "");
    const splitText = doc.splitTextToSize(cleanText, 180);
    let y = 15;
    for (let i = 0; i < splitText.length; i++) {
      if (y > 280) { doc.addPage(); y = 15; }
      doc.text(splitText[i], 15, y);
      y += 7;
    }
    doc.save(`${filename.replace(".md", "")}.pdf`);
  };

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-4">
          {activeTab === "generate" && selectedTemplate && (
            <button
              onClick={() => { setSelectedTemplate(null); setGeneratedContent(""); setError(null); }}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer flex-shrink-0"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Document Format Generate
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              View required documents for your case or generate a standard legal format draft.
            </p>
          </div>
        </div>

        {/* ── Tab Switcher ────────────────────────────────────────────────────── */}
        <div className="mt-6 flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("checklist")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "checklist"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Document Checklist
          </button>
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "generate"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Generate Document Format
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1 — DOCUMENT CHECKLIST
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "checklist" && (
        <div className="space-y-6">

          {/* Case Selector */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Select Your Case
            </label>
            {cases.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                No cases found linked to your account. Please contact your advocate.
              </div>
            ) : (
              <select
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
              >
                <option value="">-- Choose a case --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_no} — {c.case_title} ({c.case_type || "Unknown Type"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Checklist Body */}
          {selectedCaseObj && (
            <>
              {/* Case Info Bar + Progress */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">{selectedCaseObj.case_title}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{selectedCaseObj.case_no} · {selectedCaseObj.court_name || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {caseTypeConfig && (
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${caseTypeConfig.color}`}>
                        <span className={`w-2 h-2 rounded-full ${caseTypeConfig.dot}`} />
                        {resolvedType} Case
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-slate-600">
                      Documents Submitted
                    </span>
                    <span className={`font-bold ${uploadedCount === requiredDocs.length ? "text-emerald-600" : "text-blue-600"}`}>
                      {uploadedCount} / {requiredDocs.length}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        progress === 100 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {progress === 100
                      ? "✅ All required documents have been uploaded!"
                      : `${requiredDocs.length - uploadedCount} document${requiredDocs.length - uploadedCount !== 1 ? "s" : ""} still needed`}
                  </p>
                </div>
              </div>

              {/* Document Cards Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {requiredDocs.map((doc, idx) => {
                  const uploaded = isDocUploaded(doc.name, uploadedDocs);
                  return (
                    <div
                      key={idx}
                      className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 transition-all duration-200 hover:shadow-md ${
                        uploaded ? "border-emerald-200" : "border-slate-200 hover:border-blue-200"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                        uploaded ? "bg-emerald-50" : "bg-slate-50"
                      }`}>
                        {doc.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                          {uploaded ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Uploaded
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3 h-3" /> Missing
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{doc.description}</p>

                        {/* Action Buttons */}
                        {!uploaded && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <button
                              onClick={() => router.push("/client-documents")}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer"
                            >
                              <Upload className="w-3 h-3" />
                              Upload Now
                            </button>
                            {doc.canGenerate && (
                              <button
                                onClick={() => handleSelectTemplate(doc.templateKey, selectedCase)}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer border border-slate-200"
                              >
                                <Wand2 className="w-3 h-3" />
                                Generate Format
                              </button>
                            )}
                          </div>
                        )}
                        {uploaded && doc.canGenerate && (
                          <button
                            onClick={() => handleSelectTemplate(doc.templateKey, selectedCase)}
                            className="mt-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer border border-slate-200"
                          >
                            <Wand2 className="w-3 h-3" />
                            Re-generate Format
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom CTA */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-extrabold text-lg">Need to upload documents?</h3>
                  <p className="text-blue-100 text-sm mt-0.5 font-medium">
                    Go to the Documents page to upload any missing files to your advocate.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/client-documents")}
                  className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  Go to Documents
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2 — GENERATE DOCUMENT FORMAT
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "generate" && (
        <div className="space-y-6">

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Template Selection Grid */}
          {!selectedTemplate && (
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(TEMPLATE_METADATA).map(([key, template]) => (
                <div
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                      ⚖️
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{template.description}</p>
                  </div>
                  <button className="mt-6 w-full py-3 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-bold rounded-xl text-sm transition-all border border-slate-100 hover:border-blue-200">
                    Select Format &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Form & Generation Preview */}
          {selectedTemplate && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Interactive Draft Editor */}
              <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {TEMPLATE_METADATA[selectedTemplate].name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                      Edit name, address, and details directly below
                    </p>
                  </div>

                  <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Attach to Case
                      </label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                        value={selectedCase}
                        onChange={(e) => setSelectedCase(e.target.value)}
                        required
                      >
                        <option value="">-- Choose active case --</option>
                        {cases.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.case_no} - {c.case_title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Document Format Editor
                      </label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 font-mono transition-all min-h-[350px] resize-y outline-none"
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Compiling Polished Draft...
                        </>
                      ) : (
                        "Generate Document →"
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: Polished Output Preview */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between min-h-[500px]">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Polished Legal Output</h3>
                    {success && (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" />
                        Auto-Saved to Case
                      </div>
                    )}
                  </div>

                  {generatedContent ? (
                    <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-2xl border border-slate-100 max-h-[550px] overflow-y-auto font-medium text-slate-800 leading-relaxed text-sm">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-[350px] flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <span className="font-semibold text-sm text-center px-8">
                        Edit the template on the left, then click Generate to view final legal copy
                      </span>
                    </div>
                  )}
                </div>

                {generatedContent && (
                  <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleDownloadPdf}
                      className="flex-1 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      Download PDF Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
