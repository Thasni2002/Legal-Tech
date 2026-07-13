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
import DocumentViewerModal from "@/components/common/DocumentViewerModal";


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
  // Custom activity logging states removed

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

          const mapped = matchedCases.map(item => ({
            id: `db-case-${item.id}`,
            type: "case",
            title: "Case Created / Updated",
            desc: `Case '${item.case_title || item.case_no}' under court '${item.court_name}' is currently '${item.status}'${item.selected_advocate ? ` | Assigned Advocate: ${item.selected_advocate}` : ''}.`,
            clientName: item.client_name || "Unknown",
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
            id: `db-billing-${item.id}`,
            type: "billing",
            title: `₹${(item.grand_total || item.subtotal || 0).toLocaleString("en-IN")} — ${item.status === 'Paid' ? 'Received' : item.status || 'Pending'}`,
            desc: `Invoice for ${item.client_name || "Client"} | Case: ${item.case_number || "N/A"} | Method: ${item.payment_method || "N/A"}.`,
            clientName: item.client_name || "Unknown",
            date: item.created_at ? item.created_at.replace(" ", "T").split("T")[0] : new Date().toISOString().split("T")[0],
            time: item.created_at ? (item.created_at.replace(" ", "T").split("T")[1] || "12:00").substring(0, 5) : "12:00",
            badge: item.status || "Pending",
            invoiceData: item,
          }));

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

          const mapped = matchedConsultations.map(item => ({
            id: `db-discussion-${item.id}`,
            type: "discussion",
            title: `Discussion Scheduled — ${item.status}`,
            desc: `Discussion appointment for issue: '${item.issue || "N/A"}' with Adv. ${item.advocate_name || "counsel"} (${item.type || "N/A"}).`,
            clientName: item.client_name || "Unknown",
            date: item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0],
            time: item.time || "12:00 PM",
            badge: item.status || "Scheduled",
            discussionData: item,
          }));

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

  // Manual activity handlers removed

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

  // Get configuration styles per history event type (matching modal icon sizes and designs)
  const getTypeConfig = (type) => {
    switch (type) {
      case "case":
        return {
          bg: "bg-blue-50 border-blue-100",
          iconBg: "bg-blue-600 text-white",
          badgeBg: "bg-blue-100 text-blue-700",
          icon: <Briefcase size={12} />,
          label: "Case Update",
        };
      case "document":
        return {
          bg: "bg-amber-50 border-amber-100",
          iconBg: "bg-amber-500 text-white",
          badgeBg: "bg-amber-100 text-amber-700",
          icon: <FileText size={12} />,
          label: "Document Upload",
        };
      case "billing":
        return {
          bg: "bg-emerald-50 border-emerald-100",
          iconBg: "bg-emerald-600 text-white",
          badgeBg: "bg-emerald-100 text-emerald-700",
          icon: <span className="font-bold text-xs leading-none select-none">₹</span>,
          label: "Billing",
        };
      case "discussion":
        return {
          bg: "bg-indigo-50 border-indigo-100",
          iconBg: "bg-indigo-600 text-white",
          badgeBg: "bg-indigo-100 text-indigo-700",
          icon: <MessageSquare size={12} />,
          label: "Case Discussion",
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-100",
          iconBg: "bg-slate-500 text-white",
          badgeBg: "bg-slate-100 text-slate-700",
          icon: <Clock size={12} />,
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

  return (
    <div className="w-full space-y-6 md:space-y-8 pb-10 animate-fade-in">
      {/* Main content card mimicking the modal design */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col">
        {/* Card Header showing current client details */}
        <div className="p-5 border-b border-[#F1F5F9] bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/client-management"
              className="flex items-center justify-center w-9 h-9 bg-white border border-[#E2E8F0] rounded-lg shadow-sm text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h3 className="font-bold text-[#0F172A] text-lg">
                Activity History - {client ? (client.fullName || client.clientName) : "All Clients"}
              </h3>
              {client ? (
                <div className="space-y-0.5">
                  <p className="text-xs text-[#64748B] font-medium">
                    Client ID: {client.clientId} &bull; {client.email || client.emailId} &bull; {client.phone || client.contactNumber}
                  </p>
                  {assignedAdvocatesList.length > 0 && (
                    <p className="text-xs text-indigo-600 font-bold mt-0.5">
                      Assigned Advocate{assignedAdvocatesList.length > 1 ? "s" : ""}: {assignedAdvocatesList.join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                  Consolidated history across all active cases and invoices.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#64748B]">Switch Client:</span>
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
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200 cursor-pointer font-semibold shadow-xs"
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

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-[#F1F5F9] p-1 rounded-lg">
            {["all", "case", "document", "billing", "discussion"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer capitalize ${
                  activeTab === tab
                    ? "bg-white text-[#0F172A] shadow-sm"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab === "all" ? "All Activities" : tab === "case" ? "Case Updates" : tab === "document" ? "Documents" : tab === "billing" ? "Billing" : "Case Discussion"}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
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

        {/* Timeline Content */}
        <div className="p-6 bg-slate-50/50">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
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
                    <div 
                      onClick={() => {
                        if (item.type === "document") {
                          setSelectedDoc({ fileUrl: item.fileUrl || null, title: item.fileName || item.title, badge: item.badge });
                        }
                      }}
                      className={`p-4 rounded-lg border border-[#E2E8F0] shadow-xs hover:shadow-sm bg-white transition-all duration-200 ${
                        item.type === "document" ? "cursor-pointer hover:border-amber-300 hover:bg-amber-50/5" : ""
                      }`}
                    >
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

                      {item.type === "document" ? (
                        <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                          {!client && (
                            <>
                              <span className="font-bold text-[#0F172A]">Client: {item.clientName || "Unknown"}</span>
                              <span className="text-[#E2E8F0] mx-1.5">&bull;</span>
                            </>
                          )}
                          Document{" "}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc({ fileUrl: item.fileUrl || null, title: item.fileName, badge: item.badge });
                            }}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-0 p-0 inline-block align-baseline text-[11px]"
                          >
                            '{item.fileName || "File"}'
                          </button>{" "}
                          uploaded for case '{item.caseName || "N/A"}' ({item.courtName || "N/A"}).
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                          {!client && (
                            <>
                              <span className="font-bold text-[#0F172A]">Client: {item.clientName || "Unknown"}</span>
                              <span className="text-[#E2E8F0] mx-1.5">&bull;</span>
                            </>
                          )}
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
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            <Eye size={11} /> View Document
                          </button>
                        )}
                        {item.type === "billing" && (
                          <button
                            onClick={() => setSelectedPayment(item)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            <Receipt size={11} /> View Billing Details
                          </button>
                        )}
                        {item.type === "discussion" && (
                          <button
                            onClick={() => setSelectedDiscussion(item)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            <MessageSquare size={11} /> View Discussion Details
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

      {/* Billing Detail Modal */}
      {selectedPayment && (
        <BillingDetailModal
          item={selectedPayment}
          formatDate={formatDate}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {/* Discussion Detail Modal */}
      {selectedDiscussion && (
        <DiscussionDetailModal
          item={selectedDiscussion}
          formatDate={formatDate}
          onClose={() => setSelectedDiscussion(null)}
        />
      )}
    </div>
  );
}



// ─── Billing Detail Modal ────────────────────────────────────────
function BillingDetailModal({ item, formatDate, onClose }) {
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
              <h3 className="font-bold text-slate-800 text-sm">Billing Details</h3>
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



// ─── Discussion Detail Modal ────────────────────────────────────────
function DiscussionDetailModal({ item, formatDate, onClose }) {
  const consult = item.discussionData || {};

  const statusColor = {
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Approved: "bg-blue-100 text-blue-700 border-blue-200",
    Scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
    Rescheduled: "bg-purple-100 text-purple-700 border-purple-200",
  }[consult.status] || "bg-slate-100 text-slate-700 border-slate-200";

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Discussion Details</h3>
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
              <p className="font-bold text-slate-800 text-sm">{consult.client_name || "—"}</p>
            </div>
            {consult.status && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusColor}`}>
                {consult.status}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Discussion Date & Time</p>
              <p className="font-semibold text-slate-700">{formatDate(consult.date)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{consult.time}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Advocate / Counsel</p>
              <p className="font-semibold text-slate-700">{consult.advocate_name || "—"}</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Legal Issue</p>
                <p className="font-semibold text-slate-700">{consult.issue || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Discussion Type</p>
                <p className="font-semibold text-slate-700 capitalize">{consult.type || "—"}</p>
              </div>
              {consult.fee && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Discussion Fee</p>
                  <p className="font-bold text-slate-800">{consult.fee}</p>
                </div>
              )}
            </div>

            {consult.meeting_link && (
              <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">Meeting Link</p>
                  <p className="font-semibold text-slate-700 text-xs truncate max-w-xs">{consult.meeting_link}</p>
                </div>
                <a
                  href={consult.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                >
                  Join Meeting
                </a>
              </div>
            )}

            {consult.summary && (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discussion Summary / Notes</p>
                </div>
                <div className="p-4 bg-white text-xs leading-relaxed text-slate-600 font-medium">
                  {consult.summary}
                </div>
              </div>
            )}

            {consult.reschedule_reason && (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-purple-50/50 px-4 py-2 border-b border-purple-100">
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Reason for Rescheduling</p>
                </div>
                <div className="p-4 bg-white text-xs leading-relaxed text-slate-600 font-medium">
                  {consult.reschedule_reason}
                </div>
              </div>
            )}
          </div>
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
