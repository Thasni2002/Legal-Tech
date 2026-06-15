"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import {
  History,
  CreditCard,
} from "lucide-react";

export default function CourtFeeCalView() {
  const [savedCalculations, setSavedCalculations] = useState([]);

  const [courtFee, setCourtFee] = useState("");
  const [stampDuty, setStampDuty] = useState("");
  const [advocateFee, setAdvocateFee] = useState("");
  const [filingCost, setFilingCost] = useState("");



  const [clientName, setClientName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");


  const total =
    Number(courtFee || 0) +
    Number(stampDuty || 0) +
    Number(advocateFee || 0) +
    Number(filingCost || 0);

  const handleSaveCalculation = () => {
    const newCalculation = {
      date: new Date().toLocaleDateString(),
      caseType: "Current Calculation",
      amount: Number(courtFee || 0),
      totalCost: total,
    };

    setSavedCalculations((prev) => [newCalculation, ...prev]);

    // Optional: Clear form after save
    setCourtFee("");
    setStampDuty("");
    setAdvocateFee("");
    setFilingCost("");
  };
const actions = [
 
{
  title: "Invoice History",
  icon: History,
  button: "View Invoices",
  color: "bg-[#0891B2]",
},
{
  title: "Client Due Payments",
  icon: CreditCard,
  button: "View Due Payments",
  color: "bg-[#DC2626]",
},
];

const clients = [
  {
    name: "Rahul Kumar",
    caseNumber: "CIV/101",
    mobile: "9876543210",
    email: "rahul@gmail.com",
  },
  {
    name: "Arun Nair",
    caseNumber: "CR/202",
    mobile: "9876543211",
    email: "arun@gmail.com",
  },
  {
    name: "John Mathew",
    caseNumber: "FAM/303",
    mobile: "9876543212",
    email: "john@gmail.com",
  },
];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Court Fee Calculation Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Court Fee: ₹${courtFee || 0}`, 20, 40);
    doc.text(`Stamp Duty: ₹${stampDuty || 0}`, 20, 50);
    doc.text(`Advocate Fee: ₹${advocateFee || 0}`, 20, 60);
    doc.text(`Paper Filing: ₹${filingCost || 0}`, 20, 70);

    doc.setFontSize(14);
    doc.text(`Total Cost: ₹${total}`, 20, 90);

    doc.save("CourtFeeCalculation.pdf");
  };

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
{/* Client Details */}
<div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
  <h3 className="font-bold text-lg mb-4">
    Client Details
  </h3>

  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

    <select
      value={clientName}
      onChange={(e) => {
        const selectedClient = clients.find(
          (client) => client.name === e.target.value
        );

        if (selectedClient) {
          setClientName(selectedClient.name);
          setCaseNumber(selectedClient.caseNumber);
          setMobileNumber(selectedClient.mobile);
          setEmail(selectedClient.email);
        }
      }}
      className="border border-[#E2E8F0] rounded-lg p-2"
    >
      <option value="">Select Client</option>

      {clients.map((client) => (
        <option
          key={client.name}
          value={client.name}
        >
          {client.name}
        </option>
      ))}
    </select>

    <input
      type="text"
      placeholder="Case Number"
      value={caseNumber}
      readOnly
      className="border border-[#E2E8F0] rounded-lg p-2 bg-[#F1F5F9]"
    />

    <input
      type="text"
      placeholder="Mobile Number"
      value={mobileNumber}
      readOnly
      className="border border-[#E2E8F0] rounded-lg p-2 bg-[#F1F5F9]"
    />

    <input
      type="email"
      placeholder="Email Address"
      value={email}
      readOnly
      className="border border-[#E2E8F0] rounded-lg p-2 bg-[#F1F5F9]"
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
            <input
              type="text"
              placeholder="Case Type"
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Court Fee Amount"
              value={courtFee}
              onChange={(e) => setCourtFee(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            <input
              type="text"
              placeholder="Court Jurisdiction"
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />
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
            <input
              type="text"
              placeholder="Document Type"
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Stamp Duty Amount"
              value={stampDuty}
              onChange={(e) => setStampDuty(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            <input
              type="text"
              placeholder="State"
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
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
            <input
              type="text"
              placeholder="Case Type"
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Advocate Fee Amount"
              value={advocateFee}
              onChange={(e) => setAdvocateFee(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            <input
              type="text"
              placeholder="Remarks"
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
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
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Filing Cost"
              value={filingCost}
              onChange={(e) => setFilingCost(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
            />

            <input
              type="text"
              placeholder="Notes"
              className="w-full border border-[#E2E8F0] rounded-lg p-2"
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

   <div className="flex justify-between">
  <span>Client Name</span>
  <span>{clientName || "-"}</span>
</div>

<div className="flex justify-between">
  <span>Case Number</span>
  <span>{caseNumber || "-"}</span>
</div>

<div className="flex justify-between">
  <span>Mobile Number</span>
  <span>{mobileNumber || "-"}</span>
</div>

<div className="flex justify-between">
  <span>Email</span>
  <span>{email || "-"}</span>
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

    <div className="flex justify-between">
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
      <span>Discount</span>
      <span>₹0</span>
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
  

    <button className="px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803d]">
      Generate Invoice
    </button>

    <button
      onClick={handleDownloadPDF}
      className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#d97706]"
    >
      Download PDF
    </button>

    <button className="px-4 py-2 bg-[#D97706] text-white rounded-lg hover:bg-[#b45309]">
      Send To Client
    </button>
  </div>
</div>
{/* Actions */}
<div className="grid md:grid-cols-2 gap-4">
  {actions.map((item, index) => {
    const Icon = item.icon;

    return (
      <div
        key={index}
        className="bg-white rounded-xl border p-5"
      >
        <div className="w-12 h-12 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-[#0F172A]" />
        </div>

        <h3 className="font-semibold mb-4">
          {item.title}
        </h3>

        <button
          className={`${item.color} text-white w-full py-2 rounded-lg`}
        >
          {item.button}
        </button>
      </div>
    );
  })}
</div>
     
      </div>
  
  );
}