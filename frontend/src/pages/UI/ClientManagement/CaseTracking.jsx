"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Eye,
  Edit,
  Briefcase,
  CheckCircle,
  Clock,
  ArrowLeft,
  User,
} from "lucide-react";
export default function CaseTracking() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await fetch("http://127.0.0.1:8000/case-management/");
        if (res.ok) {
          const data = await res.json();
          setCases(data);
        }
      } catch (err) {
        console.error("Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build clients dynamically from cases
  const clientsMap = {};
  cases.forEach((c) => {
    const name = c.client_name || "Unknown Client";
    if (!clientsMap[name]) {
      clientsMap[name] = {
        id: `CL-${name.replace(/\s+/g, "").substring(0, 5).toUpperCase()}-${c.contact_number || "000"}`,
        name: name,
        cases: [],
      };
    }
    clientsMap[name].cases.push({
      id: c.case_id || `C-${c.id}`,
      dbId: c.id,
      name: c.case_title,
      status: c.status,
      court: c.court_name,
      hearing: c.next_hearing_date || "N/A",
      selected_advocate: c.selected_advocate,
      case_no: c.case_no,
      documents: c.documents || [],
    });
  });
  const clients = Object.values(clientsMap);

  const filteredClients = clients.filter(
    (client) =>
      client.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      client.cases.some((c) =>
        c.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-xl border border-[#E2E8F0]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#64748B] font-medium">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/client-management"
            className="flex items-center justify-center w-9 h-9 bg-white border border-[#E2E8F0] rounded-lg shadow-sm text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Case Tracking
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Monitor litigation milestones, document trails, and schedules.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </span>
          <input
            type="text"
            placeholder="Search Client / Case..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200 shadow-sm"
          />
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center bg-white py-12 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B]">
            No matching client or case found.
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-bold text-base text-[#0F172A]">{client.name}</h2>
                  <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] font-mono px-2 py-0.5 rounded border border-[#E2E8F0] font-semibold">
                    ID: {client.id}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#64748B] mt-3">
                  <p>
                    <span className="font-semibold text-[#1E293B]">Case:</span>{" "}
                    {client.cases[0]?.name}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Court:</span>{" "}
                    {client.cases[0]?.court}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedClient(client);
                  setSelectedCase(null);
                  setEditingCase(null);
                }}
                className="mt-5 w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer"
              >
                View Cases
              </button>
            </div>
          ))
        )}
      </div>

      {/* Cases Table */}
      {selectedClient && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">
            Cases of {selectedClient.name}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC]">
                  <th className="p-3 font-medium">Case ID</th>
                  <th className="p-3 font-medium">Case Name</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {selectedClient.cases.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-3 text-sm font-medium text-[#1E293B]">{item.id}</td>
                    <td className="p-3 text-sm text-[#1E293B]">{item.name}</td>
                    <td className="p-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200/50">
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCase(item);
                            setEditingCase(null);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors duration-200 cursor-pointer"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        <button
                          onClick={() =>
                            setEditingCase({ ...item })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors duration-200 cursor-pointer"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Details */}
      {selectedCase && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0F172A] mb-5 border-b border-[#F1F5F9] pb-3">
            Case Details Log
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 text-sm text-[#64748B]">
              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Case ID</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.id}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Case Name</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.name}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Case Number</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.case_no || "N/A"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Advocate Name</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.selected_advocate || "N/A"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Status</span>
                <span className="col-span-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
                    {selectedCase.status}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="font-semibold text-[#1E293B]">Court</span>
                <span className="col-span-2 text-[#0F172A] font-medium">{selectedCase.court}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pb-2">
                <span className="font-semibold text-[#1E293B]">Next Hearing</span>
                <span className="col-span-2 text-[#0F172A] font-semibold">{selectedCase.hearing}</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Documents */}
              <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A] mb-3">
                  <Briefcase size={16} className="text-[#2563EB]" />
                  Documents
                </div>

                <ul className="text-xs space-y-2.5">
                  {selectedCase.documents && selectedCase.documents.length > 0 ? (
                    selectedCase.documents.map((doc, idx) => (
                      <li key={idx}>
                        <span className="text-[#2563EB] flex items-center gap-1.5 font-medium">
                          📄 {doc.file || doc.documentType || "Unnamed Document"}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 italic">No documents uploaded</li>
                  )}
                </ul>
              </div>

              {/* Timeline */}
              <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A] mb-3">
                  <Clock size={16} className="text-[#2563EB]" />
                  Timeline
                </div>

                <ul className="text-xs space-y-2 text-[#64748B] font-medium">
                  {selectedCase.hearing && selectedCase.hearing !== "N/A" ? (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                      Next Hearing Scheduled: {selectedCase.hearing}
                    </li>
                  ) : (
                    <li className="text-gray-500 italic">No timeline events</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Added Dropdowns at the bottom of Case Details Log as requested */}
          <div className="mt-8 border-t border-[#F1F5F9] pt-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Quick Filters / Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Advocate Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  />
                  <select
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    value={selectedCase.selected_advocate || ""}
                    disabled
                  >
                    <option value="">{selectedCase.selected_advocate || "No Advocate Assigned"}</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Case Number
                </label>
                <div className="relative">
                  <Briefcase
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  />
                  <select
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    value={selectedCase.case_no || ""}
                    disabled
                  >
                    <option value="">{selectedCase.case_no || "No Case Number"}</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) /* Removed editing modal as it is irrelevant/unused dummy overlay code */}

      {/* Edit Case Form */}
      {mounted && editingCase && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl relative">

            <button
              onClick={() => setEditingCase(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-[#0F172A] mb-6">
              Edit Case Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-xs font-semibold">
                  Case Name
                </label>
                <input
                  type="text"
                  value={editingCase.name}
                  onChange={(e) =>
                    setEditingCase({
                      ...editingCase,
                      name: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-semibold">
                  Status
                </label>
                <select
                  value={editingCase.status}
                  onChange={(e) =>
                    setEditingCase({
                      ...editingCase,
                      status: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option>Active</option>
                  <option>Closed</option>
                  <option>Hearing Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-xs font-semibold">
                  Court Name
                </label>
                <input
                  type="text"
                  value={editingCase.court}
                  onChange={(e) =>
                    setEditingCase({
                      ...editingCase,
                      court: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-semibold">
                  Hearing Date
                </label>
                <input
                  type="text"
                  value={editingCase.hearing}
                  onChange={(e) =>
                    setEditingCase({
                      ...editingCase,
                      hearing: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`http://127.0.0.1:8000/case-management/${editingCase.dbId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        caseTitle: editingCase.name,
                        status: editingCase.status,
                        courtName: editingCase.court,
                        nextHearingDate: editingCase.hearing,
                      }),
                    });
                    if (res.ok) {
                      alert("Case Updated Successfully");
                      // Refresh cases
                      const loadRes = await fetch("http://127.0.0.1:8000/case-management/");
                      if (loadRes.ok) {
                        const data = await loadRes.json();
                        setCases(data);
                        // Update active selectedCase if it was edited
                        if (selectedCase && selectedCase.dbId === editingCase.dbId) {
                          const updatedCase = data.find(c => c.id === editingCase.dbId);
                          if (updatedCase) {
                            setSelectedCase({
                              id: updatedCase.case_id || `C-${updatedCase.id}`,
                              dbId: updatedCase.id,
                              name: updatedCase.case_title,
                              status: updatedCase.status,
                              court: updatedCase.court_name,
                              hearing: updatedCase.next_hearing_date || "N/A",
                              selected_advocate: updatedCase.selected_advocate,
                              case_no: updatedCase.case_no,
                              documents: updatedCase.documents || [],
                            });
                          }
                        }
                      }
                      setEditingCase(null);
                    } else {
                      alert("Failed to update case");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Error updating case");
                  }
                }}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Save Changes
              </button>

              <button
                onClick={() => setEditingCase(null)}
                className="border border-[#E2E8F0] px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}