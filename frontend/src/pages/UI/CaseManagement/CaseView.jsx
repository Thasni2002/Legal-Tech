"use client";

import { useRouter } from "next/navigation";

import {
  Menu,
  Bell,
  Search,
  Plus,
  Eye,
  Pencil,
  MoreVertical,
} from "lucide-react";

const cases = [
  {
    title: "State of U.P. vs. Rajesh Kumar",
    caseNo: "CR/1234/2023",
    client: "Rajesh Kumar",
    court: "CJM Court, Prayagraj",
    hearing: "28 May 2024",
    status: "Active",
  },
  {
    title: "Anita Verma vs. Suresh Verma",
    caseNo: "FA/567/2023",
    client: "Anita Verma",
    court: "Family Court",
    hearing: "30 May 2024",
    status: "Active",
  },
  {
    title: "ABC Pvt. Ltd. vs. XYZ Corp.",
    caseNo: "CS/890/2023",
    client: "ABC Pvt. Ltd.",
    court: "High Court",
    hearing: "04 Jun 2024",
    status: "Active",
  },
  {
    title: "Neha Singh vs. RTO Dept.",
    caseNo: "MA/334/2023",
    client: "Neha Singh",
    court: "Motor Accident Tribunal",
    hearing: "12 Jun 2024",
    status: "Pending",
  },
];

export default function CaseView() {
  const router = useRouter();
  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Case Management
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Track legal cases, hearings and case progress
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
         <Card
           title="AI Legal Assistant"
           description="Get intelligent legal answers and recommendations."
           buttonText="Open Assistant"
           color="bg-[#7C3AED] hover:bg-[#6d28d9]"
           onClick={() => router.push("/ai-assistant")}
         />

        <Card
          title="Judgment Summary"
          description="Summarize judgments and extract key points."
          buttonText="Explore Judgments"
          color="bg-[#16A34A] hover:bg-[#15803d]"
          onClick={() => router.push("/judgment-summary")}
        />

        <Card
          title="Legal Research"
          description="Search laws, acts and legal provisions."
          buttonText="Start Research"
          color="bg-[#2563EB] hover:bg-[#1d4ed8]"
          onClick={() => router.push("/legal-research")}
        />

        <Card
          title="Document Generation"
          description="Generate legal documents with AI."
          buttonText="Generate Document"
          color="bg-[#D97706] hover:bg-[#b45309]"
          onClick={() => router.push("/document-generation")}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Cases Section */}
        <div className="col-span-12 bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h2 className="font-bold text-lg text-[#0F172A]">My Cases</h2>

            <button
              onClick={() => router.push("/case-management/case-add")}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Plus size={16} />
              Add Case
            </button>
          </div>

          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-[#94A3B8]" />
            </span>
            <input
              type="text"
              placeholder="Search by case title..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Case Title</th>
                  <th className="pb-3 font-medium">Case No</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Court</th>
                  <th className="pb-3 font-medium">Next Hearing</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {cases.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="py-4 text-sm font-medium text-[#1E293B]">{item.title}</td>
                    <td className="py-4 text-sm text-[#1E293B]">{item.caseNo}</td>
                    <td className="py-4 text-sm text-[#1E293B]">{item.client}</td>
                    <td className="py-4 text-sm text-[#64748B]">{item.court}</td>
                    <td className="py-4 text-sm text-[#64748B]">{item.hearing}</td>

                    <td className="py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          item.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200/50"
                            : "bg-amber-50 text-amber-700 border-amber-200/50"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-4 text-sm">
                      <div className="flex gap-3 text-[#64748B]">
                        <Eye size={18} className="hover:text-[#2563EB] cursor-pointer transition-colors" />
                        <Pencil size={18} className="hover:text-[#2563EB] cursor-pointer transition-colors" />
                        <MoreVertical size={18} className="hover:text-[#2563EB] cursor-pointer transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, description, buttonText, color, onClick }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full">
      <div>
        <h3 className="font-bold text-base text-[#0F172A] mb-1.5">{title}</h3>
        <p className="text-xs text-[#64748B] mb-4">
          {description}
        </p>
      </div>

      <button
        onClick={onClick}
        className={`${color} text-white text-xs font-semibold px-4 py-2 rounded-lg w-full transition-all duration-200 shadow-sm cursor-pointer`}
      >
        {buttonText}
      </button>
    </div>
  );
}

function QuickAction({ text }) {
  return (
    <button className="w-full border rounded-lg p-3 text-left hover:bg-gray-50">
      {text}
    </button>
  );
}

function DocumentItem({ name }) {
  return (
    <div className="flex justify-between items-center border-b pb-2">
      <span>{name}</span>
    </div>
  );
}