"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  History, Wallet, CheckCircle2, Clock, AlertCircle,
  Search, User, Phone, Mail, FileText, Send,
  Briefcase, Scale, Receipt, Landmark, Lock
} from "lucide-react";
import { jsPDF } from "jspdf";
import { generateProfessionalInvoicePDF } from "@/utils/generateProfessionalInvoicePDF";
import InvoiceHistoryView from "./InvoiceHistoryView";
import { usePermissions } from "@/utils/usePermissions";
import ConfirmModal from "@/components/common/ConfirmModal";
import { API_BASE_URL } from "@/utils/api";


export default function CourtFeeCalView() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const searchParams = useSearchParams();

  const paramClientName = searchParams ? searchParams.get("client_name") : null;
  const paramCaseNo = searchParams ? searchParams.get("case_no") : null;
  const paramMobile = searchParams ? searchParams.get("mobile") : null;
  const paramEmail = searchParams ? searchParams.get("email") : null;
  const paramCaseType = searchParams ? searchParams.get("case_type") : null;
  const paramFromCase = searchParams ? searchParams.get("from_case") === "true" : false;
  const paramCaseId = searchParams ? searchParams.get("case_id") : null;

  const isLockedFromCase = paramFromCase || Boolean(paramClientName && paramCaseNo);


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
  const [deleteConfirmInvoiceId, setDeleteConfirmInvoiceId] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(false);

  // Client Details state
  const [clientName, setClientName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [clientCases, setClientCases] = useState([]);

  // Advocate Fee inputs
  const [advocateFeeCaseType, setAdvocateFeeCaseType] = useState("");
  const [advocateFee, setAdvocateFee] = useState("");
  const [advocateFeeRemarks, setAdvocateFeeRemarks] = useState("");

  // Court Fee Calculator inputs (19 Indian States & UTs)
  const [selectedState, setSelectedState] = useState("Kerala");
  const [suitValuation, setSuitValuation] = useState("");

  const supportedStatesList = [
    "Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Delhi",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu",
    "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  // Instant Court Fee calculation for all 19 states & UTs
  const calculateCourtFeeForState = (st, valNum) => {
    const val = Math.max(0, Number(valNum || 0));
    if (val <= 0) return 0;

    let fee = 0;
    if (st === "Haryana") {
      if (val <= 15000) fee = val * 0.025;
      else if (val <= 27000) fee = 375 + (val - 15000) * 0.035;
      else if (val <= 39000) fee = 795 + (val - 27000) * 0.045;
      else if (val <= 51000) fee = 1335 + (val - 39000) * 0.055;
      else if (val <= 63000) fee = 1995 + (val - 51000) * 0.065;
      else if (val <= 75000) fee = 2775 + (val - 63000) * 0.075;
      else if (val <= 500000) fee = 3675 + (val - 75000) * 0.065;
      else if (val <= 1000000) fee = 31300 + (val - 500000) * 0.055;
      else if (val <= 2000000) fee = 58800 + (val - 1000000) * 0.045;
      else if (val <= 3000000) fee = 103800 + (val - 2000000) * 0.035;
      else if (val <= 4500000) fee = 138000 + (val - 3000000) * 0.025;
      else if (val <= 6000000) fee = 176300 + (val - 4500000) * 0.015;
      else fee = 198800 + (val - 6000000) * 0.005;
    } else if (st === "Tamil Nadu") {
      if (val <= 5) fee = 0.5;
      else if (val <= 100) fee = 0.5 + 0.5 * Math.ceil((val - 5) / 5);
      else if (val <= 500) fee = 10 + Math.ceil((val - 100) / 10);
      else if (val <= 1000) fee = 50 + 1.5 * Math.ceil((val - 500) / 10);
      else if (val <= 5000) fee = 125 + 12.2 * Math.ceil((val - 1000) / 100);
      else if (val <= 10000) fee = 613 + 24.4 * Math.ceil((val - 5000) / 250);
      else if (val <= 20000) fee = 1101 + 36.5 * Math.ceil((val - 10000) / 500);
      else if (val <= 30000) fee = 1831 + 48.8 * Math.ceil((val - 20000) / 1000);
      else if (val <= 50000) fee = 2319 + 48.8 * Math.ceil((val - 30000) / 2000);
      else fee = 2563 + 48.8 * Math.ceil((val - 50000) / 5000);
    } else if (st === "Andhra Pradesh" || st === "Telangana") {
      if (val <= 100) fee = 0.6 * Math.ceil(val / 5);
      else if (val <= 500) fee = 8 + 0.8 * Math.ceil((val - 100) / 10);
      else if (val <= 1000) fee = 40 + 1.1 * Math.ceil((val - 500) / 10);
      else if (val <= 10000) fee = 111 + 7 * Math.ceil((val - 1000) / 100);
      else if (val <= 20000) fee = 174 + 30 * Math.ceil((val - 10000) / 500);
      else if (val <= 30000) fee = 774 + 40 * Math.ceil((val - 20000) / 1000);
      else if (val <= 50000) fee = 1174 + 60 * Math.ceil((val - 30000) / 2000);
      else if (val <= 100000) fee = 1774 + 80 * Math.ceil((val - 50000) / 4000);
      else fee = 2774 + 100 * Math.ceil((val - 100000) / 10000);
    } else if (st === "Assam") {
      if (val <= 100) fee = 0.55 * Math.ceil(val / 5);
      else if (val <= 150) fee = 11 + 1.95 * Math.ceil((val - 100) / 10);
      else if (val <= 1000) fee = 20.75 + 1.45 * Math.ceil((val - 150) / 10);
      else if (val <= 7500) fee = 144 + 8.25 * Math.ceil((val - 1000) / 100);
      else if (val <= 10000) fee = 680.25 + 16.5 * Math.ceil((val - 7500) / 250);
      else if (val <= 20000) fee = 845.25 + 24.75 * Math.ceil((val - 10000) / 500);
      else if (val <= 50000) fee = 1340.25 + 33 * Math.ceil((val - 20000) / 1000);
      else fee = 2330.25 + 41.25 * Math.ceil((val - 50000) / 5000);
      fee = Math.min(fee, 11000);
    } else if (st === "Bihar" || st === "Jharkhand") {
      if (val < 6) fee = 0;
      else if (val <= 100) fee = Math.ceil(val / 5);
      else if (val <= 1000) fee = 20 + 2 * Math.ceil((val - 100) / 10);
      else if (val <= 5000) fee = 200 + 16 * Math.ceil((val - 1000) / 100);
      else if (val <= 10000) fee = 840 + 32 * Math.ceil((val - 5000) / 250);
      else if (val <= 20000) fee = 1480 + 48 * Math.ceil((val - 10000) / 500);
      else if (val <= 30000) fee = 2440 + 64 * Math.ceil((val - 20000) / 1000);
      else if (val <= 50000) fee = 3080 + 64 * Math.ceil((val - 30000) / 2000);
      else fee = 3720 + 80 * Math.ceil((val - 50000) / 5000);
      fee = Math.min(fee, 50000);
    } else if (st === "Delhi" || st === "Chandigarh" || st === "Himachal Pradesh") {
      if (val <= 100) fee = Math.ceil(val / 5);
      else if (val <= 500) fee = 20 + Math.ceil((val - 100) / 10);
      else if (val <= 1000) fee = 60 + 2 * Math.ceil((val - 500) / 10);
      else if (val <= 5000) fee = 160 + 15 * Math.ceil((val - 1000) / 100);
      else if (val <= 10000) fee = 760 + 25 * Math.ceil((val - 5000) / 250);
      else if (val <= 20000) fee = 1260 + 40 * Math.ceil((val - 10000) / 500);
      else if (val <= 30000) fee = 2060 + 50 * Math.ceil((val - 20000) / 1000);
      else if (val <= 50000) fee = 2560 + 50 * Math.ceil((val - 30000) / 2000);
      else fee = 3060 + 50 * Math.ceil((val - 50000) / 5000);
    } else if (st === "Gujarat") {
      if (val <= 10000) fee = 100 * Math.ceil(val / 1000);
      else if (val <= 15000) fee = 1250;
      else if (val <= 20000) fee = 1500;
      else if (val <= 21000) fee = 1525;
      else if (val <= 30000) fee = 1525 + 75 * Math.ceil((val - 21000) / 1000);
      else if (val <= 34000) fee = 2200 + 175 * Math.ceil((val - 30000) / 2000);
      else if (val <= 50000) fee = 2500 + 150 * Math.ceil((val - 34000) / 2000);
      else if (val <= 75000) fee = 3700 + 300 * Math.ceil((val - 50000) / 5000);
      else if (val <= 100000) fee = 5200 + 150 * Math.ceil((val - 75000) / 5000);
      else if (val <= 1000000) fee = 5950 + 200 * Math.ceil((val - 100000) / 10000);
      else if (val <= 2000000) fee = 23950 + 1200 * Math.ceil((val - 1000000) / 100000);
      else fee = 35950 + 500 * Math.ceil((val - 2000000) / 100000);
      fee = Math.min(fee, 75000);
    } else if (st === "Karnataka") {
      if (val <= 15000) fee = val * 0.025;
      else if (val <= 75000) fee = 375 + (val - 15000) * 0.075;
      else if (val <= 250000) fee = 4875 + (val - 75000) * 0.07;
      else if (val <= 500000) fee = 17125 + (val - 250000) * 0.065;
      else if (val <= 750000) fee = 33375 + (val - 500000) * 0.06;
      else if (val <= 1000000) fee = 48375 + (val - 750000) * 0.055;
      else if (val <= 1500000) fee = 62125 + (val - 1000000) * 0.05;
      else if (val <= 2000000) fee = 87125 + (val - 1500000) * 0.045;
      else if (val <= 2500000) fee = 109625 + (val - 2000000) * 0.04;
      else if (val <= 3000000) fee = 129625 + (val - 2500000) * 0.035;
      else if (val <= 4000000) fee = 147125 + (val - 3000000) * 0.03;
      else if (val <= 5000000) fee = 177125 + (val - 4000000) * 0.025;
      else if (val <= 6000000) fee = 202125 + (val - 5000000) * 0.02;
      else if (val <= 7000000) fee = 222125 + (val - 6000000) * 0.015;
      else if (val <= 8000000) fee = 237125 + (val - 7000000) * 0.01;
      else fee = 247125 + (val - 8000000) / 200;
    } else if (st === "Kerala") {
      if (val <= 100) fee = 4;
      else if (val <= 15000) fee = 4 + 4 * Math.ceil((val - 100) / 100);
      else if (val <= 50000) fee = 600 + 8 * Math.ceil((val - 15000) / 100);
      else if (val <= 1000000) fee = 3400 + 10 * Math.ceil((val - 50000) / 100);
      else if (val <= 10000000) fee = 98400 + 8 * Math.ceil((val - 1000000) / 100);
      else fee = 818400 + Math.ceil((val - 10000000) / 100);
    } else if (st === "Maharashtra") {
      if (val <= 1000) fee = 200;
      else if (val <= 5000) fee = 200 + 12 * Math.ceil((val - 1000) / 100);
      else if (val <= 10000) fee = 680 + 15 * Math.ceil((val - 5000) / 100);
      else if (val <= 20000) fee = 1430 + 75 * Math.ceil((val - 10000) / 500);
      else if (val <= 30000) fee = 2930 + 100 * Math.ceil((val - 20000) / 1000);
      else if (val <= 50000) fee = 3930 + 100 * Math.ceil((val - 30000) / 2000);
      else if (val <= 100000) fee = 4930 + 150 * Math.ceil((val - 50000) / 5000);
      else if (val <= 1100000) fee = 6430 + 200 * Math.ceil((val - 100000) / 10000);
      else if (val <= 23900000) fee = 26430 + 1200 * Math.ceil((val - 1100000) / 100000);
      else fee = 300000;
    } else if (st === "Punjab") {
      if (val <= 10000) fee = val * 0.025;
      else if (val <= 20000) fee = 250 + (val - 10000) * 0.035;
      else if (val <= 30000) fee = 600 + (val - 20000) * 0.045;
      else if (val <= 40000) fee = 1050 + (val - 30000) * 0.055;
      else if (val <= 50000) fee = 1600 + (val - 40000) * 0.065;
      else if (val <= 60000) fee = 2250 + (val - 50000) * 0.075;
      else if (val <= 75000) fee = 3000 + (val - 60000) * 0.065;
      else if (val <= 100000) fee = 3975 + (val - 75000) * 0.055;
      else if (val <= 200000) fee = 5350 + (val - 100000) * 0.035;
      else if (val <= 300000) fee = 8850 + (val - 200000) * 0.0225;
      else fee = 11100 + (val - 300000) * 0.0225;
    } else if (st === "Rajasthan") {
      if (val <= 15000) fee = val * 0.025;
      else if (val <= 75000) fee = 375 + (val - 15000) * 0.075;
      else if (val <= 250000) fee = 4875 + (val - 75000) * 0.07;
      else if (val <= 500000) fee = 17125 + (val - 250000) * 0.065;
      else if (val <= 750000) fee = 33375 + (val - 500000) * 0.06;
      else if (val <= 1000000) fee = 48375 + (val - 750000) * 0.055;
      else if (val <= 1500000) fee = 62125 + (val - 1000000) * 0.05;
      else if (val <= 2000000) fee = 87125 + (val - 1500000) * 0.045;
      else if (val <= 2500000) fee = 109625 + (val - 2000000) * 0.04;
      else if (val <= 3000000) fee = 129625 + (val - 2500000) * 0.035;
      else if (val <= 4000000) fee = 147125 + (val - 3000000) * 0.03;
      else if (val <= 10000000) fee = 177125 + (val - 4000000) * 0.025;
      else if (val <= 15000000) fee = 327125 + (val - 10000000) * 0.02;
      else if (val <= 20000000) fee = 427125 + (val - 15000000) * 0.015;
      else if (val <= 30000000) fee = 502125 + (val - 20000000) * 0.01;
      else fee = 602125 + (val - 30000000) / 200;
    } else if (st === "Uttar Pradesh" || st === "Uttarakhand") {
      if (val <= 100) fee = 0.5 * Math.ceil(val / 5);
      else if (val <= 300) fee = 10 + 1.25 * Math.ceil((val - 100) / 10);
      else if (val <= 500) fee = 35 + 1.5 * Math.ceil((val - 300) / 10);
      else if (val <= 1000) fee = 65 + 2.25 * Math.ceil((val - 500) / 10);
      else if (val <= 5000) fee = 177.5 + 12 * Math.ceil((val - 1000) / 100);
      else if (val <= 10000) fee = 657.5 + 20 * Math.ceil((val - 5000) / 200);
      else fee = 1157.5 + 37.5 * Math.ceil((val - 10000) / 500);
    } else if (st === "West Bengal") {
      if (val <= 1000) fee = 10 * Math.ceil(val / 100);
      else if (val <= 7500) fee = 100 + 8 * Math.ceil((val - 1000) / 250);
      else if (val <= 10000) fee = 620 + 16 * Math.ceil((val - 7500) / 500);
      else if (val <= 20000) fee = 780 + 30 * Math.ceil((val - 10000) / 10);
      else if (val <= 50000) fee = 1380 + 50 * Math.ceil((val - 20000) / 1000);
      else if (val <= 100000) fee = 2880 + 350 * Math.ceil((val - 50000) / 5000);
      else if (val <= 200000) fee = 6380 + 370 * Math.ceil((val - 100000) / 5000);
      else if (val <= 300000) fee = 13780 + 210 * Math.ceil((val - 200000) / 5000);
      else fee = 17980 + 100 * Math.ceil((val - 300000) / 10000);
      fee = Math.min(fee, 50000);
    } else {
      fee = val * 0.025;
    }

    return Math.round(fee * 100) / 100;
  };

  const calculatedCourtFee = calculateCourtFeeForState(selectedState, suitValuation);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("gpay");
  const [gpayNumber, setGpayNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  const total = Number(advocateFee || 0);

  const currentMonthInvoiced = invoices
    .filter((invoice) => {
      if (!invoice.created_at) return false;

      const invoiceDate = new Date(invoice.created_at);
      const today = new Date();

      return (
        invoiceDate.getMonth() === today.getMonth() &&
        invoiceDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, invoice) => sum + Number(invoice.grand_total || 0), 0);

  // Fetch data from FastAPI backend
  const fetchInvoicesAndStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/invoices`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error("FAILED URL:", `${API_BASE_URL}/finance/invoices`, err);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/finance/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("FAILED URL:", `${API_BASE_URL}/finance/stats`, err);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/finance/clients`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("FAILED URL:", `${API_BASE_URL}/finance/clients`, err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchInvoicesAndStats();
    });
  }, [fetchInvoicesAndStats]);

  // Auto-fill client & case information when navigated from Case Management
  useEffect(() => {
    if (paramClientName || paramCaseNo) {
      if (paramClientName) {
        setClientName(paramClientName);
        setSearchTerm(paramClientName);
      }
      if (paramCaseNo) setCaseNumber(paramCaseNo);
      if (paramMobile) setMobileNumber(paramMobile);
      if (paramEmail) setEmail(paramEmail);
      if (paramCaseType) setAdvocateFeeCaseType(paramCaseType);
    }
  }, [paramClientName, paramCaseNo, paramMobile, paramEmail, paramCaseType]);

  const [isSendingPayment, setIsSendingPayment] = useState(false);

  const handleSendPayment = async () => {
    if (!clientName) {
      alert("Please select a client first.");
      return;
    }

    setIsSendingPayment(true);

    try {
      const gst = Number(advocateFee || 0) * 0.18;

      const grandTotal = (
        Number(total) + gst
      ).toFixed(2);

      const payload = {
        client_name: clientName,
        case_number: caseNumber,
        mobile_number: mobileNumber,
        email: email,

        court_fee_case_type: `${selectedState} (Ad-Valorem)`,
        court_fee_amount: Number(calculatedCourtFee || 0),
        court_fee_jurisdiction: selectedState,

        stamp_duty_doc_type: "N/A",
        stamp_duty_amount: 0,
        stamp_duty_state: "N/A",

        advocate_fee_case_type: advocateFeeCaseType || "N/A",
        advocate_fee_amount: Number(advocateFee || 0),
        advocate_fee_remarks: advocateFeeRemarks || "N/A",

        filing_cost_pages: 0,
        filing_cost_amount: 0,
        filing_cost_notes: "N/A",

        payment_method: paymentMethod,
        gpay_number: gpayNumber,
        upi_id: upiId,

        status: "Sent"
      };

      const res = await fetch(`${API_BASE_URL}/finance/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedInvoice = await res.json();

        // 🚀 SHOW SUCCESS MODAL INSTANTLY FOR SPEED
        setShowSuccessModal(true);
        setIsSendingPayment(false);
        fetchInvoicesAndStats();

        // Perform PDF generation, upload, and email sending asynchronously in background
        (async () => {
          let backendPdfPath = null;
          try {
            const doc = generateInvoicePDF(savedInvoice);
            const pdfBlob = doc.output("blob");

            const formData = new FormData();
            formData.append("file", pdfBlob, `invoice_${savedInvoice.id}.pdf`);

            const uploadRes = await fetch(`${API_BASE_URL}/finance/upload-invoice/${savedInvoice.id}`, {
              method: "POST",
              body: formData,
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              backendPdfPath = uploadData.file_path;
            }
          } catch (pdfErr) {
            console.error("Error generating/uploading invoice PDF:", pdfErr);
          }

          if (email) {
            try {
              await fetch(`${API_BASE_URL}/finance/send-payment-email`, {
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
                  payment_link: `${window.location.origin}/client-payments/${savedInvoice.id}`,
                  invoice_pdf_path: backendPdfPath || `invoices/invoice_${savedInvoice.id}.pdf`
                })
              });
            } catch (emailErr) {
              console.error("Error sending payment email:", emailErr);
            }
          }
        })();
      } else {
        setIsSendingPayment(false);
        alert("Failed to create payment request.");
      }
    } catch (error) {
      console.error(error);
      setIsSendingPayment(false);
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
      setClientCases([]);
      setCaseNumber("");
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

  const handleDeleteInvoice = (invoiceId) => {
    setDeleteConfirmInvoiceId(invoiceId);
  };

  const executeDeleteInvoice = async () => {
    if (!deleteConfirmInvoiceId) return;
    setDeletingInvoice(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/finance/invoices/${deleteConfirmInvoiceId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchInvoicesAndStats();
      } else {
        alert("Failed to delete invoice");
      }
    } catch (err) {
      console.error("Error deleting invoice:", err);
    } finally {
      setDeletingInvoice(false);
      setDeleteConfirmInvoiceId(null);
    }
  };


  // PDF Generator for Receipt / Invoice
  const generateInvoicePDF = (inv) => {
    return generateProfessionalInvoicePDF(inv);
  };

  // Download PDF for a specific saved invoice from history
  const handleDownloadInvoicePDF = (inv) => {
    const doc = generateInvoicePDF(inv);
    doc.save(`Invoice_${inv.id}_${inv.client_name || "Record"}.pdf`);
  };

  if (isHistoryOpen) {
    return (
      <>
        <InvoiceHistoryView
          invoices={invoices}
          handleUpdateStatus={handleUpdateStatus}
          handleDownloadInvoicePDF={handleDownloadInvoicePDF}
          handleDeleteInvoice={handleDeleteInvoice}
          onBack={() => setIsHistoryOpen(false)}
          hasPermission={hasPermission}
        />
        <ConfirmModal
          isOpen={!!deleteConfirmInvoiceId}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice #${deleteConfirmInvoiceId}? This action cannot be undone.`}
          confirmText="Delete Invoice"
          variant="danger"
          loading={deletingInvoice}
          onConfirm={executeDeleteInvoice}
          onClose={() => setDeleteConfirmInvoiceId(null)}
        />
      </>
    );
  }

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] font-extrabold text-3xl md:text-4xl tracking-tight leading-tight">
            Billing
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            Generate and manage client invoices &amp; fee details
          </p>
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <History size={16} />
          Invoice History
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-1">
            {invoices.length}
          </span>
        </button>
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
              ₹{currentMonthInvoiced.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h3>
          </div>
          <div className="relative z-10 text-xs font-medium text-[#94A3B8] mt-4">
            Current Month Invoiced
          </div>
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <User size={16} />
                </div>
                Client Information
              </h3>
              {isLockedFromCase && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs">
                  <Lock size={13} /> Auto-Filled & Locked
                </span>
              )}
            </div>

            {isLockedFromCase && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-blue-950 text-sm">
                      Linked to Case #{caseNumber || paramCaseNo}
                    </h4>
                    <p className="text-xs text-blue-700/90 font-medium mt-0.5">
                      Client: <span className="font-bold text-blue-950">{clientName || paramClientName || "N/A"}</span>
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-blue-700 bg-white/80 backdrop-blur-sm border border-blue-200 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto">
                  🔒 Fields are automatically filled and read-only
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Searchable Client Input */}
              <div className="relative col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                  Client Name {isLockedFromCase && "(Auto-filled)"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-[#94A3B8]" />
                  </div>
                  {isLockedFromCase ? (
                    <input
                      type="text"
                      value={searchTerm || clientName}
                      readOnly
                      disabled
                      className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm bg-[#F8FAFC] text-[#0F172A] font-bold cursor-not-allowed"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Type to search existing clients..."
                      value={searchTerm}
                      onChange={(e) => handleClientSearch(e.target.value)}
                      onFocus={() => {
                        setFilteredClients(clients);
                        setShowDropdown(true);
                      }}
                      className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  )}
                </div>

                {!isLockedFromCase && showDropdown && filteredClients.length > 0 && (
                  <div className="absolute w-full bg-white border border-[#E2E8F0] rounded-xl mt-2 max-h-60 overflow-y-auto z-50 shadow-xl">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => {
                          setClientName(client.name);
                          setSearchTerm(client.name);
                          setEmail(client.email);
                          setMobileNumber(client.mobile || "");
                          const cList = client.cases || [];
                          setClientCases(cList);
                          if (cList.length > 0) {
                            setCaseNumber(cList[0].case_no);
                          } else {
                            setCaseNumber(client.case_number || "");
                          }
                          setShowDropdown(false);
                        }}
                        className="p-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="font-bold text-[#0F172A]">{client.name}</div>
                        <div className="text-xs text-[#64748B] mt-1">
                          {client.email} {client.cases && client.cases.length > 0 ? `• (${client.cases.length} cases)` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Case Selection — full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                  Case Number {isLockedFromCase && "(Auto-filled)"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Briefcase size={16} className="text-[#94A3B8]" />
                  </div>
                  {isLockedFromCase ? (
                    <input
                      type="text"
                      value={caseNumber}
                      readOnly
                      disabled
                      className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm bg-[#F8FAFC] text-[#0F172A] font-bold cursor-not-allowed"
                    />
                  ) : clientCases.length > 0 ? (
                    <select
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">Select a Case Number</option>
                      {clientCases.map((c, idx) => (
                        <option key={idx} value={c.case_no}>
                          {c.case_no} {c.case_title ? `— ${c.case_title}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. CR-2023-145"
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  )}
                </div>
              </div>

              {/* Mobile Number */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-[#94A3B8]" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={mobileNumber}
                    readOnly
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm bg-[#F8FAFC] text-[#64748B] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email Address */}
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
          <div className="grid grid-cols-1 gap-6">

            {/* Court Fee Calculator Card */}
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-blue-600">
                <Scale size={72} />
              </div>

              <div className="flex items-center justify-between mb-5 relative z-10">
                <h3 className="font-extrabold text-blue-950 text-lg sm:text-xl flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Scale size={18} />
                  </div>
                  Court Fee Calculator <span className="text-xs font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full">Ad-Valorem</span>
                </h3>
              </div>

              <p className="text-xs text-blue-800/80 font-medium mb-5 relative z-10 leading-relaxed">
                Calculate precise ad-valorem court fees based on subject matter monetary valuation across 19 Indian States &amp; UTs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-5">
                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                    State / Union Territory
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full border border-blue-200 rounded-xl p-3 text-sm bg-white text-blue-950 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all"
                  >
                    {supportedStatesList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                    Monetary Valuation (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10000"
                    value={suitValuation}
                    onChange={(e) => setSuitValuation(e.target.value)}
                    className="w-full border border-blue-200 rounded-xl p-3 text-sm bg-white text-blue-950 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Instant Calculation Result Banner */}
              <div className="bg-white border border-blue-200/90 rounded-2xl p-4 sm:p-5 shadow-sm relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Calculated Court Fee ({selectedState})
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono tracking-tight">
                    ₹{calculatedCourtFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                  {suitValuation > 0
                    ? `Ad-Valorem Court Fees for valuation of ₹${Number(suitValuation).toLocaleString('en-IN')}/- for the State of ${selectedState} is ₹${calculatedCourtFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`
                    : `Enter suit valuation above to compute court fees for ${selectedState}.`}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Lock size={12} className="text-slate-400 shrink-0" />
                  <span>Internal advocate calculation — court fee is NOT displayed on client invoice.</span>
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
                  placeholder="Remarks / Description"
                  value={advocateFeeRemarks}
                  onChange={(e) => setAdvocateFeeRemarks(e.target.value)}
                  className="w-full border border-amber-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />

                <div className="pt-2 font-bold text-amber-700 text-lg">
                  ₹{advocateFee || 0}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Billing Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-md text-[#0F172A] sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F1F5F9]">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A]">Invoice Summary</h3>
              <Receipt size={26} className="text-[#2563EB]" />
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-extrabold mb-1">Billed To</p>
                <p className="text-base font-extrabold text-[#0F172A]">{clientName || "—"}</p>
                <p className="text-xs text-[#475569] font-medium">{email || "—"}</p>
                <p className="text-xs text-[#475569] font-medium">{mobileNumber || "—"}</p>
              </div>
              <div className="pt-2">
                <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-extrabold mb-1">Case Number</p>
                <p className="text-xs font-extrabold text-[#0F172A] font-mono">{caseNumber || "—"}</p>
              </div>
            </div>

            {/* Fees Breakdown */}
            <div className="space-y-3 text-xs border-t border-[#E2E8F0] pt-5 mb-6">
              <div className="flex justify-between items-center text-[#475569] font-medium">
                <span>Advocate Fee</span>
                <span className="font-extrabold text-[#0F172A]">₹{advocateFee || 0}</span>
              </div>

              {calculatedCourtFee > 0 && (
                <div className="flex justify-between items-center text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-lg border border-blue-100">
                  <span className="font-semibold flex items-center gap-1">
                    <Scale size={13} /> Court Fee ({selectedState}) <span className="text-[10px] text-blue-600">(Internal Ref)</span>
                  </span>
                  <span className="font-bold font-mono">₹{calculatedCourtFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-dashed border-[#E2E8F0]">
                <span className="text-[#64748B] font-medium">Advocate Subtotal</span>
                <span className="font-extrabold text-[#0F172A]">₹{total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">GST (18% on Adv Fee)</span>
                <span className="font-extrabold text-[#0F172A]">₹{(Number(advocateFee || 0) * 0.18).toFixed(2)}</span>
              </div>
            </div>

            {/* Billed Grand Total Box */}
            <div className="bg-[#F8FAFC] border border-blue-100 rounded-2xl -mx-2 px-6 py-5 mb-4 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Landmark size={80} /></div>
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-extrabold mb-1 relative z-10">Client Grand Total</p>
              <p className="text-3xl sm:text-4xl font-black text-[#2563EB] tracking-tight relative z-10">
                ₹{(Number(total) + Number(advocateFee || 0) * 0.18).toFixed(2)}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-700 relative z-10">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                Pending Payment
              </div>
            </div>

            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 flex items-start gap-2">
              <Lock size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span>Only Advocate Fee + GST will be billed &amp; shown to the client. Internal court fees are excluded from the client invoice.</span>
            </div>

            {hasPermission("Finance Management", "add") && (
              <button
                onClick={handleSendPayment}
                disabled={isSendingPayment}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-400 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {isSendingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <>
                    <span>Send Payment Request</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            )}

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
              onClick={() => {
                setShowSuccessModal(false);
                if (paramFromCase && paramCaseId) {
                  router.push(`/case-management/view/${paramCaseId}`);
                } else if (paramFromCase) {
                  router.push("/case-management");
                }
              }}
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Invoice Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmInvoiceId}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice #${deleteConfirmInvoiceId}? This action cannot be undone.`}
        confirmText="Delete Invoice"
        variant="danger"
        loading={deletingInvoice}
        onConfirm={executeDeleteInvoice}
        onClose={() => setDeleteConfirmInvoiceId(null)}
      />
    </div>
  );
}
