"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FolderCheck, 
  FileText, 
  Upload, 
  Plus, 
  CheckSquare, 
  AlertTriangle, 
  DollarSign, 
  Building, 
  Search,
  Trash2,
  ExternalLink
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkPhysicalFiling() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [filings, setFilings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileUploading, setFileUploading] = useState(false);

  const [formData, setFormData] = useState({
    case_number: "",
    client_name: "",
    advocate_name: "",
    court_name: "",
    filing_type: "Plaint",
    filing_date: new Date().toISOString().split("T")[0],
    documents_checklist: "Index, Vakalathnama, Petition, Supporting Affidavit, Annexures",
    court_fee_paid: 500,
    stamp_duty: 100,
    filing_status: "Drafting",
    filing_receipt_url: "",
    diary_sr_number: "",
    notes: ""
  });

  const fetchFilings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/physical-filing`);
      if (response.ok) {
        const data = await response.json();
        setFilings(data);
      }
    } catch (e) {
      console.error("Failed to load physical filings:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      fetchFilings().finally(() => setIsLoading(false));
    }
  }, [router]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/physical-filing/upload-receipt`, {
        method: "POST",
        body
      });
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, filing_receipt_url: data.url }));
      }
    } catch (err) {
      console.error("Filing receipt upload error:", err);
    } finally {
      setFileUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/physical-filing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const newRecord = await response.json();
        setFilings((prev) => [newRecord, ...prev]);
        setIsModalOpen(false);
        setFormData({
          case_number: "",
          client_name: "",
          advocate_name: "",
          court_name: "",
          filing_type: "Plaint",
          filing_date: new Date().toISOString().split("T")[0],
          documents_checklist: "Index, Vakalathnama, Petition, Supporting Affidavit, Annexures",
          court_fee_paid: 500,
          stamp_duty: 100,
          filing_status: "Drafting",
          filing_receipt_url: "",
          diary_sr_number: "",
          notes: ""
        });
      }
    } catch (err) {
      console.error("Save physical filing error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this filing record?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/physical-filing/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setFilings((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-xs font-bold uppercase tracking-wider">
            📁 Court Registry Filing Counter
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Physical Case Filing & Defect Scrutiny
          </h1>
          <p className="text-purple-100 text-sm max-w-2xl font-medium">
            Verify document index checklists, track court fee payments & stamp duty, upload SR/Diary receipts, and clear scrutiny defects.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
        >
          <Plus size={18} />
          New Physical Filing
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
          <p className="text-slate-400 text-sm font-medium">Loading physical filing records...</p>
        </div>
      ) : filings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
            <FolderCheck size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Physical Filings Logged</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Click "New Physical Filing" to record document submission at the court filing counter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filings.map((filing) => (
            <div key={filing.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-purple-700 text-xs font-bold">
                    {filing.case_number}
                  </span>
                  <button onClick={() => handleDelete(filing.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{filing.client_name}</h3>
                <p className="text-xs text-slate-500 font-medium">Advocate: {filing.advocate_name || 'Assigned Counsel'}</p>

                <div className="space-y-2 text-xs font-medium text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-slate-400" />
                    <span>Court: <strong>{filing.court_name}</strong> ({filing.filing_type})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-emerald-500" />
                    <span>Court Fee: ₹{filing.court_fee_paid} • Stamp: ₹{filing.stamp_duty}</span>
                  </div>
                  {filing.diary_sr_number && (
                    <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                      <span>Diary / SR No: {filing.diary_sr_number}</span>
                    </div>
                  )}
                </div>

                {filing.documents_checklist && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Verified Checklist:</span>
                    <p className="text-xs text-slate-700 font-medium">{filing.documents_checklist}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                  filing.filing_status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                  filing.filing_status === 'Defect Raised' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {filing.filing_status}
                </span>

                {filing.filing_receipt_url && (
                  <a
                    href={`${API_BASE_URL}${filing.filing_receipt_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Receipt PDF <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xl font-extrabold text-slate-900">Record Physical Court Filing</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Case Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WP 1024/2026"
                    value={formData.case_number}
                    onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
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
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Advocate Name</label>
                  <input
                    type="text"
                    placeholder="Advocate Name"
                    value={formData.advocate_name}
                    onChange={(e) => setFormData({ ...formData, advocate_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Court Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="District Court / High Court"
                    value={formData.court_name}
                    onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Filing Type</label>
                  <select
                    value={formData.filing_type}
                    onChange={(e) => setFormData({ ...formData, filing_type: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Plaint">Plaint / Petition</option>
                    <option value="Vakalath">Vakalathnama</option>
                    <option value="Written Statement">Written Statement</option>
                    <option value="Interlocutory App">Interlocutory App (IA)</option>
                    <option value="Bail Petition">Bail Petition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Court Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.court_fee_paid}
                    onChange={(e) => setFormData({ ...formData, court_fee_paid: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Stamp Duty (₹)</label>
                  <input
                    type="number"
                    value={formData.stamp_duty}
                    onChange={(e) => setFormData({ ...formData, stamp_duty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Diary / SR Number</label>
                <input
                  type="text"
                  placeholder="Registry SR / Diary Receipt Number"
                  value={formData.diary_sr_number}
                  onChange={(e) => setFormData({ ...formData, diary_sr_number: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Documents Verified Checklist</label>
                <input
                  type="text"
                  placeholder="Comma separated document list"
                  value={formData.documents_checklist}
                  onChange={(e) => setFormData({ ...formData, documents_checklist: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Upload Filing Receipt</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
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
                  className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30"
                >
                  Save Filing Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
