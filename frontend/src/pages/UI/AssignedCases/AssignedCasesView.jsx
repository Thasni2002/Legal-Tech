"use client";

import React, { useState, useEffect } from "react";
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
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalViewMode, setModalViewMode] = useState("full");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleOpenDetails = (caseItem, viewMode = "full") => {
    setSelectedCase(caseItem);
    setModalViewMode(viewMode);
    setSelectedDocument(caseItem.documents && caseItem.documents.length > 0 ? caseItem.documents[0] : null);
  };

  const closeModal = () => {
    setSelectedCase(null);
    setSelectedDocument(null);
  };

  const handleStatusChange = (caseNo, newStatus) => {
    if (!perms.edit) return; // blocked if no edit permission
    setCases((prevCases) =>
      prevCases.map((c) =>
        c.caseNo === caseNo ? { ...c, status: newStatus } : c
      )
    );
    if (selectedCase && selectedCase.caseNo === caseNo) {
      setSelectedCase((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleDownloadDocument = (doc) => {
    if (!doc) return;
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
      // Dummy download if no real URL
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

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    const url = doc.url || doc.file_path;
    if (url) {
      window.open(url, "_blank");
    } else {
      // Dummy view in new tab if no real URL
      const content = `Mock preview content for ${doc.file}\nDocument Type: ${doc.documentType}`;
      const blob = new Blob([content], { type: "text/plain" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/lawfirm-management/assigned-cases/${id}`, {
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


useEffect(() => {
  fetchAssignedCases();
}, []);

const fetchAssignedCases = async () => {
  try {
    const user = getLoggedInUser();
    const res = await fetch(
      "http://localhost:8000/lawfirm-management/assigned-cases"
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
      client: item.advocate_name,
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

  const filteredCases = cases.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.caseNo.toLowerCase().includes(query) ||
      item.client.toLowerCase().includes(query) ||
      item.court.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full space-y-6 md:space-y-8">

        {/* Page Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
            Assigned Cases
          </h1>
          <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
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

        {/* Search */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
          <input
            type="text"
            placeholder="Search by case title, case no, client or court..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">

          <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A]">My Assigned Cases</h2>
            <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full">{filteredCases.length} cases</span>
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
                            onChange={(e) => handleStatusChange(item.caseNo, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 cursor-pointer transition-colors ${getStatusSelectClass(item.status)}`}
                          >
                            <option value="Completed" className="bg-white text-[#0F172A]">Completed</option>
                            <option value="Closed" className="bg-white text-[#0F172A]">Closed</option>
                            <option value="In Progress" className="bg-white text-[#0F172A]">In Progress</option>
                            <option value="Active" className="bg-white text-[#0F172A]">Active</option>
                            <option value="To Do" className="bg-white text-[#0F172A]">To Do</option>
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

                          <button
                            onClick={() => handleOpenDetails(item, "document")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
                            title="Case Documents"
                          >
                            <FileText size={14} />
                            Docs
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

      {/* Case Details Modal */}
      {selectedCase && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#F8FAFC]/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl w-full max-w-5xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F1F5F9]/50">
              <div className="flex items-center gap-3">
                <span className="bg-blue-50 text-[#2563EB] p-2.5 rounded-2xl border border-blue-100">
                  <Gavel size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-[#0F172A] text-xl leading-tight">
                    {selectedCase.title}
                  </h3>
                  <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mt-1">
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

            {/* Body: Split Layout */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 min-h-0 bg-white">
              
              {/* Left Column: Details & Documents (col-span-3 in full mode, col-span-2 in document mode) */}
              <div className={`${modalViewMode === "full" ? "lg:col-span-3" : "lg:col-span-2"} overflow-y-auto pr-2 space-y-6 flex flex-col h-full`}>
                
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

                {/* Documents Section */}
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    Assigned Documents ({selectedCase.documents?.length || 0})
                  </h4>
                  <div className={`space-y-2 overflow-y-auto flex-1 pr-1 ${modalViewMode === "full" ? "max-h-[220px]" : ""}`}>
                    {selectedCase.documents?.map((doc, idx) => {
const isSelected = selectedDocument?.file === doc.file;
return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                            isSelected
                              ? "bg-blue-50/50 border-blue-200 text-blue-900 shadow-sm"
                              : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#E2E8F0] hover:bg-[#F1F5F9]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} className={isSelected ? "text-[#2563EB]" : "text-[#64748B]"} />
                            <div>
                              <p className="text-xs font-bold truncate max-w-[160px] sm:max-w-[260px]">
                                {doc.file}
                              </p>
                              <p className="text-[10px] text-[#64748B] mt-0.5">{doc.documentType}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className={`px-4 py-1.5 rounded-xl text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#2563EB] text-white shadow-sm"
                                : "bg-[#F8FAFC] text-[#64748B] hover:bg-slate-200"
                            }`}
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Document Viewer (col-span-2 in full mode, col-span-3 in document mode) */}
              <div className={`${modalViewMode === "full" ? "lg:col-span-2" : "lg:col-span-3"} bg-[#F1F5F9] rounded-3xl border border-[#E2E8F0]/50 flex flex-col overflow-hidden h-full min-h-[300px]`}>
                
                {selectedDocument ? (
                  <div className="flex flex-col h-full">
                    {/* Doc Preview Header */}
                    <div className="p-3.5 bg-[#F8FAFC]/80 border-b border-[#E2E8F0]/60 flex items-center justify-between text-xs font-bold text-[#64748B]">
                      <span className="truncate pr-4 flex items-center gap-1.5">
                        <File size={14} className="text-blue-500" />
                       {selectedDocument.file}
                      </span>
                      <button
                        className="flex items-center gap-1 p-1 px-2.5 rounded-lg hover:bg-slate-200 text-[#64748B] hover:text-[#0F172A] transition-colors text-xxs font-bold uppercase tracking-wider bg-white/80 border border-[#E2E8F0]/40 cursor-pointer"
                        onClick={() => handleDownloadDocument(selectedDocument)}
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>

                    {/* Doc Preview Content */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-200/30 flex justify-center items-start">
                      {selectedDocument.url || selectedDocument.file_path ? (
                        <iframe 
                          src={selectedDocument.url || selectedDocument.file_path} 
                          title={selectedDocument.file} 
                          className="w-full min-h-[320px] rounded-xl border border-[#E2E8F0] shadow-sm bg-white" 
                        />
                      ) : (
                        <div className="bg-white w-full shadow-sm border border-[#E2E8F0] rounded-xl p-5 min-h-[320px] font-serif text-[#0F172A] text-[11px] leading-relaxed flex flex-col relative select-none">
                          
                          {/* Decorative Legal Document Top Header */}
                          <div className="border-b border-double border-slate-300 pb-2 mb-3 text-center">
                            <p className="uppercase tracking-widest text-[8px] font-sans font-bold text-[#64748B]">IN THE COURT OF THE LAW</p>
                            <p className="font-sans font-bold text-[9px] text-[#64748B] mt-0.5 uppercase">{selectedCase.court}</p>
                            <div className="flex justify-between text-[7px] font-sans text-[#64748B] mt-1.5">
                              <span>CASE: {selectedCase.caseNo}</span>
                              <span>OFFICIAL PREVIEW</span>
                            </div>
                          </div>

                          {/* Document Title */}
                          <h5 className="font-bold text-center underline text-xs mb-3 uppercase text-[#0F172A]">
                            {selectedDocument.file?.replace('.pdf', '').replaceAll('_', ' ')}
                          </h5>

                          {/* Document Simulated Body Text */}
                          <div className="whitespace-pre-wrap flex-1 text-[#64748B] font-serif italic border-l border-[#E2E8F0] pl-2">
                           Document Type: {selectedDocument.documentType}
                          </div>

                          {/* Bottom stamp marker */}
                          <div className="mt-6 border-t border-[#E2E8F0] pt-3 flex justify-between items-center text-[7px] font-sans text-[#64748B]">
                            <span>VERIFIED VIA LEGALPORTAL</span>
                            <span className="bg-blue-50 text-[#2563EB] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border border-blue-100">PREVIEW ONLY</span>
                          </div>

                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#64748B] mb-4 border border-[#E2E8F0]/50">
                      <FileText size={20} />
                    </div>
                    <h5 className="font-bold text-[#0F172A] text-xs">
                      No Document Selected
                    </h5>
                    <p className="text-[11px] text-[#64748B] max-w-[200px] mt-1.5 leading-normal">
                      Click the <span className="font-bold text-blue-500">View</span> button on any document to see a live preview.
                    </p>
                  </div>
                )}

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
    </div>
  );
}