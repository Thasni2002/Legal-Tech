"use client";

import { API_BASE_URL } from "@/utils/api";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  FileText,
  Calendar,
  X,
  User,
  Building2,
  Download,
  Briefcase,
  File,
  Gavel,
  Trash2,
  Lock,
  Upload,
  Pencil,
  ShieldOff,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import useModulePermission from "@/utils/useModulePermission";
import { getLoggedInUser } from "@/utils/auth";




const getStatusSelectClass = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "Closed":
      return "bg-red-100 text-red-700 border-red-200";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "To Do":
      return "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-50 text-green-700 border border-green-100";
    case "Closed":
      return "bg-red-50 text-red-700 border border-red-100";
    case "In Progress":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "Active":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "To Do":
      return "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]";
    default:
      return "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]";
  }
};

export default function AssignedCasesView() {
  const { perms, loading } = useModulePermission("Assigned Cases");
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalViewMode, setModalViewMode] = useState("full");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Edit (rename) state
  const [editingDocIdx, setEditingDocIdx] = useState(null);
  const [editingDocName, setEditingDocName] = useState("");

  // Doc-level delete confirm
  const [docDeleteIdx, setDocDeleteIdx] = useState(null);

  const [viewerUrl, setViewerUrl] = useState("");
  const [isPdf, setIsPdf] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [isAudio, setIsAudio] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    fetchAssignedCases();
  }, []);

  useEffect(() => {
    if (!selectedDocument) {
      setViewerUrl("");
      setIsPdf(false);
      setIsImage(false);
      setIsAudio(false);
      setIsVideo(false);
      return;
    }

    let fileUrl = selectedDocument.url || selectedDocument.file_path;
    if (!fileUrl && selectedDocument.file) {
      const title = selectedDocument.file;
      if (title.includes(".") || title.toLowerCase().endsWith(".pdf") || title.toLowerCase().endsWith(".jpg") || title.toLowerCase().endsWith(".png") || title.toLowerCase().endsWith(".jpeg")) {
        fileUrl = `http://localhost:8000/uploads/${title}`;
      }
    }

    if (!fileUrl) {
      setViewerUrl("");
      setIsPdf(false);
      setIsImage(false);
      setIsAudio(false);
      setIsVideo(false);
      return;
    }

    if (fileUrl.startsWith("data:")) {
      const mime = fileUrl.split(";")[0].split(":")[1] || "";
      setIsImage(mime.startsWith("image/"));
      setIsPdf(mime === "application/pdf");
      setIsAudio(mime.startsWith("audio/"));
      setIsVideo(mime.startsWith("video/"));

      try {
        const parts = fileUrl.split(",");
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
        console.error("Failed to parse base64 for preview in AssignedCases:", e);
        setViewerUrl(fileUrl);
      }
    } else {
      let ext = (fileUrl || "").split(".").pop().toLowerCase().split("?")[0];
      if (fileUrl.startsWith("blob:") || ext.length > 5) {
        ext = (selectedDocument.file || "").split(".").pop().toLowerCase().split("?")[0];
      }
      setIsImage(["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(ext));
      setIsPdf(ext === "pdf");
      setIsAudio(["mp3", "wav", "ogg", "aac", "m4a", "wma", "flac"].includes(ext));
      setIsVideo(["mp4", "webm", "ogg", "mov", "avi", "mkv", "3gp"].includes(ext));
      
      let normalized = fileUrl;
      if (typeof window !== "undefined") {
        if (window.location.hostname === "127.0.0.1") {
          normalized = fileUrl.replace("localhost:8000", "127.0.0.1:8000");
        } else {
          normalized = fileUrl.replace("127.0.0.1:8000", "localhost:8000");
        }
      }
      setViewerUrl(normalized);
    }
  }, [selectedDocument]);

  const fetchAssignedCases = async () => {
    try {
      const user = getLoggedInUser();
      const res = await fetch(
        `${API_BASE_URL}/lawfirm-management/assigned-cases`
      );
      const data = await res.json();

      let casesToShow = data;
      if (user && user.role && user.role.toLowerCase().includes("junior")) {
        casesToShow = data.filter((item) => {
          if (!item.advocate_name) return false;
          const normalizedAssignedName = item.advocate_name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return normalizedAssignedName === user.username;
        });
      }

      const formattedCases = casesToShow.map((item) => ({
        id: item.id,
        title: item.case_title,
        caseNo: item.case_number,
        client: item.client_name || "N/A",
        court: item.practice_area,
        hearing: item.due_date || "No hearing date",
        status: item.status || "Active",
        documents: item.assigned_documents || [],
        notes: item.assignment_notes || "",
      }));

      setCases(formattedCases);
    } catch (error) {
      console.error("Error fetching assigned cases:", error);
    }
  };

  // No view access
  if (!loading && !perms.view) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 max-w-sm text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-sm mt-2">You do not have permission to view Assigned Cases.</p>
        </div>
      </div>
    );
  }

  // ── Open modal & default to first VIEWABLE document ──
  const handleOpenDetails = (caseItem, viewMode = "full") => {
    setSelectedCase(caseItem);
    setModalViewMode(viewMode);
    setUploadSuccess(false);
    setEditingDocIdx(null);
    setDocDeleteIdx(null);

    // default-select the first document that has view=true (or view is undefined/null = treat as allowed)
    const firstViewable = caseItem.documents?.find(
      (d) => d.view === true || d.view === undefined || d.view === null
    ) || null;
    setSelectedDocument(firstViewable);
  };

  const closeModal = () => {
    setSelectedCase(null);
    setSelectedDocument(null);
    setEditingDocIdx(null);
    setDocDeleteIdx(null);
    setUploadSuccess(false);
  };

  const handleStatusChange = async (id, newStatus) => {
  if (!perms.edit) return;

  try {
    const res = await fetch(
      `${API_BASE_URL}/lawfirm-management/assigned-cases/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to update status on server");
    }

    setCases((prevCases) =>
      prevCases.map((c) =>
        c.id === id ? { ...c, status: newStatus } : c
      )
    );

    if (selectedCase && selectedCase.id === id) {
      setSelectedCase((prev) => ({
        ...prev,
        status: newStatus,
      }));
    }
  } catch (error) {
    console.error("Status update error:", error);
    alert("Failed to update status. Please try again.");
  }
};



  // const handleStatusChange = (caseNo, newStatus) => {
  //   if (!perms.edit) return;
  //   setCases((prevCases) =>
  //     prevCases.map((c) =>
  //       c.caseNo === caseNo ? { ...c, status: newStatus } : c
  //     )
  //   );
  //   if (selectedCase && selectedCase.caseNo === caseNo) {
  //     setSelectedCase((prev) => ({ ...prev, status: newStatus }));
  //   }
  // };

  // ── VIEW: check doc.view permission ──
  const handleViewDocument = (doc) => {
    if (doc.view === false) return; // blocked
    setSelectedDocument(doc);
    let fileUrl = doc.url || doc.file_path || null;
    if (!fileUrl && doc.file) {
      const title = doc.file;
      if (title.includes(".") || title.toLowerCase().endsWith(".pdf") || title.toLowerCase().endsWith(".jpg") || title.toLowerCase().endsWith(".png") || title.toLowerCase().endsWith(".jpeg")) {
        fileUrl = `http://localhost:8000/uploads/${title}`;
      }
    }
    if (!fileUrl) {
      const content = `Mock preview content for ${doc.file}\nDocument Type: ${doc.documentType}`;
      const blob = new Blob([content], { type: "text/plain" });
      fileUrl = URL.createObjectURL(blob);
    }
    
    // Normalize localhost
    if (fileUrl && typeof window !== "undefined") {
      if (window.location.hostname === "127.0.0.1") {
        fileUrl = fileUrl.replace("localhost:8000", "127.0.0.1:8000");
      } else {
        fileUrl = fileUrl.replace("127.0.0.1:8000", "localhost:8000");
      }
    }

    setSelectedDoc({
      fileUrl: fileUrl,
      title: doc.file,
      badge: doc.documentType,
    });
  };

//   const handleViewDocument = async (doc) => {
//   if (doc.view === false) return;

//   setSelectedDocument(doc);

//   let fileUrl =
//     doc.url ||
//     doc.file_path ||
//     doc.document_url ||
//     doc.document ||
//     "";

//   if (!fileUrl) {
//     console.error("No document URL found.");
//     return;
//   }

//   // Normalize localhost
//   if (typeof window !== "undefined") {
//     if (window.location.hostname === "127.0.0.1") {
//       fileUrl = fileUrl.replace("localhost:8000", "127.0.0.1:8000");
//     } else {
//       fileUrl = fileUrl.replace("127.0.0.1:8000", "localhost:8000");
//     }
//   }

//   const extension = fileUrl
//     .split("?")[0]
//     .split(".")
//     .pop()
//     .toLowerCase();

//   setViewerUrl(fileUrl);

//   setIsPdf(extension === "pdf");

//   setIsImage(
//     [
//       "jpg",
//       "jpeg",
//       "png",
//       "gif",
//       "bmp",
//       "webp",
//       "svg",
//     ].includes(extension)
//   );
// };

  // ── DOWNLOAD: check doc.view permission ──
  const handleDownloadDocument = (doc) => {
    if (!doc || doc.view === false) return; // blocked
    const url = doc.url || doc.file_path;
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file || "document";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `Mock content for ${doc.file}\nDocument Type: ${doc.documentType}`;
      const blob = new Blob([content], { type: "text/plain" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.file || "mock_document.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }
  };

  // ── UPLOAD: check doc.upload permission on the case (first doc or general) ──
  // We allow upload if any document in the case has upload=true
  const caseAllowsUpload = (caseItem) => {
    if (!caseItem?.documents?.length) return false;
    return caseItem.documents.some((d) => d.upload === true);
  };

  // Helper to persist documents to MySQL table case_management_cases
  const saveDocumentsToBackend = async (caseNo, updatedDocs) => {
    try {
      // 1. Fetch all case management cases to find the target case ID
      const res = await fetch(`${API_BASE_URL}/case-management/`);
      if (!res.ok) throw new Error("Failed to fetch cases list");
      const casesList = await res.json();
      
      const targetCase = casesList.find(c => c.case_no === caseNo);
      if (!targetCase) {
        console.error("Target case not found in case management:", caseNo);
        return;
      }
      
      // 2. Build the CaseUpdate payload
      const payload = {
        documents: updatedDocs.map(d => ({
          documentType: d.documentType,
          advocate: d.advocate || "",
          file: d.file,
          url: d.url || null,
          view: d.view !== undefined ? d.view : true,
          upload: d.upload !== undefined ? d.upload : true,
          edit: d.edit !== undefined ? d.edit : true,
          delete: d.delete !== undefined ? d.delete : true,
        }))
      };
      
      // 3. Make PUT request to update case documents
      const updateRes = await fetch(`${API_BASE_URL}/case-management/${targetCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!updateRes.ok) {
        throw new Error("Failed to update case documents in database");
      }
    } catch (err) {
      console.error("Error saving documents to backend:", err);
      alert("Failed to save documents to database: " + err.message);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCase) return;

    setUploadLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newDoc = {
          file: file.name,
          documentType: "Uploaded",
          url: reader.result,
          view: true,
          upload: true,
          edit: true,
          delete: true,
        };
        const updatedDocs = [...(selectedCase.documents || []), newDoc];
        const updatedCase = { ...selectedCase, documents: updatedDocs };
        
        setSelectedCase(updatedCase);
        setCases((prev) =>
          prev.map((c) => (c.id === selectedCase.id ? updatedCase : c))
        );
        setSelectedDocument(newDoc);

        await saveDocumentsToBackend(selectedCase.caseNo, updatedDocs);
        fetchAssignedCases();

        setUploadSuccess(true);
        setUploadLoading(false);
        setTimeout(() => setUploadSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
      setUploadLoading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── EDIT (rename): check doc.edit ──
  const startEditing = (idx, currentName) => {
    setEditingDocIdx(idx);
    setEditingDocName(currentName);
  };

  const saveEdit = async () => {
    if (editingDocIdx === null || !selectedCase) return;
    const updatedDocs = selectedCase.documents.map((d, i) =>
      i === editingDocIdx ? { ...d, file: editingDocName } : d
    );
    const updatedCase = { ...selectedCase, documents: updatedDocs };
    setSelectedCase(updatedCase);
    setCases((prev) =>
      prev.map((c) => (c.id === selectedCase.id ? updatedCase : c))
    );
    setEditingDocIdx(null);
    setEditingDocName("");

    await saveDocumentsToBackend(selectedCase.caseNo, updatedDocs);
    fetchAssignedCases();
  };

  // ── DELETE document: check doc.delete ──
  const handleDeleteDocument = async (docIdx) => {
    if (!selectedCase) return;
    const updatedDocs = selectedCase.documents.filter((_, i) => i !== docIdx);
    const updatedCase = { ...selectedCase, documents: updatedDocs };
    setSelectedCase(updatedCase);
    setCases((prev) =>
      prev.map((c) => (c.id === selectedCase.id ? updatedCase : c))
    );
    // If the deleted doc was the selected preview, clear it
    if (selectedDocument === selectedCase.documents[docIdx]) {
      setSelectedDocument(null);
    }
    setDocDeleteIdx(null);

    await saveDocumentsToBackend(selectedCase.caseNo, updatedDocs);
    fetchAssignedCases();
  };

  // ── DELETE assigned case ──
  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCases((prev) => prev.filter((c) => c.id !== id));
        setDeleteConfirm(null);
      } else {
        alert("Failed to delete case.");
      }
    } catch (e) {
      console.error("Error deleting case:", e);
      alert("Error deleting case.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCases = cases.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.title?.toLowerCase().includes(query) ||
      item.caseNo?.toLowerCase().includes(query) ||
      item.client?.toLowerCase().includes(query) ||
      item.court?.toLowerCase().includes(query);
      
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-6 md:space-y-8">

        {/* Page Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-6">
          <h1 className="text-[#0F172A] font-bold text-2xl sm:text-3xl md:text-4xl" style={{ fontWeight: 700, lineHeight: 1.2 }}>
            Assigned Cases
          </h1>
          <p className="text-[#64748B] mt-1.5 text-xs sm:text-sm">
            View and manage your assigned legal cases
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#64748B] text-sm font-medium">
              Total Assigned Cases
            </h3>
            <p className="text-3xl font-bold text-[#0F172A] mt-2">
            {cases.length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#64748B] text-sm font-medium">
              Active Cases
            </h3>
            <p className="text-3xl font-bold text-[#16A34A] mt-2">
             {cases.filter((c) => c.status === "Active").length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#64748B] text-sm font-medium">
              Upcoming Hearings
            </h3>
            <p className="text-3xl font-bold text-[#2563EB] mt-2">
              {cases.filter((c) => c.hearing !== "No hearing date").length}
            </p>
          </div>

        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">

          <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#0F172A] whitespace-nowrap">My Assigned Cases</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex w-full sm:w-auto items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto border border-[#E2E8F0] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-sm text-[#0F172A] cursor-pointer bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by case title, case no, client or court..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 border border-[#E2E8F0] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>
              <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-3 py-1.5 rounded-full whitespace-nowrap self-end sm:self-auto">
                {filteredCases.length} cases
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Case Title</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Case No</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Court</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Next Hearing</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredCases.length > 0 ? (
                  filteredCases.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors duration-150 group"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-[#0F172A] max-w-[200px] truncate">
                        {item.title}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-lg">
                          {item.caseNo}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569] font-medium">
                        {item.client}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {item.court}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg">
                          {item.hearing}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {perms.edit ? (
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 cursor-pointer transition-colors ${getStatusSelectClass(item.status)}`}
                          >
                            {/* <option value="Completed" className="bg-white text-[#0F172A]">Completed</option> */}
                            <option value="Closed" className="bg-white text-[#0F172A]">Completed</option>
                            <option value="In Progress" className="bg-white text-[#0F172A]">In Progress</option>
                            <option value="Active" className="bg-white text-[#0F172A]">Active</option>
                            {/* <option value="To Do" className="bg-white text-[#0F172A]">To Do</option> */}
                          </select>
                        ) : (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block ${getStatusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDetails(item, "full")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="See Case Details"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {perms.delete && (
                            <button
                              onClick={() => setDeleteConfirm(item.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                              title="Delete Case"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={32} className="text-[#CBD5E1]" />
                        <p className="text-[#64748B] text-sm font-medium">No matching assigned cases found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* ══════════════════════════════════════════════
          CASE DETAILS MODAL
      ══════════════════════════════════════════════ */}
      {selectedCase && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#F8FAFC]/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl w-full max-w-5xl border border-[#E2E8F0] shadow-2xl flex flex-col max-h-[92vh] lg:max-h-[85vh] overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F1F5F9]/50">
              <div className="flex items-center gap-3">
                <span className="bg-blue-50 text-[#2563EB] p-2.5 rounded-2xl border border-blue-100">
                  <Gavel size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-[#0F172A] text-lg sm:text-xl leading-tight">
                    {selectedCase.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-[#64748B] font-semibold uppercase tracking-wider mt-1">
                    Case No: {selectedCase.caseNo}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-[#64748B] hover:text-[#64748B] rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Layout: Split Columns */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-5 gap-6 p-4 sm:p-6 min-h-0 bg-white">
              
              {/* Left Column: Metadata & Notes */}
              <div className="lg:col-span-3 space-y-6 flex flex-col lg:h-full lg:overflow-y-auto pr-0 lg:pr-4">
                
                {modalViewMode === "full" && (
                  <>
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F1F5F9]/70 p-5 rounded-2xl border border-[#E2E8F0]">
                      <div className="space-y-1">
                        <span className="text-xxs font-bold text-[#64748B] uppercase tracking-wider block">Client</span>
                        <div className="flex items-center gap-2">
                          <User size={15} className="text-[#64748B]" />
                          <span className="text-sm font-bold text-[#0F172A]">{selectedCase.client}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xxs font-bold text-[#64748B] uppercase tracking-wider block">Court / Forum</span>
                        <div className="flex items-center gap-2">
                          <Building2 size={15} className="text-[#64748B]" />
                          <span className="text-sm font-semibold text-[#0F172A]">{selectedCase.court}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xxs font-bold text-[#64748B] uppercase tracking-wider block">Next Hearing</span>
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-blue-500" />
                          <span className="text-sm font-semibold text-[#0F172A]">{selectedCase.hearing}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xxs font-bold text-[#64748B] uppercase tracking-wider block">Case Status</span>
                        <span className={`inline-block px-2.5 py-0.5 mt-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${getStatusBadgeClass(selectedCase.status)}`}>
                          {selectedCase.status}
                        </span>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase size={14} className="text-[#64748B]" />
                        <span>Case Strategy & Advocate Notes</span>
                      </h4>
                      <div className="bg-amber-50/30 border border-amber-200/40 p-4 rounded-2xl text-[#64748B] text-sm font-medium leading-relaxed italic">
                        "{selectedCase.notes}"
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Right Column: Documents Section */}
              <div className="lg:col-span-2 flex flex-col space-y-4 lg:h-full min-h-[300px] lg:min-h-0 lg:overflow-y-auto pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-[#E2E8F0]/40 pt-6 lg:pt-0">
                {/* ── Documents Section ── */}
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                      Assigned Documents ({selectedCase.documents?.length || 0})
                    </h4>

                    {/* UPLOAD button — only if any document has upload=true */}
                    {caseAllowsUpload(selectedCase) && (
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
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                            uploadLoading
                              ? "bg-[#E2E8F0] text-[#94A3B8]"
                              : "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                          }`}
                        >
                          <Upload size={12} />
                          {uploadLoading ? "Uploading..." : "Upload Doc"}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Upload success banner */}
                  {uploadSuccess && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <CheckCircle size={14} className="text-green-600" />
                      <p className="text-xs font-semibold text-green-700">Document uploaded successfully!</p>
                    </div>
                  )}

                  <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[320px] lg:max-h-[480px]">
                    {selectedCase.documents?.length > 0 ? (
                      selectedCase.documents.map((doc, idx) => {
                        const isSelected = selectedDocument?.file === doc.file;
                        const isLocked = doc.view === false;
                        const canEdit = doc.edit === true;
                        const canDelete = doc.delete === true;
                        const isEditingThis = editingDocIdx === idx;

                        return (
                          <div
                            key={idx}
                            className={`rounded-2xl border transition-all ${
                              isLocked
                                ? "bg-slate-50 border-slate-200 opacity-75"
                                : isSelected
                                ? "bg-blue-50/50 border-blue-200 shadow-sm"
                                : "bg-white border-[#E2E8F0] hover:border-[#E2E8F0] hover:bg-[#F1F5F9]"
                            }`}
                          >
                            <div className="flex items-center justify-between p-3.5">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* File Icon / Lock Icon */}
                                {isLocked ? (
                                  <Lock size={18} className="text-slate-400 shrink-0" />
                                ) : (
                                  <FileText size={18} className={isSelected ? "text-[#2563EB]" : "text-[#64748B]"} />
                                )}

                                <div className="flex-1 min-w-0">
                                  {/* Editable name / display name */}
                                  {isEditingThis ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={editingDocName}
                                        onChange={(e) => setEditingDocName(e.target.value)}
                                        className="flex-1 text-xs border border-[#2563EB] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/30"
                                        autoFocus
                                      />
                                      <button
                                        onClick={saveEdit}
                                        className="text-[10px] font-bold px-2 py-1 bg-[#2563EB] text-white rounded-lg cursor-pointer hover:bg-[#1d4ed8]"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingDocIdx(null)}
                                        className="text-[10px] font-bold px-2 py-1 bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <p className={`text-xs font-bold truncate max-w-[140px] sm:max-w-[220px] ${isLocked ? "text-slate-400 line-through" : ""}`}>
                                        {doc.file}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className="text-[10px] text-[#64748B]">{doc.documentType}</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              {!isEditingThis && (
                                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                  {/* VIEW button */}
                                  {!isLocked && (
                                    <button
                                      onClick={() => handleViewDocument(doc)}
                                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                        isSelected
                                          ? "bg-[#2563EB] text-white shadow-sm"
                                          : "bg-[#F8FAFC] text-[#64748B] hover:bg-slate-200"
                                      }`}
                                    >
                                      View
                                    </button>
                                  )}

                                  {/* EDIT button */}
                                  {canEdit && !isLocked && (
                                    <button
                                      onClick={() => startEditing(idx, doc.file)}
                                      className="p-1.5 rounded-lg text-[#64748B] hover:bg-blue-50 hover:text-[#2563EB] transition-colors cursor-pointer"
                                      title="Rename document"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                  )}

                                  {/* DELETE button */}
                                  {canDelete && (
                                    <button
                                      onClick={() => setDocDeleteIdx(idx)}
                                      className="p-1.5 rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                      title="Delete document"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Document delete confirmation (inline) */}
                            {docDeleteIdx === idx && (
                              <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between rounded-b-2xl">
                                <p className="text-xs font-semibold text-red-700">Delete this document?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setDocDeleteIdx(null)}
                                    className="text-[10px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(idx)}
                                    className="text-[10px] px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold cursor-pointer hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-[#94A3B8] text-xs">
                        No documents attached to this case.
                      </div>
                    )}
                  </div>
                </div>

              </div>



            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E2E8F0] flex justify-end bg-[#F1F5F9]/50">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-slate-900 text-white hover:bg-[#1E293B] text-xs font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer"
              >
                Close Case Details
              </button>
            </div>

          </div>
        </div>
      , document.body)}

      {/* ══════════════════════════════════════════════
          DELETE CONFIRM DIALOG
      ══════════════════════════════════════════════ */}
      {deleteConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">Delete Assigned Case?</h3>
            <p className="text-sm text-[#64748B] mb-6">
              This action cannot be undone. The case assignment will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-sm hover:bg-[#F8FAFC] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition disabled:opacity-70"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

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
        console.error("Failed to parse base64 for preview in AssignedCases viewer modal:", e);
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
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              <ExternalLink size={13} /> Open in Tab
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
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
            <iframe
              src={viewerUrl}
              className="w-full h-full min-h-[600px] border-0"
              title={title || "Document"}
            />
          ) : isImage ? (
            <div className="p-6">
              <img
                src={viewerUrl}
                alt={title || "Document"}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
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