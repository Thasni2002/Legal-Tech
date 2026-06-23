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
    <div className="w-full space-y-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">

      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Client Dashboard
          </h1>
          <p className="text-[#64748B] mt-2 text-lg font-medium">
             Welcome 
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-6 md:p-8 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer group">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Briefcase className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
          </div>
          <p className="text-[#475569] text-xs font-bold uppercase tracking-wider mb-2">
            Active Cases
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight">2</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-6 md:p-8 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer group">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Calendar className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
          </div>
          <p className="text-[#475569] text-xs font-bold uppercase tracking-wider mb-2">
            Upcoming Hearings
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight">2</h2>
        </div>

      </div>

      {/* My Cases */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-[#0F172A]">
            My Cases
          </h2>
          <button className="text-xs font-bold text-[#2563EB] uppercase tracking-wider hover:text-[#1d4ed8] transition-colors">
            View All
          </button>
        </div>

        <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Case No</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Next Hearing</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Advocate</th>
                <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {cases.map((item, index) => (
                <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                  <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">{item.caseNo}</td>
                  <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{item.type}</td>
                  <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{item.hearing}</td>
                  <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{item.advocate}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      item.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Consultation History */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#0F172A]">
              Consultation History
            </h2>
          </div>

          <div className="space-y-4 flex-1">
            {consultations.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-2xl border border-transparent hover:border-[#E2E8F0] hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <div>
                  <span className="block font-bold text-[#1E293B] mb-1">{item.date}</span>
                  <span className="text-xs font-medium text-[#64748B]">{item.advocate}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  item.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col">
          <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">
            Payment Summary
          </h2>

          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-emerald-800 font-bold text-sm uppercase tracking-wider">Total Paid</span>
              <span className="font-black text-emerald-600 text-xl">₹35,000</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <span className="text-rose-800 font-bold text-sm uppercase tracking-wider">Pending Amount</span>
              <span className="font-black text-rose-600 text-xl">₹15,000</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
              <span className="text-[#475569] font-bold text-sm uppercase tracking-wider">Next Due Date</span>
              <span className="font-extrabold text-[#0F172A] text-lg">25 June 2026</span>
            </div>
          </div>

          <button className="mt-8 w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-4 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
            Pay Now
          </button>
        </div>

      </div>

      {/* Assigned Advocate */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
        <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          Assigned Advocate
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <span className="block text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Name</span>
            <span className="font-extrabold text-lg text-[#0F172A]">Rahul Sharma</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <span className="block text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Phone</span>
            <span className="font-bold text-[#1E293B]">+91 9876543210</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <span className="block text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Email</span>
            <span className="font-bold text-[#1E293B] overflow-hidden text-ellipsis">rahul@gmail.com</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <span className="block text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Specialization</span>
            <span className="font-bold text-[#1E293B]">Criminal Lawyer</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
        <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">
          Recent Activity
        </h2>

        <div className="space-y-6">
          {timeline.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                {index + 1}
              </div>
              <div className="flex-1 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] group-hover:bg-white group-hover:shadow-md transition-all">
                <span className="font-bold text-[#1E293B]">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}