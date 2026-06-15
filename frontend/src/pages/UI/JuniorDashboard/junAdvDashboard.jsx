"use client";

import { useRouter } from "next/navigation";
import {
  Briefcase,
  Calendar,
  FileText,
  CheckCircle,
  MessageSquare,
  Plus,
} from "lucide-react";

export default function JunAdvDashView() {
  const router = useRouter();

  const cases = [
    {
      title: "State vs Rajesh Kumar",
      hearing: "15 Jun 2026",
      status: "Active",
    },
    {
      title: "Anita Verma vs Suresh",
      hearing: "18 Jun 2026",
      status: "Pending",
    },
  ];

  const tasks = [
    "Prepare case notes",
    "Upload hearing documents",
    "Review client affidavit",
  ];

  const documents = [
    "Petition Draft.pdf",
    "Evidence Report.pdf",
    "Affidavit.docx",
  ];

  return (
    <div className="w-full space-y-6 md:space-y-8">

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Junior Advocate Dashboard
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Welcome back, view and manage your assigned tasks and cases.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Assigned Cases"
          value="12"
          icon={<Briefcase size={22} />}
          color="bg-[#2563EB]"
        />

        <StatCard
          title="Hearings"
          value="5"
          icon={<Calendar size={22} />}
          color="bg-[#16A34A]"
        />

        <StatCard
          title="Documents"
          value="25"
          icon={<FileText size={22} />}
          color="bg-[#7C3AED]"
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* Cases */}
        <div className="lg:col-span-12 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-[#0F172A]">
              Assigned Cases
            </h2>

            <button
              onClick={() =>
                router.push("/assigned-cases")
              }
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Case</th>
                  <th className="pb-3 font-medium">Hearing</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {cases.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="py-4 text-sm font-medium text-[#1E293B]">
                      {item.title}
                    </td>

                    <td className="py-4 text-sm text-[#64748B]">
                      {item.hearing}
                    </td>

                    <td className="py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-200/50'
                          : 'bg-amber-50 text-amber-700 border-amber-200/50'
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

      </div>

      {/* Bottom Section */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Pending Tasks */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
          <h2 className="font-bold text-lg text-[#0F172A] mb-4">
            Pending Tasks
          </h2>

          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={index}
                className="border border-[#E2E8F0] rounded-lg p-4 text-sm text-[#1E293B] hover:bg-[#F8FAFC] transition-colors duration-150"
              >
                {task}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
          <h2 className="font-bold text-lg text-[#0F172A] mb-4">
            Recent Documents
          </h2>

          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center text-sm text-[#1E293B] hover:bg-[#F8FAFC] transition-colors duration-150"
              >
                <span className="font-medium">{doc}</span>

                <button className="text-[#2563EB] hover:text-[#1d4ed8] font-medium text-sm transition-colors cursor-pointer">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[#64748B] text-sm font-medium">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2 text-[#0F172A]">
            {value}
          </h2>
        </div>

        <div className={`${color} text-white p-3 rounded-lg shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}