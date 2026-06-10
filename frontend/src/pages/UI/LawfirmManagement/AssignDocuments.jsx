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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-bold">Share Case Document</h2>

          <button
            onClick={onClose}
            className="text-gray-500 text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* Case Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Case Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="caseNumber"
                placeholder="Case Number"
                value={formData.caseNumber}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />

              <input
                type="text"
                name="caseTitle"
                placeholder="Case Title"
                value={formData.caseTitle}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />

              <input
                type="text"
                name="clientName"
                placeholder="Client Name"
                value={formData.clientName}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />

              <input
                type="text"
                name="courtName"
                placeholder="Court Name"
                value={formData.courtName}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />
            </div>
          </div>

          {/* Document Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Document Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="documentId"
                placeholder="Document ID"
                value={formData.documentId}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />

              <input
                type="text"
                name="documentName"
                placeholder="Document Name"
                value={formData.documentName}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />

              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="border rounded-lg p-3"
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
                className="border rounded-lg p-3"
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
                className="border rounded-lg p-3 md:col-span-2"
              />
            </div>
          </div>

          {/* Sharing Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Sharing Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="sharedBy"
                placeholder="Senior Advocate"
                value={formData.sharedBy}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />

              <input
                type="text"
                name="sharedWith"
                placeholder="Junior Advocate"
                value={formData.sharedWith}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />

              <select
                name="accessType"
                value={formData.accessType}
                onChange={handleChange}
                className="border rounded-lg p-3"
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
                className="border rounded-lg p-3"
              />
            </div>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Security & Remarks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="passwordOtp"
                placeholder="Password / OTP"
                value={formData.passwordOtp}
                onChange={handleChange}
                className="border rounded-lg p-3"
              />

              <select
                name="confidentialLevel"
                value={formData.confidentialLevel}
                onChange={handleChange}
                className="border rounded-lg p-3"
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
                className="border rounded-lg p-3 md:col-span-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border rounded-lg cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
            >
              Share Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}