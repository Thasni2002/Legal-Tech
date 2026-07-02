"use client";

import { useState, useEffect } from "react";
import { Upload, Eye, Trash, FileText, Download, ExternalLink, X } from "lucide-react";
import useModulePermission from "@/utils/useModulePermission";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";
import { createPortal } from "react-dom";

const AccessDenied = ({ action }) => (
  <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
    <span>🔒</span>
    <span>{action} not permitted</span>
  </div>
);

export default function ClientDocuments() {
  const { perms, loading } = useModulePermission("Documents");

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [matchedCases, setMatchedCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");

  const fetchClientDocs = async () => {
    try {
      const user = getLoggedInUser();
      const clientName = (user?.username || user?.name || "").trim().toLowerCase();
      if (!clientName) {
        setLoadingDocs(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/case-management/`);
      if (res.ok) {
        const casesData = await res.json();
        // Filter cases matching client name
        const casesArray = Array.isArray(casesData)
          ? casesData
          : Array.isArray(casesData.results)
          ? casesData.results
          : Array.isArray(casesData.data)
          ? casesData.data
          : [];

        const filtered = casesArray.filter(item => {
          const itemClientName = (item.client_name || "").trim().toLowerCase();
          return itemClientName === clientName || clientName.includes(itemClientName) || itemClientName.includes(clientName);
        });

        setMatchedCases(filtered);

        // Pre-select the first case if not set already
        if (filtered.length > 0 && !selectedCaseId) {
          setSelectedCaseId(filtered[0].id.toString());
        }

        // Extract documents from matched cases
        const docItems = [];
        filtered.forEach(item => {
          const docs = Array.isArray(item.documents) ? item.documents : [];
          docs.forEach((doc, idx) => {
            if (!doc.file && !doc.url) return; // skip empty entries
            docItems.push({
              id: `db-doc-${item.id}-${idx}`,
              name: doc.documentType || "Document",
              type: doc.documentType || "Document",
              fileName: doc.file || "File",
              fileUrl: doc.url || null,
              date: item.created_at ? item.created_at.replace(" ", "T").split("T")[0] : new Date().toISOString().split("T")[0],
              status: "Submitted",
            });
          });
        });
        setDocuments(docItems);
      }
    } catch (err) {
      console.error("Failed to fetch client documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchClientDocs();
  }, []);

  const handleUpload = () => {
    if (!perms.add) {
      alert("You do not have permission to upload documents.");
      return;
    }
    if (!documentName || !documentType || !file || !selectedCaseId) {
      alert("Please fill all fields and select a case");
      return;
    }

    const targetCase = matchedCases.find(c => c.id.toString() === selectedCaseId.toString());
    if (!targetCase) {
      alert("Selected case not found.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Url = reader.result;

      const newDoc = {
        documentType: documentType,
        advocate: targetCase.selected_advocate || "",
        file: file.name,
        url: base64Url,
        view: true,
        upload: true,
        edit: true,
        delete: true,
      };

      const existingDocs = Array.isArray(targetCase.documents) ? targetCase.documents : [];
      const updatedDocs = [...existingDocs, newDoc];

      const payload = {
        caseId: targetCase.case_id,
        cnrNumber: targetCase.cnr_number,
        caseTitle: targetCase.case_title,
        caseNo: targetCase.case_no,
        caseType: targetCase.case_type,
        caseDes: targetCase.case_description,
        clientName: targetCase.client_name,
        contactNumber: targetCase.contact_number,
        emailId: targetCase.email_id,
        courtName: targetCase.court_name,
        courtType: targetCase.court_type,
        status: targetCase.status,
        selectedAdvocate: targetCase.selected_advocate,
        documents: updatedDocs.map(d => ({
          documentType: d.documentType,
          advocate: d.advocate || "",
          file: d.file,
          url: d.url || null,
          view: d.view !== undefined ? d.view : true,
          upload: d.upload !== undefined ? d.upload : true,
          edit: d.edit !== undefined ? d.edit : true,
          delete: d.delete !== undefined ? d.delete : true,
        })),
        nextHearingDate: targetCase.next_hearing_date,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/case-management/${targetCase.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          alert("Document uploaded successfully!");
          setDocumentName("");
          setDocumentType("");
          setFile(null);
          fetchClientDocs();
        } else {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.detail || "Failed to upload document");
        }
      } catch (err) {
        console.error("Upload document failed:", err);
        alert(err.message || "Failed to upload document. Please try again.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (docId) => {
    if (!perms.delete) {
      alert("You do not have permission to delete documents.");
      return;
    }

    if (typeof docId === "string" && docId.startsWith("db-doc-")) {
      const parts = docId.split("-");
      const caseIdStr = parts[2];
      const docIndex = parseInt(parts[3], 10);

      const targetCase = matchedCases.find(c => c.id.toString() === caseIdStr);
      if (!targetCase) {
        alert("Case associated with document not found.");
        return;
      }

      const existingDocs = Array.isArray(targetCase.documents) ? targetCase.documents : [];
      const updatedDocs = existingDocs.filter((_, idx) => idx !== docIndex);

      const payload = {
        caseId: targetCase.case_id,
        cnrNumber: targetCase.cnr_number,
        caseTitle: targetCase.case_title,
        caseNo: targetCase.case_no,
        caseType: targetCase.case_type,
        caseDes: targetCase.case_description,
        clientName: targetCase.client_name,
        contactNumber: targetCase.contact_number,
        emailId: targetCase.email_id,
        courtName: targetCase.court_name,
        courtType: targetCase.court_type,
        status: targetCase.status,
        selectedAdvocate: targetCase.selected_advocate,
        documents: updatedDocs.map(d => ({
          documentType: d.documentType,
          advocate: d.advocate || "",
          file: d.file,
          url: d.url || null,
          view: d.view !== undefined ? d.view : true,
          upload: d.upload !== undefined ? d.upload : true,
          edit: d.edit !== undefined ? d.edit : true,
          delete: d.delete !== undefined ? d.delete : true,
        })),
        nextHearingDate: targetCase.next_hearing_date,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/case-management/${targetCase.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          alert("Document deleted successfully!");
          fetchClientDocs();
        } else {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.detail || "Failed to delete document");
        }
      } catch (err) {
        console.error("Delete document failed:", err);
        alert(err.message || "Failed to delete document. Please try again.");
      }
    } else {
      setDocuments(documents.filter((doc) => doc.id !== docId));
    }
  };

  // No view access → show access denied page
  if (!loading && !perms.view) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 max-w-sm text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-sm mt-2">
            You do not have permission to view Documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:space-y-8">

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Documents
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Upload and manage documents for your advocate
        </p>
      </div>

      {/* Upload Section — only shown if add is allowed */}
      <div className="bg-white rounded-xl border-[#E2E8F0] p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Upload New Document</h2>

        {perms.add ? (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg p-3 bg-white"
              >
                <option value="">Select Associated Case</option>
                {matchedCases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.case_title} ({item.case_no})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Document Title"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg p-3"
              />
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg p-3"
              >
                <option value="">Select Document Type</option>
                <option>Agreement</option>
                <option>ID Proof</option>
                <option>Evidence</option>
                <option>Affidavit</option>
                <option>Case File</option>
                <option>Audio Recording</option>
                <option>Video Footage</option>
                <option>Written Document</option>
                <option>Other</option>
              </select>
              <input
                type="file"
                accept="audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif"
                onChange={(e) => setFile(e.target.files[0])}
                className="border border-[#E2E8F0] rounded-lg p-2"
              />
            </div>
            {matchedCases.length === 0 && (
              <p className="text-xs text-red-500 mt-2">
                ⚠️ No cases found matching your client name. Please contact your advocate to create a case for you.
              </p>
            )}
            <button
              onClick={handleUpload}
              className="mt-5 bg-[#2563EB] text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <Upload size={18} />
              Upload Document
            </button>
          </>
        ) : (
          <AccessDenied action="Uploading" />
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border-[#E2E8F0] p-6 shadow-sm overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Uploaded Documents</h2>

        {loadingDocs ? (
          <div className="py-8 text-center text-slate-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-slate-500">No documents found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]">
                <th className="text-left p-3">Case Title</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">File Name</th>
                <th className="text-left p-3">Uploaded Date</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-[#E2E8F0]">
                  <td className="p-3 font-semibold text-slate-800">{doc.name}</td>
                  <td className="p-3 text-slate-600">{doc.type}</td>
                  <td className="p-3 text-slate-600 font-mono text-xs">{doc.fileName}</td>
                  <td className="p-3 text-slate-500">{doc.date}</td>

                  <td className="p-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                      {doc.status}
                    </span>
                  </td>

                  <td className="p-3 flex gap-3 items-center">
                    {/* View — always shown if view=true */}
                    {perms.view && (
                      <button
                        onClick={() => setSelectedDoc({ fileUrl: doc.fileUrl, title: doc.fileName || doc.name, badge: doc.type })}
                        className="text-[#2563EB] hover:text-[#1d4ed8] cursor-pointer bg-transparent border-0 p-0 flex items-center"
                        title="View Document"
                      >
                        <Eye size={18} />
                      </button>
                    )}

                    {/* Delete */}
                    {perms.delete ? (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-[#DC2626] hover:text-[#991b1b] cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash size={18} />
                      </button>
                    ) : (
                      <span className="text-slate-300" title="Delete not permitted">
                        <Trash size={18} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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