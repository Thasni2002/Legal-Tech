"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Globe, 
  UploadCloud, 
  CheckCircle, 
  FileCheck, 
  Download, 
  Plus, 
  ExternalLink,
  Trash2
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkEFiling() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [efilings, setEfilings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    court_name: "e-Courts High Court Portal",
    case_details: "",
    uploaded_documents: "",
    is_validated: true,
    acknowledgement_number: "",
    filing_receipt_url: "",
    filing_status: "Submitted",
    notes: ""
  });

  const fetchEfilings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/efiling`);
      if (response.ok) {
        const data = await response.json();
        setEfilings(data);
      }
    } catch (e) {
      console.error("Failed to load e-filings:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      fetchEfilings().finally(() => setIsLoading(false));
    }
  }, [router]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/efiling/upload-document`, {
        method: "POST",
        body
      });
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          filing_receipt_url: data.url,
          uploaded_documents: data.name
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/efiling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const newRecord = await response.json();
        setEfilings((prev) => [newRecord, ...prev]);
        setIsModalOpen(false);
        setFormData({
          court_name: "e-Courts High Court Portal",
          case_details: "",
          uploaded_documents: "",
          is_validated: true,
          acknowledgement_number: "",
          filing_receipt_url: "",
          filing_status: "Submitted",
          notes: ""
        });
      }
    } catch (err) {
      console.error("Save e-filing error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this e-filing submission record?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/efiling/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setEfilings((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-cyan-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs font-bold uppercase tracking-wider">
            🌐 Digital Court Portal Integration
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Online Filing (e-Filing) Manager
          </h1>
          <p className="text-cyan-100 text-sm max-w-2xl font-medium">
            Upload PDF filings to judicial e-portals, validate PDF bookmarking & digital signatures, and download e-acknowledgement receipts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-cyan-600/30 transition-all hover:scale-105"
        >
          <Plus size={18} />
          New Online e-Filing
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-600"></div>
          <p className="text-slate-400 text-sm font-medium">Loading e-Filing records...</p>
        </div>
      ) : efilings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto">
            <Globe size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Online Filings Submitted</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Click "New Online e-Filing" to record online portal submissions and store acknowledgement receipts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {efilings.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-cyan-50 border border-cyan-100 rounded-full text-cyan-800 text-xs font-bold">
                    {item.court_name}
                  </span>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">{item.case_details}</h3>

                {item.acknowledgement_number && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Ack / e-Filing SR No:</span>
                    <p className="text-xs text-cyan-700 font-extrabold">{item.acknowledgement_number}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                  item.filing_status === 'Submitted' || item.filing_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.filing_status}
                </span>

                {item.filing_receipt_url && (
                  <a
                    href={`${API_BASE_URL}${item.filing_receipt_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download size={12} /> Receipt PDF
                  </a>
                )}
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
              <h2 className="text-xl font-extrabold text-slate-900">Submit Online e-Filing Record</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Judicial Portal *</label>
                <select
                  value={formData.court_name}
                  onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="e-Courts High Court Portal">e-Courts High Court Portal</option>
                  <option value="District Courts e-Filing System">District Courts e-Filing System</option>
                  <option value="NCLT e-Filing Portal">NCLT e-Filing Portal</option>
                  <option value="DRT Online Portal">DRT Online Portal</option>
                  <option value="Supreme Court e-Filing">Supreme Court e-Filing Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Case Details & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CA 502/2026 - M/s Alpha Corp vs State"
                  value={formData.case_details}
                  onChange={(e) => setFormData({ ...formData, case_details: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Acknowledgement / SR Number</label>
                <input
                  type="text"
                  placeholder="e.g. ACK-2026-981240"
                  value={formData.acknowledgement_number}
                  onChange={(e) => setFormData({ ...formData, acknowledgement_number: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Upload e-Filing Receipt / PDF</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
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
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-600/30"
                >
                  Submit e-Filing Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
