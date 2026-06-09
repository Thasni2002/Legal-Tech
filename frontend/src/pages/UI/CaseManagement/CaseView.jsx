"use client";

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
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Menu className="w-6 h-6 cursor-pointer" />
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases, documents..."
              className="pl-10 pr-4 py-2 border rounded-lg w-80 focus:outline-none"
            />
          </div>

          <Bell className="w-5 h-5" />

          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="user"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h4 className="font-semibold">Adv. Rahul Sharma</h4>
              <p className="text-sm text-gray-500">Senior Advocate</p>
            </div>
          </div>
        </div>
      </header>

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
          />

          <Card
            title="Judgment Summary"
            description="Summarize judgments and extract key points."
            buttonText="Explore Judgments"
            color="bg-green-600"
          />

          <Card
            title="Legal Research"
            description="Search laws, acts and legal provisions."
            buttonText="Start Research"
            color="bg-blue-600"
          />

          <Card
            title="Document Generation"
            description="Generate legal documents with AI."
            buttonText="Generate Document"
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Cases Section */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg">My Cases</h2>

              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
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

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-bold mb-4">Quick Actions</h3>

              <div className="space-y-3">
                <QuickAction text="Ask AI Legal Assistant" />
                <QuickAction text="Summarize Judgment" />
                <QuickAction text="Legal Research" />
                <QuickAction text="Generate Document" />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-bold mb-4">Recent Documents</h3>

              <div className="space-y-3">
                <DocumentItem name="Charge Sheet.pdf" />
                <DocumentItem name="Bail Application.docx" />
                <DocumentItem name="Affidavit.pdf" />
                <DocumentItem name="Vakalatnama.pdf" />
              </div>
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