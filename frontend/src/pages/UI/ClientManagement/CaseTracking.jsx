"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Eye,

  Briefcase,
  CheckCircle,
  Clock,
  ArrowLeft,
  User,
  X,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api";
export default function CaseTracking() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
    loadCases();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build clients dynamically from cases
  const clientsMap = {};
  cases.forEach((c) => {
    const name = c.client_name || "Unknown Client";
    if (!clientsMap[name]) {
      clientsMap[name] = {
        id: `CL-${name.replace(/\s+/g, "").substring(0, 5).toUpperCase()}-${c.contact_number || "000"}`,
        name: name,
        cases: [],
      };
    }
    clientsMap[name].cases.push({
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
  const clients = Object.values(clientsMap);

  const filteredClients = clients.filter(
    (client) =>
      client.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      client.cases.some((c) =>
        c.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-xl border border-[#E2E8F0]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#64748B] font-medium">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className={`space-y-6 md:space-y-8 ${selectedCase ? "hidden" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/client-management"
            className="flex items-center justify-center w-9 h-9 bg-white border border-[#E2E8F0] rounded-lg shadow-sm text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors cursor-pointer"
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

        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </span>
          <input
            type="text"
            placeholder="Search Client / Case..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200 shadow-sm"
          />
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center bg-white py-12 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B]">
            No matching client or case found.
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-bold text-base text-[#0F172A]">{client.name}</h2>
                  <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] font-mono px-2 py-0.5 rounded border border-[#E2E8F0] font-semibold">
                    ID: {client.id}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#64748B] mt-3">
                  <p>
                    <span className="font-semibold text-[#1E293B]">Case:</span>{" "}
                    {client.cases[0]?.name}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Court:</span>{" "}
                    {client.cases[0]?.court}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedClient(client);
                  if (client.cases && client.cases.length > 0) {
                    setSelectedCase(client.cases[0]);
                  } else {
                    setSelectedCase(null);
                  }
                }}
                className="mt-5 w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer"
              >
                View Cases
              </button>
            </div>
          ))
        )}
      </div>

      {/* Cases Table */}
      {selectedClient && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">
            Cases of {selectedClient.name}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC]">
                  <th className="p-3 font-medium">Case ID</th>
                  <th className="p-3 font-medium">Case Name</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {selectedClient.cases.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-3 text-sm font-medium text-[#1E293B]">{item.id}</td>
                    <td className="p-3 text-sm text-[#1E293B]">{item.name}</td>
                    <td className="p-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200/50">
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCase(item);
                            
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors duration-200 cursor-pointer"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>

      {/* Case Details */}
      {mounted && selectedCase && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedCase(null);
                setSelectedClient(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold text-[#0F172A] mb-5 border-b border-[#F1F5F9] pb-3 pr-10">
              Case Details Log
            </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 text-sm text-[#64748B]">
              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Case ID</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.id}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Case Name</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.name}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Case Number</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.case_no || "N/A"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Advocate Name</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.selected_advocate || "N/A"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Status</span>
                <span className="col-span-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
                    {selectedCase.status}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Court</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.court}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pb-2">
                <span className="font-semibold text-[#1E293B]">Next Hearing</span>
                <span className="col-span-2 text-[#0F172A] font-semibold">{selectedCase.hearing}</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Documents */}
              <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A] mb-3">
                  <Briefcase size={16} className="text-[#2563EB]" />
                  Documents
                </div>

                <ul className="text-xs space-y-2.5">
                  {selectedCase.documents && selectedCase.documents.length > 0 ? (
                    selectedCase.documents.map((doc, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/50 shadow-xs">
                        <span className="text-slate-700 flex items-center gap-1.5 font-medium truncate pr-2">
                          <FileText size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{doc.file || "Unnamed Document"}</span>
                        </span>
                        {doc.file && (
                          <button
                            onClick={() => setSelectedDoc({ fileUrl: doc.url || null, title: doc.file, badge: doc.documentType || "Document" })}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                          >
                            <Eye size={11} /> View
                          </button>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 italic">No documents uploaded</li>
                  )}
                </ul>
              </div>

              {/* Timeline */}
              <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A] mb-3">
                  <Clock size={16} className="text-[#2563EB]" />
                  Timeline
                </div>

                <ul className="text-xs space-y-2 text-[#64748B] font-medium">
                  {selectedCase.hearing && selectedCase.hearing !== "N/A" ? (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                      Next Hearing Scheduled: {selectedCase.hearing}
                    </li>
                  ) : (
                    <li className="text-gray-500 italic">No timeline events</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Added Dropdowns at the bottom of Case Details Log as requested */}
          <div className="mt-8 border-t border-[#F1F5F9] pt-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Quick Filters / Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Client Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  />
                  <input
                    type="text"
                    list="client-options"
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-search-cancel-button]:hidden"
                    defaultValue={selectedClient?.name || ""}
                    placeholder="Search client..."
                  />
                  <datalist id="client-options">
                    {clients.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Status
                </label>
                <div className="relative">
                  <CheckCircle
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  />
                  <select
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                    value={selectedCase?.status || "Active"}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      if (!selectedCase) return;
                      try {
                        const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.dbId}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            status: newStatus,
                          }),
                        });
                        if (res.ok) {
                          // Update locally
                          const updatedCase = { ...selectedCase, status: newStatus };
                          setSelectedCase(updatedCase);
                          // Update cases list locally
                          setCases((prev) => 
                            prev.map((c) => c.id === selectedCase.dbId ? { ...c, status: newStatus } : c)
                          );
                        } else {
                          alert("Failed to update status");
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    <option value="Case Submit">Case Submit</option>
                    <option value="Document Upload">Document Upload</option>
                    <option value="Hearing Scheduled">Hearing Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                    <option value="Active">Active</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>,
        document.body
      ) : null}

      
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

function DocumentViewerModal({ fileUrl, title, badge, onClose }) {
  const [viewerUrl, setViewerUrl] = useState("");
  const [isPdf, setIsPdf] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [isAudio, setIsAudio] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  const normalizeUrl = (url) => {
    if (!url) return "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "127.0.0.1") {
        return url.replace("localhost:8000", "127.0.0.1:8000");
      } else {
        return url.replace("127.0.0.1:8000", "localhost:8000");
      }
    }
    return url;
  };

  const effectiveUrl = fileUrl || (title && (title.includes(".") || title.toLowerCase().endsWith(".pdf") || title.toLowerCase().endsWith(".jpg") || title.toLowerCase().endsWith(".png") || title.toLowerCase().endsWith(".jpeg")) ? `http://localhost:8000/uploads/${title}` : "");
  const normalizedUrl = normalizeUrl(effectiveUrl);

  useEffect(() => {
    if (!effectiveUrl) return;

    // Detect file type
    if (effectiveUrl.startsWith("data:")) {
      const mime = effectiveUrl.split(";")[0].split(":")[1] || "";
      setIsImage(mime.startsWith("image/"));
      setIsPdf(mime === "application/pdf");
      setIsAudio(mime.startsWith("audio/"));
      setIsVideo(mime.startsWith("video/"));

      try {
        const parts = effectiveUrl.split(",");
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mimeType });
        const bUrl = URL.createObjectURL(blob);
        setViewerUrl(bUrl);
        return () => {
          URL.revokeObjectURL(bUrl);
        };
      } catch (e) {
        console.error("Failed to parse base64 for preview:", e);
        setViewerUrl(effectiveUrl);
      }
    } else {
      let ext = (effectiveUrl || "").split(".").pop().toLowerCase().split("?")[0];
      if (effectiveUrl.startsWith("blob:") || ext.length > 5) {
        ext = (title || "").split(".").pop().toLowerCase().split("?")[0];
      }
      setIsImage(["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(ext));
      setIsPdf(ext === "pdf");
      setIsAudio(["mp3", "wav", "ogg", "aac", "m4a", "wma", "flac"].includes(ext));
      setIsVideo(["mp4", "webm", "ogg", "mov", "avi", "mkv", "3gp"].includes(ext));
      setViewerUrl(normalizedUrl);
    }
  }, [effectiveUrl]);

  const handleDownload = () => {
    if (!normalizedUrl) return;

    if (normalizedUrl.startsWith("data:")) {
      try {
        const parts = normalizedUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = title || "document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("Base64 download failed, fallback to direct open:", err);
        window.open(normalizedUrl, "_blank");
      }
    } else {
      window.location.href = normalizedUrl + "?download=true";
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">{title || "Document"}</h3>
              {badge && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <Download size={13} /> Download
            </button>
            <a href={normalizedUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition">
              <ExternalLink size={13} /> Open in Tab
            </a>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Viewer Body */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[400px]">
          {!viewerUrl ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center">
                <FileText size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">No preview available</p>
                <p className="text-xs text-slate-500 mt-1">This document has no uploaded file data to preview.</p>
              </div>
            </div>
          ) : isPdf ? (
            <iframe src={viewerUrl} className="w-full h-full min-h-[600px] border-0" title={title || "Document"} />
          ) : isImage ? (
            <div className="p-6">
              <img src={viewerUrl} alt={title || "Document"} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />
            </div>
          ) : isAudio ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 bg-white rounded-xl border border-slate-200 w-full max-w-md mx-auto my-8 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center shadow-xs">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="font-bold text-slate-700 text-sm text-center truncate max-w-full">{title}</p>
              <audio controls src={viewerUrl} className="w-full mt-2 focus:outline-none" />
            </div>
          ) : isVideo ? (
            <div className="p-6 flex items-center justify-center max-w-full w-full h-full">
              <video controls src={viewerUrl} className="max-w-full max-h-[70vh] rounded-xl shadow-lg border border-slate-200" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center">
                <FileText size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">Preview not available</p>
                <p className="text-xs text-slate-500 mt-1">This file type cannot be previewed in the browser.</p>
              </div>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Download size={14} /> Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}