"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Printer, 
  Plus, 
  CheckCircle, 
  PackageCheck, 
  ExternalLink,
  Trash2
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkClientNotice() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    case_no: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    notice_type: "Hearing Date Reminder",
    channel: "WhatsApp",
    notice_content: "Dear Client, Your case is posted for hearing on court next week. Please be available.",
    tracking_number: "",
    delivery_status: "Draft",
    sent_at: ""
  });

  const fetchNotices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/client-notice`);
      if (response.ok) {
        const data = await response.json();
        setNotices(data);
      }
    } catch (e) {
      console.error("Failed to load client notices:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      fetchNotices().finally(() => setIsLoading(false));
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/client-notice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          delivery_status: "Sent",
          sent_at: new Date().toLocaleString()
        })
      });
      if (response.ok) {
        const newRecord = await response.json();
        setNotices((prev) => [newRecord, ...prev]);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Save client notice error:", err);
    }
  };

  const handlePrint = (notice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Client Notice - ${notice.case_no}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
          <h2>LEGAL NOTICE / CLIENT UPDATE</h2>
          <hr/>
          <p><strong>Case No:</strong> ${notice.case_no}</p>
          <p><strong>Client Name:</strong> ${notice.client_name}</p>
          <p><strong>Notice Type:</strong> ${notice.notice_type}</p>
          <p><strong>Date:</strong> ${notice.sent_at || new Date().toLocaleDateString()}</p>
          <hr/>
          <div style="margin-top: 20px; white-space: pre-wrap;">${notice.notice_content}</div>
          <br/><br/>
          <p>Advocate Office Clerk Signature</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this notice record?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/client-notice/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setNotices((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-teal-300 text-xs font-bold uppercase tracking-wider">
            📲 Client Notice & Process Summons Dispatch
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Client Notice & Summons Dispatch
          </h1>
          <p className="text-teal-100 text-sm max-w-2xl font-medium">
            Generate client hearing updates, send multi-channel notifications (WhatsApp, SMS, Email), print notices, and log Speed Post/RPAD tracking.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-teal-600/30 transition-all hover:scale-105"
        >
          <Plus size={18} />
          Generate & Send Notice
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
          <p className="text-slate-400 text-sm font-medium">Loading notice dispatch records...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
            <Send size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Client Notices Sent Yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Click "Generate & Send Notice" to dispatch hearing reminders or court summons dispatches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-800 text-xs font-bold">
                    {notice.channel} • {notice.case_no}
                  </span>
                  <button onClick={() => handleDelete(notice.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{notice.client_name}</h3>
                <p className="text-xs text-slate-500 font-medium">Type: {notice.notice_type}</p>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-700 font-medium">
                  "{notice.notice_content}"
                </div>

                {notice.tracking_number && (
                  <div className="text-xs text-indigo-600 font-extrabold bg-indigo-50 p-2 rounded-xl border border-indigo-100 flex items-center gap-1">
                    <PackageCheck size={14} /> Speed Post RPAD: {notice.tracking_number}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold">
                  ✓ {notice.delivery_status}
                </span>

                <button
                  onClick={() => handlePrint(notice)}
                  className="text-xs text-slate-700 font-bold hover:text-teal-600 flex items-center gap-1 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50"
                >
                  <Printer size={14} /> Print Notice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xl font-extrabold text-slate-900">Generate & Dispatch Client Notice</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Case No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OS 420/2026"
                    value={formData.case_no}
                    onChange={(e) => setFormData({ ...formData, case_no: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Client Name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Client Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notice Type</label>
                  <select
                    value={formData.notice_type}
                    onChange={(e) => setFormData({ ...formData, notice_type: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Hearing Date Reminder">Hearing Date Reminder</option>
                    <option value="Fee Alert / Due Notice">Fee Alert / Due Notice</option>
                    <option value="Court Summons Delivery">Court Summons Delivery</option>
                    <option value="Document Requirement">Document Requirement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dispatch Channel</label>
                <div className="grid grid-cols-4 gap-2">
                  {['WhatsApp', 'SMS', 'Email', 'Speed Post'].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setFormData({ ...formData, channel: ch })}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        formData.channel === ch ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {formData.channel === 'Speed Post' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Speed Post RPAD Tracking No</label>
                  <input
                    type="text"
                    placeholder="e.g. EU123456789IN"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notice Text Content *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.notice_content}
                  onChange={(e) => setFormData({ ...formData, notice_content: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold shadow-lg shadow-teal-600/30"
                >
                  Send & Record Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
