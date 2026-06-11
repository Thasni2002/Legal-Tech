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
    <div className="min-h-screen bg-gray-50">
      
      

      <div className="p-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Case Management</h1>
          <p className="text-gray-500">
            AI Powered Legal Workspace
          </p>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
           <Card
             title="AI Legal Assistant"
             description="Get intelligent legal answers and recommendations."
             buttonText="Open Assistant"
             color="bg-purple-600"
             onClick={() => router.push("/ai-assistant")}
           />

          <Card
            title="Judgment Summary"
            description="Summarize judgments and extract key points."
            buttonText="Explore Judgments"
            color="bg-green-600"
            onClick={() => router.push("/judgment-summary")}
          />

          <Card
            title="Legal Research"
            description="Search laws, acts and legal provisions."
            buttonText="Start Research"
            color="bg-blue-600"
            onClick={() => router.push("/legal-research")}
          />

          <Card
            title="Document Generation"
            description="Generate legal documents with AI."
            buttonText="Generate Document"
            color="bg-orange-500"
            onClick={() => router.push("/document-generation")}
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Cases Section */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg">My Cases</h2>

              

              <button
              onClick={() => router.push("/case-management/case-add")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={16} />
                Add Case
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by case title..."
              className="w-full border rounded-lg px-4 py-2 mb-5"
            />

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3">Case Title</th>
                    <th>Case No</th>
                    <th>Client</th>
                    <th>Court</th>
                    <th>Next Hearing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {cases.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-4">{item.title}</td>
                      <td>{item.caseNo}</td>
                      <td>{item.client}</td>
                      <td>{item.court}</td>
                      <td>{item.hearing}</td>

                      <td>
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            item.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <div className="flex gap-3">
                          <Eye size={18} />
                          <Pencil size={18} />
                          <MoreVertical size={18} />
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
    </div>
  );
}

function Card({ title, description, buttonText, color }) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-lg mb-2">{title}</h3>

      <p className="text-sm text-gray-500 mb-4">
        {description}
      </p>

      <button
        className={`${color} text-white px-4 py-2 rounded-lg`}
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