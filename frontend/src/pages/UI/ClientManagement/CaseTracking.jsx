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

  // ── search filter — matches only on client name ──────────────
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const q = searchTerm.toLowerCase();
    return clients.filter((cl) => cl.name.toLowerCase().includes(q));
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
        // Update only the specific case in the raw cases list
        setCases((prev) =>
          prev.map((c) =>
            c.id === caseDbId ? { ...c, status: newStatus } : c
          )
        );
        // Also keep the modal in sync
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
    <div className="relative w-full space-y-6 md:space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/client-management"
            className="flex items-center justify-center w-9 h-9 bg-white border border-[#E2E8F0] rounded-lg shadow-sm text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Case Tracking
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Monitor litigation milestones, document trails, and schedules.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-[#94A3B8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search Client / Case…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* ── Client cards ── */}
      {filteredClients.length === 0 ? (
        <div className="text-center bg-white py-16 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B]">
          <Users size={32} className="mx-auto mb-3 text-slate-300" />
          No matching client or case found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => {
            const isExpanded = expandedClient === client.id;
            return (
              <div
                key={client.id}
                className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Card header — click to expand/collapse cases table */}
                <button
                  onClick={() =>
                    setExpandedClient(isExpanded ? null : client.id)
                  }
                  className="w-full flex items-center justify-between p-5 text-left group"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        {client.name}
                      </h2>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        ID: {client.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Case count badge */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Briefcase size={12} />
                      {client.cases.length}{" "}
                      {client.cases.length === 1 ? "Case" : "Cases"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp
                        size={18}
                        className="text-[#64748B] flex-shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                        className="text-[#64748B] flex-shrink-0"
                      />
                    )}
                  </div>
                </button>

                {/* Inline cases table — shown when expanded */}
                {isExpanded && (
                  <div className="border-t border-[#F1F5F9]">
                    <div className="overflow-x-auto">
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
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {client.cases.map((item, idx) => (
                            <tr
                              key={item.dbId || `${item.id}-${idx}`}
                              className="hover:bg-[#F8FAFC] transition-colors"
                            >
                              <td className="px-5 py-3 text-xs text-[#94A3B8] font-bold">
                                {idx + 1}
                              </td>
                              <td className="px-5 py-3 text-xs font-mono font-semibold text-[#1E293B]">
                                {item.id}
                              </td>
                              <td className="px-5 py-3 text-sm text-[#1E293B] max-w-[200px]">
                                <span className="line-clamp-2">{item.name}</span>
                              </td>
                              <td className="px-5 py-3 text-xs text-[#64748B]">
                                {item.court || "—"}
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusBadge(
                                    item.status
                                  )}`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  onClick={() => setSelectedCase(item)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
                                  <Eye size={13} />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Case Detail Modal (portal) ── */}
      {mounted && selectedCase && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
              <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9]">
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">
                      Case Details Log
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {selectedCase.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left — case info */}
                    <div className="space-y-3 text-sm text-[#64748B]">
                      {[
                        ["Case ID", selectedCase.id],
                        ["Case Title", selectedCase.name],
                        ["Case No.", selectedCase.case_no || "N/A"],
                        ["Advocate", selectedCase.selected_advocate || "N/A"],
                        ["Court", selectedCase.court],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2 last:border-0"
                        >
                          <span className="font-semibold text-[#1E293B] text-xs uppercase tracking-wide">
                            {label}
                          </span>
                          <span className="col-span-2 text-[#0F172A] font-medium">
                            {val}
                          </span>
                        </div>
                      ))}

                      {/* Status row */}
                      <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                        <span className="font-semibold text-[#1E293B] text-xs uppercase tracking-wide">
                          Status
                        </span>
                        <span className="col-span-2">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge(
                              selectedCase.status
                            )}`}
                          >
                            {selectedCase.status}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Right — docs + timeline */}
                    <div className="space-y-4">
                      {/* Documents */}
                      <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC]">
                        <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A] mb-3">
                          <Briefcase size={16} className="text-[#2563EB]" />
                          Documents
                        </div>
                        <ul className="text-xs space-y-2">
                          {selectedCase.documents &&
                          selectedCase.documents.length > 0 ? (
                            selectedCase.documents.map((doc, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/50 shadow-xs"
                              >
                                <span className="text-slate-700 flex items-center gap-1.5 font-medium truncate pr-2">
                                  <FileText
                                    size={14}
                                    className="text-slate-400 shrink-0"
                                  />
                                  <span className="truncate">
                                    {doc.file || "Unnamed Document"}
                                  </span>
                                </span>
                                {doc.file && (
                                  <button
                                    onClick={() =>
                                      setSelectedDoc({
                                        fileUrl: doc.url || null,
                                        title: doc.file,
                                        badge:
                                          doc.documentType || "Document",
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                                  >
                                    <Eye size={11} /> View
                                  </button>
                                )}
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-500 italic">
                              No documents uploaded
                            </li>
                          )}
                        </ul>
                      </div>


                    </div>
                  </div>

                  {/* ── Update Status ── */}
                  <div className="mt-6 border-t border-[#F1F5F9] pt-5">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-3">
                      Update Case Status
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative flex-1 min-w-[200px]">
                        <CheckCircle
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                        />
                        <select
                          className="w-full border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-white disabled:opacity-60"
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
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#64748B]">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                      {updatingStatus && (
                        <span className="text-xs text-[#64748B] animate-pulse">
                          Saving…
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

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