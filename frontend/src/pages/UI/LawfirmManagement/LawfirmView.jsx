"use client";
import { useState } from "react";
import LawfirmAdd from "./LawfirmAdd";
import AssignAdv from "./AssignAdv";
import {
  Building2,
  Users,
  FileText,
  History,
  BarChart3,
  Briefcase,
  IndianRupee,
} from "lucide-react";




export default function LawfirmView() {

  const [openModal, setOpenModal] = useState(false);

  const [openAdvocateModal, setOpenAdvocateModal] = useState(false);

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
    {
      title: "View History",
      icon: History,
      button: "View History",
      color: "bg-orange-500",
    },
    {
      title: "Firm Analytics",
      icon: BarChart3,
      button: "View Analytics",
      color: "bg-cyan-600",
    },
  ];

  return (
    <div className="w-full space-y-6">


      <LawfirmAdd
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      />

      <AssignAdv
        isOpen={openAdvocateModal}
        onClose={() => setOpenAdvocateModal(false)}
      />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Law Firm Management
        </h1>

        <p className="text-sm text-gray-500">
          Dashboard / Law Firm Management
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    setOpenModal(true);
                  }

                  if (item.title === "Assign Advocate") {
                    setOpenAdvocateModal(true);
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

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-4 rounded-xl shrink-0">
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>

            <div>
              <h2 className="font-bold text-lg leading-tight">
                Lex & Justice Associates
              </h2>

              <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">
                Active
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p><strong className="text-gray-700">Registration No:</strong> LF/UP/2022/00125</p>
            <p><strong className="text-gray-700">Established:</strong> 12 Jan 2022</p>
            <p><strong className="text-gray-700">Phone:</strong> +91 9876543210</p>
            <p><strong className="text-gray-700">Email:</strong> info@lexjustice.in</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Users className="w-8 h-8 text-purple-600 mb-3" />

          <p className="text-gray-500 text-sm">
            Total Advocates
          </p>

          <h3 className="text-3xl md:text-4xl font-bold mt-2">
            12
          </h3>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Briefcase className="w-8 h-8 text-cyan-600 mb-3" />

          <p className="text-gray-500 text-sm">
            Active Cases
          </p>

          <h3 className="text-3xl md:text-4xl font-bold mt-2">
            28
          </h3>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-sm">
            Closed Cases
          </p>

          <h3 className="text-3xl md:text-4xl font-bold mt-2">
            41
          </h3>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <IndianRupee className="w-8 h-8 text-green-600 mb-3" />

          <p className="text-gray-500 text-sm">
            Total Revenue
          </p>

          <h3 className="text-3xl md:text-4xl font-bold mt-2">
            ₹18,75,000
          </h3>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex gap-6 border-b px-6 py-4 overflow-x-auto whitespace-nowrap min-w-full">
          <button className="font-semibold text-blue-600 border-b-2 border-blue-600 pb-2 cursor-pointer shrink-0">
            Firm Details
          </button>

          <button className="cursor-pointer shrink-0 text-gray-600 hover:text-blue-600 transition-colors">Advocates</button>
          <button className="cursor-pointer shrink-0 text-gray-600 hover:text-blue-600 transition-colors">Documents</button>
          <button className="cursor-pointer shrink-0 text-gray-600 hover:text-blue-600 transition-colors">History</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold mb-4">
              Firm Details
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong className="text-gray-700">Firm Name:</strong> Lex &
                Justice Associates
              </p>

              <p>
                <strong className="text-gray-700">Registration:</strong>
                LF/UP/2022/00125
              </p>

              <p>
                <strong className="text-gray-700">Phone:</strong>
                +91 9876543210
              </p>

              <p>
                <strong className="text-gray-700">Email:</strong>
                info@lexjustice.in
              </p>

              <p>
                <strong className="text-gray-700">Website:</strong>
                www.lexjustice.in
              </p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold mb-4">
              Assigned Advocates
            </h3>

            <ul className="space-y-2 text-sm text-gray-600">
              <li>Adv. Rahul Sharma</li>
              <li>Adv. Priya Singh</li>
              <li>Adv. Amit Verma</li>
              <li>Adv. Neha Gupta</li>
              <li>Adv. Rohan Das</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold mb-4">
              Recent Documents
            </h3>

            <ul className="space-y-2 text-sm text-gray-600">
              <li>Partnership Deed.pdf</li>
              <li>Registration Certificate.pdf</li>
              <li>GST Certificate.pdf</li>
              <li>Office Address Proof.pdf</li>
              <li>PAN Card.pdf</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}