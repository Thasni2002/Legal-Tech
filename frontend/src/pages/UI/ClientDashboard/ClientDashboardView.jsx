"use client";

import {
  Calendar,
  Briefcase,
  User,
} from "lucide-react";

export default function ClientDashboard() {
  const cases = [
    {
      caseNo: "CIV/101",
      type: "Property Dispute",
      hearing: "20 June 2026",
      advocate: "Rahul Sharma",
      status: "Active",
    },
    {
      caseNo: "CR/202",
      type: "Criminal Case",
      hearing: "25 June 2026",
      advocate: "Priya Nair",
      status: "Hearing",
    },
  ];

  const consultations = [
    {
      date: "12 June 2026",
      advocate: "Rahul Sharma",
      status: "Completed",
    },
    {
      date: "15 June 2026",
      advocate: "Priya Nair",
      status: "Pending",
    },
  ];

  const timeline = [
    "10 June - Case Created",
    "12 June - Evidence Submitted",
    "15 June - Hearing Scheduled",
    "18 June - Court Notice Sent",
  ];

  return (
    <div className="w-full space-y-6">

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold">
          Welcome, John Mathew
        </h1>

        <p className="mt-2 text-sm opacity-90">
          Manage your cases, hearings and payments.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <Briefcase className="w-8 h-8 text-blue-600 mb-3" />
          <p className="text-gray-500 text-sm">
            Active Cases
          </p>
          <h2 className="text-3xl font-bold">2</h2>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <Calendar className="w-8 h-8 text-green-600 mb-3" />
          <p className="text-gray-500 text-sm">
            Upcoming Hearings
          </p>
          <h2 className="text-3xl font-bold">2</h2>
        </div>

      </div>

      {/* My Cases */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">
          My Cases
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Case No</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Next Hearing</th>
              <th className="text-left p-3">Advocate</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {cases.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">{item.caseNo}</td>
                <td className="p-3">{item.type}</td>
                <td className="p-3">{item.hearing}</td>
                <td className="p-3">{item.advocate}</td>
                <td className="p-3">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Consultation + Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Consultation History */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">
            Consultation History
          </h2>

          {consultations.map((item, index) => (
            <div
              key={index}
              className="flex justify-between border-b py-3"
            >
              <span>{item.date}</span>
              <span>{item.advocate}</span>
              <span>{item.status}</span>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">
            Payment Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Paid</span>
              <span>₹35,000</span>
            </div>

            <div className="flex justify-between">
              <span>Pending Amount</span>
              <span>₹15,000</span>
            </div>

            <div className="flex justify-between">
              <span>Next Due Date</span>
              <span>25 June 2026</span>
            </div>
          </div>

          <button className="mt-5 w-full bg-blue-600 text-white py-2 rounded-lg">
            Pay Now
          </button>
        </div>

      </div>

      {/* Assigned Advocate */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Assigned Advocate
        </h2>

        <div className="space-y-2">
          <p><strong>Name:</strong> Rahul Sharma</p>
          <p><strong>Phone:</strong> +91 9876543210</p>
          <p><strong>Email:</strong> rahul@gmail.com</p>
          <p><strong>Specialization:</strong> Criminal Lawyer</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">
          Recent Activity
        </h2>

        <div className="space-y-3">
          {timeline.map((item, index) => (
            <div
              key={index}
              className="border-l-4 border-green-500 pl-3"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}