"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  User, 
  FileText, 
  Upload, 
  Bell, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Trash2
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkNextPosting() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [postings, setPostings] = useState([]);
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    case_id: "",
    case_no: "",
    case_title: "",
    court_name: "",
    court_hall: "",
    judge_name: "",
    next_hearing_date: "",
    hearing_time: "",
    hearing_purpose: "Arguments",
    item_number: "",
    posting_order_url: "",
    notify_senior: true,
    notify_junior: true,
    notify_client: true,
    notes: ""
  });

  const [notificationMsg, setNotificationMsg] = useState(null);

  const fetchPostings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/next-posting`);
      if (response.ok) {
        const data = await response.json();
        setPostings(data);
      }
    } catch (e) {
      console.error("Failed to load postings:", e);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/case-management/cases`);
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (e) {
      console.error("Failed to load cases:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      Promise.all([fetchPostings(), fetchCases()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [router]);

  const handleSelectCase = (caseItem) => {
    setFormData((prev) => ({
      ...prev,
      case_id: caseItem.id,
      case_no: caseItem.case_no || caseItem.case_id || "",
      case_title: caseItem.case_title || "",
      court_name: caseItem.court_name || ""
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/next-posting/upload-order`, {
        method: "POST",
        body
      });
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, posting_order_url: data.url }));
        setNotificationMsg({ type: "success", text: "Posting order memo uploaded successfully!" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setNotificationMsg({ type: "error", text: "Failed to upload file." });
    } finally {
      setFileUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.case_no || !formData.next_hearing_date) {
      setNotificationMsg({ type: "error", text: "Case Number and Next Hearing Date are required!" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/next-posting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const newPosting = await response.json();
        setPostings((prev) => [newPosting, ...prev]);
        setIsModalOpen(false);
        setNotificationMsg({ type: "success", text: "Next posting recorded and advocate/client notified!" });
        // Reset form
        setFormData({
          case_id: "",
          case_no: "",
          case_title: "",
          court_name: "",
          court_hall: "",
          judge_name: "",
          next_hearing_date: "",
          hearing_time: "",
          hearing_purpose: "Arguments",
          item_number: "",
          posting_order_url: "",
          notify_senior: true,
          notify_junior: true,
          notify_client: true,
          notes: ""
        });
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this posting record?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/next-posting/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setPostings((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredPostings = postings.filter(
    (p) =>
      p.case_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.case_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.court_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
            🏛️ Clerk Operations Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Next Posting Management
          </h1>
          <p className="text-blue-200 text-sm max-w-2xl font-medium">
            Capture hearing dates, court halls, judge bench updates, and send instant notifications to Senior Advocates, Junior Advocates, and Clients.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          Record Next Posting
        </button>
      </div>

      {/* Alert notification */}
      {notificationMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between ${notificationMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            {notificationMsg.type === 'success' ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-red-600" />}
            <span className="font-semibold text-sm">{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-xs underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Search Bar & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by case number, title or court..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Total Postings Recorded: <span className="text-blue-600 font-extrabold text-sm ml-1">{postings.length}</span>
        </div>
      </div>

      {/* Postings Grid / List */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-400 text-sm font-medium">Fetching hearing postings...</p>
        </div>
      ) : filteredPostings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <CalendarIcon size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Postings Recorded Yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Click "Record Next Posting" to log the upcoming hearing date, court hall, and item number.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPostings.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold">
                    {item.case_no}
                  </span>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                  {item.case_title}
                </h3>

                <div className="space-y-2 pt-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200">
                    <CalendarIcon size={16} className="text-amber-600" />
                    <span>Next Hearing: <strong>{item.next_hearing_date}</strong></span>
                    {item.hearing_time && <span className="ml-auto flex items-center gap-1"><Clock size={12} />{item.hearing_time}</span>}
                  </div>

                  {item.court_name && (
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" />
                      <span>{item.court_name} {item.court_hall ? `• Hall: ${item.court_hall}` : ''}</span>
                    </div>
                  )}

                  {item.judge_name && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span>Bench: {item.judge_name}</span>
                    </div>
                  )}

                  {item.hearing_purpose && (
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span>Stage: <strong>{item.hearing_purpose}</strong> {item.item_number ? `(Item #${item.item_number})` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions & Notifications */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Bell size={14} className="text-blue-500" />
                  <span>Notified:</span>
                  {item.notify_senior && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">Sr</span>}
                  {item.notify_junior && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">Jr</span>}
                  {item.notify_client && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">Client</span>}
                </div>

                {item.posting_order_url && (
                  <a
                    href={`${API_BASE_URL}${item.posting_order_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 underline"
                  >
                    View Memo <ArrowRight size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Next Posting */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Record Next Posting</h2>
                <p className="text-xs font-medium text-slate-500">Log next hearing details and notify stakeholders</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              {/* Select Case from System */}
              {cases.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Select Active Firm Case (Optional Auto-Fill)
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = cases.find((c) => c.id === parseInt(e.target.value));
                      if (selected) handleSelectCase(selected);
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">-- Choose from existing cases --</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_no || c.case_id} - {c.case_title} ({c.client_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Case Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OS 420/2026"
                    value={formData.case_no}
                    onChange={(e) => setFormData({ ...formData, case_no: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Case Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh vs Suresh"
                    value={formData.case_title}
                    onChange={(e) => setFormData({ ...formData, case_title: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Next Hearing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.next_hearing_date}
                    onChange={(e) => setFormData({ ...formData, next_hearing_date: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Hearing Time
                  </label>
                  <input
                    type="time"
                    value={formData.hearing_time}
                    onChange={(e) => setFormData({ ...formData, hearing_time: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Item Number
                  </label>
                  <input
                    type="text"
                    placeholder="Item # e.g. 14"
                    value={formData.item_number}
                    onChange={(e) => setFormData({ ...formData, item_number: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Court Name
                  </label>
                  <input
                    type="text"
                    placeholder="High Court / District Court"
                    value={formData.court_name}
                    onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Court Hall
                  </label>
                  <input
                    type="text"
                    placeholder="Hall # 04"
                    value={formData.court_hall}
                    onChange={(e) => setFormData({ ...formData, court_hall: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Judge / Bench
                  </label>
                  <input
                    type="text"
                    placeholder="Justice XYZ"
                    value={formData.judge_name}
                    onChange={(e) => setFormData({ ...formData, judge_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Hearing Purpose / Stage
                  </label>
                  <select
                    value={formData.hearing_purpose}
                    onChange={(e) => setFormData({ ...formData, hearing_purpose: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Admission">Admission / First Hearing</option>
                    <option value="Arguments">Arguments</option>
                    <option value="Evidence">Evidence / Cross Examination</option>
                    <option value="Frame of Issues">Frame of Issues</option>
                    <option value="Written Statement">Written Statement</option>
                    <option value="Judgment / Orders">Judgment / Orders</option>
                    <option value="Process Service">Process Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Upload Posting Order / Daily Memo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="posting-file-upload"
                    />
                    <label
                      htmlFor="posting-file-upload"
                      className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl cursor-pointer text-slate-600 font-semibold"
                    >
                      <Upload size={16} />
                      {fileUploading ? "Uploading..." : formData.posting_order_url ? "Memo Uploaded ✓" : "Choose File"}
                    </label>
                  </div>
                </div>
              </div>

              {/* Notification Checkboxes */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                <span className="block text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  Automated Broadcasting & Reminders
                </span>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notify_senior}
                      onChange={(e) => setFormData({ ...formData, notify_senior: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Notify Senior Advocate
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notify_junior}
                      onChange={(e) => setFormData({ ...formData, notify_junior: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Notify Junior Advocate
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notify_client}
                      onChange={(e) => setFormData({ ...formData, notify_client: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Notify Client (SMS/WhatsApp)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Note down opponent counsel remarks or next steps..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  {isSubmitting ? "Saving..." : "Save Next Posting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
