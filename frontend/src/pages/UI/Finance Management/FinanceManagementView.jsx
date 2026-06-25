"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  History, Wallet, CheckCircle2, Clock, AlertCircle,
  Search, User, Phone, Mail, FileText, Send,
  Briefcase, Scale, Receipt, Landmark
} from "lucide-react";
import { jsPDF } from "jspdf";
import InvoiceHistoryView from "./InvoiceHistoryView";
import { usePermissions } from "@/utils/usePermissions";


export default function CourtFeeCalView() {
  const { hasPermission } = usePermissions();


  // Dynamic list of invoices and stats from the backend
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    total_invoiced: 0,
    total_paid: 0,
    total_pending: 0,
    total_overdue: 0,
    invoice_count: 0
  });
  const [clients, setClients] = useState([]);

  // Modal states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Client Details state
  const [clientName, setClientName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");

  // Court Fee inputs
  const [courtFeeCaseType, setCourtFeeCaseType] = useState("");
  const [courtFee, setCourtFee] = useState("");
  const [courtFeeJurisdiction, setCourtFeeJurisdiction] = useState("");

  // Stamp Duty inputs
  const [stampDutyDocType, setStampDutyDocType] = useState("");
  const [stampDuty, setStampDuty] = useState("");
  const [stampDutyState, setStampDutyState] = useState("");

  // Advocate Fee inputs
  const [advocateFeeCaseType, setAdvocateFeeCaseType] = useState("");
  const [advocateFee, setAdvocateFee] = useState("");
  const [advocateFeeRemarks, setAdvocateFeeRemarks] = useState("");

  // Paper Filing inputs
  const [filingCostPages, setFilingCostPages] = useState("");
  const [filingCost, setFilingCost] = useState("");
  const [filingCostNotes, setFilingCostNotes] = useState("");


  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("gpay");
  const [gpayNumber, setGpayNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  const total =
    Number(courtFee || 0) +
    Number(stampDuty || 0) +
    Number(advocateFee || 0) +
    Number(filingCost || 0);

  // Fetch data from FastAPI backend
  const fetchInvoicesAndStats = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/finance/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error("FAILED URL: http://127.0.0.1:8000/finance/invoices", err);
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/finance/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("FAILED URL: http://127.0.0.1:8000/finance/stats", err);
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/finance/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("FAILED URL: http://127.0.0.1:8000/finance/clients", err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchInvoicesAndStats();
    });
  }, [fetchInvoicesAndStats]);

  const handleSendPayment = async () => {
    if (!clientName) {
      alert("Please select a client first.");
      return;
    }

    try {
      const grandTotal = (
        Number(total) +
        Number((total * 18) / 100)
      ).toFixed(2);

      const payload = {
        client_name: clientName,
        case_number: caseNumber,
        mobile_number: mobileNumber,
        email: email,

        court_fee_case_type: courtFeeCaseType || "N/A",
        court_fee_amount: Number(courtFee || 0),
        court_fee_jurisdiction: courtFeeJurisdiction || "N/A",

        stamp_duty_doc_type: stampDutyDocType || "N/A",
        stamp_duty_amount: Number(stampDuty || 0),
        stamp_duty_state: stampDutyState || "N/A",

        advocate_fee_case_type: advocateFeeCaseType || "N/A",
        advocate_fee_amount: Number(advocateFee || 0),
        advocate_fee_remarks: advocateFeeRemarks || "N/A",

        filing_cost_pages: Number(filingCostPages || 0),
        filing_cost_amount: Number(filingCost || 0),
        filing_cost_notes: filingCostNotes || "N/A",

        payment_method: paymentMethod,
        gpay_number: gpayNumber,
        upi_id: upiId,

        status: "Sent"
      };

      const res = await fetch("http://127.0.0.1:8000/finance/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedInvoice = await res.json();
        await fetch("http://127.0.0.1:8000/finance/send-payment-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            client_name: clientName,
            amount: grandTotal,
            payment_method: paymentMethod,
            gpay_number: gpayNumber,
            upi_id: upiId,
            payment_link: `http://localhost:3000/client-payments/${savedInvoice.id}`
          })
        });

        setShowSuccessModal(true);
        fetchInvoicesAndStats();
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleClientSearch = (value) => {
    setSearchTerm(value);
    setClientName(value);

    if (value.trim() === "") {
      setFilteredClients([]);
      setShowDropdown(false);
      setEmail("");
      setMobileNumber("");
      return;
    }

    const filtered = clients.filter((client) =>
      client.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredClients(filtered);
    setShowDropdown(true);
  };
  const handleUpdateStatus = async (invoiceId, newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/finance/invoices/${invoiceId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchInvoicesAndStats();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/finance/invoices/${invoiceId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchInvoicesAndStats();
      } else {
        alert("Failed to delete invoice");
      }
    } catch (err) {
      console.error("Error deleting invoice:", err);
    }
  };



  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // 1. Primary Blue Color Banner Header Block
    doc.setFillColor(37, 99, 235); // Blue primary color (#2563EB)
    doc.rect(0, 0, 210, 35, "F");

    // Title inside the blue block
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("INVOICE REPORT", 20, 23);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 150, 23);

    // 2. Client Details section
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Client Information", 20, 50);

    // Light line separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 53, 190, 53);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Name: ${clientName || "N/A"}`, 20, 62);
    doc.text(`Case No: ${caseNumber || "N/A"}`, 20, 70);
    doc.text(`Mobile: ${mobileNumber || "N/A"}`, 110, 62);
    doc.text(`Email: ${email || "N/A"}`, 110, 70);

    // 3. Billing details section header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Fee Details", 20, 85);
    doc.line(20, 88, 190, 88);

    // Table Columns Header
    doc.setFillColor(248, 250, 252); // soft grey
    doc.rect(20, 93, 170, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 25, 98);
    doc.text("Jurisdiction / Remarks", 95, 98);
    doc.text("Amount", 165, 98);

    doc.line(20, 101, 190, 101);

    // Table Rows
    doc.setFont("helvetica", "normal");
    let currentY = 108;

    const items = [
      {
        name: `Court Fee (${courtFeeCaseType || "N/A"})`,
        details: courtFeeJurisdiction || "N/A",
        amount: Number(courtFee || 0)
      },
      {
        name: `Stamp Duty (${stampDutyDocType || "N/A"})`,
        details: stampDutyState || "N/A",
        amount: Number(stampDuty || 0)
      },
      {
        name: `Advocate Fee (${advocateFeeCaseType || "N/A"})`,
        details: advocateFeeRemarks || "N/A",
        amount: Number(advocateFee || 0)
      },
      {
        name: "Paper Filing",
        details: filingCostPages ? `${filingCostPages} pages` : "N/A",
        amount: Number(filingCost || 0)
      }
    ];

    items.forEach((item) => {
      doc.text(item.name, 25, currentY);
      doc.text(item.details, 95, currentY);
      doc.text(`Rs. ${item.amount.toFixed(2)}`, 165, currentY);
      currentY += 8;
    });

    // Summary lines
    doc.line(20, currentY, 190, currentY);
    currentY += 8;

    doc.text("Subtotal:", 130, currentY);
    doc.text(`Rs. ${total.toFixed(2)}`, 165, currentY);
    currentY += 8;

    doc.text("GST (18%):", 130, currentY);
    doc.text(`Rs. ${((total * 18) / 100).toFixed(2)}`, 165, currentY);
    currentY += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 130, currentY);
    doc.text(`Rs. ${(Number(total) + Number((total * 18) / 100)).toFixed(2)}`, 165, currentY);

    // 4. Footer info
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("This document is a computer-generated calculation report and does not require a physical signature.", 20, 275);
    doc.text("Thank you for your trust in our services.", 20, 280);

    doc.save(`Invoice_${clientName || "Calculation"}.pdf`);
  };

  // Download PDF for a specific saved invoice from history
  const handleDownloadInvoicePDF = (inv) => {
    const doc = new jsPDF();

    // Header banner - only title and invoice info, no company name
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("INVOICE REPORT", 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice #${inv.id}  |  Date: ${new Date(inv.created_at).toLocaleDateString()}`, 148, 20, { align: "right" });

    // Client Information
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Client Information", 20, 45);
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
    doc.text("Fee Details", 20, 80);
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

    // Payment Status badge — placed below grand total
    y += 10;
    const statusColor = inv.status.toLowerCase() === "paid"
      ? [22, 163, 74]
      : inv.status.toLowerCase() === "overdue"
        ? [220, 38, 38]
        : [217, 119, 6];
    doc.setFillColor(...statusColor);
    doc.roundedRect(130, y - 4, 50, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Status: ${inv.status.toUpperCase()}`, 155, y + 0.5, { align: "center" });

    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("This document is a computer-generated invoice and does not require a physical signature.", 20, 275);
    doc.text("Thank you for your trust in our services.", 20, 281);

    doc.save(`Invoice_${inv.id}_${inv.client_name || "Record"}.pdf`);
  };




  if (isHistoryOpen) {
    return (
      <InvoiceHistoryView
        invoices={invoices}
        handleUpdateStatus={handleUpdateStatus}
        handleDownloadInvoicePDF={handleDownloadInvoicePDF}
        handleDeleteInvoice={handleDeleteInvoice}
        onBack={() => setIsHistoryOpen(false)}
        hasPermission={hasPermission}
      />
    );
  }

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-3xl shadow-xl shadow-slate-900/10 p-8 md:p-10">
        <div className="relative z-10">
          <h1 className="text-white font-extrabold text-3xl md:text-4xl tracking-tight leading-tight">
            Finance Management
          </h1>
          <p className="text-[#94A3B8] mt-2 text-sm md:text-base font-medium max-w-xl">
            Monitor revenue, track invoices, and manage all your financial records in one place.
          </p>
        </div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10 pointer-events-none">
          <Landmark size={200} />
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="group bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Receipt size={20} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-[#64748B] uppercase tracking-wider">Total Invoiced</span>
            </div>
            <h3 className="text-3xl font-extrabold text-[#0F172A]">
              ₹{stats.total_invoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="relative z-10 text-xs font-medium text-[#94A3B8] mt-4">Overall calculations generated</div>
        </div>

        <div className="group bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={20} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Total Paid</span>
            </div>
            <h3 className="text-3xl font-extrabold text-[#0F172A]">
              ₹{stats.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="relative z-10 text-xs font-medium text-[#94A3B8] mt-4">Payments received successfully</div>
        </div>

        <div className="group bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Clock size={20} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">Pending</span>
            </div>
            <h3 className="text-3xl font-extrabold text-[#0F172A]">
              ₹{stats.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="relative z-10 text-xs font-medium text-[#94A3B8] mt-4">Awaiting client payment</div>
        </div>

        <div className="group bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertCircle size={20} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-rose-600 uppercase tracking-wider">Overdue</span>
            </div>
            <h3 className="text-3xl font-extrabold text-[#0F172A]">
              ₹{stats.total_overdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="relative z-10 text-xs font-medium text-[#94A3B8] mt-4">Overdue billing records</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Data Entry */}
        <div className="lg:col-span-2 space-y-8">

          {/* Client Details Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            <h3 className="text-xl font-extrabold text-[#0F172A] mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <User size={16} />
              </div>
              Client Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Searchable Client Input */}
              <div className="relative col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Search Client</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-[#94A3B8]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Type to search existing clients..."
                    value={searchTerm}
                    onChange={(e) => handleClientSearch(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {showDropdown && filteredClients.length > 0 && (
                  <div className="absolute w-full bg-white border border-[#E2E8F0] rounded-xl mt-2 max-h-60 overflow-y-auto z-50 shadow-xl">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => {
                          setClientName(client.name);
                          setSearchTerm(client.name);
                          setEmail(client.email);
                          setMobileNumber(client.mobile || "");
                          setCaseNumber("");
                          setShowDropdown(false);
                        }}
                        className="p-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="font-bold text-[#0F172A]">{client.name}</div>
                        <div className="text-xs text-[#64748B] mt-1">{client.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Case Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase size={16} className="text-[#94A3B8]" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. CR-2023-145"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-[#94A3B8]" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-[#94A3B8]" />
                  </div>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={email}
                    readOnly
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm bg-[#F8FAFC] text-[#64748B] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Court Fee */}
            <div className="bg-gradient-to-br from-blue-50/50 to-transparent border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none text-blue-600">
                <Scale size={48} />
              </div>
              <h3 className="font-extrabold text-blue-700 mb-5 flex items-center gap-2">
                Court Fee
              </h3>
              <div className="space-y-4 relative z-10">
                <select
                  value={courtFeeCaseType}
                  onChange={(e) => setCourtFeeCaseType(e.target.value)}
                  className="w-full border border-blue-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Case Type</option>
                  <option value="Civil Suit">Civil Suit</option>
                  <option value="Criminal Appeal">Criminal Appeal</option>
                  <option value="Writ Petition">Writ Petition</option>
                  <option value="Family Dispute">Family Dispute</option>
                  <option value="Corporate/Commercial Case">Corporate/Commercial Case</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={courtFee}
                  onChange={(e) => setCourtFee(e.target.value)}
                  className="w-full border border-blue-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
                <select
                  value={courtFeeJurisdiction}
                  onChange={(e) => setCourtFeeJurisdiction(e.target.value)}
                  className="w-full border border-blue-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Jurisdiction</option>
                  <option value="District Court">District Court</option>
                  <option value="High Court">High Court</option>
                  <option value="Supreme Court">Supreme Court</option>
                  <option value="Family Court">Family Court</option>
                  <option value="Tribunal">Tribunal</option>
                </select>
                <div className="pt-2 font-bold text-blue-700 text-lg">
                  ₹{courtFee || 0}
                </div>
              </div>
            </div>

            {/* Stamp Duty */}
            <div className="bg-gradient-to-br from-emerald-50/50 to-transparent border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none text-emerald-600">
                <FileText size={48} />
              </div>
              <h3 className="font-extrabold text-emerald-700 mb-5 flex items-center gap-2">
                Stamp Duty
              </h3>
              <div className="space-y-4 relative z-10">
                <select
                  value={stampDutyDocType}
                  onChange={(e) => setStampDutyDocType(e.target.value)}
                  className="w-full border border-emerald-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="">Document Type</option>
                  <option value="Sale Deed">Sale Deed</option>
                  <option value="Gift Deed">Gift Deed</option>
                  <option value="Lease Agreement">Lease Agreement</option>
                  <option value="Power of Attorney">Power of Attorney</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={stampDuty}
                  onChange={(e) => setStampDuty(e.target.value)}
                  className="w-full border border-emerald-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={stampDutyState}
                  onChange={(e) => setStampDutyState(e.target.value)}
                  className="w-full border border-emerald-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <div className="pt-2 font-bold text-emerald-700 text-lg">
                  ₹{stampDuty || 0}
                </div>
              </div>
            </div>

            {/* Advocate Fee */}
            <div className="bg-gradient-to-br from-amber-50/50 to-transparent border border-amber-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none text-amber-600">
                <Briefcase size={48} />
              </div>
              <h3 className="font-extrabold text-amber-700 mb-5 flex items-center gap-2">
                Advocate Fee
              </h3>
              <div className="space-y-4 relative z-10">
                <select
                  value={advocateFeeCaseType}
                  onChange={(e) => setAdvocateFeeCaseType(e.target.value)}
                  className="w-full border border-amber-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                >
                  <option value="">Consultation Type</option>
                  <option value="Consultation / Advice">Consultation / Advice</option>
                  <option value="Drafting & Filing">Drafting & Filing</option>
                  <option value="Trial Representation">Trial Representation</option>
                  <option value="Appeals">Appeals</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={advocateFee}
                  onChange={(e) => setAdvocateFee(e.target.value)}
                  className="w-full border border-amber-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Remarks"
                  value={advocateFeeRemarks}
                  onChange={(e) => setAdvocateFeeRemarks(e.target.value)}
                  className="w-full border border-amber-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
                <div className="pt-2 font-bold text-amber-700 text-lg">
                  ₹{advocateFee || 0}
                </div>
              </div>
            </div>

            {/* Paper Filing */}
            <div className="bg-gradient-to-br from-purple-50/50 to-transparent border border-purple-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none text-purple-600">
                <Receipt size={48} />
              </div>
              <h3 className="font-extrabold text-purple-700 mb-5 flex items-center gap-2">
                Paper Filing
              </h3>
              <div className="space-y-4 relative z-10">
                <input
                  type="number"
                  placeholder="Number of Pages"
                  value={filingCostPages}
                  onChange={(e) => setFilingCostPages(e.target.value)}
                  className="w-full border border-purple-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={filingCost}
                  onChange={(e) => setFilingCost(e.target.value)}
                  className="w-full border border-purple-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Notes"
                  value={filingCostNotes}
                  onChange={(e) => setFilingCostNotes(e.target.value)}
                  className="w-full border border-purple-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
                <div className="pt-2 font-bold text-purple-700 text-lg">
                  ₹{filingCost || 0}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Billing Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#0F172A] rounded-3xl p-8 shadow-2xl shadow-slate-900/20 text-white sticky top-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold tracking-tight">Invoice</h3>
              <Receipt size={28} className="text-slate-400" />
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Billed To</p>
                <p className="text-lg font-bold">{clientName || "—"}</p>
                <p className="text-sm text-slate-300">{email || "—"}</p>
                <p className="text-sm text-slate-300">{mobileNumber || "—"}</p>
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Case Number</p>
                <p className="text-sm font-semibold">{caseNumber || "—"}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm border-t border-slate-700/50 pt-6 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Court Fee</span>
                <span className="font-bold">₹{courtFee || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Stamp Duty</span>
                <span className="font-bold">₹{stampDuty || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Advocate Fee</span>
                <span className="font-bold">₹{advocateFee || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Paper Filing</span>
                <span className="font-bold">₹{filingCost || 0}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-700">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-bold">₹{total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">GST (18%)</span>
                <span className="font-bold">₹{((total * 18) / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 -mx-8 px-8 py-6 mb-8 shadow-inner text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Landmark size={80} /></div>
              <p className="text-xs text-blue-200 uppercase tracking-wider font-bold mb-1 relative z-10">Grand Total</p>
              <p className="text-4xl font-black tracking-tight relative z-10">
                ₹{(Number(total) + Number((total * 18) / 100)).toFixed(2)}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm relative z-10">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Pending Payment
              </div>
            </div>

            {hasPermission("Finance Management", "add") && (
              <button
                onClick={handleSendPayment}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#0F172A] font-extrabold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10 group"
              >
                Send Payment Request
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            )}

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                    <History size={16} />
                  </div>
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Invoice History</span>
                </div>
                <div className="bg-slate-700 text-xs font-bold px-2.5 py-1 rounded-full text-slate-300">
                  {invoices.length} records
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-emerald-500/10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#0F172A] mb-2">Success!</h3>
            <p className="text-[#64748B] font-medium mb-8">
              Payment request has been sent successfully to the client.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/20"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
