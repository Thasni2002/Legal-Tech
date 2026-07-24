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
  ExternalLink,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "@/utils/api";
import DocumentViewerModal from "@/components/common/DocumentViewerModal";

// Helper to accurately convert backend UTC timestamps into local IST 12-hour AM/PM time
const formatExactDateTime = (dateVal) => {
  const now = new Date();

  if (!dateVal) {
    return {
      date: now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    };
  }

  const str = String(dateVal).trim();

  // If dateVal contains full ISO timestamp or HH:MM:SS string from backend
  if (str.includes("T") || str.includes(":")) {
    let cleanStr = str.replace(" ", "T");
    // Ensure UTC interpretation if no timezone offset is attached
    if (!cleanStr.endsWith("Z") && !cleanStr.includes("+") && !cleanStr.includes("-", 10)) {
      cleanStr += "Z";
    }
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      return { date, time };
    }
  }

  // Fallback for plain date strings
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      return { date, time };
    }
  } catch (e) {}

  return {
    date: str,
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  };
};

// Helper to reliably resolve performer/uploader Name and Role (Senior Adv, Jr Adv, Clerk, Client)
const resolveUploader = (doc, item, eventType) => {
  // 1. Check document-specific uploader / advocate first
  const docAdv = doc?.advocate || doc?.uploadedBy || doc?.uploaded_by || doc?.uploadedByName;
  const docRole = doc?.uploadedByRole || doc?.uploaded_by_role || doc?.role;

  if (docAdv && docAdv.trim() !== "" && docAdv.trim().toLowerCase() !== "n/a") {
    const advLower = docAdv.toLowerCase();
    let computedRole = docRole;
    if (!computedRole) {
      if (advLower.includes("liya") || advLower.includes("jr") || advLower.includes("junior")) {
        computedRole = "Junior Advocate";
      } else if (advLower.includes("clerk") || advLower.includes("ramesh")) {
        computedRole = "Clerk";
      } else if (advLower.includes("client")) {
        computedRole = "Client";
      } else {
        computedRole = "Senior Advocate";
      }
    }
    return {
      label: "Uploaded by",
      name: docAdv.trim(),
      role: computedRole
    };
  }

  // 2. Filename metadata hints
  if (doc?.file) {
    const fileLower = doc.file.toLowerCase();
    if (fileLower.includes("liya")) {
      return { label: "Uploaded by", name: "Jr. Adv. Liya", role: "Junior Advocate" };
    }
    if (fileLower.includes("clerk")) {
      return { label: "Uploaded by", name: "Clerk Ramesh", role: "Clerk" };
    }
  }

  // 3. For Case Creation / Update events from Senior Advocate Case Management:
  const advocateName = item?.selected_advocate && item.selected_advocate.trim() !== "" && item.selected_advocate.trim().toLowerCase() !== "n/a"
    ? item.selected_advocate.trim()
    : "Senior Advocate";

  if (eventType === "case" || item?.type === "case") {
    return {
      label: "Created / Managed by",
      name: advocateName,
      role: "Senior Advocate"
    };
  }

  // 4. Default for Case Management document uploads:
  if (doc) {
    if (docRole && docRole.toLowerCase().includes("client")) {
      return { label: "Uploaded by", name: item?.client_name || "Client", role: "Client" };
    }
    return {
      label: "Uploaded by",
      name: advocateName,
      role: "Senior Advocate"
    };
  }

  return {
    label: "Action by",
    name: advocateName,
    role: "Senior Advocate"
  };
};

export default function ClientHistory() {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState({ clientCount: 0, caseCount: 0 });
  const [allClientsList, setAllClientsList] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [assignedAdvocatesList, setAssignedAdvocatesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Load client data to display details
    const data = localStorage.getItem("clientData");
    if (data) {
      try {
        const currentClient = JSON.parse(data);
        setClient(currentClient);
      } catch (err) {
        console.error("Failed to parse client data:", err);
      }
    }
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

          const uniqueAdvocates = Array.from(
            new Set(
              matchedCases
                .map(item => item.selected_advocate)
                .filter(adv => adv && adv.trim() !== "" && adv.trim().toLowerCase() !== "n/a")
            )
          );
          setAssignedAdvocatesList(uniqueAdvocates);

          const mapped = matchedCases.map((item) => {
            const dt = formatExactDateTime(item.created_at || item.updated_at);
            const uploader = resolveUploader(null, item, "case");
            return {
              id: `db-case-${item.id}`,
              type: "case",
              title: "Case Created / Updated",
              desc: `Case '${item.case_title || item.case_no}' under court '${item.court_name}' is currently '${item.status}'${item.selected_advocate ? ` | Assigned Advocate: ${item.selected_advocate}` : ''}.`,
              clientName: item.client_name || "Unknown",
              uploaderLabel: uploader.label,
              uploaderRole: uploader.role,
              uploaderName: uploader.name,
              documents: item.documents || [],
              date: dt.date,
              time: dt.time,
              badge: item.status || "Active",
            };
          });

          // Extract documents from each matched case and map as document history items
          const docItems = [];
          matchedCases.forEach((item) => {
            const docs = Array.isArray(item.documents) ? item.documents : [];
            docs.forEach((doc, idx) => {
              if (!doc.file && !doc.url) return;

              const docTimeStr = doc.created_at || doc.uploaded_at || doc.uploadedAt || item.created_at;
              const dt = formatExactDateTime(docTimeStr);
              const uploader = resolveUploader(doc, item, "document");

              docItems.push({
                id: `db-doc-${item.id}-${idx}`,
                type: "document",
                title: doc.documentType || "Document Uploaded",
                fileName: doc.file || "File",
                caseName: item.case_title || item.case_no,
                courtName: item.court_name,
                clientName: item.client_name || "Unknown",
                uploaderLabel: uploader.label,
                uploaderRole: uploader.role,
                uploaderName: uploader.name,
                desc: client
                  ? `Document '${doc.file || doc.url || "File"}' uploaded for case '${item.case_title || item.case_no}' (${item.court_name}).`
                  : `Client: ${item.client_name || "Unknown"} — '${doc.file || doc.url || "File"}' for case '${item.case_title || item.case_no}'.`,
                date: dt.date,
                time: dt.time,
                badge: doc.documentType || "Document",
                fileUrl: doc.url || null,
              });
            });
          });

          setHistoryItems(prev => {
            const nonDb = prev.filter(i => !i.id.startsWith("db-case-") && !i.id.startsWith("db-doc-"));
            return [...mapped, ...docItems, ...nonDb];
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

          const mapped = matchedInvoices.map((item) => {
            const dt = formatExactDateTime(item.created_at || item.updated_at);
            return {
              id: `db-billing-${item.id}`,
              type: "billing",
              title: `₹${(item.grand_total || item.subtotal || 0).toLocaleString("en-IN")} — ${item.status === 'Paid' ? 'Received' : item.status || 'Pending'}`,
              desc: `Invoice for ${item.client_name || "Client"} | Case: ${item.case_number || "N/A"} | Method: ${item.payment_method || "N/A"}.`,
              clientName: item.client_name || "Unknown",
              uploaderLabel: "Issued by",
              uploaderRole: "Finance",
              uploaderName: "Billing System",
              date: dt.date,
              time: dt.time,
              badge: item.status || "Pending",
              invoiceData: item,
            };
          });

          setHistoryItems(prev => {
            const nonDb = prev.filter(i => !i.id.startsWith("db-billing-"));
            return [...mapped, ...nonDb];
          });
        }
      } catch (err) {
        console.error("Failed to fetch invoices in ClientHistory:", err);
      }
    };

    const fetchDbConsultations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/consultations`);
        if (res.ok) {
          const data = await res.json();
          const matchedConsultations = client
            ? data.filter(item => {
                const itemClientName = (item.client_name || "").trim().toLowerCase();
                return itemClientName === targetName || targetName.includes(itemClientName) || itemClientName.includes(targetName);
              })
            : data;

          const mapped = matchedConsultations.map((item) => {
            const dt = formatExactDateTime(item.created_at || item.date);
            return {
              id: `db-discussion-${item.id}`,
              type: "discussion",
              title: `Discussion Scheduled — ${item.status}`,
              desc: `Discussion appointment for issue: '${item.issue || "N/A"}' with Adv. ${item.advocate_name || "counsel"} (${item.type || "N/A"}).`,
              clientName: item.client_name || "Unknown",
              uploaderLabel: "Scheduled by",
              uploaderRole: item.advocate_name ? "Senior Advocate" : "Client",
              uploaderName: item.advocate_name || item.client_name || "System User",
              date: dt.date,
              time: dt.time,
              badge: item.status || "Scheduled",
              discussionData: item,
            };
          });

          setHistoryItems(prev => {
            const nonDb = prev.filter(i => !i.id.startsWith("db-discussion-"));
            return [...mapped, ...nonDb];
          });
        }
      } catch (err) {
        console.error("Failed to fetch consultations in ClientHistory:", err);
      }
    };

    fetchDbCases();
    fetchDbInvoices();
    fetchDbConsultations();
  }, [client]);

  // Get configuration styles per history event type
  const getTypeConfig = (type) => {
    switch (type) {
      case "case":
        return {
          bg: "bg-blue-50 border-blue-100",
          iconBg: "bg-[#2563EB] text-white",
          badgeBg: "bg-blue-50 text-[#2563EB] border-blue-200",
          icon: <Briefcase size={12} />,
          label: "Case Update",
        };
      case "document":
        return {
          bg: "bg-amber-50 border-amber-100",
          iconBg: "bg-indigo-600 text-white",
          badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: <FileText size={12} />,
          label: "Document Upload",
        };
      case "billing":
        return {
          bg: "bg-emerald-50 border-emerald-100",
          iconBg: "bg-emerald-600 text-white",
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <span className="font-bold text-xs leading-none select-none">₹</span>,
          label: "Billing",
        };
      case "discussion":
        return {
          bg: "bg-indigo-50 border-indigo-100",
          iconBg: "bg-violet-600 text-white",
          badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
          icon: <MessageSquare size={12} />,
          label: "Case Discussion",
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-100",
          iconBg: "bg-slate-600 text-white",
          badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <Clock size={12} />,
          label: "Activity",
        };
    }
  };

  // Filter & search history items
  const filteredItems = historyItems.filter((item) => {
    if (activeTab !== "all" && item.type !== activeTab) {
      return false;
    }

    const search = searchQuery.trim().toLowerCase();
    if (!search) return true;

    return (
      item.title?.toLowerCase().includes(search) ||
      item.desc?.toLowerCase().includes(search) ||
      item.badge?.toLowerCase().includes(search) ||
      item.uploaderName?.toLowerCase().includes(search) ||
      item.uploaderRole?.toLowerCase().includes(search) ||
      item.type?.toLowerCase().includes(search) ||
      item.date?.toLowerCase().includes(search) ||
      item.time?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in">
      {/* Main content card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col">
        {/* Card Header showing current client details */}
        <div className="p-4 sm:p-5 border-b border-[#F1F5F9] bg-[#F8FAFC] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/client-management"
              className="flex items-center justify-center w-9 h-9 bg-white border border-[#E2E8F0] rounded-xl shadow-xs text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors cursor-pointer shrink-0"
              title="Back to Client Management"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-lg sm:text-xl tracking-tight">
                Activity History - {client ? (client.fullName || client.clientName) : "All Clients"}
              </h3>
              {client ? (
                <div className="space-y-0.5">
                  <p className="text-xs text-[#64748B] font-medium">
                    Client ID: {client.clientId} &bull; {client.email || client.emailId} &bull; {client.phone || client.contactNumber}
                  </p>
                  {assignedAdvocatesList.length > 0 && (
                    <p className="text-xs text-[#2563EB] font-bold mt-0.5">
                      Assigned Advocate{assignedAdvocatesList.length > 1 ? "s" : ""}: {assignedAdvocatesList.join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                  Consolidated activity logs across cases, documents, billing, and consultations.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-[#64748B]">Switch Client:</span>
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
              className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200 cursor-pointer font-bold shadow-2xs"
            >
              <option value="all">All Clients</option>
              {allClientsList.map((c) => (
                <option key={c.clientId} value={c.clientName || c.fullName}>
                  {c.clientName || c.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Filters Toolbar and Search Bar */}
        <div className="px-4 py-2.5 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          {/* Compact Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            {["all", "case", "document", "billing", "discussion"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer capitalize ${
                  activeTab === tab
                    ? "bg-white text-[#0F172A] shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab === "all" ? "All Activities" : tab === "case" ? "Case Updates" : tab === "document" ? "Documents" : tab === "billing" ? "Billing" : "Case Discussion"}
              </button>
            ))}
          </div>

          {/* Compact Search Input */}
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-3 top-2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-4 sm:p-6 bg-slate-50/40">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-[#F1F5F9] text-[#64748B] rounded-full flex items-center justify-center mb-3 border border-[#E2E8F0]">
                <Search size={18} />
              </div>
              <h4 className="font-bold text-[#0F172A] text-sm mb-1">No activities found</h4>
              <p className="text-xs text-[#64748B] max-w-xs">
                No history logs match your search filter for this client.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-6">
              {filteredItems.map((item) => {
                const config = getTypeConfig(item.type);
                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <span className={`absolute -left-[29px] sm:-left-[37px] top-1 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border-4 border-white ${config.iconBg} shadow-2xs transition-transform group-hover:scale-110 select-none shrink-0`}>
                      {config.icon}
                    </span>

                    {/* Content Card */}
                    <div 
                      onClick={() => {
                        if (item.type === "document") {
                          setSelectedDoc({ fileUrl: item.fileUrl || null, title: item.fileName || item.title, badge: item.badge });
                        }
                      }}
                      className={`p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-200 bg-white transition-all duration-200 space-y-2.5 ${
                        item.type === "document" ? "cursor-pointer" : ""
                      }`}
                    >
                      {/* Top Header Row: Title, Badge, Date & Accurately Converted Local Time */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-[#0F172A] text-sm leading-tight">
                            {item.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${config.badgeBg}`}>
                            {item.badge || config.label}
                          </span>
                        </div>

                        {/* Date & Accurately Converted Local IST Time */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 self-start sm:self-auto shrink-0 shadow-2xs">
                          <Calendar size={13} className="shrink-0 text-[#2563EB]" />
                          <span>{item.date}</span>
                          {item.time && (
                            <>
                              <span className="text-slate-300">•</span>
                              <Clock size={13} className="shrink-0 text-[#2563EB]" />
                              <span className="font-bold text-slate-800">{item.time}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Subtitle line right below title stating who uploaded / created the case/document */}
                      {item.uploaderName && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <User size={13} className="text-[#2563EB] shrink-0" />
                          <span className="text-slate-500 font-medium">{item.uploaderLabel || "Uploaded / Created by"}:</span>
                          <span className="font-bold text-[#0F172A]">{item.uploaderName}</span>
                          <span className="text-[10px] font-extrabold text-[#2563EB] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {item.uploaderRole}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {item.type === "document" ? (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {!client && (
                            <>
                              <span className="font-bold text-[#0F172A]">Client: {item.clientName || "Unknown"}</span>
                              <span className="text-slate-300 mx-1.5">&bull;</span>
                            </>
                          )}
                          Document{" "}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc({ fileUrl: item.fileUrl || null, title: item.fileName, badge: item.badge });
                            }}
                            className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer bg-transparent border-0 p-0 inline-block align-baseline text-xs"
                          >
                            '{item.fileName || "File"}'
                          </button>{" "}
                          uploaded for case '{item.caseName || "N/A"}' ({item.courtName || "N/A"}).
                        </p>
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {!client && (
                            <>
                              <span className="font-bold text-[#0F172A]">Client: {item.clientName || "Unknown"}</span>
                              <span className="text-slate-300 mx-1.5">&bull;</span>
                            </>
                          )}
                          {item.desc}
                        </p>
                      )}

                      {/* Attached documents list */}
                      {item.type === "case" && item.documents && item.documents.length > 0 && (
                        <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attached Case Documents:</p>
                          <div className="grid gap-2">
                            {item.documents.map((doc, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-indigo-200 transition-colors gap-2">
                                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                                  <FileText size={14} className="text-indigo-500 shrink-0" />
                                  <span className="text-xs text-slate-800 font-bold truncate">{doc.file || "Document"}</span>
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase shrink-0">{doc.documentType || "Document"}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                  <button
                                    onClick={() => setSelectedDoc({ fileUrl: doc.url || null, title: doc.file, badge: doc.documentType })}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-white bg-white hover:bg-[#2563EB] border border-indigo-200 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
                                  >
                                    <Eye size={12} />
                                    <span>View</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-1 flex-wrap">
                        {item.type === "document" && (
                          <button
                            onClick={() => setSelectedDoc({ fileUrl: item.fileUrl || null, title: item.fileName || item.title, badge: item.badge })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View Document</span>
                          </button>
                        )}
                        {item.type === "billing" && (
                          <button
                            onClick={() => setSelectedPayment(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                          >
                            <Receipt size={13} />
                            <span>View Billing Details</span>
                          </button>
                        )}
                        {item.type === "discussion" && (
                          <button
                            onClick={() => setSelectedDiscussion(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                          >
                            <MessageSquare size={13} />
                            <span>View Discussion Details</span>
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

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          fileUrl={selectedDoc.fileUrl}
          title={selectedDoc.title}
          badge={selectedDoc.badge}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
