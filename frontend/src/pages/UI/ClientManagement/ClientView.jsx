"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Plus
} from "lucide-react";
import { usePermissions } from "@/utils/usePermissions";

export default function ClientView() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [clients, setClients] = useState([]);
  const fetchClients = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/case-management/");
      if (res.ok) {
        const casesData = await res.json();
        const clientMap = {};
        let idCounter = 1;

        casesData.forEach(c => {
          const name = c.client_name;
          if (!name) return;

          if (!clientMap[name]) {
            clientMap[name] = {
              clientId: `CUST-${String(idCounter).padStart(4, '0')}`,
              clientName: name,
              contactNumber: c.contact_number || "N/A",
              emailId: c.email_id || "N/A",
              activeCases: 1,
              courtName: c.court_name || "N/A",
              status: c.status === "Closed" ? "Inactive" : "Active",
            };
            idCounter++;
          } else {
            clientMap[name].activeCases += 1;
          }
        });
        
        setClients(Object.values(clientMap));
      }
    } catch (err) {
      console.error("Failed to fetch clients from case-management:", err);
    }
  };
  useEffect(() => {
    fetchClients();
  }, []);
  const handleDelete = async (clientId) => {
    alert("Client deletion is currently disabled as clients are derived from active cases.");
  };
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* <TopCard
          title="Add Client"
          desc="Register a new client profile"
          button="Add Client"
          color="bg-[#16A34A] hover:bg-[#15803d]"
          link="/client-management/add-client"
        /> */}
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
        {clients .length > 0? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase">
                  <th className="pb-3">Client ID</th>
                  <th className="pb-3">Client Name</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Cases</th>
                  <th className="pb-3">Court</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {clients.map((client) => (
                  <tr
                    key={client.clientId}
                    className="hover:bg-[#F8FAFC]"
                  >
                    <td className="py-4">{client.clientId}</td>
                    <td className="py-4 font-semibold text-[#0F172A]">{client.clientName}</td>
                    <td className="py-4">{client.contactNumber}</td>
                    <td className="py-4">{client.emailId}</td>
                    <td className="py-4">{client.activeCases}</td>
                    <td className="py-4">{client.courtName}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          client.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : client.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            localStorage.setItem("clientData", JSON.stringify({
                              clientId: client.clientId,
                              fullName: client.clientName,
                              email: client.emailId,
                              phone: client.contactNumber
                            }));
                            router.push("/client-management/view-history");
                          }}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer transition"
                        >
                          History
                        </button>
                        {hasPermission("Client Management", "edit") && (
                          <button
                            onClick={() => {
                              localStorage.setItem("clientData", JSON.stringify({
                                clientId: client.clientId,
                                fullName: client.clientName,
                                email: client.emailId,
                                phone: client.contactNumber
                              }));
                              router.push("/client-management/edit-client");
                            }}
                            className="px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded text-xs font-semibold cursor-pointer transition"
                          >
                            Edit
                          </button>
                        )}
                        {hasPermission("Client Management", "delete") && (
                          <button
                            onClick={() => handleDelete(client.clientId)}
                            className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold cursor-pointer transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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