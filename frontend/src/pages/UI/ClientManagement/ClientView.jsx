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
      <header className="bg-white border-b h-16 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Client Management
        </h1>
      </header>

      <main className="p-6">
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <TopCard
            title="Add / Manage Client"
            desc="Add new client or manage existing clients"
            button="Add / Manage Client"
            color="bg-green-600"
            onClick={() => setShowAddForm(true)}
          />

          <TopCard
            title="Communication (WhatsApp)"
            desc="Chat with clients"
            button="Open WhatsApp"
            color="bg-green-500"
          />

          <TopCard
            title="Case Tracking"
            desc="Track all cases"
            button="Track Cases"
            color="bg-blue-600"
          />

          <TopCard
            title="View History"
            desc="Communication history"
            button="View History"
            color="bg-purple-600"
          />
        </div>

        {/* Client Overview */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {client ? (
            <div className="bg-white rounded-xl border p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="font-bold text-xl text-slate-800">
                    Client Overview
                  </h2>
                  <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded">
                    ID: {client.clientId}
                  </span>
                </div>

                {/* Profile Summary */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg select-none">
                    {client.fullName ? client.fullName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">
                      {client.fullName}
                    </h3>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1.5 ${
                      client.caseStatus === "Active" || client.caseStatus === "In Progress"
                        ? "bg-green-100 text-green-700"
                        : client.caseStatus === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      Status: {client.caseStatus || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3 mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Details</div>
                  
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Phone size={16} className="text-slate-400 shrink-0" />
                    <span>{client.phone}</span>
                  </div>

                  {client.email && (
                    <div className="flex items-center gap-3 text-slate-600 text-sm min-w-0">
                      <Mail size={16} className="text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}

                  {client.whatsapp && (
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <MessageCircle size={16} className="text-slate-400 shrink-0" />
                      <span>{client.whatsapp} (WhatsApp)</span>
                    </div>
                  )}

                  {client.address && (
                    <div className="flex items-start gap-3 text-slate-600 text-sm">
                      <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <span>{client.address}, {client.city}, {client.state} - {client.pincode}</span>
                    </div>
                  )}

                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-3">Case Information</div>

                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Briefcase size={16} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{client.caseTitle || "No case title"} ({client.caseType})</span>
                  </div>

                  {client.caseNumber && (
                    <div className="flex items-center gap-3 text-slate-600 text-sm pl-7">
                      <span className="text-slate-400 font-mono text-xs">No:</span>
                      <span>{client.caseNumber}</span>
                    </div>
                  )}

                  {client.courtName && (
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <Building size={16} className="text-slate-400 shrink-0" />
                      <span>{client.courtName}</span>
                    </div>
                  )}

                  {client.assignedAdvocate && (
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <User size={16} className="text-slate-400 shrink-0" />
                      <span>{client.assignedAdvocate}</span>
                    </div>
                  )}

                  {client.nextHearing && (
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <Clock size={16} className="text-slate-400 shrink-0" />
                      <span>Next Hearing: <strong className="text-slate-800">{client.nextHearing}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex-1 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm transition-colors cursor-pointer text-center"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleRemoveClient}
                  className="py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-colors cursor-pointer text-center"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-6 text-center shadow-sm flex flex-col justify-center items-center min-h-[350px]">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <Users size={32} />
              </div>
              <h2 className="font-bold text-lg text-slate-800 mb-2">
                No Client Registered
              </h2>
              <p className="text-sm text-gray-500 max-w-xs mb-6">
                No client details have been recorded yet. Click below to add a new client and setup their profile.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer shadow-sm"
              >
                Add Client Profile
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">
              Recent Activity
            </h3>

            <ActivityItem
              title="Case Updated"
              time="10 May 2024"
            />

            <ActivityItem
              title="Document Uploaded"
              time="09 May 2024"
            />

            <ActivityItem
              title="Payment Received"
              time="05 May 2024"
            />
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">
              WhatsApp Chat
            </h3>

            <div className="space-y-3">
              <div className="bg-green-100 p-2 rounded">
                Hello Sir
              </div>

              <div className="bg-gray-100 p-2 rounded">
                Case hearing tomorrow.
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <input
                placeholder="Message..."
                className="flex-1 border rounded px-3 py-2"
              />

              <button className="bg-green-600 text-white p-2 rounded">
                <MessageCircle size={18} />
              </button>
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