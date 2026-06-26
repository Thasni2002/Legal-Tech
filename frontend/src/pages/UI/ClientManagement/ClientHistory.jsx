"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Calendar,
  FileText,
  Clock,
  Briefcase,
  Plus,
  X,
  Filter,
  Activity,
  User,
  AlertCircle,
  TrendingUp,
  CreditCard,
  MessageSquare
} from "lucide-react";

export default function ClientHistory() {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState({ clientCount: 0, caseCount: 0 });
  const [allClientsList, setAllClientsList] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLog, setNewLog] = useState({
    title: "",
    desc: "",
    type: "case",
    badge: "New Log",
    date: "",
    time: "",
  });

  // Get current date/time for default form values
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);
    setNewLog((prev) => ({
      ...prev,
      date: dateStr,
      time: timeStr,
    }));
  }, [showAddModal]);

  useEffect(() => {
    // 1. Load client data
    const data = localStorage.getItem("clientData");
    let currentClient = null;
    if (data) {
      try {
        currentClient = JSON.parse(data);
        setClient(currentClient);
      } catch (err) {
        console.error("Failed to parse client data:", err);
      }
    }

    // 2. Load custom history data manually added by user
    let manualLogs = [];
    if (currentClient) {
      const historyKey = `clientHistory_${currentClient.clientId}`;
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        try {
          // Only load manual logs (long timestamp IDs) and exclude dummy data ("1", "2", "3")
          manualLogs = JSON.parse(savedHistory).filter(item => item.id.length > 5 && !item.id.startsWith("db-"));
        } catch (err) {
          console.error("Failed to parse history data:", err);
        }
      }
    } else {
      // Aggregate manual logs for all clients
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("clientHistory_")) {
          const savedHistory = localStorage.getItem(key);
          if (savedHistory) {
            try {
              const parsed = JSON.parse(savedHistory).filter(item => item.id.length > 5 && !item.id.startsWith("db-"));
              manualLogs = [...manualLogs, ...parsed];
            } catch (err) {
              console.error("Failed to parse history data for key:", key, err);
            }
          }
        }
      }
    }
    setHistoryItems(manualLogs);
  }, []);

  useEffect(() => {
    const targetName = (client?.fullName || client?.clientName || "").trim().toLowerCase();

    const fetchDbCases = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/case-management/");
        if (res.ok) {
          const data = await res.json();
          
          const clientMap = {};
          let idCounter = 1;
          data.forEach(c => {
            const name = c.client_name;
            if (!name) return;
            if (!clientMap[name]) {
              clientMap[name] = {
                clientId: `CUST-${String(idCounter).padStart(4, '0')}`,
                fullName: name,
                clientName: name,
                phone: c.contact_number || "N/A",
                email: c.email_id || "N/A",
                caseStatus: c.status || "N/A",
                caseTitle: c.case_title || "N/A",
                caseNumber: c.case_no || "N/A",
                courtName: c.court_name || "N/A",
                assignedAdvocate: "Advocate",
              };
              idCounter++;
            }
          });
          const clientsArray = Object.values(clientMap);
          setAllClientsList(clientsArray);
          setStats({
            clientCount: clientsArray.length,
            caseCount: data.length
          });

          const matchedCases = client
            ? data.filter(item => {
                const itemClientName = (item.client_name || "").trim().toLowerCase();
                return itemClientName === targetName || targetName.includes(itemClientName) || itemClientName.includes(targetName);
              })
            : data;

          const mapped = matchedCases.map(item => ({
            id: `db-case-${item.id}`,
            type: "case",
            title: "Case Created / Updated",
            desc: client
              ? `Case '${item.case_title || item.case_no}' under court '${item.court_name}' is currently '${item.status}'.`
              : `Client: ${item.client_name || "Unknown"} - Case '${item.case_title || item.case_no}' under court '${item.court_name}' is currently '${item.status}'.`,
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
        console.error("Failed to fetch cases in ClientHistory:", err);
      }
    };

    const fetchDbInvoices = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/finance/invoices");
        if (res.ok) {
          const data = await res.json();
          const matchedInvoices = client
            ? data.filter(item => {
                const itemClientName = (item.client_name || "").trim().toLowerCase();
                return itemClientName === targetName || targetName.includes(itemClientName) || itemClientName.includes(targetName);
              })
            : data;

          const mapped = matchedInvoices.map(item => ({
            id: `db-payment-${item.id}`,
            type: "payment",
            title: `₹${item.amount || 0} ${item.status === 'Paid' ? 'Received' : 'Pending'}`,
            desc: client
              ? `Invoice for '${item.service_details || "Services"}' with due date ${item.due_date}.`
              : `Client: ${item.client_name || "Unknown"} - Invoice for '${item.service_details || "Services"}' with due date ${item.due_date}.`,
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
        console.error("Failed to fetch invoices in ClientHistory:", err);
      }
    };

    fetchDbCases();
    fetchDbInvoices();
  }, [client]);

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newLog.title || !newLog.desc) {
      alert("Please fill in all fields.");
      return;
    }

    const clientId = client ? client.clientId : "C-9874";
    const historyKey = `clientHistory_${clientId}`;

    const newHistoryItem = {
      id: Date.now().toString(),
      ...newLog,
    };

    const updatedHistory = [newHistoryItem, ...historyItems];
    setHistoryItems(updatedHistory);
    // Only save custom logs to localStorage so we don't duplicate fetched data
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory.filter(item => !item.id.startsWith("db-"))));

    // Reset state and close modal
    setNewLog({
      title: "",
      desc: "",
      type: "case",
      badge: "User Update",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
    });
    setShowAddModal(false);
  };

  const handleResetHistory = () => {
    if (confirm("Are you sure you want to reset the client history to defaults?")) {
      const clientId = client ? client.clientId : "C-9874";
      const historyKey = `clientHistory_${clientId}`;
      localStorage.removeItem(historyKey);
      window.location.reload();
    }
  };

  // Helper to format date string to human readable format
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return new Date(dateString).toLocaleDateString("en-IN", options);
    } catch (e) {
      return dateString;
    }
  };

  // Helper to format 24h time to 12h AM/PM
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

  // Get configuration styles per history event type
  const getTypeConfig = (type) => {
    switch (type) {
      case "case":
        return {
          bg: "bg-blue-50 border-blue-100",
          iconBg: "bg-blue-600 text-white",
          badgeBg: "bg-blue-100 text-blue-700",
          icon: <Briefcase size={18} />,
          label: "Case Update",
        };
      case "document":
        return {
          bg: "bg-amber-50 border-amber-100",
          iconBg: "bg-amber-500 text-white",
          badgeBg: "bg-amber-100 text-amber-700",
          icon: <FileText size={18} />,
          label: "Document Upload",
        };
      case "payment":
        return {
          bg: "bg-emerald-50 border-emerald-100",
          iconBg: "bg-emerald-600 text-white",
          badgeBg: "bg-emerald-100 text-emerald-700",
          icon: <span className="font-bold text-sm">₹</span>,
          label: "Payment Received",
        };
      case "consultation":
        return {
          bg: "bg-purple-50 border-purple-100",
          iconBg: "bg-purple-600 text-white",
          badgeBg: "bg-purple-100 text-purple-700",
          icon: <MessageSquare size={18} />,
          label: "Consultation",
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-100",
          iconBg: "bg-slate-500 text-white",
          badgeBg: "bg-slate-100 text-slate-700",
          icon: <Clock size={18} />,
          label: "Activity",
        };
    }
  };

  // Filter & search history items
  const filteredItems = historyItems
  .filter((item) => {
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

  const displayClient = client || {
    clientId: "C-9874",
    fullName: "John Doe (Demo Case)",
    caseStatus: "In Progress",
    caseTitle: "Commercial Contract Dispute",
    caseType: "Civil",
    caseNumber: "OS 104/2024",
    courtName: "District Court",
    assignedAdvocate: "Adv. Arjun Menon",
    nextHearing: "2026-06-25",
    phone: "+91 98765 43210",
    email: "john.doe@example.com",
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Back and Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/client-management"
            className="flex items-center justify-center w-9 h-9 bg-white border border-[#E2E8F0] rounded-lg shadow-sm text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              View Client History
            </h1>
            <p className="text-[#64748B] text-xs mt-0.5">
              Activity log and correspondence audit trail.
            </p>
          </div>
        </div>

        {/* <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Add Activity Log
          </button>
          <button
            onClick={handleResetHistory}
            className="px-4 py-2.5 bg-white hover:bg-[#F1F5F9] text-[#0F172A] rounded-lg font-semibold text-sm transition-all border border-[#E2E8F0] shadow-sm cursor-pointer"
          >
            Reset to Defaults
          </button>
        </div> */}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Client Sidebar Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Client Navigation List Card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
            <h3 className="font-bold text-[#0F172A] text-sm mb-3">Filter by Client</h3>
            <div className="space-y-1">
              <button
                onClick={() => setClient(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  client === null
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                }`}
              >
                All Clients
              </button>
              {allClientsList.map((c) => (
                <button
                  key={c.clientId}
                  onClick={() => setClient(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    client?.clientName === c.clientName
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  }`}
                >
                  {c.clientName}
                </button>
              ))}
            </div>
          </div>

          {/* Client Specific Details Card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm flex flex-col justify-between h-fit space-y-5">
            {client ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-[#0F172A] text-sm">Client Details</h3>
                  <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] font-mono px-2 py-0.5 rounded font-semibold border border-[#E2E8F0]">
                    ID: {client.clientId}
                  </span>
                </div>

                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#F1F5F9]">
                  <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center font-bold text-base select-none border border-blue-100">
                    {client.fullName ? client.fullName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-sm leading-tight">
                      {client.fullName}
                    </h4>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 border ${
                      client.caseStatus === "Active" || client.caseStatus === "In Progress"
                        ? "bg-green-50 text-green-700 border-green-200/50"
                        : "bg-amber-50 text-amber-700 border-amber-200/50"
                    }`}>
                      {client.caseStatus || "In Progress"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-[#64748B]">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block font-semibold uppercase tracking-wider mb-1">Contact Info</span>
                    <p className="font-medium text-[#1E293B]">{client.phone}</p>
                    <p className="font-medium text-[#1E293B] break-all">{client.email}</p>
                  </div>
                  
                  {client.caseTitle && (
                    <div className="pt-3 border-t border-[#F1F5F9]">
                      <span className="text-[10px] text-[#94A3B8] block font-semibold uppercase tracking-wider mb-1">Active Case</span>
                      <p className="font-semibold text-[#1E293B] leading-tight">{client.caseTitle}</p>
                      <p className="text-[10px] text-[#64748B] mt-0.5">{client.caseNumber} &bull; {client.courtName}</p>
                    </div>
                  )}

                  {client.assignedAdvocate && (
                    <div className="pt-3 border-t border-[#F1F5F9]">
                      <span className="text-[10px] text-[#94A3B8] block font-semibold uppercase tracking-wider mb-1">Counsel</span>
                      <p className="font-semibold text-[#1E293B]">{client.assignedAdvocate}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-[#0F172A] text-sm">Client Details</h3>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded font-semibold border border-blue-200">
                    Scope: All
                  </span>
                </div>

                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#F1F5F9]">
                  <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center font-bold text-base select-none border border-blue-100">
                    A
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-sm leading-tight break-words">
                      All Clients
                    </h4>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 border bg-blue-50 text-blue-700 border-blue-200/50">
                      Consolidated View
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-[#64748B]">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block font-semibold uppercase tracking-wider mb-1">Timeline Coverage</span>
                    <p className="font-medium text-[#1E293B]">Consolidated history logs across all case updates and financial transactions in the firm.</p>
                  </div>
                  
                  <div className="pt-3 border-t border-[#F1F5F9]">
                    <span className="text-[10px] text-[#94A3B8] block font-semibold uppercase tracking-wider mb-1">Overview Statistics</span>
                    <p className="font-semibold text-[#1E293B] leading-tight">Total Clients: {stats.clientCount}</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Total Cases Tracked: {stats.caseCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline & Filters Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Search and Filters Bar */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Tabs */}
              <div className="flex flex-wrap gap-1 bg-[#F1F5F9] p-1 rounded-lg self-start">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-white text-[#0F172A] shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  All Activities
                </button>
                <button
                  onClick={() => setActiveTab("case")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "case"
                      ? "bg-white text-[#0F172A] shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  Case Updates
                </button>
                <button
                  onClick={() => setActiveTab("document")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "document"
                      ? "bg-white text-[#0F172A] shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setActiveTab("payment")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "payment"
                      ? "bg-white text-[#0F172A] shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  Payments
                </button>

              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search history logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm relative">
            <h3 className="font-bold text-[#0F172A] text-base mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#2563EB]" />
              History Timeline Log
            </h3>

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-[#F1F5F9] text-[#64748B] rounded-full flex items-center justify-center mb-3">
                  <Filter size={20} />
                </div>
                <h4 className="font-bold text-[#0F172A] text-sm mb-1">No activities found</h4>
                <p className="text-xs text-[#64748B] max-w-xs">
                  No history log entries matched your current filter or search criteria.
                </p>
              </div>
            ) : (
              <div className="relative border-l border-[#E2E8F0] ml-4 pl-6 space-y-6">
                {filteredItems.map((item) => {
                  const config = getTypeConfig(item.type);
                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline Icon Node */}
                      <span className={`absolute -left-[37px] top-1 flex items-center justify-center w-8 h-8 rounded-full border-4 border-white ${config.iconBg} shadow-sm transition-transform group-hover:scale-105 select-none`}>
                        {config.icon}
                      </span>

                      {/* Content Card */}
                      <div className="p-5 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md bg-white transition-all duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-[#0F172A] text-sm leading-tight">
                              {item.title}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${config.badgeBg}`}>
                              {item.badge || config.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
                            <Calendar size={13} className="shrink-0 text-[#94A3B8]" />
                            <span>{formatDate(item.date)}</span>
                            <span className="text-[#E2E8F0]">&bull;</span>
                            <Clock size={13} className="shrink-0 text-[#94A3B8]" />
                            <span>{formatTime(item.time)}</span>
                          </div>
                        </div>

                        <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-md overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
              <h3 className="font-bold text-[#0F172A] text-base">
                Add Custom Activity Log
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddLog} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Activity Type
                </label>
                <select
                  value={newLog.type}
                  onChange={(e) =>
                    setNewLog((prev) => ({
                      ...prev,
                      type: e.target.value,
                      badge: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) + " Update",
                    }))
                  }
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                >
                  <option value="case">Case Update</option>
                  <option value="document">Document Upload</option>
                  <option value="payment">Payment Received</option>

                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Title / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹15,000 Received, Wakalatnama Uploaded..."
                  value={newLog.title}
                  onChange={(e) => setNewLog((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newLog.date}
                    onChange={(e) => setNewLog((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newLog.time}
                    onChange={(e) => setNewLog((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Description Details
                </label>
                <textarea
                  placeholder="Provide detailed description of the event..."
                  value={newLog.desc}
                  onChange={(e) => setNewLog((prev) => ({ ...prev, desc: e.target.value }))}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200 resize-y"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Status / Tag Badge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Active, Completed, 3 Files..."
                  value={newLog.badge}
                  onChange={(e) => setNewLog((prev) => ({ ...prev, badge: e.target.value }))}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer text-center shadow-sm"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
