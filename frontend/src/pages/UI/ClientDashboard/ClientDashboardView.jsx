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
    <div className="w-full space-y-6 md:space-y-8">

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Dashboard
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Welcome, John Mathew — manage your cases, hearings and payments securely.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <Briefcase className="w-5 h-5 text-[#2563EB]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium">
            Active Cases
          </p>
          <h2 className="text-3xl font-bold mt-1 text-[#0F172A]">2</h2>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5 text-[#16A34A]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium">
            Upcoming Hearings
          </p>
          <h2 className="text-3xl font-bold mt-1 text-[#0F172A]">2</h2>
        </div>

      </div>

      {/* My Cases */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F172A] mb-4">
          My Cases
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="pb-3 font-medium">Case No</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Next Hearing</th>
                <th className="pb-3 font-medium">Advocate</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9]">
              {cases.map((item, index) => (
                <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                  <td className="py-4 text-sm font-medium text-[#1E293B]">{item.caseNo}</td>
                  <td className="py-4 text-sm text-[#1E293B]">{item.type}</td>
                  <td className="py-4 text-sm text-[#64748B]">{item.hearing}</td>
                  <td className="py-4 text-sm text-[#1E293B]">{item.advocate}</td>
                  <td className="py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      item.status === 'Active'
                        ? 'bg-green-50 text-green-700 border-green-200/50'
                        : 'bg-blue-50 text-blue-700 border-blue-200/50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consultation + Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Consultation History */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">
            Consultation History
          </h2>

          <div className="divide-y divide-[#F1F5F9]">
            {consultations.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-3.5 text-sm"
              >
                <span className="font-medium text-[#1E293B]">{item.date}</span>
                <span className="text-[#64748B]">{item.advocate}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  item.status === 'Completed'
                    ? 'bg-green-50 text-green-700 border-green-200/50'
                    : 'bg-amber-50 text-amber-700 border-amber-200/50'
                }`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">
            Payment Summary
          </h2>

          <div className="space-y-3.5 divide-y divide-[#F1F5F9]">
            <div className="flex justify-between text-sm pt-1">
              <span className="text-[#64748B]">Total Paid</span>
              <span className="font-semibold text-green-600">₹35,000</span>
            </div>

            <div className="flex justify-between text-sm pt-3">
              <span className="text-[#64748B]">Pending Amount</span>
              <span className="font-semibold text-[#DC2626]">₹15,000</span>
            </div>

            <div className="flex justify-between text-sm pt-3">
              <span className="text-[#64748B]">Next Due Date</span>
              <span className="font-medium text-[#1E293B]">25 June 2026</span>
            </div>
          </div>

          <button className="mt-6 w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors duration-200 cursor-pointer">
            Pay Now
          </button>
        </div>

      </div>

      {/* Assigned Advocate */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-[#2563EB]" />
          Assigned Advocate
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="border border-[#F1F5F9] rounded-lg p-3">
            <span className="block text-xs text-[#64748B] font-medium uppercase tracking-wider mb-1">Name</span>
            <span className="font-semibold text-[#1E293B]">Rahul Sharma</span>
          </div>
          <div className="border border-[#F1F5F9] rounded-lg p-3">
            <span className="block text-xs text-[#64748B] font-medium uppercase tracking-wider mb-1">Phone</span>
            <span className="font-medium text-[#1E293B]">+91 9876543210</span>
          </div>
          <div className="border border-[#F1F5F9] rounded-lg p-3">
            <span className="block text-xs text-[#64748B] font-medium uppercase tracking-wider mb-1">Email</span>
            <span className="font-medium text-[#1E293B]">rahul@gmail.com</span>
          </div>
          <div className="border border-[#F1F5F9] rounded-lg p-3">
            <span className="block text-xs text-[#64748B] font-medium uppercase tracking-wider mb-1">Specialization</span>
            <span className="font-medium text-[#1E293B]">Criminal Lawyer</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F172A] mb-4">
          Recent Activity
        </h2>

        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div
              key={index}
              className="border-l-4 border-[#2563EB] pl-4 py-0.5 text-sm text-[#1E293B]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}