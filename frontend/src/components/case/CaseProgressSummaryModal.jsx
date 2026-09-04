"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "@/services/api";
import {
  ArrowLeft,
  X,
  FileText,
  Clock,
  UserCheck,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Download,
  RefreshCw,
  Zap,
  MessageSquare,
  Shield,
  Star,
  User,
  CreditCard,
  DollarSign,
  FileCheck,
  Layers,
} from "lucide-react";

export default function CaseProgressSummaryModal({ isOpen, onClose, caseId }) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSummary = async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${caseId}/ai-summary`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Failed to load case progress summary.");
      }
    } catch (e) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && caseId) {
      fetchSummary();
    }
  }, [isOpen, caseId]);

  if (!isOpen || !mounted) return null;

  const caseInfo = data?.case || {};
  const assignedMembers = data?.assigned_members || [];
  const timelineEvents = data?.timeline_events || [];
  const notes = data?.notes || [];
  const documents = data?.documents || [];
  const paymentInfo = data?.payment_info || { total_amount: 0, paid_amount: 0, pending_amount: 0, payment_status: "No Invoices", invoices: [] };
  const lastUpdate = data?.last_update_info || {};
  const aiAnalysis = data?.ai_analysis || {};

  const milestones = aiAnalysis.chronologicalMilestones || [];
  const advocateNamesStr = assignedMembers.map(m => m.advocate_name).join(", ") || caseInfo.selected_advocate || "Unassigned Advocate";

  const handleDownload = () => {
    if (!data) return;
    const timeStr = new Date().toLocaleString();
    const fileName = `Master_Case_Progress_Summary_${caseId}_${Date.now()}.txt`;

    let fileContent = `================================================================================
LEGAL TECH ENTERPRISE — COMPLETE AI CASE ANALYSIS & SUMMARY REPORT
================================================================================
Case Title: ${caseInfo.case_title || "N/A"}
Case No: ${caseInfo.case_no || "N/A"} | CNR: ${caseInfo.cnr_number || "N/A"}
Court: ${caseInfo.court_name || "N/A"} (${caseInfo.court_type || "N/A"})
Client: ${caseInfo.client_name || "N/A"} (${caseInfo.client_role || "Petitioner"}) | Phone: ${caseInfo.contact_number || "N/A"}
Assigned Advocate(s): ${advocateNamesStr}
Filing Date: ${caseInfo.filing_date || "N/A"}
Next Hearing Date: ${caseInfo.next_hearing_date || "N/A"}
Current Status: ${caseInfo.status || "Active"}
Report Date: ${timeStr}
--------------------------------------------------------------------------------

I. EXECUTIVE CASE SUMMARY:
${aiAnalysis.masterSummary || "N/A"}

II. LATEST UPDATE & PROCEEDINGS (Date: ${lastUpdate.date || "N/A"} Time: ${lastUpdate.time || "N/A"}):
Event: ${lastUpdate.title || "N/A"}
Conducted By / Actor: ${lastUpdate.actor || "N/A"}
Description: ${lastUpdate.description || "N/A"}

III. CASE DISCUSSIONS & ADVOCATE NOTES (${notes.length} Logged):
${notes.map((n, i) => `[${n.date}] ${n.author} (${n.category}): ${n.text}`).join("\n")}

IV. FINANCIAL & PAYMENT SUMMARY:
Total Amount: ₹${paymentInfo.total_amount} | Paid: ₹${paymentInfo.paid_amount} | Pending: ₹${paymentInfo.pending_amount}
Payment Status: ${paymentInfo.payment_status}
Invoices (${paymentInfo.invoices.length}):
${paymentInfo.invoices.map((inv, i) => `  ${i + 1}. Inv #${inv.invoice_number} — ₹${inv.amount} (${inv.status}) | Issued: ${inv.issue_date} Due: ${inv.due_date}`).join("\n")}

V. ADVOCATE REPRESENTATION TEAM:
${aiAnalysis.assignedAdvocateDetails || "N/A"}
${assignedMembers.map((m, i) => `  ${i + 1}. ${m.advocate_name} (${m.assigned_role}) — Assigned: ${m.assigned_date}`).join("\n")}

VI. MAIN CASE HIGHLIGHTS & MILESTONES:
${milestones.map((m, i) => `  • ${m}`).join("\n")}

VII. ADVOCATE ACTION PLAN FOR NEXT HEARING:
${(aiAnalysis.actionPlan || []).map((a, i) => `  ✓ ${a}`).join("\n")}
================================================================================
`;

    const element = document.createElement("a");
    const file = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col w-screen h-screen overflow-hidden">
      <div className="bg-slate-50 w-full h-full flex flex-col overflow-hidden">
        
        {/* ── HEADER BAR ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 border-b border-indigo-900 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer shrink-0 border border-white/10 active:scale-95"
              title="Back to Case"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-black text-[10px] rounded-md uppercase tracking-wider">
                  AI Master Case Summary
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold rounded-md uppercase">
                  {caseInfo.status || "Active"}
                </span>
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug break-words">
                {caseInfo.case_title || `Case #${caseId}`}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-indigo-200 mt-1 font-mono">
                <span>CNR: {caseInfo.cnr_number || "N/A"}</span>
                <span>·</span>
                <span>Case No: {caseInfo.case_no || "N/A"}</span>
                <span>·</span>
                <span>Court: {caseInfo.court_name || "Court"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              disabled={loading || !data}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download Master Brief</span>
            </button>
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Refresh Summary"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── LOADING STATE ─────────────────────────────────────────── */}
        {loading && (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center my-auto">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-slate-800">Analyzing Complete Case File &amp; Financials…</p>
            <p className="text-xs text-slate-500">Synthesizing case journey, discussions, latest proceedings, and payment details.</p>
          </div>
        )}

        {/* ── ERROR STATE ───────────────────────────────────────────── */}
        {error && !loading && (
          <div className="p-8 text-center my-auto">
            <AlertTriangle size={36} className="text-rose-500 mx-auto mb-3" />
            <h4 className="font-extrabold text-slate-900 text-base mb-1">Unable to Load Summary</h4>
            <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchSummary}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── CONTENT BODY (Complete with Discussions, Payments & Last Updates) ── */}
        {data && !loading && (
          <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 scrollbar-thin">

            {/* 1. KEY INFO STRIP (5 Pill Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck size={13} /> Assigned Advocate
                </p>
                <p className="font-black text-slate-900 text-xs mt-1 truncate">
                  {advocateNamesStr}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Lead Counsel</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                  <User size={13} /> Client Details
                </p>
                <p className="font-black text-slate-900 text-xs mt-1 truncate">
                  {caseInfo.client_name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{caseInfo.client_role} · {caseInfo.contact_number}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Zap size={13} /> Last Update
                </p>
                <p className="font-black text-amber-900 text-xs mt-1 truncate">
                  {lastUpdate.date} ({lastUpdate.time})
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{lastUpdate.title}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard size={13} /> Payment Details
                </p>
                <p className="font-black text-emerald-800 text-xs mt-1 truncate">
                  ₹{paymentInfo.paid_amount} / ₹{paymentInfo.total_amount}
                </p>
                <span className={`inline-block px-1.5 py-0.2 rounded font-extrabold text-[9px] uppercase mt-0.5 ${
                  paymentInfo.payment_status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  Status: {paymentInfo.payment_status}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={13} /> Next Hearing
                </p>
                <p className="font-black text-blue-900 text-xs mt-1 truncate">
                  {caseInfo.next_hearing_date}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{caseInfo.court_name}</p>
              </div>
            </div>

            {/* 2. EXECUTIVE CASE SUMMARY */}
            <div className="bg-white border border-indigo-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                  Master AI Case Summary &amp; Legal Standing
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/80">
                {aiAnalysis.masterSummary}
              </p>
            </div>

            {/* 3. CASE JOURNEY AT A GLANCE (START TO END SUMMARY) */}
            <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-indigo-600" />
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                    Case Journey at a Glance (Start to End Summary)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-indigo-600">3-Step Lifecycle Story</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* START STEP */}
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-600 text-white font-black text-[10px] rounded uppercase tracking-wider">
                      1. CASE START / FILING
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-900">{caseInfo.filing_date}</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs mt-1.5">Initial Filing &amp; Onboarding</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Matter registered before <span className="font-bold text-slate-900">{caseInfo.court_name}</span> for client <span className="font-bold text-slate-900">{caseInfo.client_name}</span> ({caseInfo.client_role}). Lead counsel: <span className="font-bold text-slate-900">{advocateNamesStr}</span>.
                  </p>
                </div>

                {/* PRESENT / LATEST STEP */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-amber-600 text-white font-black text-[10px] rounded uppercase tracking-wider">
                      2. LATEST PROCEEDING
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-900">{lastUpdate.date}</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs mt-1.5 truncate">{lastUpdate.title}</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed truncate">{lastUpdate.description}</p>
                </div>

                {/* UPCOMING / END STAGE */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[10px] rounded uppercase tracking-wider">
                      3. UPCOMING / NEXT STAGE
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-900">{caseInfo.next_hearing_date}</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs mt-1.5">Next Hearing &amp; Action Plan</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Status: <span className="font-bold text-slate-900">{caseInfo.status}</span>. Advocate action plan active for upcoming court date.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. LATEST UPDATE & PROCEEDINGS DETAILS */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/20 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-amber-600 fill-amber-500" />
                  <h3 className="font-black text-sm text-amber-950 uppercase tracking-wide">
                    Latest Case Update &amp; Recent Proceeding
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 bg-amber-600 text-white font-mono font-bold text-[11px] rounded-lg">
                  {lastUpdate.date} · {lastUpdate.time}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-amber-950">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900">{lastUpdate.title}</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded">
                    Updated by: {lastUpdate.actor}
                  </span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200/60">
                  {lastUpdate.description}
                </p>
              </div>
            </div>

            {/* 4. CASE DISCUSSIONS & ADVOCATE NOTES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Case Discussions & Notes */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-600" />
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                      Case Discussions &amp; Advocate Notes ({notes.length})
                    </h3>
                  </div>
                </div>

                {notes.length > 0 ? (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
                    {notes.map((n, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-indigo-950">{n.author} ({n.category})</span>
                          <span className="text-slate-400 font-mono">{n.date}</span>
                        </div>
                        <p className="text-slate-800 font-medium leading-normal">{n.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl">
                    {aiAnalysis.discussionHighlights || "No internal discussion notes logged yet."}
                  </p>
                )}
              </div>

              {/* Payment & Invoice Financial Overview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-emerald-600" />
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                      Payment &amp; Financial Overview
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                    paymentInfo.payment_status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {paymentInfo.payment_status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Total Fee</p>
                    <p className="font-black text-slate-900 mt-0.5">₹{paymentInfo.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Paid Amount</p>
                    <p className="font-black text-emerald-700 mt-0.5">₹{paymentInfo.paid_amount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Pending Balance</p>
                    <p className="font-black text-amber-700 mt-0.5">₹{paymentInfo.pending_amount}</p>
                  </div>
                </div>

                {paymentInfo.invoices.length > 0 ? (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                    {paymentInfo.invoices.map((inv, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{inv.invoice_number}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">Due: {inv.due_date}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900">₹{inv.amount}</span>
                          <span className={`block font-bold text-[10px] uppercase ${
                            inv.status === "Paid" ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl text-center">
                    No billing invoices generated for this case yet.
                  </p>
                )}
              </div>
            </div>

            {/* 5. ADVOCATE REPRESENTATION & NEXT HEARING ACTION PLAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Advocate Team Representation */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <UserCheck size={16} className="text-purple-600" />
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                    Assigned Advocate Team Representation
                  </h3>
                </div>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  {aiAnalysis.assignedAdvocateDetails}
                </p>
                {assignedMembers.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {assignedMembers.map((m, i) => (
                      <div key={i} className="bg-purple-50/70 border border-purple-150 p-2.5 rounded-xl text-xs flex items-center justify-between">
                        <span className="font-bold text-purple-950">{m.advocate_name}</span>
                        <span className="text-[11px] font-bold text-purple-700">{m.assigned_role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tactical Next Hearing Action Plan */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Shield size={16} className="text-emerald-400" />
                  <h3 className="font-black text-xs sm:text-sm text-emerald-400 uppercase tracking-wide">
                    Advocate Action Plan for Next Hearing ({caseInfo.next_hearing_date})
                  </h3>
                </div>
                <div className="space-y-2">
                  {(aiAnalysis.actionPlan || []).map((action, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200 font-medium">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── FOOTER BAR ────────────────────────────────────────────── */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between shrink-0 gap-4">
          <p className="text-[11px] text-slate-500 italic hidden sm:block">
            * Complete AI progress analysis based on live database records, discussions, payments, and eCourts updates.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Back to Case Details</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
