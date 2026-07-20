"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Plus, Calendar, Scale, Link2 } from "lucide-react";

export default function CaseNumberFromCourt() {
  const router = useRouter();

  // Mock list of linked court case numbers
  const [cases, setCases] = useState([
    {
      id: 1,
      caseNumber: "OS/412/2026",
      cnrNumber: "KLEK010041222026",
      diaryNumber: "Diary-1892/2026",
      physicalFile: "PF-2026-001",
      filingDate: "2026-07-12",
      nextHearingDate: "2026-08-20",
      courtName: "District Court, Ernakulam"
    },
    {
      id: 2,
      caseNumber: "MC/89/2026",
      cnrNumber: "KLEK020008922026",
      diaryNumber: "Diary-2051/2026",
      physicalFile: "PF-2026-002",
      filingDate: "2026-07-16",
      nextHearingDate: "2026-08-25",
      courtName: "Sessions Court, Ernakulam"
    }
  ]);

  const [formData, setFormData] = useState({
    caseNumber: "",
    cnrNumber: "",
    diaryNumber: "",
    physicalFile: "PF-2026-001",
    filingDate: new Date().toISOString().split("T")[0],
    nextHearingDate: "",
    courtName: "District Court, Ernakulam"
  });

  const [search, setSearch] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.caseNumber || !formData.cnrNumber) {
      alert("Please enter Case Number and CNR Number.");
      return;
    }
    const newCase = {
      id: Date.now(),
      ...formData
    };
    setCases([newCase, ...cases]);
    setFormData((prev) => ({
      ...prev,
      caseNumber: "",
      cnrNumber: "",
      diaryNumber: "",
      nextHearingDate: ""
    }));
  };

  const filteredCases = cases.filter(
    (c) =>
      c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.cnrNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.physicalFile.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/clerk/dashboard")}
          className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 flex items-center justify-center transition active:scale-95 shadow-sm"
        >
          <ArrowLeft size={16} className="text-[#475569]" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">Court Case Linker</h1>
          <p className="text-[#64748B] text-sm font-medium">Record and link official court case numbers to files.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Record Case Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-5 h-fit"
        >
          <h2 className="text-lg font-extrabold text-[#0F172A] border-b pb-3 flex items-center gap-2">
            <span className="text-violet-500">⚖️</span> Link Court Case Number
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Court Case Number *</label>
              <input
                type="text"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                placeholder="e.g. OS/123/2026"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">CNR Number (16 chars) *</label>
              <input
                type="text"
                value={formData.cnrNumber}
                onChange={(e) => setFormData({ ...formData, cnrNumber: e.target.value })}
                placeholder="e.g. KLEK010041222026"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Filing Diary Number</label>
              <input
                type="text"
                value={formData.diaryNumber}
                onChange={(e) => setFormData({ ...formData, diaryNumber: e.target.value })}
                placeholder="e.g. Diary-1892/2026"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Court</label>
                <select
                  value={formData.courtName}
                  onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition"
                >
                  <option value="District Court, Ernakulam">District Court</option>
                  <option value="Sessions Court, Ernakulam">Sessions Court</option>
                  <option value="Family Court, Ernakulam">Family Court</option>
                  <option value="High Court of Kerala">High Court</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Physical File No.</label>
                <select
                  value={formData.physicalFile}
                  onChange={(e) => setFormData({ ...formData, physicalFile: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition"
                >
                  <option value="PF-2026-001">PF-2026-001</option>
                  <option value="PF-2026-002">PF-2026-002</option>
                  <option value="PF-2026-003">PF-2026-003</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Filing Date</label>
                <input
                  type="date"
                  value={formData.filingDate}
                  onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Next Hearing</label>
                <input
                  type="date"
                  value={formData.nextHearingDate}
                  onChange={(e) => setFormData({ ...formData, nextHearingDate: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Link Case Number
          </button>
        </form>

        {/* List Pane */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#F8FAFC]/50">
            <h2 className="text-lg font-extrabold text-[#0F172A]">Official Court Registry</h2>
            <div className="flex items-center border border-[#E2E8F0] rounded-full px-4 py-2 bg-white w-full sm:w-64 focus-within:ring-2 focus-within:ring-violet-600/20 focus-within:border-violet-600 transition">
              <Search className="w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search case details..."
                className="w-full ml-2 bg-transparent outline-none text-xs text-[#0F172A] placeholder:text-[#94A3B8]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Case Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#64748B]">CNR Number</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Filing Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Linked File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{c.caseNumber}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{c.courtName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#475569]">{c.cnrNumber}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5 text-xs font-semibold">
                        <p className="text-slate-500">Filed: {c.filingDate}</p>
                        {c.nextHearingDate ? (
                          <p className="text-amber-600 flex items-center gap-1">
                            <Calendar size={11} /> Next: {c.nextHearingDate}
                          </p>
                        ) : (
                          <p className="text-slate-400">Next Hearing: TBD</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 px-2.5 py-1 rounded-md text-xs font-bold border border-violet-100">
                        <Link2 size={12} />
                        {c.physicalFile}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">No matching cases found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
