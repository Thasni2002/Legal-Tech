"use client";

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
  Globe
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

 
    setClientEmail(user.email);
  
    const namePart = user.email.split("@")[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    setClientName(formattedName);
  }, []);

  // Fetch invoices for active client
  const fetchInvoices = async () => {
    if (!clientEmail) return;
    try {
      const res = await fetch(`http://localhost:8000/finance/invoices?email=${encodeURIComponent(clientEmail)}`);
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
    // Create Razorpay order
    const orderRes = await fetch(
      "http://localhost:8000/finance/payment/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Invoice.grand_total,
          invoice_id:Invoice.id,
        }),
      }
    );

    const orderData = await orderRes.json();

    const options = {
      key: "rzp_test_your_key_id",
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Legal Tech",
      description: `Invoice Payment #${Invoice.id}`,
      order_id: orderData.id,

      handler: async function (response) {
        // Verify payment
        const verifyRes = await fetch(
          "http://localhost:8000/finance/payment/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoice_id: Invoice.id,
            }),
          }
        );

        const verifyData = await verifyRes.json();

        if (verifyRes.ok && verifyData.success) {
          setPaymentSuccess(true);
          setShowPaymentModal(false);
          fetchInvoices();
        } else {
          alert("Payment verification failed");
        }
      },

      prefill: {
        name: Invoice.client_name,
        email: Invoice.email,
        contact: Invoice.mobile_number,
      },

      theme: {
        color: "#2563EB",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

    setIsProcessing(false);
  } catch (error) {
    console.error("Payment error:", error);
    setIsProcessing(false);
  }
};
  // PDF Generator for Receipt / Invoice
  const handleDownloadInvoicePDF = (inv) => {
    const doc = new jsPDF();

    // Primary Blue Color Banner Header Block
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(inv.status.toLowerCase() === "paid" ? "PAYMENT RECEIPT" : "INVOICE DUE", 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice #${inv.id}  |  Date: ${new Date(inv.created_at).toLocaleDateString()}`, 148, 20, { align: "right" });

    // Client Details
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Client Details", 20, 45);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Name: ${inv.client_name || "N/A"}`, 20, 57);
    doc.text(`Case No: ${inv.case_number || "N/A"}`, 20, 65);
    doc.text(`Mobile: ${inv.mobile_number || "N/A"}`, 110, 57);
    doc.text(`Email: ${inv.email || "N/A"}`, 110, 65);

    // Fee Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Itemized Fee Breakdown", 20, 80);
    doc.line(20, 83, 190, 83);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 88, 170, 8, "F");
    doc.setFontSize(10);
    doc.text("Description", 25, 93);
    doc.text("Details", 95, 93);
    doc.text("Amount", 165, 93);
    doc.line(20, 96, 190, 96);
    doc.setFont("helvetica", "normal");

    let y = 104;
    const rows = [
      [`Court Fee (${inv.court_fee_case_type || "N/A"})`, inv.court_fee_jurisdiction || "N/A", inv.court_fee_amount],
      [`Stamp Duty (${inv.stamp_duty_doc_type || "N/A"})`, inv.stamp_duty_state || "N/A", inv.stamp_duty_amount],
      [`Advocate Fee (${inv.advocate_fee_case_type || "N/A"})`, inv.advocate_fee_remarks || "N/A", inv.advocate_fee_amount],
      ["Paper Filing", `${inv.filing_cost_pages || 0} pages`, inv.filing_cost_amount],
    ];

    rows.forEach(([name, detail, amount]) => {
      doc.setFontSize(10);
      doc.text(name, 25, y);
      doc.text(detail, 95, y);
      doc.text(`Rs. ${Number(amount || 0).toFixed(2)}`, 165, y);
      y += 8;
    });

    // Totals section
    doc.line(20, y, 190, y); y += 8;
    doc.setFontSize(10);
    doc.text("Subtotal:", 130, y);
    doc.text(`Rs. ${Number(inv.subtotal || 0).toFixed(2)}`, 165, y); y += 7;
    doc.text("GST (18%):", 130, y);
    doc.text(`Rs. ${Number(inv.gst || 0).toFixed(2)}`, 165, y); y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Grand Total:", 130, y);
    doc.text(`Rs. ${Number(inv.grand_total || 0).toFixed(2)}`, 165, y);

    // Payment Status badge
    y += 10;
    const statusColor = inv.status.toLowerCase() === "paid" ? [22, 163, 74] : [217, 119, 6];
    doc.setFillColor(...statusColor);
    doc.roundedRect(130, y - 4, 50, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Status: ${inv.status.toUpperCase()}`, 155, y + 0.5, { align: "center" });

    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("This document is a computer-generated transaction copy.", 20, 275);
    doc.text("Thank you for your timely payment.", 20, 281);

    doc.save(`Invoice_${inv.id}_${inv.client_name || "Record"}.pdf`);
  };

  // Filter due vs paid invoices
  const dueInvoices = invoices.filter(
    (inv) => inv.status.toLowerCase() === "sent" || inv.status.toLowerCase() === "overdue"
  );
  const paidInvoices = invoices.filter(
    (inv) => inv.status.toLowerCase() === "paid"
  );

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.grand_total, 0);
  const totalDue = dueInvoices.reduce((sum, inv) => sum + inv.grand_total, 0);

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
  }

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Payments
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          View, download, and pay outstanding fee invoices
        </p>
      </div>

      {/* Success Notification */}
      {paymentSuccess && (
        <div className="bg-emerald-50 border border-emerald-500 text-emerald-700 px-4 py-3.5 rounded-lg flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="font-medium">Payment completed successfully! The invoice record has been updated and a receipt generated.</span>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
          <span className="text-sm font-medium text-[#64748B]">Active Account</span>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              {clientName ? clientName.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{clientName || "Demo Client"}</h4>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">{clientEmail}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
          <span className="text-sm font-medium text-[#EF4444]">Total Outstanding Amount</span>
          <h3 className="text-2xl font-bold text-red-600 mt-1.5">
            ₹{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{dueInvoices.length} pending billing request{dueInvoices.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
          <span className="text-sm font-medium text-[#16A34A]">Total Paid Amount</span>
          <h3 className="text-2xl font-bold text-[#16A34A] mt-1.5">
            ₹{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{paidInvoices.length} successful payment{paidInvoices.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Due Payments Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <span>Due Payments</span>
        </h3>

        {dueInvoices.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl py-12 px-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-700 text-lg">No Due Invoices</h4>
            <p className="text-slate-400 text-sm mt-1">Excellent! You are all caught up on your legal fee payments.</p>
          </div>
        ) : (
    <div className="overflow-x-auto bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
  <table className="w-full border-collapse text-left text-sm">
    <thead>
      <tr className="bg-slate-50 border-b border-[#E2E8F0] text-slate-600 text-xs font-semibold uppercase">
        <th className="p-4">Invoice ID</th>
        <th className="p-4">Case ID</th>
        <th className="p-4">Date</th>
        <th className="p-4">Subtotal</th>
        <th className="p-4">GST</th>
        <th className="p-4">Grand Total</th>
        <th className="p-4">Status</th>
        <th className="p-4 text-center">Actions</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-slate-100">
      {dueInvoices.map((inv) => (
        <tr key={inv.id} className="hover:bg-slate-50">
          <td className="p-4 font-medium">#{inv.id}</td>

          <td className="p-4">
            {inv.case_number || "General Consultation"}
          </td>

          <td className="p-4">
            {new Date(inv.created_at).toLocaleDateString()}
          </td>

          <td className="p-4">₹{inv.subtotal}</td>

          <td className="p-4">₹{inv.gst}</td>

          <td className="p-4 font-bold text-slate-900">
            ₹{inv.grand_total.toFixed(2)}
          </td>

          <td className="p-4">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                inv.status.toLowerCase() === "overdue"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {inv.status}
            </span>
          </td>

          <td className="p-4">
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleDownloadInvoicePDF(inv)}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
              </button>

              {perms.add ? (
                <button
                type="button"
                 onClick={() => handlePaymentSubmit(inv)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Pay Now
                </button>
              ) : (
                <span className="px-3 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-semibold flex items-center gap-1">
                  🔒 Restricted
                </span>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        )}
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span>Payment History</span>
        </h3>

        {paidInvoices.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No completed payments recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0] text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3">#Invoice ID</th>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Receipt</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paidInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-mono text-xs text-slate-500">#{inv.id}</td>
                    <td className="p-3 font-semibold text-slate-800">{inv.case_number || "Consultation"}</td>
                    <td className="p-3 text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{inv.grand_total.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDownloadInvoicePDF(inv)}
                        className="text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Download Receipt PDF"
                      >
                        <Download className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      
    </div>
  );
}