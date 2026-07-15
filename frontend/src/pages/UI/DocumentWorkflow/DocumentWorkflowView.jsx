"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  FileText, Upload, CheckCircle, AlertTriangle, Eye, Edit3, 
  Send, Bot, ChevronRight, MessageSquare, Plus, ArrowLeft, Loader2,
  Check, X, File, ShieldAlert, BookOpen, AlertCircle
} from "lucide-react";
import useModulePermission from "@/utils/useModulePermission";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";
import DocumentViewerModal from "@/components/common/DocumentViewerModal";

export default function DocumentWorkflowView({ forceMode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { perms: jrPerms, loading: jrLoading, user: jrUser } = useModulePermission("Junior Document Approval");
  const { perms: srPerms, loading: srLoading, user: srUser } = useModulePermission("Senior Document Approval");

  const loading = jrLoading || srLoading;
  const user = jrUser || srUser;


  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [activeTab, setActiveTab] = useState("All"); // All, Drafts, Pending, Approved, Correction
  const [searchTerm, setSearchTerm] = useState("");

  // Create Draft state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [docType, setDocType] = useState("Petition");
  const [draftContent, setDraftContent] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Draft state
  const [editingDoc, setEditingDoc] = useState(null);

  // Senior review comment state
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState("");

  // Detail view state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerDoc, setViewerDoc] = useState(null);

  // Notifications/Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const isSenior = forceMode ? (forceMode === "senior") : (!loading && srPerms?.view === true);
  const perms = isSenior ? srPerms : jrPerms;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!loading && perms.view) {
      fetchWorkflowDocs();
      if (!isSenior) {
        fetchJuniorCases();
      }
    }
  }, [loading, perms.view, user]);

  const fetchWorkflowDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/workflow/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Error fetching workflow documents:", err);
      showToast("Failed to fetch documents.", "error");
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchJuniorCases = async () => {
    try {
      // First try to fetch junior cases via lawfirm management
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter cases where this junior is assigned
        const filtered = data.filter((item) => {
          if (!item.advocate_name) return false;
          const normName = item.advocate_name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return normName === user?.username?.toLowerCase();
        });
        
        // Match them to get case_management case database IDs
        const caseMgmtRes = await fetch(`${API_BASE_URL}/case-management/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (caseMgmtRes.ok) {
          const casesData = await caseMgmtRes.json();
          const matched = casesData.filter(c => 
            filtered.some(f => f.case_number === c.case_no)
          );
          setCases(matched);
        }
      }
    } catch (err) {
      console.error("Error fetching junior cases:", err);
    }
  };

  const handleGenerateAi = async () => {
    if (!selectedCaseId) {
      alert("Please select a case first");
      return;
    }
    if (!aiPrompt) {
      alert("Please enter prompt instructions");
      return;
    }

    setGeneratingAi(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCaseId}/generate-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setDraftContent(data.document);
        showToast("Legal document generated by AI successfully.");
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Failed to generate");
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      showToast(err.message || "AI generation failed.", "error");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCreateDraft = async (e, submitImmediately = false) => {
    if (e) e.preventDefault();
    if (!selectedCaseId || !draftTitle) {
      alert("Please complete required fields.");
      return;
    }

    setActionLoading(true);
    try {
      const selectedCase = cases.find(c => String(c.id) === String(selectedCaseId));
      let uploadedUrl = null;

      if (fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const uploadRes = await fetch(`${API_BASE_URL}/case-management/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrl = uploadData.url;
        } else {
          throw new Error("File upload failed");
        }
      }

      const payload = {
        case_id: selectedCase.id,
        case_no: selectedCase.case_no,
        case_title: selectedCase.case_title,
        title: draftTitle,
        document_type: docType,
        content: draftContent || "",
        file_url: uploadedUrl
      };

      const res = await fetch(`${API_BASE_URL}/case-management/workflow/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdDoc = await res.json();
        if (submitImmediately) {
          const submitRes = await fetch(`${API_BASE_URL}/case-management/workflow/documents/${createdDoc.id}/submit`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (submitRes.ok) {
            showToast("Document draft generated and sent to Senior Advocate successfully.");
          } else {
            showToast("Document saved, but sending to Senior Advocate failed.", "error");
          }
        } else {
          showToast("Document draft created successfully.");
        }
        setIsCreateModalOpen(false);
        resetCreateForm();
        fetchWorkflowDocs();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create draft");
      }
    } catch (err) {
      console.error("Create draft error:", err);
      showToast(err.message || "Failed to save draft.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDraft = async (e, submitImmediately = false) => {
    if (e) e.preventDefault();
    if (!editingDoc.title) {
      alert("Title is required.");
      return;
    }

    setActionLoading(true);
    try {
      let uploadedUrl = editingDoc.file_url;

      if (fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const uploadRes = await fetch(`${API_BASE_URL}/case-management/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrl = uploadData.url;
        } else {
          throw new Error("File upload failed");
        }
      }

      const payload = {
        title: editingDoc.title,
        document_type: editingDoc.document_type,
        content: editingDoc.content || "",
        file_url: uploadedUrl
      };

      const res = await fetch(`${API_BASE_URL}/case-management/workflow/documents/${editingDoc.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedDoc = await res.json();
        if (submitImmediately) {
          const submitRes = await fetch(`${API_BASE_URL}/case-management/workflow/documents/${updatedDoc.id}/submit`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (submitRes.ok) {
            showToast("Document updated and sent to Senior Advocate successfully.");
          } else {
            showToast("Document updated, but sending to Senior Advocate failed.", "error");
          }
        } else {
          showToast("Draft updated successfully.");
        }
        setEditingDoc(null);
        setFileToUpload(null);
        fetchWorkflowDocs();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update draft");
      }
    } catch (err) {
      console.error("Update draft error:", err);
      showToast(err.message || "Failed to update draft.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForReview = async (docId) => {
    if (!confirm("Are you sure you want to submit this draft for Senior Advocate review?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/case-management/workflow/documents/${docId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Document submitted to review board.");
        fetchWorkflowDocs();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Failed to submit");
      }
    } catch (err) {
      console.error("Submit error:", err);
      showToast(err.message || "Failed to submit document.", "error");
    }
  };

  const handleReviewAction = async (status) => {
    if (status === "Needs Correction" && !reviewFeedback.trim()) {
      alert("Please provide feedback notes explaining what needs correction.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/workflow/documents/${reviewingDoc.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: status,
          senior_feedback: reviewFeedback
        })
      });

      if (res.ok) {
        showToast(status === "Approved" ? "Document approved successfully." : "Correction request sent to Junior.");
        setReviewingDoc(null);
        setReviewFeedback("");
        fetchWorkflowDocs();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Failed to review");
      }
    } catch (err) {
      console.error("Review error:", err);
      showToast(err.message || "Failed to save review.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedCaseId("");
    setDraftTitle("");
    setDocType("Petition");
    setDraftContent("");
    setFileToUpload(null);
    setAiPrompt("");
  };

  // Filters logic
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.case_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "All") return matchesSearch;
    if (activeTab === "Drafts") return doc.status === "Draft" && matchesSearch;
    if (activeTab === "Pending") return doc.status === "Pending Review" && matchesSearch;
    if (activeTab === "Approved") return doc.status === "Approved" && matchesSearch;
    if (activeTab === "Correction") return doc.status === "Needs Correction" && matchesSearch;

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!perms.view) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm mt-12">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permissions to access the Case Document Approval module.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold transition-all ${
          toastType === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        }`}>
          {toastType === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl shadow-lg p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
            <FileText className="w-9 h-9" />
            Case Document Approval
          </h1>
          <p className="text-blue-100 mt-2 font-medium max-w-xl">
            {isSenior 
              ? "Review, approve, or request corrections on legal document drafts submitted by Junior Advocates." 
              : "Generate case documents using AI templates, manage case files, and submit drafts to Seniors for review."}
          </p>
        </div>
        {!isSenior && perms.add && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start md:self-auto bg-white hover:bg-slate-50 text-blue-700 font-bold px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Draft New Document
          </button>
        )}
      </div>

      {/* Filters & Workspace Grid */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tab Filters */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {["All", "Drafts", "Pending", "Approved", "Correction"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab 
                    ? "bg-white text-blue-700 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab === "Pending" ? "Pending Review" : tab === "Correction" ? "Needs Correction" : tab}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by case name, cnr or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 pl-4 font-medium outline-none transition-all"
            />
          </div>
        </div>

        {/* Documents List */}
        {loadingDocs ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-500 mt-2 text-sm font-medium">Loading documents workspace...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No documents found</h3>
            <p className="text-slate-400 mt-1 text-sm">There are no workflow documents in this section.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => {
              // Determine status colors
              let statusBg = "bg-slate-100 text-slate-700 border-slate-200";
              if (doc.status === "Pending Review") statusBg = "bg-blue-50 text-blue-700 border-blue-100";
              if (doc.status === "Approved") statusBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
              if (doc.status === "Needs Correction") statusBg = "bg-rose-50 text-rose-700 border-rose-100";

              return (
                <div 
                  key={doc.id}
                  className="border border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between bg-white"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${statusBg}`}>
                        {doc.status}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {new Date(doc.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-base line-clamp-1">{doc.title}</h3>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">{doc.document_type}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Case Details</p>
                      <p className="text-slate-700 font-bold mt-1 line-clamp-1">{doc.case_title}</p>
                      <p className="text-slate-500 font-semibold mt-0.5">{doc.case_no}</p>
                    </div>

                    {doc.status === "Needs Correction" && doc.senior_feedback && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
                        <p className="font-extrabold flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Senior Correction Note:
                        </p>
                        <p className="mt-1 font-medium">{doc.senior_feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    
                    {/* View Button */}
                    <button
                      onClick={() => {
                        setSelectedDoc(doc);
                        if (doc.file_url) {
                          setViewerDoc({ name: doc.title, file: doc.title, url: doc.file_url });
                        }
                      }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-xl border border-slate-200 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>

                    {/* Junior Actions */}
                    {!isSenior && (
                      <>
                        {doc.status === "Draft" || doc.status === "Needs Correction" ? (
                          <>
                            {perms.edit && (
                              <button
                                onClick={() => {
                                  setEditingDoc(doc);
                                  setDraftTitle(doc.title);
                                  setDocType(doc.document_type);
                                  setDraftContent(doc.content || "");
                                }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl border border-blue-200 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleSubmitForReview(doc.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Submit
                            </button>
                          </>
                        ) : null}
                      </>
                    )}

                    {/* Senior Actions */}
                    {isSenior && doc.status === "Pending Review" && (
                      <button
                        onClick={() => {
                          setReviewingDoc(doc);
                          setReviewFeedback("");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Review Draft
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Draft Details Drawer/Modal */}
      {mounted && selectedDoc && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600">
                  {selectedDoc.status}
                </span>
                <h2 className="text-xl font-bold mt-1.5">{selectedDoc.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid md:grid-cols-2 gap-6 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Linked Case</p>
                  <p className="text-slate-800 font-bold text-base mt-1">{selectedDoc.case_title}</p>
                  <p className="text-slate-500 font-semibold mt-0.5">{selectedDoc.case_no}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Document Type</p>
                  <p className="text-slate-800 font-bold text-base mt-1">{selectedDoc.document_type}</p>
                  <p className="text-slate-500 font-semibold mt-0.5">Submitted by Junior Advocate</p>
                </div>
              </div>

              {selectedDoc.senior_feedback && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-sm text-rose-800">
                  <h4 className="font-extrabold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Senior Advocate Feedback Note
                  </h4>
                  <p className="mt-2 font-medium">{selectedDoc.senior_feedback}</p>
                </div>
              )}

              {/* Draft Content Panel */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Document Text Content</h4>
                {selectedDoc.content ? (
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed text-slate-700">
                    {selectedDoc.content}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 font-semibold text-sm">
                    No text content. Draft is file-based upload.
                  </div>
                )}
              </div>

              {/* Uploaded File Link */}
              {selectedDoc.file_url && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-blue-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2.5 rounded-xl">
                      <File className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Attachment Uploaded</p>
                      <p className="text-xs text-slate-500 mt-0.5">Click to view/download the legal file</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewerDoc({ name: selectedDoc.title, file: selectedDoc.title, url: selectedDoc.file_url })}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    View File
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-colors text-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Senior Review Actions Dialog Modal */}
      {mounted && reviewingDoc && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold">Review Document Draft</h2>
              <button onClick={() => setReviewingDoc(null)} className="text-slate-300 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm">
                <p className="text-slate-500 font-bold text-xs uppercase">Document Name</p>
                <p className="text-slate-800 font-bold mt-0.5">{reviewingDoc.title}</p>
                <p className="text-slate-500 font-medium text-xs mt-2">Submitted for: {reviewingDoc.case_title}</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Review Feedback / Correction Instructions</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3.5 font-medium outline-none transition-all min-h-[120px]"
                  placeholder="Enter comments or guidelines for updates (Required if requesting correction)..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setReviewingDoc(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReviewAction("Needs Correction")}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2.5 rounded-xl border border-rose-200 transition-colors text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Request Correction
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReviewAction("Approved")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Approve Document
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Junior Create Draft Drawer/Modal */}
      {mounted && isCreateModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-blue-700 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Draft Legal Document</h2>
                <p className="text-blue-200 text-xs mt-0.5">Generate with AI templates or upload file directly.</p>
              </div>
              <button onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }} className="text-blue-200 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateDraft} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Case Select */}
              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Assigned Case *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose from Assigned Cases --</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_title} ({c.case_no})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Document Category *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    required
                  >
                    <option value="Petition">Petition</option>
                    <option value="Affidavit">Affidavit</option>
                    <option value="Legal Notice">Legal Notice</option>
                    <option value="Evidence">Evidence</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Draft Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Adjournment Application, Sworn Bail affidavit"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  required
                />
              </div>

              {/* AI generator block */}
              <div className="border border-blue-200 rounded-2xl p-5 bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-white space-y-4">
                <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Legal Draft Generation Helper
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter instructions for AI, e.g. 'Draft adjournment request due to advocate medical emergency'..."
                    className="flex-1 bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={generatingAi}
                    onClick={handleGenerateAi}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    {generatingAi ? <Loader2 size={14} className="animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                    Generate Draft
                  </button>
                </div>
              </div>

              {/* Inline Content Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Document Text Editor</label>
                <textarea
                  rows={10}
                  placeholder="Type or edit the document contents here..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 font-mono outline-none transition-all leading-relaxed"
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                />
              </div>

              {/* Binary File Attachment */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase">Attach Scan / File (Optional)</label>
                <div className="border border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 bg-slate-50 hover:bg-slate-100/50 transition-all text-center relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">
                    {fileToUpload ? fileToUpload.name : "Choose file to attach (PDF, Scan, Image)"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Supports legal documents up to 25MB</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={(e) => handleCreateDraft(e, false)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer text-sm transition-all"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={(e) => handleCreateDraft(e, true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {actionLoading && <Loader2 size={14} className="animate-spin" />}
                  Send to Senior Advocate
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Draft Modal */}
      {mounted && editingDoc && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Edit Draft</h2>
                <p className="text-slate-400 text-xs mt-0.5">{editingDoc.case_title} ({editingDoc.case_no})</p>
              </div>
              <button onClick={() => { setEditingDoc(null); setFileToUpload(null); }} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleEditDraft} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Draft Title *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                    value={editingDoc.title}
                    onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Document Category *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                    value={editingDoc.document_type}
                    onChange={(e) => setEditingDoc({ ...editingDoc, document_type: e.target.value })}
                    required
                  >
                    <option value="Petition">Petition</option>
                    <option value="Affidavit">Affidavit</option>
                    <option value="Legal Notice">Legal Notice</option>
                    <option value="Evidence">Evidence</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Inline Content Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Document Text Editor</label>
                <textarea
                  rows={10}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 font-mono outline-none transition-all leading-relaxed"
                  value={editingDoc.content || ""}
                  onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                />
              </div>

              {/* Binary File Attachment */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase">Scan / File Attachment</label>
                <div className="border border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 bg-slate-50 hover:bg-slate-100/50 transition-all text-center relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">
                    {fileToUpload ? fileToUpload.name : (editingDoc.file_url ? "Replace existing attached file" : "Upload replacement scan or file")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Supports legal documents up to 25MB</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditingDoc(null); setFileToUpload(null); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={(e) => handleEditDraft(e, false)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer text-sm transition-all"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={(e) => handleEditDraft(e, true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {actionLoading && <Loader2 size={14} className="animate-spin" />}
                  Send to Senior Advocate
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PDF / Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          onClose={() => setViewerDoc(null)}
          doc={viewerDoc}
        />
      )}
    </div>
  );
}
