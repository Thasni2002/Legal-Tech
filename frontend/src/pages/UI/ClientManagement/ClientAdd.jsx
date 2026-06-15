"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ClientAdd({ onSave, onCancel }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    clientId: "",
    fullName: "",
    email: "",
    phone: "",
    // whatsapp: "",
    // address: "",
    // city: "",
    // state: "",
    // pincode: "",
    // assignedAdvocate: "",
    // caseTitle: "",
    // caseType: "",
    // caseNumber: "",
    // courtName: "",
    // nextHearing: "",
    // caseStatus: "",
    // totalFee: "",
    // amountPaid: "",
    // outstandingAmount: "",
    // notes: "",
  });

//   const courts = [
//   "Supreme Court",
//   "High Court",
//   "District Court",
//   "Family Court",
//   "Consumer Court",
//   "Labour Court",
//   "Sessions Court",
//   "Magistrate Court",
// ];

// const advocates = [
//   "Adv. Arjun Menon",
//   "Adv. Priya Nair",
//   "Adv. Rahul Krishnan",
// ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   console.log(formData);
  //   alert("Client Saved Successfully");
  // };

  const handleSubmit = (e) => {
  e.preventDefault();

  if (
    !formData.clientId ||
    !formData.fullName ||
    !formData.email ||
    !formData.phone 
    // !formData.caseType ||
    // !formData.courtName
  ) {
    alert("Please fill all required fields");
    return;
  }

  localStorage.setItem(
    "clientData",
    JSON.stringify(formData)
  );

  alert("Client Saved Successfully");

  if (onSave) {
    onSave(formData);
  } else {
    router.push("/client-management");
  }
};

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
      <div className="flex items-center gap-4 border-b border-[#F1F5F9] pb-4 mb-6">
        <Link
          href="/client-management"
          className="flex items-center justify-center w-9 h-9 bg-white border border-[#E2E8F0] rounded-lg shadow-sm text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">
            Add / Manage Client
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Register a client profile in the legal firm's registry.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Client ID</label>
            <input
              type="text"
              name="clientId"
              placeholder="e.g. CLI-2026-908"
              value={formData.clientId}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="e.g. client@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Mobile Number</label>
            <input
              type="text"
              name="phone"
              placeholder="e.g. +91 XXXXX XXXXX"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Next Hearing Date (Optional)</label>
            <input
              type="date"
              name="nextHearing"
              value={formData.nextHearing || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#F1F5F9]">
          <button
            type="submit"
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 cursor-pointer"
          >
            Save Client
          </button>

          <button
            type="reset"
            className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] px-6 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 cursor-pointer"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                router.push("/client-management");
              }
            }}
            className="bg-[#DC2626]/90 hover:bg-[#DC2626] text-white px-6 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 cursor-pointer ml-auto"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}