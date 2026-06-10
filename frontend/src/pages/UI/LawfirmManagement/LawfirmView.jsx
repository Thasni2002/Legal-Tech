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
    <div className="w-full space-y-6">


     


      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Law Firm Management
        </h1>

        <p className="text-sm text-gray-500">
          Dashboard / Law Firm Management
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>

                <h3 className="font-semibold mb-4 text-sm md:text-base">
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
  className={`${item.color} text-white w-full py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer`}
>
                {item.button}
              </button>
            </div>
          );
        })}
      </div>






      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Users className="w-8 h-8 text-purple-600 mb-3" />
          <p className="text-gray-500 text-sm">Total Advocates</p>
          <h3 className="text-3xl md:text-4xl font-bold mt-2">12</h3>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Briefcase className="w-8 h-8 text-cyan-600 mb-3" />
          <p className="text-gray-500 text-sm">Active Cases</p>
          <h3 className="text-3xl md:text-4xl font-bold mt-2">28</h3>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <History className="w-8 h-8 text-orange-500 mb-3" />
          <p className="text-gray-500 text-sm">Closed Cases</p>
          <h3 className="text-3xl md:text-4xl font-bold mt-2">41</h3>
        </div>
      </div>



    </div>

  );
}