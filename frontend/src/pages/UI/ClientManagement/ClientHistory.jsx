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
  MessageSquare,
  Eye,
  Receipt,
  Download,
  ExternalLink
} from "lucide-react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "@/utils/api";


export default function ClientHistory() {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState({ clientCount: 0, caseCount: 0 });
  const [allClientsList, setAllClientsList] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
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
        const res = await fetch(`${API_BASE_URL}/case-management/`);
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
            documents: item.documents || [],
            date: item.created_at ? item.created_at.replace(" ", "T").split("T")[0] : new Date().toISOString().split("T")[0],
            time: item.created_at ? (item.created_at.replace(" ", "T").split("T")[1] || "10:00").substring(0, 5) : "10:00",
            badge: item.status || "Active",
          }));

          setHistoryItems(prev => {
            const nonDb = prev.filter(i => !i.id.startsWith("db-case-"));
            return [...mapped, ...nonDb];
          });

          // Extract documents from each matched case and map as document history items
          const docItems = [];
          matchedCases.forEach(item => {
            const docs = Array.isArray(item.documents) ? item.documents : [];
            docs.forEach((doc, idx) => {
              if (!doc.file && !doc.url) return; // skip empty entries
              docItems.push({
                id: `db-doc-${item.id}-${idx}`,
                type: "document",
                title: doc.documentType || "Document Uploaded",
                fileName: doc.file || "File",
                caseName: item.case_title || item.case_no,
                courtName: item.court_name,
                clientName: item.client_name || "Unknown",
                desc: client
                  ? `Document '${doc.file || doc.url || "File"}' uploaded for case '${item.case_title || item.case_no}' (${item.court_name}).`
                  : `Client: ${item.client_name || "Unknown"} — '${doc.file || doc.url || "File"}' for case '${item.case_title || item.case_no}'.`,
                date: item.created_at ? item.created_at.replace(" ", "T").split("T")[0] : new Date().toISOString().split("T")[0],
                time: item.created_at ? (item.created_at.replace(" ", "T").split("T")[1] || "10:00").substring(0, 5) : "10:00",
                badge: doc.documentType || "Document",
                fileUrl: doc.url || null,
              });
            });
          });
          setHistoryItems(prev => {
            const nonDoc = prev.filter(i => !i.id.startsWith("db-doc-"));
            return [...docItems, ...nonDoc];
          });

        }
      } catch (err) {
        console.error("Failed to fetch cases in ClientHistory:", err);
      }
    };

    const fetchDbInvoices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/finance/invoices`);
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
            title: `₹${(item.grand_total || item.subtotal || 0).toLocaleString("en-IN")} — ${item.status === 'Paid' ? 'Received' : item.status || 'Pending'}`,
            desc: client
              ? `Invoice for ${item.client_name || "Client"} | Case: ${item.case_number || "N/A"} | Method: ${item.payment_method || "N/A"}.`
              : `Client: ${item.client_name || "Unknown"} | Case: ${item.case_number || "N/A"} | Method: ${item.payment_method || "N/A"}.`,
            date: item.created_at ? item.created_at.replace(" ", "T").split("T")[0] : new Date().toISOString().split("T")[0],
            time: item.created_at ? (item.created_at.replace(" ", "T").split("T")[1] || "12:00").substring(0, 5) : "12:00",
            badge: item.status || "Pending",
            invoiceData: item,
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
            <select
              value={client ? (client.clientName || client.fullName) : "all"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all") {
                  setClient(null);
                } else {
                  const selected = allClientsList.find((c) => (c.clientName || c.fullName) === val);
                  setClient(selected);
                }
              }}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200 cursor-pointer font-semibold"
            >
              <option value="all">All Clients</option>
              {allClientsList.map((c) => (
                <option key={c.clientId} value={c.clientName || c.fullName}>
                  {c.clientName || c.fullName}
                </option>
              ))}
            </select>
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
                      <div 
                        onClick={() => {
                          if (item.type === "document") {
                            setSelectedDoc({ fileUrl: item.fileUrl || null, title: item.fileName || item.title, badge: item.badge });
                          }
                        }}
                        className={`p-5 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md bg-white transition-all duration-200 ${
                          item.type === "document" ? "cursor-pointer hover:border-amber-300 hover:bg-amber-50/5" : ""
                        }`}
                      >
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

                        {item.type === "document" ? (
                          <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                            {!client && (
                              <>
                                <span className="font-bold text-[#0F172A]">Client: {item.clientName || "Unknown"}</span>
                                <span className="text-[#E2E8F0] mx-2">&bull;</span>
                              </>
                            )}
                            Document{" "}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDoc({ fileUrl: item.fileUrl || null, title: item.fileName, badge: item.badge });
                              }}
                              className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-0 p-0 inline-block align-baseline"
                            >
                              '{item.fileName || "File"}'
                            </button>{" "}
                            uploaded for case '{item.caseName || "N/A"}' ({item.courtName || "N/A"}).
                          </p>
                        ) : (
                          <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                            {item.desc}
                          </p>
                        )}

                        {item.type === "case" && item.documents && item.documents.length > 0 && (
                          <div className="mt-3.5 border-t border-slate-100 pt-3 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attached Documents:</p>
                            <div className="grid gap-2">
                              {item.documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/50">
                                  <div className="flex items-center gap-2 truncate pr-2">
                                    <FileText size={13} className="text-slate-400 shrink-0" />
                                    <span className="text-xs text-slate-700 font-semibold truncate">{doc.file || "Document"}</span>
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded-full uppercase shrink-0">{doc.documentType}</span>
                                  </div>
                                  <button
                                    onClick={() => setSelectedDoc({ fileUrl: doc.url || null, title: doc.file, badge: doc.documentType })}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                                  >
                                    <Eye size={11} /> View
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 mt-2 flex-wrap">
                          {item.type === "document" && (
                            <button
                              onClick={() => setSelectedDoc({ fileUrl: item.fileUrl || null, title: item.fileName || item.title, badge: item.badge })}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md transition cursor-pointer"
                            >
                              <Eye size={12} /> View Document
                            </button>
                          )}
                          {item.type === "payment" && (
                            <button
                              onClick={() => setSelectedPayment(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition cursor-pointer"
                            >
                              <Receipt size={12} /> View Payment Details
                            </button>
                          )}
                        </div>
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

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          fileUrl={selectedDoc.fileUrl}
          title={selectedDoc.title}
          badge={selectedDoc.badge}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          item={selectedPayment}
          formatDate={formatDate}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}

function DocumentViewerModal({ fileUrl, title, badge, onClose }) {
  const [viewerUrl, setViewerUrl] = useState("");
  const [isPdf, setIsPdf] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [isAudio, setIsAudio] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  const normalizeUrl = (url) => {
    if (!url) return "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "127.0.0.1") {
        return url.replace("localhost:8000", "127.0.0.1:8000");
      } else {
        return url.replace("127.0.0.1:8000", "localhost:8000");
      }
    }
    return url;
  };

  const effectiveUrl = fileUrl || (title && (title.includes(".") || title.toLowerCase().endsWith(".pdf") || title.toLowerCase().endsWith(".jpg") || title.toLowerCase().endsWith(".png") || title.toLowerCase().endsWith(".jpeg")) ? `http://localhost:8000/uploads/${title}` : "");
  const normalizedUrl = normalizeUrl(effectiveUrl);

  useEffect(() => {
    if (!effectiveUrl) return;

    // Detect file type
    if (effectiveUrl.startsWith("data:")) {
      const mime = effectiveUrl.split(";")[0].split(":")[1] || "";
      setIsImage(mime.startsWith("image/"));
      setIsPdf(mime === "application/pdf");
      setIsAudio(mime.startsWith("audio/"));
      setIsVideo(mime.startsWith("video/"));

      try {
        const parts = effectiveUrl.split(",");
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mimeType });
        const bUrl = URL.createObjectURL(blob);
        setViewerUrl(bUrl);
        return () => {
          URL.revokeObjectURL(bUrl);
        };
      } catch (e) {
        console.error("Failed to parse base64 for preview:", e);
        setViewerUrl(effectiveUrl);
      }
    } else {
      let ext = (effectiveUrl || "").split(".").pop().toLowerCase().split("?")[0];
      if (effectiveUrl.startsWith("blob:") || ext.length > 5) {
        ext = (title || "").split(".").pop().toLowerCase().split("?")[0];
      }
      setIsImage(["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(ext));
      setIsPdf(ext === "pdf");
      setIsAudio(["mp3", "wav", "ogg", "aac", "m4a", "wma", "flac"].includes(ext));
      setIsVideo(["mp4", "webm", "ogg", "mov", "avi", "mkv", "3gp"].includes(ext));
      setViewerUrl(normalizedUrl);
    }
  }, [effectiveUrl]);

  const handleDownload = () => {
    if (!normalizedUrl) return;

    if (normalizedUrl.startsWith("data:")) {
      try {
        const parts = normalizedUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = title || "document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("Base64 download failed, fallback to direct open:", err);
        window.open(normalizedUrl, "_blank");
      }
    } else {
      window.location.href = normalizedUrl + "?download=true";
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">{title || "Document"}</h3>
              {badge && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <Download size={13} /> Download
            </button>
            <a href={normalizedUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition">
              <ExternalLink size={13} /> Open in Tab
            </a>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Viewer Body */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[400px]">
          {!viewerUrl ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center">
                <FileText size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">No preview available</p>
                <p className="text-xs text-slate-500 mt-1">This document has no uploaded file data to preview.</p>
              </div>
            </div>
          ) : isPdf ? (
            <iframe src={viewerUrl} className="w-full h-full min-h-[600px] border-0" title={title || "Document"} />
          ) : isImage ? (
            <div className="p-6">
              <img src={viewerUrl} alt={title || "Document"} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />
            </div>
          ) : isAudio ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 bg-white rounded-xl border border-slate-200 w-full max-w-md mx-auto my-8 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center shadow-xs">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="font-bold text-slate-700 text-sm text-center truncate max-w-full">{title}</p>
              <audio controls src={viewerUrl} className="w-full mt-2 focus:outline-none" />
            </div>
          ) : isVideo ? (
            <div className="p-6 flex items-center justify-center max-w-full w-full h-full">
              <video controls src={viewerUrl} className="max-w-full max-h-[70vh] rounded-xl shadow-lg border border-slate-200" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center">
                <FileText size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">Preview not available</p>
                <p className="text-xs text-slate-500 mt-1">This file type cannot be previewed in the browser.</p>
              </div>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Download size={14} /> Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Payment Detail Modal ────────────────────────────────────────
function PaymentDetailModal({ item, formatDate, onClose }) {
  const inv = item.invoiceData || {};

  const rows = [
    { label: "Court Fee", type: inv.court_fee_case_type, amount: inv.court_fee_amount, note: inv.court_fee_jurisdiction },
    { label: "Stamp Duty", type: inv.stamp_duty_doc_type, amount: inv.stamp_duty_amount, note: inv.stamp_duty_state },
    { label: "Advocate Fee", type: inv.advocate_fee_case_type, amount: inv.advocate_fee_amount, note: inv.advocate_fee_remarks },
    { label: "Filing Cost", type: inv.filing_cost_pages ? `${inv.filing_cost_pages} pages` : null, amount: inv.filing_cost_amount, note: inv.filing_cost_notes },
  ].filter(r => r.amount > 0);

  const statusColor = {
    Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Overdue: "bg-red-100 text-red-700 border-red-200",
    Sent: "bg-blue-100 text-blue-700 border-blue-200",
  }[inv.status] || "bg-slate-100 text-slate-700 border-slate-200";

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Payment Details</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Client</p>
              <p className="font-bold text-slate-800 text-sm">{inv.client_name || "—"}</p>
              {inv.case_number && <p className="text-[10px] text-slate-500">Case: {inv.case_number}</p>}
            </div>
            {inv.status && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusColor}`}>
                {inv.status}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Invoice Date</p>
              <p className="font-semibold text-slate-700">{formatDate(item.date)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Payment Method</p>
              <p className="font-semibold text-slate-700 capitalize">{inv.payment_method || "—"}</p>
              {inv.gpay_number && <p className="text-[10px] text-slate-500 mt-0.5">GPay: {inv.gpay_number}</p>}
              {inv.upi_id && <p className="text-[10px] text-slate-500 mt-0.5">UPI: {inv.upi_id}</p>}
            </div>
          </div>
          {rows.length > 0 ? (
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fee Breakdown</p>
              </div>
              <div className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{r.label}</p>
                      {r.type && <p className="text-[10px] text-slate-400">{r.type}</p>}
                      {r.note && <p className="text-[10px] text-slate-400">{r.note}</p>}
                    </div>
                    <p className="text-sm font-bold text-slate-800">₹{(r.amount || 0).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-2">No fee breakdown available.</p>
          )}
          {(inv.subtotal > 0 || inv.grand_total > 0) && (
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 space-y-2">
              {inv.subtotal > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-700">₹{inv.subtotal.toLocaleString("en-IN")}</span>
                </div>
              )}
              {inv.gst > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">GST</span>
                  <span className="font-semibold text-slate-700">₹{inv.gst.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-emerald-100 pt-2 mt-1">
                <span className="font-bold text-slate-800">Grand Total</span>
                <span className="font-extrabold text-emerald-700 text-base">₹{(inv.grand_total || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
