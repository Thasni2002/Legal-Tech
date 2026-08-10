import jsPDF from "jspdf";

export function generateProfessionalInvoicePDF(inv) {
  const doc = new jsPDF();
  const isPaid = inv.status?.toLowerCase() === "paid";
  const isOverdue = inv.status?.toLowerCase() === "overdue";

  // Palette Definitions
  const primaryColor = [15, 23, 42]; // Slate-900 / Dark Navy
  const brandBlue = [37, 99, 235]; // Royal Blue
  const accentGray = [248, 250, 252]; // Soft Gray Fill
  const borderColor = [226, 232, 240]; // Slate-200
  const textDark = [15, 23, 42];
  const textMuted = [100, 116, 139];

  // 1. Top Header Accent Line
  doc.setFillColor(...brandBlue);
  doc.rect(0, 0, 210, 5, "F");

  // 2. Firm Branding & Invoice Title Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text("LEGAL TECH SOLUTIONS", 20, 22);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("Legal Chambers & Practice Management", 20, 27);
  doc.text("Official Tax Invoice & Payment Receipt Record", 20, 32);

  // Document Title (Right Aligned Header)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...(isPaid ? [22, 163, 74] : brandBlue));
  doc.text(isPaid ? "PAYMENT RECEIPT" : "TAX INVOICE", 190, 22, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...textDark);
  doc.text(`Invoice #${inv.id}`, 190, 28, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  const createdDate = inv.created_at ? new Date(inv.created_at) : new Date();
  doc.text(`Date: ${createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 190, 33, { align: "right" });

  // Divider Line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // 3. Client & Invoice Metadata Section (Structured Cards)
  // Left Box: Billed To
  doc.setFillColor(...accentGray);
  doc.roundedRect(20, 44, 82, 38, 3, 3, "F");
  doc.setDrawColor(...borderColor);
  doc.roundedRect(20, 44, 82, 38, 3, 3, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...brandBlue);
  doc.text("BILLED TO", 26, 52);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...textDark);
  doc.text(inv.client_name || "Valued Client", 26, 59);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  if (inv.case_number) doc.text(`Case No: ${inv.case_number}`, 26, 65);
  if (inv.mobile_number) doc.text(`Phone: ${inv.mobile_number}`, 26, 71);
  if (inv.email) doc.text(`Email: ${inv.email}`, 26, 77);

  // Right Box: Invoice Summary
  doc.setFillColor(...accentGray);
  doc.roundedRect(108, 44, 82, 38, 3, 3, "F");
  doc.setDrawColor(...borderColor);
  doc.roundedRect(108, 44, 82, 38, 3, 3, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...brandBlue);
  doc.text("INVOICE SUMMARY", 114, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text(`Invoice Ref: #INV-${inv.id}`, 114, 59);
  doc.text(`Status:`, 114, 66);

  // Status Badge calculation (7 days overdue check)
  const createdMs = inv.created_at ? new Date(inv.created_at).getTime() : Date.now();
  const diffDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);
  const isAutoOverdue = !isPaid && (diffDays >= 7 || isOverdue);

  const statusColor = isPaid
    ? [22, 163, 74]
    : isAutoOverdue
    ? [220, 38, 38]
    : [217, 119, 6];
  const statusText = isPaid ? "PAID" : isAutoOverdue ? "OVERDUE" : "PENDING";

  doc.setFillColor(...statusColor);
  doc.roundedRect(127, 62.5, 26, 5, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, 140, 66, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text(`Payment Gateway: Razorpay / Online`, 114, 74);

  // 4. Line Items Table (Clean 2-Column Format: Description | Amount)
  let y = 90;

  // Table Header Box
  doc.setFillColor(...brandBlue);
  doc.rect(20, y, 170, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION", 26, y + 6);
  doc.text("AMOUNT (INR)", 184, y + 6, { align: "right" });

  y += 9;

  // Build clean line items — excluding zero or N/A items
  const items = [];

  // Advocate / Legal Fee
  const advocateFee = Number(inv.advocate_fee_amount || 0);
  const subtotalAmt = Number(inv.subtotal || 0);
  if (advocateFee > 0) {
    items.push({
      desc: "Legal Counsel & Professional Services Fee",
      amount: advocateFee,
    });
  } else if (subtotalAmt > 0) {
    items.push({
      desc: "Legal Counsel & Professional Services Fee",
      amount: subtotalAmt,
    });
  }

  // Court Fee (only if > 0)
  const courtFee = Number(inv.court_fee_amount || 0);
  if (courtFee > 0) {
    items.push({
      desc: `Court Fee Charges${inv.court_fee_case_type ? ` (${inv.court_fee_case_type})` : ""}`,
      amount: courtFee,
    });
  }

  // Stamp Duty (only if > 0)
  const stampDuty = Number(inv.stamp_duty_amount || 0);
  if (stampDuty > 0) {
    items.push({
      desc: `Stamp Duty Charges${inv.stamp_duty_doc_type ? ` (${inv.stamp_duty_doc_type})` : ""}`,
      amount: stampDuty,
    });
  }

  // Paper Filing (only if > 0)
  const filingCost = Number(inv.filing_cost_amount || 0);
  if (filingCost > 0) {
    items.push({
      desc: `Paper Documentation & Filing Charges (${inv.filing_cost_pages || 0} pages)`,
      amount: filingCost,
    });
  }

  // Fallback if array ended up empty
  if (items.length === 0) {
    items.push({
      desc: "Professional Legal Counsel & Consultation Fee",
      amount: subtotalAmt || 0,
    });
  }

  // Render Table Rows
  items.forEach((item, index) => {
    // Zebra background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(...accentGray);
    }
    doc.rect(20, y, 170, 9, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text(item.desc, 26, y + 6);
    doc.text(`Rs. ${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 184, y + 6, { align: "right" });

    // Row Bottom Divider
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(20, y + 9, 190, y + 9);

    y += 9;
  });

  // 5. Totals & Tax Summary Block (Right-aligned Box)
  y += 6;
  const subtotal = Number(inv.subtotal || 0);
  const gst = Number(inv.gst || 0);
  const grandTotal = Number(inv.grand_total || 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text("Subtotal:", 130, y);
  doc.setTextColor(...textDark);
  doc.text(`Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 184, y, { align: "right" });

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("GST (18%):", 130, y);
  doc.setTextColor(...textDark);
  doc.text(`Rs. ${gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 184, y, { align: "right" });

  y += 4;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.line(125, y, 190, y);

  y += 6;
  // Grand Total Highlight Box
  doc.setFillColor(...brandBlue);
  doc.roundedRect(125, y - 4.5, 65, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Grand Total:", 130, y + 1.5);
  doc.text(`Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 185, y + 1.5, { align: "right" });

  // 6. Terms, Notes & Authorized Signatory Footer
  let footerY = 238;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(20, footerY, 190, footerY);

  footerY += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandBlue);
  doc.text("TERMS & PAYMENT NOTES", 20, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text("1. All payments are non-refundable once professional legal services are rendered.", 20, footerY + 5);
  doc.text("2. Please quote Invoice Ref number in all future payment correspondences.", 20, footerY + 10);
  doc.text("3. Applicable Goods & Services Tax (GST) is calculated at standard statutory 18% rate.", 20, footerY + 15);

  // Authorized Signatory Block (Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("LEGAL TECH SOLUTIONS", 190, footerY + 5, { align: "right" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text("Authorized Electronic Signatory", 190, footerY + 11, { align: "right" });

  // Bottom Notice
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("This document is an official computer-generated transaction record.", 105, 280, { align: "center" });

  return doc;
}
