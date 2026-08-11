"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Clock,
  X,
  RefreshCw,
  Scale,
  FileText,
  Phone,
  UserCheck,
  Gavel,
  BookOpen,
} from "lucide-react";

// ─── Compact Futuristic Case Timeline Component ───────────────────────────
export default function CaseTimelineView({
  selectedCase,
  events = [],
  loading = false,
  selectedEvent = null,
  onSelectEvent = () => {},
  onRefresh = () => {},
  onViewDocument = null,
}) {
  const timelineRef = useRef(null);
  const detailsPanelRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedNodeTop, setSelectedNodeTop] = useState(0);
  const [activeNoteModal, setActiveNoteModal] = useState(null);

  useEffect(() => {
    if (selectedEvent && detailsPanelRef.current) {
      detailsPanelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (activeNoteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeNoteModal]);

  const handleNodeClick = (evt, e) => {
    if (selectedEvent?.id === evt.id) {
      onSelectEvent(null);
      setSelectedNodeTop(0);
    } else {
      onSelectEvent(evt);
      if (e && e.currentTarget && timelineRef.current) {
        const nodeRect = e.currentTarget.getBoundingClientRect();
        const containerRect = timelineRef.current.getBoundingClientRect();
        const relativeTop = Math.max(0, Math.round(nodeRect.top - containerRect.top));
        setSelectedNodeTop(relativeTop);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalHeight = rect.height;
      const currentPos = windowHeight - rect.top;
      const percentage = Math.min(100, Math.max(0, (currentPos / (totalHeight + windowHeight * 0.4)) * 100));
      setScrollProgress(percentage);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-3xl">
        <div className="w-9 h-9 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Loading case timeline...
        </p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto shadow-xs">
        <Clock size={36} className="text-slate-300 mx-auto" />
        <h4 className="text-sm font-bold text-slate-700">No Case Activities Recorded</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Case activities will automatically appear here chronologically as events occur.
        </p>
      </div>
    );
  }

  const getCategoryBadge = (category) => {
    switch (category) {
      case "Case":
        return { bg: "bg-blue-50 text-blue-700 border-blue-200", icon: <Scale size={10} />, label: "Case" };
      case "Document":
        return { bg: "bg-purple-50 text-purple-700 border-purple-200", icon: <FileText size={10} />, label: "Document" };
      case "Discussion":
        return { bg: "bg-amber-50 text-amber-800 border-amber-200", icon: <Phone size={10} />, label: "Discussion" };
      case "Meeting Notes":
      case "Meeting Note":
        return { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <FileText size={10} />, label: "Meeting Notes" };
      case "Approval":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <UserCheck size={10} />, label: "Approval" };
      case "Hearing":
        return { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: <Gavel size={10} />, label: "Hearing" };
      case "Note":
        return { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <BookOpen size={10} />, label: "Note" };
      case "Status Update":
        return { bg: "bg-slate-900 text-white border-slate-800", icon: <RefreshCw size={10} />, label: "Status" };
      default:
        return { bg: "bg-slate-100 text-slate-700 border-slate-200", icon: <Clock size={10} />, label: "Activity" };
    }
  };


  const isDetailOpen = selectedEvent !== null;

  return (
    <div className="space-y-5 transition-all duration-500 ease-in-out">
      {/* MEETING NOTE FULL MODAL */}
      {activeNoteModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 text-slate-800 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                <h3 className="font-bold text-base text-slate-900">{activeNoteModal.title || "Meeting Note"}</h3>
              </div>
              <button
                onClick={() => setActiveNoteModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Client</span>
                  <span className="font-bold text-slate-900">{activeNoteModal.client_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Meeting Date</span>
                  <span className="font-semibold text-slate-800">{activeNoteModal.meeting_date || activeNoteModal.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Meeting Type</span>
                  <span className="font-semibold text-slate-800">{activeNoteModal.meeting_type || "Video Call"}</span>
                </div>
              </div>

              {activeNoteModal.summary && (
                <div>
                  <h4 className="font-bold text-[11px] uppercase text-slate-500 mb-1">Executive Summary</h4>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap text-slate-800">
                    {activeNoteModal.summary}
                  </div>
                </div>
              )}

              {activeNoteModal.key_topics && (
                <div>
                  <h4 className="font-bold text-[11px] uppercase text-slate-500 mb-1">Key Topics & Discussion Points</h4>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap text-slate-800">
                    {activeNoteModal.key_topics}
                  </div>
                </div>
              )}

              {activeNoteModal.legal_advice && (
                <div>
                  <h4 className="font-bold text-[11px] uppercase text-emerald-600 mb-1">Legal Advice & Recommendations</h4>
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-emerald-900 whitespace-pre-wrap">
                    {activeNoteModal.legal_advice}
                  </div>
                </div>
              )}

              {activeNoteModal.action_items && activeNoteModal.action_items.length > 0 && (
                <div>
                  <h4 className="font-bold text-[11px] uppercase text-indigo-600 mb-1">Action Tasks & Next Steps</h4>
                  <div className="space-y-1">
                    {activeNoteModal.action_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-800">
                        <span>{item.completed ? "☑" : "☐"} <strong>{item.task}</strong></span>
                        {item.assignee && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">{item.assignee}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeNoteModal.internal_notes && (
                <div>
                  <h4 className="font-bold text-[11px] uppercase text-rose-600 mb-1">Advocate Internal Notes (Confidential)</h4>
                  <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 text-rose-900 whitespace-pre-wrap">
                    {activeNoteModal.internal_notes}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveNoteModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close Notes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Sleek Top Bar Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-4.5 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles size={16} className="text-cyan-400 shrink-0 animate-pulse" />
            <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
              Case Journey &amp; Activity History
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              {events.length} Events
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-Sync Active
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Latest activity at top · Scroll down to <strong>Number 1 — Case Started</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDetailOpen && (
            <button
              onClick={() => onSelectEvent(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-cyan-500/30 shrink-0"
            >
              <X size={13} /> Center View
            </button>
          )}
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-blue-600/40 hover:bg-blue-600/60 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-400/30 shrink-0"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Interactive Layout Wrapper */}
      <div ref={timelineRef} className="w-full relative min-h-[450px]">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          {/* TIMELINE STREAM COLUMN */}
          <div
            className={`space-y-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
              isDetailOpen
                ? "w-full lg:w-5/12"
                : "w-full max-w-md mx-auto"
            }`}
          >
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#2563EB]" /> Case Timeline Stream
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {isDetailOpen ? "Click event to toggle panel" : "Click event to view details"}
                </span>
              </div>

              <div className="relative pl-7 space-y-3">
                <div className="absolute left-[13px] top-3.5 bottom-3.5 w-0.5 bg-slate-800/90 rounded-full" />
                <div
                  className="absolute left-[13px] top-3.5 w-0.5 bg-gradient-to-b from-amber-400 via-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-150 ease-out rounded-full z-0"
                  style={{ height: `${scrollProgress}%` }}
                />
                <div
                  className="absolute left-[10px] w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,1)] ring-2 ring-cyan-200 animate-pulse transition-all duration-150 ease-out z-10 -translate-y-1/2"
                  style={{ top: `${scrollProgress}%` }}
                />

                {events.map((evt, idx) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  const isLatest = evt.is_latest || idx === 0;
                  const badge = getCategoryBadge(evt.category);
                  const eventNum = evt.event_number || events.length - idx;
                  const nodeThreshold = (idx / Math.max(1, events.length - 1)) * 100;
                  const isPassed = scrollProgress >= nodeThreshold - 10;
                  const hasNote = evt.type === "consultation_meeting" || evt.metadata?.has_meeting_notes;

                  return (
                    <div
                      key={evt.id || idx}
                      onClick={(e) => handleNodeClick(evt, e)}
                      className="relative group cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <div
                        className={`absolute -left-[34px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${
                          isSelected
                            ? "bg-[#0F172A] text-cyan-400 ring-4 ring-cyan-500/30 border border-cyan-400 shadow-md scale-110 z-20"
                            : isLatest
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-amber-300 shadow-sm animate-pulse z-20"
                            : isPassed
                            ? "bg-slate-900 border border-cyan-500/70 text-cyan-300 shadow-2xs z-10"
                            : "bg-slate-900 border border-slate-700 text-slate-300 group-hover:border-cyan-400 group-hover:text-cyan-300"
                        }`}
                      >
                        {eventNum}
                      </div>

                      <div
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-300 ${
                          isSelected
                            ? "bg-blue-50/90 border-[#2563EB] shadow-md ring-2 ring-blue-500/20"
                            : isLatest
                            ? "bg-amber-50/40 border-amber-200 shadow-2xs hover:border-amber-300"
                            : "bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-black text-slate-900 tracking-tight">
                            {eventNum} — {evt.title}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${badge.bg}`}>
                            {badge.icon} {badge.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1 text-[10px] font-medium text-slate-500">
                          <span>📅 {evt.date} · {evt.time}</span>
                          {hasNote && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveNoteModal(evt.metadata || evt);
                              }}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[9px] flex items-center gap-1 transition shadow-xs"
                            >
                              <FileText size={10} /> View Notes
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT DETAILS PANEL */}
          {isDetailOpen && (
            <div
              ref={detailsPanelRef}
              style={{ marginTop: `${selectedNodeTop}px` }}
              className="w-full lg:w-7/12 space-y-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in slide-in-from-right-16 fade-in"
            >
              <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 text-[#0F172A]">
                <div className="border-b border-slate-100 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[11px] uppercase tracking-wider">
                      Event #{selectedEvent.event_number} Details — {selectedEvent.category}
                    </span>
                    <button
                      onClick={() => onSelectEvent(null)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Close details panel"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <h3 className="text-sm sm:text-base font-black text-[#0F172A] leading-snug">
                      {selectedEvent.event_number} — {selectedEvent.title}
                    </h3>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      📅 {selectedEvent.date} at {selectedEvent.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    Performed By: <strong className="text-slate-800 font-bold">{selectedEvent.actor || "System"}</strong> · Status: <span className="font-extrabold text-emerald-700">{selectedEvent.status || "Active"}</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Activity Overview</p>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>

                {(selectedEvent.type === "consultation_meeting" || selectedEvent.metadata?.has_meeting_notes) && (
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs">
                        <FileText size={15} className="text-indigo-600" />
                        Recorded Meeting Notes
                      </span>
                      <button
                        onClick={() => setActiveNoteModal(selectedEvent.metadata || selectedEvent)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition text-xs shadow-xs"
                      >
                        <FileText size={13} /> View Full Meeting Notes
                      </button>
                    </div>

                    {selectedEvent.metadata?.summary && (
                      <p className="text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-indigo-100">
                        {selectedEvent.metadata.summary}
                      </p>
                    )}
                  </div>
                )}

                {selectedEvent.type === "case_created" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs">
                    <div>
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Case Start Date &amp; Time</p>
                      <p className="font-extrabold text-blue-900 mt-0.5">📅 {selectedEvent.date} at {selectedEvent.time}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Case Number</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">#{selectedEvent.metadata?.case_no || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">CNR Number</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{selectedEvent.metadata?.cnr_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Client Name</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{selectedEvent.metadata?.client_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Assigned Lead Advocate</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{selectedEvent.metadata?.advocate_assigned || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Court &amp; Forum</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{selectedEvent.metadata?.court_name || "Court"}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.type === "document_uploaded" && (() => {
                  const meta = selectedEvent.metadata || {};
                  const url = (meta.url || "").trim();
                  const file = (meta.file_name || "").trim();
                  const hasValidUrl = url && url !== "null" && url !== "undefined";
                  const hasValidFile = file && (file.startsWith("http://") || file.startsWith("https://") || file.startsWith("data:") || file.startsWith("/") || /\.(pdf|png|jpe?g|gif|webp|svg|docx?|xlsx?|txt|md|html|json)$/i.test(file));
                  const canView = hasValidUrl || hasValidFile;

                  return (
                    <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-bold text-purple-700 uppercase tracking-wider">Document File Name</p>
                          <p className="font-extrabold text-slate-900 mt-0.5 truncate">{meta.file_name || "Case Document"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-purple-700 uppercase tracking-wider">Document Type</p>
                          <p className="font-extrabold text-slate-900 mt-0.5">{meta.document_type || "Uploaded Document"}</p>
                        </div>
                      </div>

                      {canView && (
                        <button
                          onClick={() => onViewDocument && onViewDocument({
                            file: meta.file_name,
                            url: meta.url,
                            fileUrl: meta.url,
                            documentType: meta.document_type
                          })}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-95 text-xs"
                        >
                          <FileText size={13} /> Open &amp; View Document
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

