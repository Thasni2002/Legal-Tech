"use client";

import { API_BASE_URL } from "@/utils/api";
import { generateProfessionalInvoicePDF } from "@/utils/generateProfessionalInvoicePDF";

import { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle,
  Download,
  AlertCircle,
  Info,
  User,
  Mail,
  Calendar,
  Check,
  Smartphone,
  Globe,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import jsPDF from "jspdf";
import useModulePermission from "@/utils/useModulePermission";
import { createPortal } from "react-dom";

export default function ClientPayments() {
  const { perms, loading: permsLoading } = useModulePermission("Payments");
  const [invoices, setInvoices] = useState([]);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // Payment modal state

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);


  // Decode user from JWT in localStorage
  const getLoggedInUser = () => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded; // { id, email, role }
    } catch (e) {
      console.error("Failed to decode token", e);
      return null;
    }
  };

  // Check login and set active client
  useEffect(() => {
    const user = getLoggedInUser();
    if (!user) {
      setAuthError("No active session found. Please log in first.");
      return;
    }

    setClientEmail(user.email || "");

    // Try to get a real name from token fields first
    const tokenFullName = [
      user.first_name || user.firstName,
      user.last_name || user.lastName
    ].filter(Boolean).join(" ").trim();

    const tokenName = tokenFullName ||
      user.full_name ||
      user.fullName ||
      user.name ||
      user.client_name ||
      ""; // do NOT fall back to username/email here

    if (tokenName) {
      setClientName(tokenName);
    }

    // Always attempt to fetch real full name from case management
    fetch(`${API_BASE_URL}/case-management/`)
      .then(res => (res.ok ? res.json() : []))
      .then(cases => {
        if (!Array.isArray(cases)) return;
        const userEmail = (user.email || "").toLowerCase().trim();
        const userName = (user.username || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const matchedCase = cases.find(c => {
          const cEmail = (c.email_id || "").toLowerCase().trim();
          const cClientName = (c.client_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            (userEmail && cEmail && userEmail === cEmail) ||
            (userName && cClientName && (cClientName === userName || userName.includes(cClientName)))
          );
        });

        if (matchedCase && matchedCase.client_name) {
          setClientName(matchedCase.client_name);
        } else if (!tokenName) {
          // Last resort: use username (not email prefix)
          const fallback = user.username ||
            (user.email ? user.email.split("@")[0] : "Client");
          setClientName(fallback.charAt(0).toUpperCase() + fallback.slice(1));
        }
      })
      .catch(() => {
        if (!tokenName) {
          const fallback = user.username ||
            (user.email ? user.email.split("@")[0] : "Client");
          setClientName(fallback.charAt(0).toUpperCase() + fallback.slice(1));
        }
      });
  }, []);

  // Fetch invoices for active client
  const fetchInvoices = async () => {
    if (!clientEmail) return;
    try {
      const res = await fetch(`${API_BASE_URL}/finance/invoices?email=${encodeURIComponent(clientEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [clientEmail]);



  // Handle Payment Submit
  const handlePaymentSubmit = async (invoice) => {
    if (!invoice) return;

    setIsProcessing(true);

    try {
      // 1. Create Razorpay Order via Backend API
      const orderRes = await fetch(`${API_BASE_URL}/finance/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: invoice.grand_total,
          invoice_id: invoice.id,
        }),
      });

      const orderData = await orderRes.json();

      // 2. Open Razorpay Modal if Order created successfully & SDK present
      if (orderRes.ok && orderData.id && typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Legal Tech Enterprise",
          description: `Payment for Invoice #${invoice.id}`,
          order_id: orderData.id,
          handler: async function (response) {
            try {
              const verifyRes = await fetch(`${API_BASE_URL}/finance/payment/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  invoice_id: invoice.id,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                setPaymentSuccess(true);
                setShowPaymentModal(false);
                fetchInvoices();
              } else {
                alert(verifyData.detail || "Payment verification failed");
              }
            } catch (err) {
              console.error("Verification error:", err);
              alert("Error verifying payment signature");
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: invoice.client_name || "",
            email: invoice.email || "",
            contact: invoice.mobile_number || "",
          },
          theme: {
            color: "#2563eb",
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } else {
        alert(orderData.detail || "Failed to initialize Razorpay Live Payment Gateway. Please verify API keys in Profile Settings.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.message || "Payment process encountered an error.");
      setIsProcessing(false);
    }
  };
  // PDF Generator for Receipt / Invoice
  const handleDownloadInvoicePDF = (inv) => {
    const doc = generateProfessionalInvoicePDF(inv);
    doc.save(`Invoice_${inv.id}_${inv.client_name || "Record"}.pdf`);
  };

  // Pagination states
  const [duePage, setDuePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  // Helper to determine status (PENDING / OVERDUE / PAID) with 7-day auto-overdue check
  const getInvoiceStatusInfo = (inv) => {
    const statusLower = (inv?.status || "").toLowerCase();
    if (statusLower === "paid") {
      return {
        label: "PAID",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        isOverdue: false,
      };
    }

    const createdMs = inv?.created_at ? new Date(inv.created_at).getTime() : Date.now();
    const diffDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);

    if (diffDays >= 7 || statusLower === "overdue") {
      return {
        label: "OVERDUE",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        isOverdue: true,
      };
    }

    return {
      label: "PENDING",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      isOverdue: false,
    };
  };

  // Filter due vs paid invoices
  const dueInvoices = invoices.filter(
    (inv) => (inv.status || "").toLowerCase() !== "paid"
  );
  const paidInvoices = invoices.filter(
    (inv) => (inv.status || "").toLowerCase() === "paid"
  );

  const overdueInvoices = dueInvoices.filter((inv) => getInvoiceStatusInfo(inv).isOverdue);

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.grand_total, 0);
  const totalDue = dueInvoices.reduce((sum, inv) => sum + inv.grand_total, 0);

  // Pagination calculations for Due Invoices
  const dueTotalPages = Math.ceil(dueInvoices.length / itemsPerPage) || 1;
  const activeDuePage = Math.min(duePage, dueTotalPages);
  const dueStartIndex = (activeDuePage - 1) * itemsPerPage;
  const dueEndIndex = Math.min(dueStartIndex + itemsPerPage, dueInvoices.length);
  const paginatedDueInvoices = dueInvoices.slice(dueStartIndex, dueEndIndex);

  // Pagination calculations for Payment History
  const historyTotalPages = Math.ceil(paidInvoices.length / itemsPerPage) || 1;
  const activeHistoryPage = Math.min(historyPage, historyTotalPages);
  const historyStartIndex = (activeHistoryPage - 1) * itemsPerPage;
  const historyEndIndex = Math.min(historyStartIndex + itemsPerPage, paidInvoices.length);
  const paginatedPaidInvoices = paidInvoices.slice(historyStartIndex, historyEndIndex);

  // If there's an authentication/session issue, render a detailed clean warning card
  // No view access
  if (!permsLoading && !perms.view) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            You do not have permission to view Payments.
          </p>
        </div>
      </div>
    );
  }

  // Auth error
  if (authError) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Client Profile Required</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            {authError}
          </p>
          <p className="text-slate-400 text-xs mt-4">
            Please register or log in with a Client account role to view case payment logs.
          </p>
          <a
            href="/login"
            className="inline-block mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Go to Login Page
          </a>
        </div>
      </div>
    );
  }  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-200 overflow-hidden">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 sm:p-6 w-full max-w-full min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold shrink-0 border border-blue-100 shadow-xs">
            <CreditCard size={18} className="sm:w-[20px] sm:h-[20px]" />
          </div>
          <h1 className="text-[#0F172A] font-extrabold text-xl sm:text-2xl md:text-3xl tracking-tight truncate">
            Payments
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed break-words mt-1">
          View, download, and pay outstanding fee invoices
        </p>
      </div>

      {/* Success Notification */}
      {paymentSuccess && (
        <div className="bg-emerald-50 border border-emerald-500 text-emerald-700 p-3.5 sm:p-4 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Payment completed successfully! The invoice record has been updated and a receipt generated.</span>
        </div>
      )}

      {/* Overdue Notification Banner (if any invoice >= 7 days) */}
      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-red-950 text-xs sm:text-sm">Overdue Payment Notice (Past 7 Days)</h4>
            <p className="text-red-700 font-medium text-xs leading-relaxed">
              You have <strong>{overdueInvoices.length} invoice(s)</strong> older than 7 days that remain unpaid. Please click <strong>Pay Now</strong> to settle them promptly and prevent delays in legal proceedings.
            </p>
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full max-w-full min-w-0">
        <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-xs min-w-0">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-2">Active Account</span>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-extrabold text-sm border border-blue-100 shrink-0">
              {clientName ? clientName.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{clientName || "Demo Client"}</h4>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{clientEmail}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-xs min-w-0">
          <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wider block mb-1">Total Outstanding Amount</span>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
            ₹{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">{dueInvoices.length} pending billing request{dueInvoices.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-xs sm:col-span-2 lg:col-span-1 min-w-0">
          <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">Total Paid Amount</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
            ₹{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">{paidInvoices.length} successful payment{paidInvoices.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Due Payments Section */}
      <div className="space-y-3.5 sm:space-y-4 w-full max-w-full min-w-0">
        <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#2563EB] shrink-0" />
          <span>Due Payments</span>
        </h3>

        {dueInvoices.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl py-10 sm:py-12 px-4 text-center shadow-xs space-y-2 w-full">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">No Due Invoices</h4>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Excellent! You are all caught up on your legal fee payments.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (Visible >= 768px) */}
            <div className="hidden md:block w-full rounded-2xl border border-[#E2E8F0] min-w-0 overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-xs md:text-sm table-fixed divide-y divide-[#E2E8F0]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="p-2.5 sm:p-3 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[10%]">Invoice ID</th>
                    <th className="p-2.5 sm:p-3 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[26%]">Client ID</th>
                    <th className="p-2.5 sm:p-3 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[14%]">Date</th>
                    <th className="p-2.5 sm:p-3 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[18%]">Grand Total</th>
                    <th className="p-2.5 sm:p-3 text-center text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[14%]">Status</th>
                    <th className="p-2.5 sm:p-3 text-right text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[18%]">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {paginatedDueInvoices.map((inv) => {
                    const statusInfo = getInvoiceStatusInfo(inv);
                    return (
                      <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-2.5 sm:p-3 font-mono font-bold text-[#0F172A] whitespace-nowrap align-middle">#{inv.id}</td>
                        <td className="p-2.5 sm:p-3 font-bold text-slate-800 break-words align-middle">{inv.client_id || inv.case_number || "General Consultation"}</td>
                        <td className="p-2.5 sm:p-3 text-slate-500 font-semibold whitespace-nowrap align-middle">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="p-2.5 sm:p-3 font-extrabold text-[#0F172A] whitespace-nowrap align-middle">₹{inv.grand_total.toFixed(2)}</td>
                        <td className="p-2.5 sm:p-3 align-middle text-center overflow-hidden">
                          <span
                            className={`inline-flex items-center justify-center text-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase border whitespace-nowrap ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-2.5 sm:p-3 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadInvoicePDF(inv)}
                              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
                              title="Download Invoice PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {perms.add ? (
                              <button
                                type="button"
                                onClick={() => handlePaymentSubmit(inv)}
                                className="px-3 py-1 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-extrabold transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Pay Now
                              </button>
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap shrink-0">
                                🔒 Restricted
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (Visible < 768px) */}
            <div className="block md:hidden space-y-3 w-full max-w-full min-w-0">
              {paginatedDueInvoices.map((inv) => {
                const statusInfo = getInvoiceStatusInfo(inv);
                return (
                  <div key={inv.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3 shadow-xs min-w-0">
                    <div className="flex items-start justify-between gap-2 border-b border-[#F1F5F9] pb-2.5">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice #{inv.id}</span>
                        <h4 className="font-extrabold text-xs text-[#0F172A] truncate mt-0.5">{inv.case_number || "General Consultation"}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border shrink-0 ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-1">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date</span>
                        <span className="font-semibold text-slate-700">{new Date(inv.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total</span>
                        <span className="font-black text-sm text-[#0F172A]">₹{inv.grand_total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9]">
                      <button
                        onClick={() => handleDownloadInvoicePDF(inv)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Download size={13} /> Invoice PDF
                      </button>
                      {perms.add ? (
                        <button
                          type="button"
                          onClick={() => handlePaymentSubmit(inv)}
                          className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold">
                          🔒 Restricted
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Bar for Due Payments */}
            {dueInvoices.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0] w-full min-w-0">
                <p className="text-xs font-medium text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{dueStartIndex + 1}</span> to{" "}
                  <span className="font-bold text-[#0F172A]">{dueEndIndex}</span> of{" "}
                  <span className="font-bold text-[#0F172A]">{dueInvoices.length}</span> entries
                </p>

                {dueTotalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDuePage((prev) => Math.max(prev - 1, 1))}
                      disabled={activeDuePage === 1}
                      className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: dueTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setDuePage(page)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeDuePage === page
                              ? "bg-[#2563EB] text-white shadow-xs"
                              : "text-[#64748B] hover:bg-slate-100 border border-transparent"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setDuePage((prev) => Math.min(prev + 1, dueTotalPages))}
                      disabled={activeDuePage === dueTotalPages}
                      className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment History Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 w-full max-w-full min-w-0">
        <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Payment History</span>
        </h3>

        {paidInvoices.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs sm:text-sm font-semibold">
            No completed payments recorded.
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (Visible >= 768px) */}
            <div className="hidden md:block w-full rounded-2xl border border-[#E2E8F0] min-w-0 overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-xs md:text-sm table-fixed divide-y divide-[#E2E8F0]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="p-2.5 sm:p-3 md:p-4 text-left text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[15%]">Invoice ID</th>
                    <th className="p-2.5 sm:p-3 md:p-4 text-left text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[28%]">Client ID</th>
                    <th className="p-2.5 sm:p-3 md:p-4 text-left text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[20%]">Payment Date</th>
                    <th className="p-2.5 sm:p-3 md:p-4 text-right text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[15%]">Amount</th>
                    <th className="p-2.5 sm:p-3 md:p-4 text-center text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[12%]">Status</th>
                    <th className="p-2.5 sm:p-3 md:p-4 text-center text-[10.5px] md:text-xs font-bold text-[#64748B] uppercase tracking-wider w-[10%]">Receipt</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {paginatedPaidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-2.5 sm:p-3 md:p-4 font-mono font-bold text-[#0F172A] whitespace-nowrap align-top">#{inv.id}</td>
                      <td className="p-2.5 sm:p-3 md:p-4 font-bold text-slate-800 break-words align-top">{inv.client_id || inv.case_number || "Consultation"}</td>
                      <td className="p-2.5 sm:p-3 md:p-4 text-slate-500 font-semibold whitespace-nowrap align-top">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="p-2.5 sm:p-3 md:p-4 text-right font-extrabold text-[#0F172A] whitespace-nowrap align-top">₹{inv.grand_total.toFixed(2)}</td>
                      <td className="p-2.5 sm:p-3 md:p-4 text-center align-top overflow-hidden">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase whitespace-nowrap">
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-2.5 sm:p-3 md:p-4 text-center align-top">
                        <button
                          onClick={() => handleDownloadInvoicePDF(inv)}
                          className="text-[#2563EB] hover:text-[#1d4ed8] p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Download Receipt PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (Visible < 768px) */}
            <div className="block md:hidden space-y-3 w-full max-w-full min-w-0">
              {paginatedPaidInvoices.map((inv) => (
                <div key={inv.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 space-y-2.5 shadow-xs min-w-0">
                  <div className="flex items-start justify-between gap-2 border-b border-[#F1F5F9] pb-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice #{inv.id}</span>
                      <h4 className="font-extrabold text-xs text-[#0F172A] truncate mt-0.5">{inv.case_number || "Consultation"}</h4>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase shrink-0">
                      {inv.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-500 font-semibold">Date: {new Date(inv.created_at).toLocaleDateString()}</span>
                    <span className="font-black text-sm text-emerald-600">₹{inv.grand_total.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9] flex justify-end">
                    <button
                      onClick={() => handleDownloadInvoicePDF(inv)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-[#2563EB] bg-blue-50/60 hover:bg-blue-100 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download size={13} /> Download Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Bar for Payment History */}
            {paidInvoices.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0] w-full min-w-0">
                <p className="text-xs font-medium text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{historyStartIndex + 1}</span> to{" "}
                  <span className="font-bold text-[#0F172A]">{historyEndIndex}</span> of{" "}
                  <span className="font-bold text-[#0F172A]">{paidInvoices.length}</span> entries
                </p>

                {historyTotalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                      disabled={activeHistoryPage === 1}
                      className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setHistoryPage(page)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeHistoryPage === page
                              ? "bg-[#2563EB] text-white shadow-xs"
                              : "text-[#64748B] hover:bg-slate-100 border border-transparent"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages))}
                      disabled={activeHistoryPage === historyTotalPages}
                      className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}