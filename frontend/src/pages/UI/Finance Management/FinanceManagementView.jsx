"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import jsPDF from "jspdf";
import InvoiceHistoryView from "./InvoiceHistoryView";

export default function CourtFeeCalView() {
  const [savedCalculations, setSavedCalculations] = useState([]);

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

  const total =
    Number(courtFee || 0) +
    Number(stampDuty || 0) +
    Number(advocateFee || 0) +
    Number(filingCost || 0);

  // Fetch data from FastAPI backend
  const fetchInvoicesAndStats = async () => {
    try {
      const resInvoices = await fetch("http://localhost:8000/finance/invoices");
      if (resInvoices.ok) {
        const data = await resInvoices.json();
        setInvoices(data);
      }
      const resStats = await fetch("http://localhost:8000/finance/stats");
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data);
      }
      const resClients = await fetch("http://localhost:8000/finance/clients");
      if (resClients.ok) {
        const data = await resClients.json();
        setClients(data);
      }
    } catch (err) {
      console.error("Error fetching finance data:", err);
    }
  };

  useEffect(() => {
    fetchInvoicesAndStats();
  }, []);
  const handleGenerateInvoice = async () => {
    if (!clientName) {
      alert("Please select a client first.");
      return;
    }

    try {
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
        status: "Sent"
      };

      const res = await fetch("http://localhost:8000/finance/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`Invoice generated and sent successfully to ${clientName}!`);

        // Clear all inputs
        setCourtFeeCaseType("");
        setCourtFee("");
        setCourtFeeJurisdiction("");
        setStampDutyDocType("");
        setStampDuty("");
        setStampDutyState("");
        setAdvocateFeeCaseType("");
        setAdvocateFee("");
        setAdvocateFeeRemarks("");
        setFilingCostPages("");
        setFilingCost("");
        setFilingCostNotes("");
        setClientName("");
        setCaseNumber("");
        setMobileNumber("");
        setEmail("");
        setSearchTerm("");

        fetchInvoicesAndStats();
      } else {
        alert("Failed to generate invoice.");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Error generating invoice.");
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
      const res = await fetch(`http://localhost:8000/finance/invoices/${invoiceId}/status`, {
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
      const res = await fetch(`http://localhost:8000/finance/invoices/${invoiceId}`, {
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
      ["Paper Filing", `${inv.paper_filing_pages || 0} pages`, inv.paper_filing_cost],
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
    doc.text(`Rs. ${Number(inv.gst_amount || 0).toFixed(2)}`, 165, y); y += 7;
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
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Finance Management
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Monitor revenue, invoices and financial records
        </p>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium text-[#64748B]">Total Invoiced</span>
            <h3 className="text-2xl font-bold text-[#0F172A] mt-1">
              ₹{stats.total_invoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="text-xs text-[#64748B] mt-2">Overall calculations generated</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium text-[#16A34A]">Total Paid</span>
            <h3 className="text-2xl font-bold text-[#16A34A] mt-1">
              ₹{stats.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="text-xs text-[#64748B] mt-2">Payments received successfully</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium text-[#F59E0B]">Pending Payments</span>
            <h3 className="text-2xl font-bold text-[#F59E0B] mt-1">
              ₹{stats.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="text-xs text-[#64748B] mt-2">Awaiting client payment</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium text-[#EF4444]">Overdue Payments</span>
            <h3 className="text-2xl font-bold text-[#EF4444] mt-1">
              ₹{stats.total_overdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="text-xs text-[#64748B] mt-2">Overdue billing records</div>
        </div>
      </div>

      {/* Client Details */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <h3 className="font-bold text-lg mb-4">
          Client Details
        </h3>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Searchable Client Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Type Client Name"
              value={searchTerm}
              onChange={(e) => handleClientSearch(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            {showDropdown && filteredClients.length > 0 && (
              <div className="absolute w-full bg-white border border-[#E2E8F0] rounded-lg mt-1 max-h-48 overflow-y-auto z-50 shadow-md">
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
                    className="p-2 cursor-pointer hover:bg-gray-100"
                  >
                    {client.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Case Number */}
          <input
            type="text"
            placeholder="Case Number"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            className="border border-[#E2E8F0] rounded-lg p-2"
          />

          {/* Mobile Number */}
          <input
            type="text"
            placeholder="Mobile Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            className="border border-[#E2E8F0] rounded-lg p-2"
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            readOnly
            className="border border-[#E2E8F0] rounded-lg p-2 bg-[#F1F5F9] text-[#64748B]"
          />
        </div>
      </div>

      {/* Calculator Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Court Fee */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h3 className="font-semibold text-[#2563EB] mb-4">
            Court Fee Calculator
          </h3>

          <div className="space-y-3">
            <select
              value={courtFeeCaseType}
              onChange={(e) => setCourtFeeCaseType(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm bg-white"
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
              placeholder="Court Fee Amount"
              value={courtFee}
              onChange={(e) => setCourtFee(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            />

            <select
              value={courtFeeJurisdiction}
              onChange={(e) => setCourtFeeJurisdiction(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            >
              <option value="">Select Court Jurisdiction</option>
              <option value="District Court">District Court</option>
              <option value="High Court">High Court</option>
              <option value="Supreme Court">Supreme Court</option>
              <option value="Family Court">Family Court</option>
              <option value="Consumer Court">Consumer Court</option>
              <option value="Sessions Court">Sessions Court</option>
              <option value="Labour Court">Labour Court</option>
              <option value="Tribunal">Tribunal</option>
            </select>
          </div>

          <div className="mt-4 font-bold text-[#2563EB]">
            Court Fee: ₹{courtFee || 0}
          </div>
        </div>

        {/* Stamp Duty */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h3 className="font-semibold text-[#16A34A] mb-4">
            Stamp Duty Calculator
          </h3>

          <div className="space-y-3">
            <select
              value={stampDutyDocType}
              onChange={(e) => setStampDutyDocType(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm bg-white"
            >
              <option value="">Select Document Type</option>
              <option value="Sale Deed">Sale Deed</option>
              <option value="Gift Deed">Gift Deed</option>
              <option value="Lease Agreement">Lease Agreement</option>
              <option value="Power of Attorney">Power of Attorney</option>
              <option value="Mortgage Deed">Mortgage Deed</option>
              <option value="Partnership Deed">Partnership Deed</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="number"
              placeholder="Stamp Duty Amount"
              value={stampDuty}
              onChange={(e) => setStampDuty(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            />

            <input
              type="text"
              placeholder="State"
              value={stampDutyState}
              onChange={(e) => setStampDutyState(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            />
          </div>

          <div className="mt-4 font-bold text-[#16A34A]">
            Stamp Duty: ₹{stampDuty || 0}
          </div>
        </div>

        {/* Advocate Fee */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h3 className="font-semibold text-[#D97706] mb-4">
            Advocate Fee
          </h3>

          <div className="space-y-3">
            <select
              value={advocateFeeCaseType}
              onChange={(e) => setAdvocateFeeCaseType(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm bg-white"
            >
              <option value="">Select Case Type</option>
              <option value="Consultation / Advice">Consultation / Advice</option>
              <option value="Drafting & Filing">Drafting & Filing</option>
              <option value="Trial Representation">Trial Representation</option>
              <option value="Appeals">Appeals</option>
              <option value="Arbitration & Mediation">Arbitration & Mediation</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="number"
              placeholder="Advocate Fee Amount"
              value={advocateFee}
              onChange={(e) => setAdvocateFee(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            />

            <input
              type="text"
              placeholder="Remarks"
              value={advocateFeeRemarks}
              onChange={(e) => setAdvocateFeeRemarks(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            />
          </div>

          <div className="mt-4 font-bold text-[#D97706]">
            Advocate Fee: ₹{advocateFee || 0}
          </div>
        </div>

        {/* Paper Filing */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h3 className="font-semibold text-[#F59E0B] mb-4">
            Paper Filing
          </h3>

          <div className="space-y-3">
            <input
              type="number"
              placeholder="Pages"
              value={filingCostPages}
              onChange={(e) => setFilingCostPages(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            />

            <input
              type="number"
              placeholder="Filing Cost"
              value={filingCost}
              onChange={(e) => setFilingCost(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            />

            <input
              type="text"
              placeholder="Notes"
              value={filingCostNotes}
              onChange={(e) => setFilingCostNotes(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm"
            />
          </div>

          <div className="mt-4 font-bold text-[#F59E0B]">
            Filing Cost: ₹{filingCost || 0}
          </div>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="bg-[#F0FDF4] border border-[#E2E8F0] rounded-xl p-5">
        <h3 className="font-bold text-lg mb-4">
          Billing Summary
        </h3>

        {/* Client Information */}
        <div className="mb-5 pb-4 border-b border-[#E2E8F0]">
          <h4 className="font-semibold mb-3">
            Client Information
          </h4>

          <div className="flex justify-between py-1">
            <span>Client Name</span>
            <span className="font-medium">{clientName || "-"}</span>
          </div>

          <div className="flex justify-between py-1">
            <span>Case Number</span>
            <span className="font-medium">{caseNumber || "-"}</span>
          </div>

          <div className="flex justify-between py-1">
            <span>Mobile Number</span>
            <span className="font-medium">{mobileNumber || "-"}</span>
          </div>

          <div className="flex justify-between py-1">
            <span>Email</span>
            <span className="font-medium">{email || "-"}</span>
          </div>
        </div>

        {/* Billing Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Court Fee</span>
            <span>₹{courtFee || 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Stamp Duty</span>
            <span>₹{stampDuty || 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Advocate Fee</span>
            <span>₹{advocateFee || 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Paper Filing</span>
            <span>₹{filingCost || 0}</span>
          </div>

          <div className="flex justify-between border-t border-dashed border-[#E2E8F0] pt-2">
            <span>Subtotal</span>
            <span>₹{total}</span>
          </div>

          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span>
              ₹{((total * 18) / 100).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Invoice Status</span>
            <span className="font-medium text-[#F59E0B]">
              Pending
            </span>
          </div>
        </div>

        <hr className="my-4" />

        <div className="flex justify-between font-bold text-xl">
          <span>Grand Total</span>
          <span>
            ₹{(
              Number(total) +
              Number((total * 18) / 100)
            ).toFixed(2)}
          </span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            onClick={handleGenerateInvoice}
            className="px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803d] transition-colors"
          >
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* View Invoices */}
        <div className="bg-white rounded-xl border p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EFF6FF] rounded-full flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <div className="font-semibold text-sm text-[#0F172A]">Invoice History</div>
              <div className="text-xs text-[#64748B]">{invoices.length} record{invoices.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="bg-[#0891B2] text-white px-4 py-2 text-sm rounded-lg hover:bg-[#0e7490] transition-colors shrink-0"
          >
            View
          </button>
        </div>
      </div>
    </div>

  );
}
