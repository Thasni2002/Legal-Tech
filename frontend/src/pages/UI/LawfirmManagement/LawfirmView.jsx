"use client";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  FileText,
  History,

  Briefcase,
  
} from "lucide-react";




export default function LawfirmView() {
  const router = useRouter();


  const actions = [
    {
      title: "Add / Manage Firm",
      icon: Building2,
      button: "Add / Manage",
      color: "bg-blue-600",
    },
    {
      title: "Assign Advocate",
      icon: Users,
      button: "Assign Advocate",
      color: "bg-green-600",
    },
    {
      title: "Assign Documents",
      icon: FileText,
      button: "Assign Documents",
      color: "bg-purple-600",
    },

  ];

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Law Firm Management
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Manage law firms, branches and firm information
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {actions.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="w-12 h-12 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center mb-4 border border-blue-100">
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-[#0F172A] text-sm md:text-base mb-4">
                  {item.title}
                </h3>
              </div>

              <button
                onClick={() => {
                  if (item.title === "Add / Manage Firm") {
                    router.push("/lawfirm-management/add-manage-firm");
                  }

                  if (item.title === "Assign Advocate") {
                    router.push("/lawfirm-management/assign-advocate");
                  }

                  if (item.title === "Assign Documents") {
                    router.push("/lawfirm-management/assign-documents");
                  }
                }}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white w-full py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer"
              >
                {item.button}
              </button>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-[#2563EB]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium">Total Advocates</p>
          <h3 className="text-3xl font-bold mt-1 text-[#0F172A]">12</h3>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
            <Briefcase className="w-5 h-5 text-[#16A34A]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium">Active Cases</p>
          <h3 className="text-3xl font-bold mt-1 text-[#0F172A]">28</h3>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
            <History className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium">Closed Cases</p>
          <h3 className="text-3xl font-bold mt-1 text-[#0F172A]">41</h3>
        </div>
      </div>
    </div>
  );
}