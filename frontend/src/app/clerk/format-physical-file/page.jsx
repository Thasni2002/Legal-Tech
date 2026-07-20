"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Plus, Search, Folder, PrinterCheck } from "lucide-react";

export default function FormatPhysicalFile() {
  const router = useRouter();

  // Mock initial physical files registry
  const [files, setFiles] = useState([
    {
      id: 1,
      fileNumber: "PF-2026-001",
      caseTitle: "Joseph K. v. Jacob Matthew",
      cabinet: "Cabinet A",
      shelf: "Shelf 2",
      dateFiled: "2026-07-10",
      status: "Active"
    },
    {
      id: 2,
      fileNumber: "PF-2026-002",
      caseTitle: "State of Kerala v. Sudheer Kumar",
      cabinet: "Cabinet B",
      shelf: "Shelf 4",
      dateFiled: "2026-07-15",
      status: "Active"
    }
  ]);

  const [formData, setFormData] = useState({
    fileNumber: "",
    caseTitle: "",
    cabinet: "Cabinet A",
    shelf: "Shelf 1",
    dateFiled: new Date().toISOString().split("T")[0],
    status: "Active"
  });

  const [search, setSearch] = useState("");
  const [activeLabelFile, setActiveLabelFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fileNumber || !formData.caseTitle) {
      alert("Please fill in File Number and Case Title.");
      return;
    }
    const newFile = {
      id: Date.now(),
      ...formData
    };
    setFiles([newFile, ...files]);
    // Reset file number
    setFormData((prev) => ({
      ...prev,
      fileNumber: "",
      caseTitle: ""
    }));
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const filteredFiles = files.filter(
    (f) =>
      f.fileNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.caseTitle.toLowerCase().includes(search.toLowerCase()) ||
      f.cabinet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Label Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #label-print-area, #label-print-area * {
            visibility: visible;
          }
          #label-print-area {
            position: absolute;
            left: 50%;
            top: 20%;
            transform: translate(-50%, -20%);
            width: 250px;
            height: 400px;
            border: 4px solid #000;
            padding: 20px;
            font-family: sans-serif;
            text-align: center;
            background: #fff;
            color: #000;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/clerk/dashboard")}
          className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 flex items-center justify-center transition active:scale-95 shadow-sm"
        >
          <ArrowLeft size={16} className="text-[#475569]" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">Physical File Indexer</h1>
          <p className="text-[#64748B] text-sm font-medium">Log shelving indexes and print spine stickers/labels.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Log File Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-5 h-fit"
        >
          <h2 className="text-lg font-extrabold text-[#0F172A] border-b pb-3 flex items-center gap-2">
            <span className="text-emerald-500">📁</span> Log Physical File
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Physical File No. *</label>
              <input
                type="text"
                value={formData.fileNumber}
                onChange={(e) => setFormData({ ...formData, fileNumber: e.target.value })}
                placeholder="e.g. PF-2026-003"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Case Title *</label>
              <input
                type="text"
                value={formData.caseTitle}
                onChange={(e) => setFormData({ ...formData, caseTitle: e.target.value })}
                placeholder="e.g. Mary Joseph v. BSNL"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Cabinet</label>
                <select
                  value={formData.cabinet}
                  onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
                >
                  <option value="Cabinet A">Cabinet A</option>
                  <option value="Cabinet B">Cabinet B</option>
                  <option value="Cabinet C">Cabinet C</option>
                  <option value="Cabinet D">Cabinet D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Shelf Rack</label>
                <select
                  value={formData.shelf}
                  onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
                >
                  <option value="Shelf 1">Shelf 1</option>
                  <option value="Shelf 2">Shelf 2</option>
                  <option value="Shelf 3">Shelf 3</option>
                  <option value="Shelf 4">Shelf 4</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Date Logged</label>
              <input
                type="date"
                value={formData.dateFiled}
                onChange={(e) => setFormData({ ...formData, dateFiled: e.target.value })}
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Register File Record
          </button>
        </form>

        {/* Index Table Pane */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden">
          {/* Table Header / Search */}
          <div className="p-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#F8FAFC]/50">
            <h2 className="text-lg font-extrabold text-[#0F172A]">Physical Archive Index</h2>
            <div className="flex items-center border border-[#E2E8F0] rounded-full px-4 py-2 bg-white w-full sm:w-64 focus-within:ring-2 focus-within:ring-emerald-600/20 focus-within:border-emerald-600 transition">
              <Search className="w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search file index..."
                className="w-full ml-2 bg-transparent outline-none text-xs text-[#0F172A] placeholder:text-[#94A3B8]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#64748B]">File Number</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Case Title</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Location</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Labels</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{file.fileNumber}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{file.caseTitle}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 mr-1.5">{file.cabinet}</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md">{file.shelf}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setActiveLabelFile(file)}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white p-2 rounded-lg transition"
                        title="Print Spine Sticker Label"
                      >
                        <PrinterCheck size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">No matching physical files found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Spinal Label Print Modal */}
      {activeLabelFile && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-[#0F172A] mb-4">File Spine Label Preview</h3>

            {/* Print Sticker Frame */}
            <div className="flex justify-center mb-6">
              <div
                id="label-print-area"
                className="w-[200px] h-[320px] border-4 border-solid border-slate-900 bg-white p-6 flex flex-col justify-between items-center text-center rounded-xl shadow-inner select-none"
              >
                <div className="space-y-1">
                  <Folder className="w-8 h-8 text-slate-800 mx-auto" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Physical Record</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">{activeLabelFile.fileNumber}</h4>
                  <p className="text-xs font-bold text-slate-700 max-h-[80px] overflow-hidden leading-snug px-2">
                    {activeLabelFile.caseTitle}
                  </p>
                </div>

                <div className="w-full border-t border-slate-300 pt-3 text-[11px] font-bold text-slate-600">
                  <p>{activeLabelFile.cabinet}</p>
                  <p className="text-[#10B981]">{activeLabelFile.shelf}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveLabelFile(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePrintLabel}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Print Sticker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
