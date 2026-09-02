"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "@/utils/api";
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
  FileCheck,
  Shield,
  Layers,
  ChevronRight,
  User,
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
  const aiAnalysis = data?.ai_analysis || {};

  const handleDownload = () => {
    if (!data) return;
    const timeStr = new Date().toLocaleString();
    const fileName = `Master_Case_Progress_Summary_${caseId}_${Date.now()}.txt`;

    let fileContent = `================================================================================
LEGAL TECH ENTERPRISE — MASTER AI CASE PROGRESS & TIMELINE SUMMARY
================================================================================
Case Title: ${caseInfo.case_title || "N/A"}
Case No: ${caseInfo.case_no || "N/A"} | CNR: ${caseInfo.cnr_number || "N/A"}
Court: ${caseInfo.court_name || "N/A"} (${caseInfo.court_type || "N/A"})
Client: ${caseInfo.client_name || "N/A"} (${caseInfo.client_role || "Petitioner"}) | Phone: ${caseInfo.contact_number || "N/A"}
Filing Date: ${caseInfo.filing_date || "N/A"}
Next Hearing Date: ${caseInfo.next_hearing_date || "N/A"}
Status: ${caseInfo.status || "Active"}
Report Date: ${timeStr}
--------------------------------------------------------------------------------

I. EXECUTIVE MASTER CASE SUMMARY:
${aiAnalysis.masterSummary || "N/A"}

II. ASSIGNED ADVOCATE & LEGAL TEAM:
${aiAnalysis.assignedAdvocateDetails || "N/A"}
${assignedMembers.map((m, i) => `${i + 1}. ${m.advocate_name} (${m.assigned_role}) — Assigned: ${m.assigned_date} | Notes: ${m.assignment_notes}`).join("\n")}

III. NEXT HEARING PREPARATION & ACTION PLAN:
${aiAnalysis.nextHearingPreparation || "N/A"}

IV. CHRONOLOGICAL MILESTONES & JOURNEY:
${(aiAnalysis.chronologicalMilestones || []).map((m, i) => `• ${m}`).join("\n")}

V. LATEST UPDATES SUMMARY:
${aiAnalysis.latestUpdatesSummary || "N/A"}

VI. ADVOCATE DISCUSSIONS & NOTES (${notes.length} Entry/Entries):
${notes.map((n, i) => `[${n.date}] ${n.author} (${n.category}): ${n.text}`).join("\n")}

VII. FULL CHRONOLOGICAL TIMELINE EVENTS (${timelineEvents.length} Event/Events):
${timelineEvents.map((e, i) => `[${e.date || "N/A"}] #${e.event_number || i + 1} ${e.title}: ${e.description} (Actor: ${e.actor || "N/A"})`).join("\n")}

VIII. ADVOCATE ACTION PLAN FOR NEXT HEARING:
${(aiAnalysis.actionPlan || []).map((a, i) => `✓ ${a}`).join("\n")}
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
    <div className="fixed inset-0 z-[999999] bg-[#0F172A] flex flex-col w-screen h-screen overflow-hidden">
      <div className="bg-[#F8FAFC] w-full h-full flex flex-col overflow-hidden">
        
        {/* ── HEADER BAR ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 border-b border-indigo-900 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer shrink-0 border border-white/10"
              title="Back to Case"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-3 py-1 bg-indigo-600 text-white font-black text-[11px] rounded-lg uppercase tracking-wider">
                  AI Case Progress &amp; Timeline Summary
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-extrabold rounded-lg uppercase">
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
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download Case Brief</span>
            </button>
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Refresh"
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
            <p className="text-sm font-extrabold text-slate-800">Analyzing Complete Case Journey &amp; Updates…</p>
            <p className="text-xs text-slate-500">Processing timeline events, hearing logs, advocate notes, and document workflows.</p>
          </div>
        )}

        {/* ── ERROR STATE ───────────────────────────────────────────── */}
        {error && !loading && (
          <div className="p-8 text-center my-auto">
            <AlertTriangle size={36} className="text-rose-500 mx-auto mb-3" />
            <h4 className="font-extrabold text-slate-900 text-base mb-1">Failed to Load Summary</h4>
            <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchSummary}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── CONTENT BODY ──────────────────────────────────────────── */}
        {data && !loading && (
          <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 scrollbar-thin">

            {/* Quick Summary Stat Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck size={12} className="text-indigo-600" /> Assigned Advocates
                </p>
                <p className="font-black text-slate-800 mt-0.5 truncate">
                  {assignedMembers.map(m => m.advocate_name).join(", ") || caseInfo.selected_advocate || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User size={12} className="text-purple-600" /> Client Details
                </p>
                <p className="font-black text-slate-800 mt-0.5 truncate">
                  {caseInfo.client_name} ({caseInfo.client_role})
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} className="text-emerald-600" /> Next Hearing
                </p>
                <p className="font-black text-emerald-700 mt-0.5 truncate">
                  {caseInfo.next_hearing_date}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} className="text-amber-600" /> Timeline Events
                </p>
                <p className="font-black text-amber-700 mt-0.5">
                  {timelineEvents.length} Recorded Event(s)
                </p>
              </div>
            </div>

            {/* Master Summary Box */}
            <div className="space-y-2">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={16} className="text-indigo-600" /> Executive Master Case Summary &amp; Legal Standing
              </h3>
              <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 border border-indigo-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-900 leading-relaxed font-semibold">
                {aiAnalysis.masterSummary}
              </div>
            </div>

            {/* Assigned Advocates & Legal Team */}
            <div className="space-y-2">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={16} className="text-purple-600" /> Assigned Advocates &amp; Representation Team
              </h3>
              {assignedMembers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignedMembers.map((m, i) => (
                    <div key={i} className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-purple-950 text-sm">{m.advocate_name}</span>
                        <span className="px-2 py-0.5 bg-purple-200 text-purple-900 rounded font-bold text-[10px]">
                          {m.assigned_role}
                        </span>
                      </div>
                      <p className="text-purple-900 font-medium">Assigned: {m.assigned_date}</p>
                      <p className="text-slate-600 italic text-[11px]">Notes: {m.assignment_notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 font-medium">
                  {aiAnalysis.assignedAdvocateDetails}
                </div>
              )}
            </div>

            {/* Next Hearing Preparation & Action Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Next Hearing Prep */}
              <div className="space-y-2">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={16} className="text-emerald-600" /> Next Hearing Date Preparation
                </h3>
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-xs text-emerald-950 font-semibold leading-relaxed space-y-2">
                  <p>{aiAnalysis.nextHearingPreparation}</p>
                </div>
              </div>

              {/* Latest Updates Summary */}
              <div className="space-y-2">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={16} className="text-amber-500" /> Latest Hearing Updates &amp; Developments
                </h3>
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 font-semibold leading-relaxed">
                  <p>{aiAnalysis.latestUpdatesSummary}</p>
                </div>
              </div>
            </div>

            {/* Full Chronological Case Timeline Journey */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={16} className="text-blue-600" /> Complete Case Journey &amp; Timeline History ({timelineEvents.length} Events)
                </h3>
                <span className="text-[11px] font-bold text-slate-500">From Filing Date to Present</span>
              </div>

              {timelineEvents.length > 0 ? (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                  {timelineEvents.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-xs transition space-y-1 ${
                        evt.is_latest
                          ? "bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                            #{evt.event_number || timelineEvents.length - idx}
                          </span>
                          <span className="font-black text-slate-900 text-xs sm:text-sm">{evt.title}</span>
                          {evt.is_latest && (
                            <span className="px-2 py-0.5 bg-indigo-600 text-white font-extrabold text-[10px] rounded uppercase">
                              LATEST UPDATE
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-500 text-[11px] font-bold">
                          {evt.date} {evt.time ? `(${evt.time})` : ""}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">{evt.description}</p>
                      {evt.actor && (
                        <p className="text-[11px] text-slate-500 font-bold">Actor / Conducted by: {evt.actor}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 italic">
                  No chronological timeline events logged yet.
                </div>
              )}
            </div>

            {/* Advocate Notes, Discussions & Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Notes & Discussions */}
              <div className="space-y-2">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-indigo-600" /> Advocate Notes &amp; Discussions ({notes.length})
                </h3>
                {notes.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {notes.map((n, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{n.author} ({n.category})</span>
                          <span className="text-slate-400 font-mono">{n.date}</span>
                        </div>
                        <p className="text-slate-700 font-medium">{n.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 italic">
                    No advocate discussion notes logged yet.
                  </div>
                )}
              </div>

              {/* Action Plan */}
              <div className="space-y-2">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={16} className="text-emerald-600" /> Advocate Action Plan for Next Hearing
                </h3>
                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2.5">
                  {(aiAnalysis.actionPlan || []).map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-medium text-slate-200">
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
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0 gap-4">
          <p className="text-[11px] text-slate-500 italic hidden sm:block">
            * Complete AI progress analysis based on live database timeline events, assigned advocates, notes, and eCourts portal updates.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
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
