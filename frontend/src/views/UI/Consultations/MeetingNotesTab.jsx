"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { API_BASE_URL } from "@/utils/api";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  User,
  Briefcase,
  CheckSquare,
  Square,
  Lock,
  Globe,
  Trash2,
  Edit,
  Eye,
  Printer,
  X,
  CheckCircle2,
} from "lucide-react";

export default function MeetingNotesTab({ user, preselectedConsultation, onClosePreselected }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [casesList, setCasesList] = useState([]);

  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    consultation_id: null,
    case_id: "",
    client_name: "",
    case_title: "",
    case_no: "",
    title: "Meeting Notes",
    meeting_date: new Date().toISOString().split("T")[0],
    meeting_time: "11:00 AM",
    meeting_type: "Video Call",
    summary: "",
    key_topics: "",
    legal_advice: "",
    internal_notes: "",
    is_confidential: false,
    action_items: []
  });

  const [newActionText, setNewActionText] = useState("");
  const [newActionAssignee, setNewActionAssignee] = useState("");
  const [newActionDueDate, setNewActionDueDate] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // Fetch Cases list for dropdown selection
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/case-management/`, { headers });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.cases || data.items || [];
          setCasesList(list);
        }
      } catch (err) {
        console.warn("Could not fetch cases list for meeting notes:", err);
      }
    };
    fetchCases();
  }, []);

  // Fetch Meeting Notes
  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/consultations/notes`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotes(data || []);
      }
    } catch (err) {
      console.error("Error fetching meeting notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadInitialNotes() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/consultations/notes`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setNotes(data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching meeting notes:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadInitialNotes();
    return () => {
      ignore = true;
    };
  }, []);

  // Handle opening pre-selected consultation for note creation
  useEffect(() => {
    if (preselectedConsultation) {
      const clientName = preselectedConsultation.client_name || preselectedConsultation.client || "";
      const caseIssue = preselectedConsultation.issue || "";

      // Find matching case by case_id or client_name
      let matchedCase = null;
      if (preselectedConsultation.case_id) {
        matchedCase = casesList.find(c => String(c.id) === String(preselectedConsultation.case_id));
      }
      if (!matchedCase && clientName && casesList.length > 0) {
        const cleanName = clientName.toLowerCase().trim();
        matchedCase = casesList.find(c =>
          (c.client_name || "").toLowerCase().includes(cleanName) ||
          cleanName.includes((c.client_name || "").toLowerCase())
        );
      }

      const timer = setTimeout(() => {
        setFormData({
          id: null,
          consultation_id: preselectedConsultation.id || null,
          case_id: matchedCase ? matchedCase.id : (preselectedConsultation.case_id || ""),
          client_name: clientName,
          case_title: matchedCase ? matchedCase.case_title : caseIssue,
          case_no: matchedCase ? matchedCase.case_no : "",
          title: `Meeting Notes - ${clientName || "Client"}`,
          meeting_date: preselectedConsultation.date ? String(preselectedConsultation.date) : new Date().toISOString().split("T")[0],
          meeting_time: preselectedConsultation.time || "11:00 AM",
          meeting_type: preselectedConsultation.type || "Video Call",
          summary: preselectedConsultation.summary || "",
          key_topics: "",
          legal_advice: "",
          internal_notes: "",
          is_confidential: false,
          action_items: []
        });
        setShowNoteModal(true);
        if (onClosePreselected) {
          onClosePreselected();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [preselectedConsultation, onClosePreselected, casesList]);




  const openNewNoteModal = () => {
    setFormData({
      id: null,
      consultation_id: null,
      case_id: "",
      client_name: "",
      case_title: "",
      case_no: "",
      title: "Meeting Notes",
      meeting_date: new Date().toISOString().split("T")[0],
      meeting_time: "11:00 AM",
      meeting_type: "Video Call",
      summary: "",
      key_topics: "",
      legal_advice: "",
      internal_notes: "",
      is_confidential: false,
      action_items: []
    });
    setShowNoteModal(true);
  };

  const openEditNoteModal = (note) => {
    setFormData({
      id: note.id,
      consultation_id: note.consultation_id || null,
      case_id: note.case_id || "",
      client_name: note.client_name || "",
      case_title: note.case_title || "",
      case_no: note.case_no || "",
      title: note.title || "Meeting Notes",
      meeting_date: note.meeting_date || new Date().toISOString().split("T")[0],
      meeting_time: note.meeting_time || "11:00 AM",
      meeting_type: note.meeting_type || "Video Call",
      summary: note.summary || "",
      key_topics: note.key_topics || "",
      legal_advice: note.legal_advice || "",
      internal_notes: note.internal_notes || "",
      is_confidential: Boolean(note.is_confidential),
      action_items: note.action_items || []
    });
    setShowNoteModal(true);
  };

  const handleAddActionItem = () => {
    if (!newActionText.trim()) return;
    const newItem = {
      id: Date.now(),
      task: newActionText.trim(),
      assignee: newActionAssignee.trim() || "Advocate",
      due_date: newActionDueDate || "",
      completed: false
    };
    setFormData((prev) => ({
      ...prev,
      action_items: [...prev.action_items, newItem]
    }));
    setNewActionText("");
    setNewActionAssignee("");
    setNewActionDueDate("");
  };

  const toggleActionItem = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      action_items: prev.action_items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const removeActionItem = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      action_items: prev.action_items.filter((item) => item.id !== itemId)
    }));
  };

  const handleCaseSelect = (caseIdStr) => {
    if (!caseIdStr) {
      setFormData((prev) => ({ ...prev, case_id: "", case_title: "", case_no: "" }));
      return;
    }
    const selectedCase = casesList.find((c) => String(c.id) === String(caseIdStr));
    if (selectedCase) {
      setFormData((prev) => ({
        ...prev,
        case_id: selectedCase.id,
        case_title: selectedCase.case_title || "",
        case_no: selectedCase.case_no || "",
        client_name: prev.client_name || selectedCase.client_name || ""
      }));
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!formData.meeting_date) {
      showToast("Meeting date is required", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const payload = {
        ...formData,
        case_id: formData.case_id ? parseInt(formData.case_id, 10) : null
      };

      let url = `${API_BASE_URL}/consultations/notes`;
      let method = "POST";

      if (formData.id) {
        url = `${API_BASE_URL}/consultations/notes/${formData.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(formData.id ? "Meeting note updated successfully!" : "Meeting note recorded successfully!");
        setShowNoteModal(false);
        fetchNotes();
      } else {
        const errData = await res.json();
        showToast(errData.detail || "Failed to save meeting note", "error");
      }
    } catch (err) {
      console.error("Error saving meeting note:", err);
      showToast("Error saving meeting note", "error");
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/consultations/notes/${deleteId}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        showToast("Meeting note deleted");
        setShowDeleteModal(false);
        setDeleteId(null);
        fetchNotes();
      }
    } catch (err) {
      showToast("Failed to delete meeting note", "error");
    }
  };

  const handlePrintNote = (note) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${note.title || "Meeting Note"}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 5px; }
            .meta { display: flex; gap: 20px; font-size: 14px; color: #64748b; margin-top: 10px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
            .task-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
            .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${note.title || "Consultation Meeting Note"}</div>
            <div class="meta">
              <span><strong>Client:</strong> ${note.client_name || "N/A"}</span>
              <span><strong>Date:</strong> ${note.meeting_date}</span>
              <span><strong>Time:</strong> ${note.meeting_time || "N/A"}</span>
              <span><strong>Type:</strong> ${note.meeting_type || "Video Call"}</span>
            </div>
            ${note.case_title ? `<div class="meta" style="margin-top:5px;"><span><strong>Case:</strong> ${note.case_title} ${note.case_no ? `(#${note.case_no})` : ""}</span></div>` : ""}
          </div>

          ${note.summary ? `
            <div class="section">
              <div class="section-title">Executive Summary</div>
              <div class="box">${note.summary}</div>
            </div>
          ` : ""}

          ${note.key_topics ? `
            <div class="section">
              <div class="section-title">Key Topics & Discussion Points</div>
              <div class="box">${note.key_topics}</div>
            </div>
          ` : ""}

          ${note.legal_advice ? `
            <div class="section">
              <div class="section-title">Legal Advice & Strategy Given</div>
              <div class="box" style="background:#f0fdf4; border-color:#bbf7d0;">${note.legal_advice}</div>
            </div>
          ` : ""}

          ${note.action_items && note.action_items.length > 0 ? `
            <div class="section">
              <div class="section-title">Action Items & Next Steps</div>
              <div class="box">
                ${note.action_items.map(item => `
                  <div class="task-item">
                    <span>${item.completed ? "☑" : "☐"}</span>
                    <span><strong>${item.task}</strong> ${item.assignee ? `(Assigned to: ${item.assignee})` : ""} ${item.due_date ? `- Due: ${item.due_date}` : ""}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}

          ${note.internal_notes ? `
            <div class="section">
              <div class="section-title">Advocate Internal Notes (Confidential)</div>
              <div class="box" style="background:#fef2f2; border-color:#fecaca;">${note.internal_notes}</div>
            </div>
          ` : ""}

          <div class="footer">
            Generated from LegalTech Advocate Suite &bull; Confidential Legal Record &bull; ${new Date().toLocaleDateString()}
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.client_name && n.client_name.toLowerCase().includes(q)) ||
        (n.case_title && n.case_title.toLowerCase().includes(q)) ||
        (n.summary && n.summary.toLowerCase().includes(q)) ||
        (n.key_topics && n.key_topics.toLowerCase().includes(q));

      const matchesDate =
        !selectedDateFilter || n.meeting_date === selectedDateFilter;

      return matchesSearch && matchesDate;
    });
  }, [notes, searchQuery, selectedDateFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 transition-all transform animate-bounce ${
            toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          <CheckCircle2 size={20} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="text-indigo-600" size={26} />
              meeting notes
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-xl font-medium">
              Record, organize, and attach structured meeting notes to client consultations and case timelines.
            </p>
          </div>
          <button
            onClick={openNewNoteModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus size={18} />
            <span>Record New Meeting Note</span>
          </button>
        </div>
      </div>

      {/* Controls & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search notes by client, case title, summary, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
          />
        </div>

        {/* Calendar Date Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar size={16} className="text-slate-400 hidden sm:block" />
          <div className="relative w-full sm:w-48">
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {selectedDateFilter && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                title="Clear Date Filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes Grid View */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 mt-3 font-medium">Loading consultation meeting notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Meeting Notes Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || selectedDateFilter
              ? "No meeting notes match your search or date filters."
              : "Record notes after client meetings to maintain a clear timeline of discussions and strategy."}
          </p>
          <button
            onClick={openNewNoteModal}
            className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md"
          >
            <Plus size={16} />
            <span>Create First Meeting Note</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Case</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {filteredNotes.map((note) => {
                  return (
                    <tr key={note.id} className="hover:bg-slate-50 transition-colors group">
                      {/* Title */}
                      <td className="px-5 py-4 max-w-[220px]">
                        <p className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                          {note.title}
                        </p>
                        {note.summary && (
                          <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[200px]">{note.summary}</p>
                        )}
                      </td>

                      {/* Client */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-800 text-sm capitalize">
                            {note.client_name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Case */}
                      <td className="px-5 py-4 max-w-[180px]">
                        {note.case_title ? (
                          <div className="flex items-start gap-1.5">
                            <Briefcase size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                            <span className="text-slate-600 text-xs truncate">
                              {note.case_title}
                              {note.case_no && (
                                <span className="ml-1 text-indigo-600 font-semibold">(#{note.case_no})</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">General</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                          <Calendar size={13} className="text-slate-400" />
                          {note.meeting_date}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelectedNote(note); setShowViewModal(true); }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                            title="View Note"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handlePrintNote(note)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                            title="Print Note"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => openEditNoteModal(note)}
                            className="p-1.5 hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 rounded-lg transition-colors"
                            title="Edit Note"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => { setDeleteId(note.id); setShowDeleteModal(true); }}
                            className="p-1.5 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded-lg transition-colors"
                            title="Delete Note"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT NOTE MODAL */}
      {showNoteModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={22} />
                <h3 className="font-extrabold text-lg text-slate-900">
                  {formData.id ? "Edit Meeting Note" : "Record Meeting Note"}
                </h3>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveNote} className="bg-white px-6 py-5 overflow-y-auto space-y-4 flex-1">

              {/* Row 1 — Title + Meeting Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Meeting Note Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E.g. Strategy Discussion — Interim Stay Application"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Meeting Type
                  </label>
                  {formData.consultation_id ? (
                    <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold flex items-center gap-2 cursor-not-allowed">
                      {formData.meeting_type}
                    </div>
                  ) : (
                    <select
                      value={formData.meeting_type}
                      onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    >
                      <option value="Video Call">📹 Video Call</option>
                      <option value="In-Person">🤝 In-Person Meeting</option>
                      <option value="Phone Call">📞 Phone Call</option>
                      <option value="Chat">💬 Chat / Virtual</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Row 2 — Client + Case */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Client Name <span className="text-rose-500">*</span>
                  </label>
                  {formData.consultation_id ? (
                    <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold flex items-center gap-2 cursor-not-allowed capitalize">
                      {formData.client_name}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="Enter client name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Link Existing Case
                    <span className="ml-1 text-[10px] font-medium text-slate-400 normal-case tracking-normal">(Optional)</span>
                  </label>
                  <select
                    value={formData.case_id}
                    onChange={(e) => handleCaseSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="">— No Specific Case (General Consultation) —</option>
                    {(() => {
                      const clientFilter = (formData.client_name || "").toLowerCase().trim();
                      const filtered = clientFilter
                        ? casesList.filter(c =>
                            (c.client_name || "").toLowerCase().includes(clientFilter) ||
                            clientFilter.includes((c.client_name || "").toLowerCase())
                          )
                        : casesList;
                      return filtered.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.case_title} ({c.case_no})
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Row 3 — Date + Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Meeting Date <span className="text-rose-500">*</span>
                  </label>
                  {formData.consultation_id ? (
                    <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold flex items-center gap-2 cursor-not-allowed">
                      {formData.meeting_date}
                    </div>
                  ) : (
                    <input
                      type="date"
                      required
                      value={formData.meeting_date}
                      onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Meeting Time
                  </label>
                  {formData.consultation_id ? (
                    <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold flex items-center gap-2 cursor-not-allowed">
                      {formData.meeting_time}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.meeting_time}
                      onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                      placeholder="E.g. 11:30 AM"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-1" />

              {/* Row 4 — Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Executive Summary / Discussion Overview
                </label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Summarize what was discussed during the consultation..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none"
                />
              </div>

              {/* Row 5 — Key Topics + Legal Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Key Topics & Points Raised
                  </label>
                  <textarea
                    rows={4}
                    value={formData.key_topics}
                    onChange={(e) => setFormData({ ...formData, key_topics: e.target.value })}
                    placeholder="• Bail application status&#10;• Witness availability&#10;• Next court date..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Legal Advice & Recommendations Given
                  </label>
                  <textarea
                    rows={4}
                    value={formData.legal_advice}
                    onChange={(e) => setFormData({ ...formData, legal_advice: e.target.value })}
                    placeholder="Statutory provisions explained, bail conditions, next steps..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/25 transition-all"
                >
                  {formData.id ? "Update Note" : "Save Meeting Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      , typeof document !== 'undefined' ? document.body : null)}

      {/* VIEW NOTE DETAIL MODAL */}
      {showViewModal && selectedNote && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={20} />
                <h3 className="font-extrabold text-lg text-slate-900">{selectedNote.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintNote(selectedNote)}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                  title="Print Note"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm text-slate-800">
              {/* Meta Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Client</span>
                  <span className="font-bold text-slate-900">{selectedNote.client_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="font-medium text-slate-700">{selectedNote.meeting_date} ({selectedNote.meeting_time || "N/A"})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Type</span>
                  <span className="font-medium text-slate-700">{selectedNote.meeting_type || "Video Call"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Access</span>
                  <span className={`font-semibold ${selectedNote.is_confidential ? "text-rose-600" : "text-emerald-600"}`}>
                    {selectedNote.is_confidential ? "Confidential" : "Client Shared"}
                  </span>
                </div>
              </div>

              {selectedNote.case_title && (
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs flex items-center gap-2 text-indigo-900">
                  <Briefcase size={16} className="text-indigo-600 shrink-0" />
                  <span><strong>Associated Case:</strong> {selectedNote.case_title} {selectedNote.case_no ? `(#${selectedNote.case_no})` : ""}</span>
                </div>
              )}

              {/* Summary */}
              {selectedNote.summary && (
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-1">Executive Summary</h4>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                    {selectedNote.summary}
                  </div>
                </div>
              )}

              {/* Key Topics */}
              {selectedNote.key_topics && (
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-1">Key Topics & Discussion Points</h4>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                    {selectedNote.key_topics}
                  </div>
                </div>
              )}

              {/* Legal Advice */}
              {selectedNote.legal_advice && (
                <div>
                  <h4 className="font-bold text-xs uppercase text-emerald-600 mb-1">Legal Advice & Strategy</h4>
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-emerald-950 whitespace-pre-wrap">
                    {selectedNote.legal_advice}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {selectedNote.action_items && selectedNote.action_items.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase text-indigo-600 mb-1.5 flex items-center gap-1">
                    <CheckSquare size={14} /> Action Items & Tasks
                  </h4>
                  <div className="space-y-1.5">
                    {selectedNote.action_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          {item.completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Square size={16} className="text-slate-400" />}
                          <span className={item.completed ? "line-through text-slate-400" : "font-medium text-slate-800"}>{item.task}</span>
                        </div>
                        {item.assignee && (
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px]">
                            {item.assignee}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Advocate Notes */}
              {selectedNote.internal_notes && (
                <div>
                  <h4 className="font-bold text-xs uppercase text-rose-600 mb-1 flex items-center gap-1">
                    <Lock size={13} /> Advocate Internal Notes (Confidential)
                  </h4>
                  <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 text-rose-950 whitespace-pre-wrap">
                    {selectedNote.internal_notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditNoteModal(selectedNote);
                }}
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-xs font-bold"
              >
                <Edit size={14} /> Edit This Note
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      , typeof document !== 'undefined' ? document.body : null)}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={26} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Meeting Note?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this consultation note? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNote}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      , typeof document !== 'undefined' ? document.body : null)}
    </div>
  );
}
