"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  Edit,
  Briefcase,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";

export default function CaseTracking() {
  const router = useRouter();
  const clients = [
    {
      id: "CL001",
      name: "Rahul Sharma",
      cases: [
        {
          id: "C001",
          name: "Property Dispute",
          status: "Active",
          court: "District Court",
          hearing: "25 June 2026",
        },
      ],
    },

    {
      id: "CL002",
      name: "Anjali Menon",
      cases: [
        {
          id: "C004",
          name: "Divorce Petition",
          status: "Active",
          court: "Family Court",
          hearing: "15 June 2026",
        },
      ],
    },

    {
      id: "CL003",
      name: "Arjun Nair",
      cases: [
        {
          id: "C006",
          name: "Cheque Bounce",
          status: "Active",
          court: "Magistrate Court",
          hearing: "20 June 2026",
        },
      ],
    },
  ];

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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
  return (
    <div className="w-full space-y-6 md:space-y-8">
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
                  <li>
                    <a
                      href="/documents/Vakalatnama.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline flex items-center gap-1.5 font-medium"
                    >
                      📄 Vakalatnama.pdf
                    </a>
                  </li>

                  <li>
                    <a
                      href="/documents/Evidence.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline flex items-center gap-1.5 font-medium"
                    >
                      📄 Evidence.pdf
                    </a>
                  </li>

                  <li>
                    <a
                      href="/documents/CourtOrder.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline flex items-center gap-1.5 font-medium"
                    >
                      📄 CourtOrder.pdf
                    </a>
                  </li>
                </ul>
              </div>

              {/* Timeline */}
              <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A] mb-3">
                  <Clock size={16} className="text-[#2563EB]" />
                  Timeline
                </div>

                <ul className="text-xs space-y-2 text-[#64748B] font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                    10 May 2026 - Case Filed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                    15 May 2026 - Notice Issued
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                    25 May 2026 - Hearing Scheduled
                  </li>
                </ul>
              </div>

              {/* Payment */}
              <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A] mb-3">
                  <CheckCircle size={16} className="text-[#2563EB]" />
                  Payment Summary
                </div>

                <div className="space-y-1.5 text-xs text-[#64748B]">
                  <div className="flex justify-between">
                    <span>Total Fee:</span>
                    <span className="font-semibold text-[#0F172A]">₹50,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="font-semibold text-green-600">₹30,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="font-semibold text-red-600">₹20,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Case Form */}
      {editingCase && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0F172A] mb-6 border-b border-[#F1F5F9] pb-3">
            Edit Case Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
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
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
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
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              >
                <option>Active</option>
                <option>Closed</option>
                <option>Hearing Scheduled</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
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
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
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
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#F1F5F9]">
            <button
              onClick={() => {
                alert("Case Updated Successfully");
                setEditingCase(null);
              }}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all duration-200 cursor-pointer"
            >
              Save Changes
            </button>

            <button
              onClick={() => setEditingCase(null)}
              className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}