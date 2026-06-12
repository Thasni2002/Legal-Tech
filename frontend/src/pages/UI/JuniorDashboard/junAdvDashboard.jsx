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
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Junior Advocate Dashboard
        </h1>

        <p className="text-gray-500">
          Welcome Back
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">

        <StatCard
          title="Assigned Cases"
          value="12"
          icon={<Briefcase size={22} />}
          color="bg-blue-500"
        />

        <StatCard
          title="Hearings"
          value="5"
          icon={<Calendar size={22} />}
          color="bg-green-500"
        />

        {/* <StatCard
          title="Tasks"
          value="8"
          icon={<CheckCircle size={22} />}
          color="bg-orange-500"
        /> */}

        <StatCard
          title="Documents"
          value="25"
          icon={<FileText size={22} />}
          color="bg-purple-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* Cases */}
        <div className="lg:col-span-12 bg-white p-5 rounded-xl shadow border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">
              Assigned Cases
            </h2>

            <button
              onClick={() =>
                router.push("/assigned-cases")
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              View All
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3">Case</th>
                <th>Hearing</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {cases.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-4">
                    {item.title}
                  </td>

                  <td>{item.hearing}</td>

                  <td>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        {/* <div className="bg-white p-5 rounded-xl shadow border">
          <h2 className="font-bold text-lg mb-4">
            Quick Actions
          </h2>

          <div className="space-y-3">

            <ActionButton
              text="Add Notes"
              icon={<Plus size={16} />}
            />

            <ActionButton
              text="Upload Document"
              icon={<FileText size={16} />}
            />

            <ActionButton
              text="View Hearings"
              icon={<Calendar size={16} />}
            />

            <ActionButton
              text="Messages"
              icon={<MessageSquare size={16} />}
            />

          </div>
        </div> */}

      </div>

      {/* Bottom Section */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">

        {/* Pending Tasks */}
         <div className="col-span-12 bg-white p-5 rounded-xl shadow border">
          <h2 className="font-bold text-lg mb-4">
            Pending Tasks
          </h2>

          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={index}
                className="border rounded-lg p-3"
              >
                {task}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="col-span-12 bg-white p-5 rounded-xl shadow border">
          <h2 className="font-bold text-lg mb-4">
            Recent Documents
          </h2>

          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 flex justify-between"
              >
                <span>{doc}</span>

                <button className="text-blue-600">
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
    <div className="bg-white p-5 rounded-xl shadow border">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <div
          className={`${color} text-white p-3 rounded-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ text, icon }) {
  return (
    <button className="w-full flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-50">
      {icon}
      {text}
    </button>
  );
}