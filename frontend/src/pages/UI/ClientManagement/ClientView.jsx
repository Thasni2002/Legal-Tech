"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Phone,
  Mail,
  MapPin,
  FileText,
  MessageCircle,
  Clock,
  Wallet,
  User,
  Building,
  Users,
  Briefcase,
} from "lucide-react";
import ClientAdd from "./ClientAdd";
import ClientEdit from "./ClientEdit";

export default function ClientView() {
  const [client, setClient] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("clientData");
    if (data) {
      try {
        setClient(JSON.parse(data));
      } catch (err) {
        console.error("Failed to parse client data:", err);
      }
    }
  }, []);

  const handleRemoveClient = () => {
    if (confirm("Are you sure you want to remove this client? All details will be deleted.")) {
      localStorage.removeItem("clientData");
      setClient(null);
    }
  };

  if (showAddForm) {
    return (
      <ClientAdd
        onSave={(newClient) => {
          setClient(newClient);
          setShowAddForm(false);
        }}
        onCancel={() => setShowAddForm(false)}
      />
    );
  }

  if (showEditForm) {
    return (
      <ClientEdit
        onSave={(updatedClient) => {
          setClient(updatedClient);
          setShowEditForm(false);
        }}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className=" h-16 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Client Management
        </h1>
        <p className="text-sm text-gray-500">
          Dashboard / Client Management
        </p>
      </header>

      <main className="p-6">
        {/* Top Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6"> */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <TopCard
            title="Add / Manage Client"
            desc="Add new client or manage existing clients"
            button="Add / Manage Client"
            color="bg-green-600"
            link="/client-management/client-add"
          />

          {/* <TopCard
            title="Communication (WhatsApp)"
            desc="Chat with clients"
            button="Open WhatsApp"
            color="bg-green-500"
          /> */}

          <TopCard
            title="Case Tracking"
            desc="Track all cases"
            button="Track Cases"
            color="bg-green-600"
            link="/client-management/case-tracking"
          />

          <TopCard
            title="View History"
            desc="Communication history"
            button="View History"
            color="bg-green-600"
            // link="/client-management/client-history"
          />
        </div>

        {/* Client Overview */}
        {/* Client Overview */}
<div className="mt-8">
  <div className="bg-white rounded-xl shadow-sm border p-5">
    <div className="flex justify-between items-center mb-5">
      <h2 className="font-bold text-lg">Client Overview</h2>

      {client && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit Profile
          </button>

          <button
            onClick={handleRemoveClient}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      )}
    </div>

    {client ? (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3">Client ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              {/* <th>Case Title</th>
              <th>Case No</th>
              <th>Status</th> */}
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="py-4">{client.clientId}</td>
              <td>{client.fullName}</td>
              <td>{client.phone}</td>
              <td>{client.email}</td>
              {/* <td>{client.caseTitle}</td>
              <td>{client.caseNumber}</td> */}

              {/* <td>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    client.caseStatus === "Active"
                      ? "bg-green-100 text-green-700"
                      : client.caseStatus === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {client.caseStatus || "Unknown"}
                </span>
              </td> */}
            </tr>
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={32} />
        </div>

        <h2 className="font-bold text-lg text-slate-800 mb-2">
          No Client Registered
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          No client details have been recorded yet.
        </p>

        <Link
          href="/client-management/client-add"
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm"
        >
          Add Client Profile
        </Link>
      </div>
    )}
  </div>
</div>

{/* Recent Activity */}
<div className="mt-6">
  <div className="bg-white rounded-xl shadow-sm border p-5">
    <h3 className="font-bold text-lg mb-5">
      Recent Activity
    </h3>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-3">Activity</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b">
            <td className="py-4">Case Updated</td>
            <td>10 May 2024</td>
          </tr>

          <tr className="border-b">
            <td className="py-4">Document Uploaded</td>
            <td>09 May 2024</td>
          </tr>

          <tr>
            <td className="py-4">Payment Received</td>
            <td>05 May 2024</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
      </main>
    </div>
  );
}

function TopCard({
  title,
  desc,
  button,
  color,
  link,
  onClick,
}) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="font-semibold mb-2">{title}</h3>

      <p className="text-sm text-gray-500 mb-4">
        {desc}
      </p>

      {onClick ? (
        <button
          onClick={onClick}
          className={`w-full py-2 rounded-lg text-white ${color} cursor-pointer hover:opacity-95 transition-opacity`}
        >
          {button}
        </button>
      ) : link ? (
        <Link href={link}>
          <button
            className={`w-full py-2 rounded-lg text-white ${color} cursor-pointer hover:opacity-95 transition-opacity`}
          >
            {button}
          </button>
        </Link>
      ) : (
        <button
          className={`w-full py-2 rounded-lg text-white ${color} cursor-pointer hover:opacity-95 transition-opacity`}
        >
          {button}
        </button>
      )}
    </div>
  );
}

function InfoItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function ActivityItem({ title, time }) {
  return (
    <div className="flex justify-between py-2">
      <div className="flex items-center gap-2">
        <Clock size={16} />
        {title}
      </div>

      <span className="text-xs text-gray-500">
        {time}
      </span>
    </div>
  );
}