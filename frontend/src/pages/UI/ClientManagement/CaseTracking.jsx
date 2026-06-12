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
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* <h1 className="text-3xl font-bold text-slate-800 mb-6">
        Case Tracking
      </h1> */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/client-management"
          className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Case Tracking
          </h1>

          {/* <p className="text-sm text-slate-500">
      Manage client cases and hearings
    </p> */}
        </div>
      </div>
      {/* <div className="mb-6">
  <input
    type="text"
    placeholder="Search by Client Name or Case Name..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full md:w-96 border rounded-lg p-3"
  />
</div> */}
      <div className="flex justify-end mb-6">
        <input
          type="text"
          placeholder="Search Client / Case..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-80 border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {/* Client Cards */}
      {/* Client Cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {filteredClients.length === 0 ? (
          <div className="col-span-3 text-center bg-white p-8 rounded-xl border">
            No matching case found.
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white border rounded-xl p-5 shadow-sm"
            >
              <h2 className="font-bold text-lg">{client.name}</h2>

              <p className="text-sm text-slate-500 mt-1">
                Client ID: {client.id}
              </p>

              <p className="text-sm mt-2">
                <span className="font-medium">Case:</span>{" "}
                {client.cases[0]?.name}
              </p>

              <button
                onClick={() => {
                  setSelectedClient(client);
                  setSelectedCase(null);
                  setEditingCase(null);
                }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                View Cases
              </button>
            </div>
          ))
        )}
      </div>

      {/* Cases Table */}
      {selectedClient && (
        <div className="bg-white rounded-xl border p-5 mb-8">
          <h2 className="text-xl font-bold mb-4">
            Cases of {selectedClient.name}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-100">
                  <th className="p-3 text-left">Case ID</th>
                  <th className="p-3 text-left">Case Name</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {selectedClient.cases.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">{item.id}</td>

                    <td className="p-3">{item.name}</td>

                    <td className="p-3">
                      <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCase(item);
                          setEditingCase(null);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      <button
                        onClick={() =>
                          setEditingCase({ ...item })
                        }
                        className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white rounded"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
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
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">
            Case Details
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p>
                <strong>Case ID:</strong> {selectedCase.id}
              </p>

              <p className="mt-2">
                <strong>Case Name:</strong>{" "}
                {selectedCase.name}
              </p>

              <p className="mt-2">
                <strong>Status:</strong>{" "}
                {selectedCase.status}
              </p>

              <p className="mt-2">
                <strong>Court:</strong>{" "}
                {selectedCase.court}
              </p>

              <p className="mt-2">
                <strong>Next Hearing:</strong>{" "}
                {selectedCase.hearing}
              </p>
            </div>

            <div className="space-y-3">
              {/* Documents */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Briefcase size={18} />
                  Documents
                </div>

                <ul className="mt-2 text-sm space-y-2">
                  <li>
                    <a
                      href="/documents/Vakalatnama.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      📄 Vakalatnama.pdf
                    </a>
                  </li>

                  <li>
                    <a
                      href="/documents/Evidence.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      📄 Evidence.pdf
                    </a>
                  </li>

                  <li>
                    <a
                      href="/documents/CourtOrder.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      📄 CourtOrder.pdf
                    </a>
                  </li>
                </ul>
              </div>

              {/* Timeline */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock size={18} />
                  Timeline
                </div>

                <ul className="mt-2 text-sm">
                  <li>10 May 2026 - Case Filed</li>
                  <li>15 May 2026 - Notice Issued</li>
                  <li>25 May 2026 - Hearing Scheduled</li>
                </ul>
              </div>

              {/* Payment */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle size={18} />
                  Payment Summary
                </div>

                <p className="mt-2 text-sm">
                  Total Fee: ₹50,000
                </p>

                <p className="text-sm">
                  Paid: ₹30,000
                </p>

                <p className="text-sm">
                  Pending: ₹20,000
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Case Form */}
      {editingCase && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-2xl font-bold mb-6">
            Edit Case
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">
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
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
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
                className="w-full border rounded-lg p-2"
              >
                <option>Active</option>
                <option>Closed</option>
                <option>Hearing Scheduled</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">
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
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
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
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                alert("Case Updated Successfully");
                setEditingCase(null);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Save Changes
            </button>

            <button
              onClick={() => setEditingCase(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}