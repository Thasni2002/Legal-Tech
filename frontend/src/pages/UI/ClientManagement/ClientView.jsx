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
    <div className="w-full space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Client Management
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Manage clients, documents and communications
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <TopCard
          title="Add / Manage Client"
          desc="Add new client or manage existing clients"
          button="Add / Manage Client"
          color="bg-[#2563EB] hover:bg-[#1d4ed8]"
          link="/client-management/client-add"
        />

        <TopCard
          title="Case Tracking"
          desc="Track all cases"
          button="Track Cases"
          color="bg-[#2563EB] hover:bg-[#1d4ed8]"
          link="/client-management/case-tracking"
        />

        <TopCard
          title="View History"
          desc="Communication and activity history"
          button="View History"
          color="bg-[#2563EB] hover:bg-[#1d4ed8]"
          link="/client-management/view-history"
        />
      </div>

      {/* Client Overview */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg text-[#0F172A]">Client Overview</h2>
        </div>

        {client ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Client ID</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                <tr className="hover:bg-[#F8FAFC] transition-colors duration-150">
                  <td className="py-4 text-sm font-medium text-[#1E293B]">{client.clientId}</td>
                  <td className="py-4 text-sm text-[#1E293B] font-medium">{client.fullName}</td>
                  <td className="py-4 text-sm text-[#64748B]">{client.phone}</td>
                  <td className="py-4 text-sm text-[#64748B]">{client.email}</td>

                  <td className="py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setShowEditForm(true)}
                        className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors duration-200 cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        onClick={handleRemoveClient}
                        className="px-3.5 py-1.5 bg-[#DC2626]/90 hover:bg-[#DC2626] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors duration-200 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-[#F1F5F9] text-[#64748B] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>

            <h2 className="font-bold text-lg text-[#0F172A] mb-2">
              No Client Registered
            </h2>

            <p className="text-sm text-[#64748B] mb-6">
              No client details have been recorded yet.
            </p>

            <Link
              href="/client-management/client-add"
              className="inline-flex px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg font-semibold text-sm shadow-sm transition-colors duration-200 cursor-pointer"
            >
              Add Client Profile
            </Link>
          </div>
        )}
      </div>
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
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full">
      <div>
        <h3 className="font-bold text-base text-[#0F172A] mb-1.5">{title}</h3>
        <p className="text-xs text-[#64748B] mb-4">
          {desc}
        </p>
      </div>

      {onClick ? (
        <button
          onClick={onClick}
          className={`w-full py-2.5 rounded-lg text-white font-medium text-xs shadow-sm cursor-pointer ${color} transition-all duration-200`}
        >
          {button}
        </button>
      ) : link ? (
        <Link href={link} className="w-full">
          <button
            className={`w-full py-2.5 rounded-lg text-white font-medium text-xs shadow-sm cursor-pointer ${color} transition-all duration-200`}
          >
            {button}
          </button>
        </Link>
      ) : (
        <button
          className={`w-full py-2.5 rounded-lg text-white font-medium text-xs shadow-sm cursor-pointer ${color} transition-all duration-200`}
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