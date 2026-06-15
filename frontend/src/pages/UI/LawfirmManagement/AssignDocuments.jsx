"use client";

import { useState } from "react";

export default function AssignDocuments({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    caseNumber: "",
    caseTitle: "",
    clientName: "",
    courtName: "",

    documentId: "",
    documentName: "",
    documentType: "",
    documentCategory: "",
    uploadFile: null,

    sharedBy: "",
    sharedWith: "",
    accessType: "",
    expiryDate: "",

    passwordOtp: "",
    confidentialLevel: "",
    remarks: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E2E8F0] px-6 py-5 sticky top-0 bg-white/95 backdrop-blur z-10">
          <h2 className="text-xl font-bold text-[#0F172A]">Share Case Document</h2>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#DC2626] text-xl cursor-pointer transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* Case Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4">
              Case Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="caseNumber"
                placeholder="Case Number"
                value={formData.caseNumber}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
              <input
                type="text"
                name="caseTitle"
                placeholder="Case Title"
                value={formData.caseTitle}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
              <input
                type="text"
                name="clientName"
                placeholder="Client Name"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
              <input
                type="text"
                name="courtName"
                placeholder="Court Name"
                value={formData.courtName}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Document Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4">
              Document Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="documentId"
                placeholder="Document ID"
                value={formData.documentId}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
              <input
                type="text"
                name="documentName"
                placeholder="Document Name"
                value={formData.documentName}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              >
                <option value="">Select Document Type</option>
                <option>Evidence</option>
                <option>Affidavit</option>
                <option>Agreement</option>
                <option>Court Order</option>
                <option>Petition</option>
              </select>
              <select
                name="documentCategory"
                value={formData.documentCategory}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              >
                <option value="">Document Category</option>
                <option>Client Documents</option>
                <option>Evidence</option>
                <option>Court Orders</option>
                <option>Legal Notices</option>
              </select>
              <input
                type="file"
                name="uploadFile"
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2563EB]/10 file:text-[#2563EB] hover:file:bg-[#2563EB]/20 md:col-span-2 cursor-pointer transition-all duration-200"
              />
            </div>
          </div>

          {/* Sharing Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4">
              Sharing Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="sharedBy"
                placeholder="Senior Advocate"
                value={formData.sharedBy}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
              <input
                type="text"
                name="sharedWith"
                placeholder="Junior Advocate"
                value={formData.sharedWith}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
              <select
                name="accessType"
                value={formData.accessType}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              >
                <option value="">Access Type</option>
                <option>Password Protected</option>
                <option>OTP Verification</option>
                <option>View Only</option>
                <option>Download Allowed</option>
              </select>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4">
              Security & Remarks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="passwordOtp"
                placeholder="Password / OTP"
                value={formData.passwordOtp}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
              <select
                name="confidentialLevel"
                value={formData.confidentialLevel}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              >
                <option value="">Confidential Level</option>
                <option>Normal</option>
                <option>Confidential</option>
                <option>Highly Confidential</option>
                <option>Restricted</option>
              </select>
              <textarea
                name="remarks"
                placeholder="Remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200 md:col-span-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-[#E2E8F0] text-[#0F172A] rounded-lg text-sm font-medium hover:bg-[#F1F5F9] transition-all duration-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1d4ed8] shadow-sm transition-all duration-200"
            >
              Share Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}