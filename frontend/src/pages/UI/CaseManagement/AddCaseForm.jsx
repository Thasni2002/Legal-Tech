"use client";

import { useState } from "react";

export default function AddCaseForm() {
  const [documents, setDocuments] = useState([]);

  const [formData, setFormData] = useState({
    caseTitle: "",
    caseNo: "",
    caseType: "",
    caseCat: "",
    caseDes: "",

    clientName: "",
    contactNumber: "",
    emailId: "",

    courtName: "",
    courtType: "",

    status: "Active",

    documentType: "",
    advocate: "",
    documentFile: null,


    
  });

  const handleChange = (e) => {
  const { name, value, files } = e.target;

  setFormData({
    ...formData,
    [name]: files ? files[0] : value,
  });
};

const handleDocumentUpload = () => {
  if (
    !formData.documentType ||
    !formData.advocate ||
    !formData.documentFile
  ) {
    alert("Please fill all document fields");
    return;
  }

  const newDocument = {
  documentType: formData.documentType,
  fileName: formData.documentFile.name,
  fileUrl: URL.createObjectURL(formData.documentFile),
  advocate: formData.advocate,
  uploadDate: new Date().toLocaleDateString(),
};

  

  setDocuments([...documents, newDocument]);

  setFormData({
    ...formData,
    documentType: "",
    advocate: "",
    documentFile: null,
  });

  alert("Document Saved Successfully");
};








  const handleSubmit = (e) => {
    e.preventDefault();

    const newCase = {
      ...formData,
    };


    const handleDocumentUpload = () => {

  if (
    !formData.documentType ||
    !formData.advocate ||
    !formData.documentFile
  ) {
    alert("Please fill all document fields");
    return;
  }

  const newDocument = {
    documentType: formData.documentType,
    fileName: formData.documentFile.name,
    advocate: formData.advocate,
    uploadDate: new Date().toLocaleDateString(),
  };

  setDocuments([...documents, newDocument]);

  setFormData({
    ...formData,
    documentType: "",
    advocate: "",
    documentFile: null,
  });

  alert("Document Uploaded Successfully");
};

    const existingCases =
      JSON.parse(localStorage.getItem("cases")) || [];

    existingCases.push(newCase);

    localStorage.setItem(
      "cases",
      JSON.stringify(existingCases)
    );

    alert("Case Saved Successfully");

    setFormData({
      caseTitle: "",
      caseNo: "",
      caseType: "",
      caseCat: "",
      caseDes: "",

      clientName: "",
      contactNumber: "",
      emailId: "",

      courtName: "",
      courtType: "",

      status: "Active",
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
      {/* Title */}
      <div className="border-b border-[#F1F5F9] pb-4 mb-6">
        <h2 className="text-xl font-bold text-[#0F172A]">
          Add New Case
        </h2>
        <p className="text-sm text-[#64748B] mt-1">
          Create a new case file and upload initial documentation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Case Information */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
            Case Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case ID</label>
              <input
                type="text"
                name="caseId"
                placeholder="e.g. CASE-2026-001"
                value={formData.caseId || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Title</label>
              <input
                type="text"
                name="caseTitle"
                placeholder="e.g. State vs. John Doe"
                value={formData.caseTitle}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Number</label>
              <input
                type="text"
                name="caseNo"
                placeholder="e.g. CR/1234/2026"
                value={formData.caseNo}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Type</label>
              <select
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              >
                <option value="">Select Case Type</option>
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
                <option value="Family">Family</option>
                <option value="Consumer">Consumer</option>
                <option value="Corporate">Corporate</option>
                <option value="Labour">Labour</option>
                <option value="Property">Property</option>
                <option value="Motor Accident">Motor Accident</option>
                <option value="Cyber Crime">Cyber Crime</option>
                <option value="Tax">Tax</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Description</label>
            <textarea
              name="caseDes"
              placeholder="Provide a detailed summary of the legal matter..."
              value={formData.caseDes}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200 resize-y"
              rows="4"
              required
            />
          </div>
        </div>

        {/* Client Information */}
        <div className="space-y-5 pt-4 border-t border-[#F1F5F9]">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
            Client Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Client Name</label>
              <input
                type="text"
                name="clientName"
                placeholder="Full Name"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                placeholder="+91 XXXXX XXXXX"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                name="emailId"
                placeholder="client@example.com"
                value={formData.emailId}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>
          </div>
        </div>

        {/* Court Information */}
        <div className="space-y-5 pt-4 border-t border-[#F1F5F9]">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
            Jurisdiction & Court
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Court Name</label>
              <select
                name="courtName"
                value={formData.courtName}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              >
                <option value="">Select Court Name</option>
                <option value="Supreme Court">Supreme Court</option>
                <option value="High Court">High Court</option>
                <option value="District Court">District Court</option>
                <option value="Family Court">Family Court</option>
                <option value="Consumer Court">Consumer Court</option>
                <option value="Motor Accident Tribunal">Motor Accident Tribunal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Court Type</label>
              <select
                name="courtType"
                value={formData.courtType}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              >
                <option value="">Select Court Type</option>
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
                <option value="Family">Family</option>
                <option value="Consumer">Consumer</option>
                <option value="Corporate">Corporate</option>
                <option value="Labour">Labour</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="space-y-5 pt-4 border-t border-[#F1F5F9]">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
            Document Upload
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Doc Type</label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              >
                <option value="">Type</option>
                <option value="Petition">Petition</option>
                <option value="Evidence">Evidence</option>
                <option value="Affidavit">Affidavit</option>
                <option value="Judgment">Judgment</option>
                <option value="Notice">Notice</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Choose File</label>
              <input
                type="file"
                name="documentFile"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 text-xs text-[#64748B] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Uploader</label>
              <select
                name="advocate"
                value={formData.advocate}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              >
                <option value="">Advocate</option>
                <option value="Adv. Rahul Sharma">Adv. Rahul Sharma</option>
                <option value="Adv. Priya Verma">Adv. Priya Verma</option>
                <option value="Adv. Arjun Nair">Adv. Arjun Nair</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Upload Date</label>
              <input
                type="text"
                value={new Date().toLocaleDateString()}
                readOnly
                className="w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2.5 text-xs text-[#64748B] outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <button
                type="button"
                onClick={handleDocumentUpload}
                className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors duration-200 cursor-pointer"
              >
                Upload
              </button>
            </div>
          </div>

          {documents.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-[#E2E8F0]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="p-3 font-medium">Document Type</th>
                    <th className="p-3 font-medium">File Name</th>
                    <th className="p-3 font-medium">Uploaded By</th>
                    <th className="p-3 font-medium">Upload Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F1F5F9]">
                  {documents.map((doc, index) => (
                    <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="p-3 text-xs font-medium text-[#1E293B]">{doc.documentType}</td>
                      <td className="p-3 text-xs">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] hover:underline font-medium"
                        >
                          {doc.fileName}
                        </a>
                      </td>
                      <td className="p-3 text-xs text-[#1E293B]">{doc.advocate}</td>
                      <td className="p-3 text-xs text-[#64748B]">{doc.uploadDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F1F5F9] items-end">
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Initial Case Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-8 py-3.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 cursor-pointer"
            >
              Save Case File
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
