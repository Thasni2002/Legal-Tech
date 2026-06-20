"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Eye } from "lucide-react";

export default function AddCaseForm() {
  const [documents, setDocuments] = useState([
    {
      documentType: "",
      advocate: "",
      file: null,
    },
  ]);
  const router = useRouter();

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
  });

  // For multiple document upload (limited to 2 files)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState("");



async function fetchAdvocates() {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/lawfirm-management/"
    );

    const data = await response.json();
    setAdvocates(data);
  } catch (error) {
    console.error("Error fetching advocates:", error);
  }
}

useEffect(() => {
  fetchAdvocates();
}, []);



  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "documentFiles") {
      const fileArray = Array.from(files);
      if (fileArray.length > 2) {
        alert("You can only select up to 2 files at a time.");
        return;
      }
      const fileList = fileArray.map((file) => ({
        file,
        documentType: "",
        advocate: "",
      }));
      setSelectedFiles(fileList);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleFileFieldChange = (index, field, value) => {
    const updated = [...selectedFiles];
    updated[index][field] = value;
    setSelectedFiles(updated);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadDocuments = () => {
    if (selectedFiles.length === 0) {
      alert("Please select files first");
      return;
    }

    const invalid = selectedFiles.some(
      (item) => !item.documentType || !item.advocate
    );
    if (invalid) {
      alert("Please select Document Type and Advocate for every file");
      return;
    }

    const newDocs = selectedFiles.map((item) => ({
      documentType: item.documentType,
      fileName: item.file.name,
      fileUrl: URL.createObjectURL(item.file),
      advocate: item.advocate,
      uploadDate: new Date().toLocaleDateString(),
    }));

    setDocuments((prev) => [...prev, ...newDocs]);
    setSelectedFiles([]);

    alert(`${newDocs.length} Document(s) Uploaded Successfully`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newCase = {
      ...formData,
      documents: [...documents],
    };

    const existingCases = JSON.parse(localStorage.getItem("cases")) || [];
    existingCases.push(newCase);
    localStorage.setItem("cases", JSON.stringify(existingCases));

    alert("Case Saved Successfully");

    // Reset form
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
    setDocuments([
      {
        documentType: "",
        advocate: "",
        file: null,
      },
    ]);

    setSelectedAdvocate("");
    setSelectedFiles([]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => router.push("/case-management")}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h2 className="text-2xl font-bold">Add New Case</h2>
          <p className="text-sm text-gray-500">
            Create a new case file and upload initial documentation.
          </p>
        </div>
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
              <input type="text" name="clientName" placeholder="Full Name" value={formData.clientName} onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Contact Number</label>
              <input type="tel" name="contactNumber" placeholder="+91 XXXXX XXXXX" value={formData.contactNumber} onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" name="emailId" placeholder="client@example.com" value={formData.emailId} onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200" required />
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
              <select name="courtName" value={formData.courtName} onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200" required>
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
              <select name="courtType" value={formData.courtType} onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200" required>
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

        {/* ==================== DOCUMENT UPLOAD SECTION ==================== */}

        <div className="space-y-6 pt-4 border-t border-[#F1F5F9]">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
            DOCUMENT UPLOAD
          </h3>

          {/* Advocate only once */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
              Advocate Name
            </label>
            <select
              value={selectedAdvocate}
              onChange={(e) => setSelectedAdvocate(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Select Advocate</option>
              {advocates.map((adv) => (
                <option key={adv.id} value={adv.advocateName}>
                  {adv.advocateName}
                </option>
              ))}
            </select>
          </div>

          {/* Multiple document uploads */}
          {documents.map((doc, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border border-[#E2E8F0] p-5 rounded-2xl bg-[#F8FAFC]"
            >
              {/* Document Type */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Document Type
                </label>
                <select
                  value={doc.documentType}
                  onChange={(e) => {
                    const updated = [...documents];
                    updated[index].documentType = e.target.value;
                    setDocuments(updated);
                  }}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Select Type</option>
                  <option value="Petition">Petition</option>
                  <option value="Evidence">Evidence</option>
                  <option value="Affidavit">Affidavit</option>
                </select>
              </div>

              {/* File Upload */}
              {/* File Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Upload File
                </label>

                <div className="flex items-center gap-2">
                  <input
                    key={`${index}-${doc.file?.name || "empty"}`}
                    type="file"
                    onChange={(e) => {
                      const updated = [...documents];
                      updated[index].file = e.target.files[0];
                      setDocuments(updated);
                    }}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm"
                  />

                  {doc.file && (
                    <button
                      type="button"
                      onClick={() => window.open(URL.createObjectURL(doc.file))}
                      className="p-3 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Add / Remove */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDocuments([
                      ...documents,
                      { documentType: "", file: null }
                    ])
                  }
                  className="bg-[#2563EB] text-white px-4 py-2 rounded-lg"
                >
                  +
                </button>
              </div>
            </div>
          ))}
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