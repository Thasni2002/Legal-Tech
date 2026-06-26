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
  BookOpen
} from "lucide-react";
import { usePermissions } from "@/utils/usePermissions";

export default function ClientView() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [clients, setClients] = useState([]);
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    activeClients: 0,
    totalCases: 0,
    pendingClients: 0,
  });
  const [selectedClientHistory, setSelectedClientHistory] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return new Date(dateString).toLocaleDateString("en-IN", options);
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    try {
      const [hour, minute] = timeString.split(":");
      const h = parseInt(hour, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 || 12;
      return `${displayHour}:${minute} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case "case":
        return {
          bg: "bg-blue-50 border-blue-100",
          iconBg: "bg-blue-600 text-white",
          badgeBg: "bg-blue-100 text-blue-700",
          icon: <Briefcase size={14} />,
          label: "Case Update",
        };
      case "document":
        return {
          bg: "bg-amber-50 border-amber-100",
          iconBg: "bg-amber-500 text-white",
          badgeBg: "bg-amber-100 text-amber-700",
          icon: <FileText size={14} />,
          label: "Document Upload",
        };
      case "payment":
        return {
          bg: "bg-emerald-50 border-emerald-100",
          iconBg: "bg-emerald-600 text-white",
          badgeBg: "bg-emerald-100 text-emerald-700",
          icon: <span className="font-bold text-xs">₹</span>,
          label: "Payment Received",
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-100",
          iconBg: "bg-slate-500 text-white",
          badgeBg: "bg-slate-100 text-slate-700",
          icon: <Clock size={14} />,
          label: "Activity",
        };
    }
  };

  useEffect(() => {
    if (!selectedClientHistory) {
      setHistoryItems([]);
      return;
    }

    const targetName = selectedClientHistory.clientName.trim().toLowerCase();

    const fetchCases = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/case-management/");
        if (res.ok) {
          const data = await res.json();
          const matched = data.filter(item => {
            const itemClientName = (item.client_name || "").trim().toLowerCase();
            return itemClientName === targetName || targetName.includes(itemClientName) || itemClientName.includes(targetName);
          });
          const mapped = matched.map(item => ({
            id: `db-case-${item.id}`,
            type: "case",
            title: "Case Created / Updated",
            desc: `Case '${item.case_title || item.case_no}' under court '${item.court_name}' is currently '${item.status}'.`,
            date: item.created_at ? item.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            time: item.created_at ? item.created_at.split("T")[1].substring(0, 5) : "10:00",
            badge: item.status || "Active",
          }));
          setHistoryItems(prev => {
            const nonDb = prev.filter(i => !i.id.startsWith("db-case-"));
            return [...mapped, ...nonDb];
          });
        }
      } catch (err) {
        console.error("Failed to fetch cases in modal:", err);
      }
    };

    const fetchInvoices = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/finance/invoices");
        if (res.ok) {
          const data = await res.json();
          const matched = data.filter(item => {
            const itemClientName = (item.client_name || "").trim().toLowerCase();
            return itemClientName === targetName || targetName.includes(itemClientName) || itemClientName.includes(targetName);
          });
          const mapped = matched.map(item => ({
            id: `db-payment-${item.id}`,
            type: "payment",
            title: `₹${item.amount || 0} ${item.status === 'Paid' ? 'Received' : 'Pending'}`,
            desc: `Invoice for '${item.service_details || "Services"}' with due date ${item.due_date}.`,
            date: item.issue_date || item.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
            time: item.created_at ? item.created_at.split("T")[1].substring(0, 5) : "12:00",
            badge: item.status || "Pending",
          }));
          setHistoryItems(prev => {
            const nonDb = prev.filter(i => !i.id.startsWith("db-payment-"));
            return [...mapped, ...nonDb];
          });
        }
      } catch (err) {
        console.error("Failed to fetch invoices in modal:", err);
      }
    };

    let manualLogs = [];
    const historyKey = `clientHistory_${selectedClientHistory.clientId}`;
    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) {
      try {
        manualLogs = JSON.parse(savedHistory).filter(item => item.id.length > 5 && !item.id.startsWith("db-"));
      } catch (err) {
        console.error("Failed to parse manual logs in modal:", err);
      }
    }

    setHistoryItems(manualLogs);
    fetchCases();
    fetchInvoices();
  }, [selectedClientHistory]);
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
    alert("Client deletion is currently disabled as clients are derived from active cases.");
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
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-4 px-4">Client ID</th>
                  <th className="py-4 px-3">Client Profile</th>
                  <th className="py-4 px-3">Contact Details</th>
                  <th className="py-4 px-3">Court Room</th>
                  <th className="py-4 px-3 text-center">Cases</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => {
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
                      <td className="py-4 px-4 text-xs font-mono font-semibold text-slate-500">
                        {client.clientId}
                      </td>
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
                              setSelectedClientHistory(client);
                              setShowHistoryModal(true);
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
                                router.push("/client-management/edit-client");
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

      {/* History Modal */}
      {showHistoryModal && selectedClientHistory && (
        <HistoryModal
          client={selectedClientHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedClientHistory(null);
          }}
          historyItems={historyItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          formatDate={formatDate}
          formatTime={formatTime}
          getTypeConfig={getTypeConfig}
        />
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

function HistoryModal({
  client,
  onClose,
  historyItems,
  activeTab,
  setActiveTab,
  formatDate,
  formatTime,
  getTypeConfig,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const filteredItems = historyItems.filter((item) => {
    // Tab filtering
    if (activeTab !== "all" && item.type !== activeTab) {
      return false;
    }

    // Search filtering
    const search = searchQuery.trim().toLowerCase();
    if (!search) return true;

    return (
      item.title?.toLowerCase().includes(search) ||
      item.desc?.toLowerCase().includes(search) ||
      item.badge?.toLowerCase().includes(search) ||
      item.type?.toLowerCase().includes(search) ||
      formatDate(item.date)?.toLowerCase().includes(search) ||
      formatTime(item.time)?.toLowerCase().includes(search)
    );
  });

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9] bg-slate-50">
          <div>
            <h3 className="font-bold text-[#0F172A] text-lg">
              Activity History - {client.clientName}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Client ID: {client.clientId} &bull; {client.emailId} &bull; {client.contactNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-[#F1F5F9] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-[#F1F5F9] p-1 rounded-lg">
            {["all", "case", "document", "payment"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer capitalize ${
                  activeTab === tab
                    ? "bg-white text-[#0F172A] shadow-sm"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab === "all" ? "All Activities" : tab === "case" ? "Case Updates" : tab + "s"}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-56">
            <Search size={14} className="absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Scrollable Timeline */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 bg-[#F1F5F9] text-[#64748B] rounded-full flex items-center justify-center mb-3">
                <Search size={16} />
              </div>
              <h4 className="font-bold text-[#0F172A] text-sm mb-1">No activities found</h4>
              <p className="text-xs text-[#64748B] max-w-xs">
                No logs match your filters or search query for this client.
              </p>
            </div>
          ) : (
            <div className="relative border-l border-[#E2E8F0] ml-3 pl-5 space-y-5">
              {filteredItems.map((item) => {
                const config = getTypeConfig(item.type);
                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <span className={`absolute -left-[33px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full border-4 border-white ${config.iconBg} shadow-xs transition-transform group-hover:scale-105 select-none`}>
                      {config.icon}
                    </span>

                    {/* Content Card */}
                    <div className="p-4 rounded-lg border border-[#E2E8F0] shadow-xs hover:shadow-sm bg-white transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-bold text-[#0F172A] text-xs leading-tight">
                            {item.title}
                          </h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider border ${config.badgeBg}`}>
                            {item.badge || config.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-[#64748B] font-medium">
                          <Calendar size={11} className="shrink-0 text-[#94A3B8]" />
                          <span>{formatDate(item.date)}</span>
                          <span className="text-[#E2E8F0]">&bull;</span>
                          <Clock size={11} className="shrink-0 text-[#94A3B8]" />
                          <span>{formatTime(item.time)}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F1F5F9] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}