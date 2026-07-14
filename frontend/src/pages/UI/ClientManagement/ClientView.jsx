"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
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
  Plus,
  X,
  Calendar,
  TrendingUp,
  UserCheck,
  Trash2,
  Edit3,
  Eye,
  BookOpen,
  Download,
  ExternalLink,
  CreditCard,
  IndianRupee,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import DocumentViewerModal from "@/components/common/DocumentViewerModal";
import { usePermissions } from "@/utils/usePermissions";
import { API_BASE_URL } from "@/utils/api";
import ClientEdit from "./ClientEdit";


export default function ClientView() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [clients, setClients] = useState([]);
  const [clientsPage, setClientsPage] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    activeClients: 0,
    totalCases: 0,
    pendingClients: 0,
  });
  // History modal state removed, redirected to history page
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    type: "", // "warning", "confirm", "success", "error"
    title: "",
    message: "",
    clientId: null,
    clientName: ""
  });

  // History loader logic removed as it is now loaded on the view-history page
  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/`);
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
              status: c.status || "N/A",
            };
            idCounter++;
          } else {
            clientMap[name].activeCases += 1;
          }
        });
        
        const clientList = Object.values(clientMap);
        setClients(clientList);

        let activeCount = 0;
        let pendingCount = 0;
        let casesSum = 0;

        clientList.forEach(c => {
          const statusLower = (c.status || "").toLowerCase();
          if (statusLower === "active" || statusLower === "progress" || statusLower === "in progress") {
            activeCount++;
          } else if (statusLower === "pending" || statusLower === "case submit" || statusLower === "case sumbit" || statusLower === "submitted") {
            pendingCount++;
          }
          casesSum += c.activeCases;
        });

        setMetrics({
          totalClients: clientList.length,
          activeClients: activeCount,
          totalCases: casesSum,
          pendingClients: pendingCount,
        });
      }
    } catch (err) {
      console.error("Failed to fetch clients from case-management:", err);
    }
  };
  useEffect(() => {
    fetchClients();
  }, []);
  const handleDelete = async (clientId) => {
    const client = clients.find(c => c.clientId === clientId);
    if (!client) return;

    const statusLower = (client.status || "").toLowerCase();
    const isClosed = statusLower === "closed" || statusLower === "inactive";

    if (!isClosed) {
      setDeleteModal({
        show: true,
        type: "warning",
        title: "Deletion Restrained",
        message: `Only clients with closed cases can be deleted.\n"${client.clientName}" currently has an active or pending status.`
      });
      return;
    }

    setDeleteModal({
      show: true,
      type: "confirm",
      title: "Delete Client?",
      message: `Are you sure you want to delete client "${client.clientName}" and all their associated cases?\nThis action cannot be undone.`,
      clientId: clientId,
      clientName: client.clientName
    });
  };
  return (
    <div className="w-full space-y-6 md:space-y-8 animate-fade-in pb-10">
      {/* Premium Dashboard Header Banner - Light Mode */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 via-indigo-50 to-slate-50 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
        {/* Soft Glow Effects */}
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 top-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            
            <h1 className="text-slate-900 font-bold tracking-tight mt-3 text-3xl md:text-4xl animate-slide-in" style={{ lineHeight: 1.2 }}>
              Client Management
            </h1>
            <p className="text-slate-600 mt-2 text-sm md:text-base max-w-xl font-medium">
              Consolidated workspace to track active representation cases, client activity audit trails, and financial records.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md rounded-xl p-4 border border-slate-200 shadow-sm">
            <TrendingUp className="text-emerald-500" size={20} />
           
          </div>
        </div>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Total Clients"
          value={metrics.totalClients}
          subtext="Registered clients list"
          icon={<Users size={20} />}
          colorClass="text-indigo-600 bg-indigo-50 border-indigo-100/50 animate-fade-in"
        />
        <StatWidget
          title="Active Clients"
          value={metrics.activeClients}
          subtext="Currently represented"
          icon={<UserCheck size={20} />}
          colorClass="text-emerald-600 bg-emerald-50 border-emerald-100/50 animate-fade-in delay-100"
        />
        <StatWidget
          title="Pending Review"
          value={metrics.pendingClients}
          subtext="Awaiting submissions"
          icon={<BookOpen size={20} />}
          colorClass="text-amber-600 bg-amber-50 border-amber-100/50 animate-fade-in delay-200"
        />
        <StatWidget
          title="Total Cases"
          value={metrics.totalCases}
          subtext="Active legal matters"
          icon={<Briefcase size={20} />}
          colorClass="text-violet-600 bg-violet-50 border-violet-100/50 animate-fade-in delay-300"
        />
      </div>

      {/* Top Cards Redesigned - Light Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RedesignedCard
          title="Case Tracking"
          desc="Monitor legal milestones, upcoming hearings, and case summaries."
          btnText="Track Cases"
          bgClass="bg-gradient-to-br from-indigo-50/50 via-indigo-50 to-indigo-100/30"
          textClass="text-slate-800"
          btnClass="bg-indigo-600 hover:bg-indigo-700 text-white"
          link="/client-management/case-tracking"
          icon={<Briefcase size={40} className="text-indigo-400/20" />}
        />
        <RedesignedCard
          title="View History"
          desc="Access unified logs of cases, invoices, and documents for all clients."
          btnText="View History"
          bgClass="bg-gradient-to-br from-blue-50/50 via-blue-50 to-blue-100/30"
          textClass="text-slate-800"
          btnClass="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => {
            localStorage.removeItem("clientData");
            router.push("/client-management/view-history");
          }}
          icon={<Clock size={40} className="text-blue-400/20" />}
        />
      </div>

      {/* Client Overview Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-lg text-[#0F172A]">Client Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">List of clients derived from active court cases.</p>
          </div>
        </div>

        {clients.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">

                  <th className="py-4 px-3">Client Profile</th>
                  <th className="py-4 px-3">Contact Details</th>
                  <th className="py-4 px-3">Court Room</th>
                  <th className="py-4 px-3 text-center">Cases</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.slice(clientsPage * 5, (clientsPage + 1) * 5).map((client) => {
                  const initials = client.clientName ? client.clientName.charAt(0).toUpperCase() : "?";
                  const statusLower = (client.status || "").toLowerCase();
                  const isActive = statusLower === "active" || statusLower === "progress";
                  const isPending = statusLower === "pending" || statusLower === "case submit" || statusLower === "case sumbit" || statusLower === "submitted";
                  const isClosed = statusLower === "closed" || statusLower === "inactive";
                  
                  return (
                    <tr
                      key={client.clientId}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >

                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm select-none shadow-sm shadow-indigo-200">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 text-sm block leading-tight">
                              {client.clientName}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{client.courtName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-xs text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <Phone size={10} className="text-slate-400" />
                            {client.contactNumber}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail size={10} className="text-slate-400" />
                            {client.emailId}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-xs font-medium text-slate-700">
                        {client.courtName}
                      </td>
                      <td className="py-4 px-3 text-xs text-center font-bold text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/50">
                          {client.activeCases}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center">
                          <span className="relative flex h-2 w-2 mr-2">
                            {isActive && (
                              <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </>
                            )}
                            {isPending && (
                              <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </>
                            )}
                            {isClosed && (
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            )}
                            {!isActive && !isPending && !isClosed && (
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                            )}
                          </span>
                          <span
                            className={`text-xs font-bold capitalize ${
                              isActive
                                ? "text-emerald-700"
                                : isPending
                                ? "text-amber-700"
                                : isClosed
                                ? "text-red-700"
                                : "text-slate-500"
                            }`}
                          >
                            {client.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              localStorage.setItem("clientData", JSON.stringify({
                                clientId: client.clientId,
                                fullName: client.clientName,
                                clientName: client.clientName,
                                email: client.emailId,
                                emailId: client.emailId,
                                phone: client.contactNumber,
                                contactNumber: client.contactNumber,
                                caseStatus: client.status,
                                status: client.status,
                              }));
                              router.push("/client-management/view-history");
                            }}
                            title="View History"
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg cursor-pointer transition shadow-xs border border-slate-200/30 flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Eye size={12} />
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
                                setShowEditModal(true);
                              }}
                              title="Edit Client"
                              className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-lg cursor-pointer transition shadow-xs border border-slate-200/30 flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Edit3 size={12} />
                              Edit
                            </button>
                          )}
                          {hasPermission("Client Management", "delete") && (
                            <button
                              onClick={() => handleDelete(client.clientId)}
                              title="Delete Client"
                              className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg cursor-pointer transition shadow-xs border border-slate-200/30 flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {clients.length > 5 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs text-[#64748B] font-semibold">
                Page {clientsPage + 1} of {Math.ceil(clients.length / 5)}
              </span>
              <button
                onClick={() => setClientsPage(p => Math.max(0, p - 1))}
                disabled={clientsPage === 0}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#2563EB] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer select-none font-bold text-xs"
              >
                &lt;
              </button>
              <button
                onClick={() => setClientsPage(p => Math.min(Math.ceil(clients.length / 5) - 1, p + 1))}
                disabled={(clientsPage + 1) * 5 >= clients.length}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#2563EB] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer select-none font-bold text-xs"
              >
                &gt;
              </button>
            </div>
          )}
        </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#F1F5F9] text-[#64748B] rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-150 shadow-inner">
              <Users size={28} className="text-slate-400" />
            </div>
            <h2 className="font-bold text-[#0F172A] text-lg mb-1">
              No Client Registered
            </h2>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              No client details have been recorded yet. Clients are derived automatically from active case records.
            </p>
          </div>
        )}
      </div>

      {/* History modal is now rendered on its dedicated page */}

      {/* Edit Modal */}
      {showEditModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <ClientEdit
            onSave={(updatedData) => {
              fetchClients();
              setShowEditModal(false);
            }}
            onCancel={() => {
              setShowEditModal(false);
            }}
          />
        </div>,
        document.body
      )}

      {/* Custom Delete Notifications/Confirm Modal */}
      {deleteModal.show && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[10001] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center animate-scale-up">
            {deleteModal.type === "warning" && (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 border border-amber-100 text-amber-500 mb-4 shadow-sm animate-bounce-subtle">
                <AlertTriangle className="h-8 w-8" />
              </div>
            )}
            {deleteModal.type === "confirm" && (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border border-red-100 text-red-500 mb-4 shadow-sm animate-bounce-subtle">
                <Trash2 className="h-8 w-8" />
              </div>
            )}
            {deleteModal.type === "success" && (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 mb-4 shadow-sm animate-bounce-subtle">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            )}
            {deleteModal.type === "error" && (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border border-red-100 text-red-500 mb-4 shadow-sm animate-bounce-subtle">
                <XCircle className="h-8 w-8" />
              </div>
            )}

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {deleteModal.title}
            </h3>
            <p className="text-xs text-slate-500 mb-6 px-2 whitespace-pre-line leading-relaxed">
              {deleteModal.message}
            </p>

            {deleteModal.type === "confirm" ? (
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteModal(prev => ({ ...prev, show: false }))}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const clientId = deleteModal.clientId;
                    const clientName = deleteModal.clientName;
                    setDeleteModal(prev => ({ ...prev, show: false }));
                    
                    try {
                      const res = await fetch(`${API_BASE_URL}/case-management/`);
                      if (res.ok) {
                        const casesData = await res.json();
                        const targetName = clientName.trim().toLowerCase();
                        const clientCases = casesData.filter(c => {
                          const itemClientName = (c.client_name || "").trim().toLowerCase();
                          return itemClientName === targetName;
                        });

                        // Delete all associated cases
                        for (const item of clientCases) {
                          await fetch(`${API_BASE_URL}/case-management/${item.id}`, {
                            method: "DELETE",
                          });
                        }

                        // Delete the client record from clients db
                        try {
                          await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                            method: "DELETE",
                          });
                        } catch (err) {
                          console.error("Failed to delete client from /clients endpoint:", err);
                        }

                        setDeleteModal({
                          show: true,
                          type: "success",
                          title: "Client Deleted Successfully",
                          message: `Client "${clientName}" and all associated cases have been successfully deleted from the system.`
                        });
                        fetchClients();
                      } else {
                        throw new Error("Failed to fetch cases");
                      }
                    } catch (err) {
                      console.error("Error deleting client:", err);
                      setDeleteModal({
                        show: true,
                        type: "error",
                        title: "Deletion Failed",
                        message: "Failed to delete the client and associated cases. Please try again."
                      });
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all duration-200 cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteModal(prev => ({ ...prev, show: false }))}
                className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all duration-200 cursor-pointer"
              >
                OK
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
function StatWidget({ title, value, subtext, icon, colorClass }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-sm transition duration-200">
      <div className="space-y-1">
        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">{title}</span>
        <span className="text-2xl font-extrabold text-slate-800 block">{value}</span>
        <span className="text-[10px] text-slate-500 block leading-tight">{subtext}</span>
      </div>
      <div className={`p-3 rounded-xl border flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}

function RedesignedCard({ title, desc, btnText, bgClass, textClass, btnClass, link, onClick, icon }) {
  const content = (
    <div className={`relative overflow-hidden ${bgClass} rounded-2xl p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${textClass} transition-all duration-300 flex flex-col justify-between h-56 cursor-pointer border border-slate-200 group`}>
      {/* Background Icon Watermark */}
      <div className="absolute right-4 top-4 transform group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-xs opacity-80 leading-relaxed max-w-xs">
          {desc}
        </p>
      </div>
      <button className={`self-start px-4 py-2 ${btnClass} font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer`}>
        {btnText}
      </button>
    </div>
  );

  if (onClick) {
    return <div onClick={onClick} className="w-full">{content}</div>;
  }

  return (
    <Link href={link} className="w-full">
      {content}
    </Link>
  );
}
