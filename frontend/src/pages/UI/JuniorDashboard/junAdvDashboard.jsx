"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
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

  const [cases, setCases] = useState([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const user = getLoggedInUser();
    if (user && user.username) {
      setUserName(user.username);
    }

    const fetchAssignedCases = async () => {
      try {
        const res = await fetch("http://localhost:8000/lawfirm-management/assigned-cases");
        const data = await res.json();

        let casesToShow = data;
        if (user && user.role && user.role.toLowerCase().includes("junior")) {
          casesToShow = data.filter((item) => {
            if (!item.advocate_name) return false;
            const normalizedAssignedName = item.advocate_name.toLowerCase().replace(/[^a-z0-9]/g, "");
            return normalizedAssignedName === user.username;
          });
        }

        const formattedCases = casesToShow.map((item) => ({
          title: item.case_title || item.case_name,
          hearing: item.due_date ? item.due_date.split("T")[0] : "No date",
          status: item.status || "Active",
        }));

        setCases(formattedCases);
      } catch (error) {
        console.error("Error fetching dashboard cases:", error);
      }
    };

    fetchAssignedCases();
  }, []);

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
    <div className="w-full space-y-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">

      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Junior Advocate Dashboard
          </h1>
          <p className="text-[#64748B] mt-2 text-lg font-medium">
            Welcome {userName ? <span className="capitalize">{userName}</span> : ""}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Assigned Cases"
          value="12"
          icon={<Briefcase className="w-7 h-7 md:w-8 md:h-8" />}
          color="bg-blue-50 text-blue-600 border-blue-200"
        />

        <StatCard
          title="Hearings"
          value="5"
          icon={<Calendar className="w-7 h-7 md:w-8 md:h-8" />}
          color="bg-emerald-50 text-emerald-600 border-emerald-200"
        />

        <StatCard
          title="Documents"
          value="25"
          icon={<FileText className="w-7 h-7 md:w-8 md:h-8" />}
          color="bg-purple-50 text-purple-600 border-purple-200"
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Cases */}
        <div className="lg:col-span-12 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#0F172A]">
              Assigned Cases
            </h2>

            <button
              onClick={() =>
                router.push("/assigned-cases")
              }
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0]">
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Case</th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Hearing</th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {cases.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">
                      {item.title}
                    </td>

                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">
                      {item.hearing}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        item.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
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
      <div className="grid md:grid-cols-2 gap-8">

        {/* Pending Tasks */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col">
          <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">
            Pending Tasks
          </h2>

          <div className="space-y-4 flex-1">
            {tasks.map((task, index) => (
              <div
                key={index}
                className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4 text-sm font-bold text-[#1E293B] hover:bg-white hover:shadow-md hover:border-[#E2E8F0] transition-all duration-300 cursor-pointer flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <span className="font-black text-xs">{index + 1}</span>
                </div>
                {task}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col">
          <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">
            Recent Documents
          </h2>

          <div className="space-y-4 flex-1">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4 flex justify-between items-center text-sm font-bold text-[#1E293B] hover:bg-white hover:shadow-md transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={16} />
                  </div>
                  <span className="group-hover:text-[#2563EB] transition-colors">{doc}</span>
                </div>

                <button className="text-[#2563EB] hover:text-[#1d4ed8] font-bold text-xs uppercase tracking-wider bg-blue-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 duration-200">
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
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-6 md:p-8 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer group">
      <div className={`w-14 h-14 md:w-16 md:h-16 ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border`}>
        {icon}
      </div>

      <p className="text-[#475569] text-xs font-bold uppercase tracking-wider mb-2">
        {title}
      </p>

      <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight">
        {value}
      </h2>
    </div>
  );
}
