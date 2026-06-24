"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Upload, X, Eye, CheckCircle, Edit3 } from "lucide-react";

// Error message component
function ErrorMsg({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5 animate-[fadeInError_0.2s_ease]">
      <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">!</span>
      {message}
    </p>
  );
}

export default function AddCaseForm() {
const router = useRouter();
  const params = useParams();
const editId = params?.id;

  const isEditMode = !!editId;
  const [documents, setDocuments] = useState([
    { documentType: "", advocate: "", file: null },
  ]);
  

  const [formData, setFormData] = useState({
    caseId: "",
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
    nextHearingDate: "",
  });

  const [loadingEdit, setLoadingEdit] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState("");

  // ─── Fetch advocates ───
  async function fetchAdvocates() {
    try {
      const response = await fetch("http://localhost:8000/lawfirm-management/");
      const data = await response.json();
      setAdvocates(data);
    } catch (error) {
      console.error("Error fetching advocates:", error);
    }
  }

  // ─── Fetch case data for edit mode ───
  async function fetchCaseForEdit(id) {
    setLoadingEdit(true);
    try {
      const res = await fetch(`http://localhost:8000/case-management/${id}`);
      if (!res.ok) throw new Error("Case not found");
      const data = await res.json();
      setFormData({
        caseId: data.case_id || "",
        caseTitle: data.case_title || "",
        caseNo: data.case_no || "",
        caseType: data.case_type || "",
        caseCat: "",
        caseDes: data.case_description || "",
        clientName: data.client_name || "",
        contactNumber: data.contact_number || "",
        emailId: data.email_id || "",
        courtName: data.court_name || "",
        courtType: data.court_type || "",
        status: data.status || "Active",
        nextHearingDate: data.next_hearing_date || "",
      });
      setSelectedAdvocate(data.selected_advocate || "");
      if (data.documents && data.documents.length > 0) {
        setDocuments(data.documents.map(d => ({
          documentType: d.documentType || "",
          advocate: d.advocate || "",
          file: d.file ? { name: d.file } : null,
          view: d.view !== undefined ? d.view : true,
          upload: d.upload !== undefined ? d.upload : true,
          edit: d.edit !== undefined ? d.edit : true,
          delete: d.delete !== undefined ? d.delete : true,
        })));
      }
    } catch (err) {
      console.error("Error loading case:", err);
      alert("Failed to load case data.");
    } finally {
      setLoadingEdit(false);
    }
  }

  useEffect(() => {
    fetchAdvocates();
    if (isEditMode) {
      fetchCaseForEdit(editId);
    }
  }, [editId]);

  // ─── Validate a single field ───
  function validateField(name, value) {
    switch (name) {
      case "caseId":
        if (!value.trim()) return "Case ID is required";
        if (!/^[a-zA-Z0-9]+-\d{4}-\d+$/.test(value.trim())) {
          return "Format must be like CASE-2026-001";
        }
        return "";
      case "caseTitle":
        if (!value.trim()) return "Case Title is required";
        if (value.trim().length < 3) return "Case Title must be at least 3 characters";
        return "";
      case "caseNo":
        if (!value.trim()) return "Case Number is required";
        if (!/^[a-zA-Z0-9]+[\/\-]\d+[\/\-]\d{4}$/.test(value.trim())) {
          return "Format must be like CR/1234/2026";
        }
        return "";
      case "caseType":
        if (!value) return "Please select a Case Type";
        return "";
      case "caseDes":
        if (!value.trim()) return "Case Description is required";
        if (value.trim().length < 10) return "Description must be at least 10 characters";
        return "";
      case "clientName":
        if (!value.trim()) return "Client Name is required";
        if (!/^[a-zA-Z\s.]+$/.test(value.trim())) return "Client Name must contain only letters";
        if (value.trim().length < 2) return "Client Name must be at least 2 characters";
        return "";
      case "contactNumber":
        if (!value) return "Contact Number is required";
        if (value.length !== 10) return "Contact number must be exactly 10 digits";
        return "";
      case "emailId":
        if (!value.trim()) return "Email Address is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
        return "";
      case "courtName":
        if (!value) return "Please select a Court Name";
        return "";
      case "courtType":
        if (!value) return "Please select a Court Type";
        return "";
      default:
        return "";
    }
  }

  function validateAll() {
    const fields = ["caseId", "caseTitle", "caseNo", "caseType", "caseDes", "clientName", "contactNumber", "emailId", "courtName", "courtType"];
    const newErrors = {};
    const newTouched = {};
    let valid = true;
    fields.forEach((f) => {
      const err = validateField(f, formData[f] || "");
      newErrors[f] = err;
      newTouched[f] = true;
      if (err) valid = false;
    });
    setErrors(newErrors);
    setTouched(newTouched);
    return valid;
  }

  function getBorderClass(field) {
    if (touched[field] && errors[field]) {
      return "border-red-400 focus:ring-red-200 focus:border-red-400";
    }
    return "border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]";
  }

  const baseInputClass =
    "w-full rounded-lg border bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 outline-none transition-all duration-200";

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
      let val = value;
      if (name === "contactNumber") {
        val = value.replace(/\D/g, "").slice(0, 10);
      }
      const newFormData = { ...formData, [name]: val };
      setFormData(newFormData);
      const error = validateField(name, val);
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateAll()) return;

  const payload = {
    caseId: formData.caseId || "",
    caseTitle: formData.caseTitle,
    caseNo: formData.caseNo,
    caseType: formData.caseType,
    caseDes: formData.caseDes,

    clientName: formData.clientName,
    contactNumber: formData.contactNumber,
    emailId: formData.emailId,

    courtName: formData.courtName,
    courtType: formData.courtType,

    status: formData.status,

    selectedAdvocate: selectedAdvocate || null,

    documents: documents.map((doc) => ({
      documentType: doc.documentType || "",
      advocate: selectedAdvocate || "",
      file: doc.file ? doc.file.name : null,
      view: doc.view !== undefined ? doc.view : true,
      upload: doc.upload !== undefined ? doc.upload : true,
      edit: doc.edit !== undefined ? doc.edit : true,
      delete: doc.delete !== undefined ? doc.delete : true,
    })),
    nextHearingDate: formData.nextHearingDate || null,
  };

  try {
    const url = isEditMode
      ? `http://localhost:8000/case-management/${editId}`
      : "http://localhost:8000/case-management/";

    const method = isEditMode ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.detail || "Failed to save case");
    }

    setShowSuccessPopup(true);

    setTimeout(() => {
      setShowSuccessPopup(false);
      router.push("/case-management");
    }, 2500);

    // Reset form only for add mode
    if (!isEditMode) {
      setFormData({
        caseId: "",
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
        nextHearingDate: "",
      });

      setErrors({});
      setTouched({});
      setDocuments([
        {
          documentType: "",
          advocate: "",
          file: null,
        },
      ]);

      setSelectedAdvocate("");
      setSelectedFiles([]);
    }
  } catch (error) {
    console.error("Save error:", error);
    alert(error.message || "Something went wrong while saving the case.");
  }
};

  if (loadingEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748B] font-medium">Loading case data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ===== SUCCESS POPUP ===== */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle size={36} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">
              {isEditMode ? "Case Updated Successfully!" : "Case Saved Successfully!"}
            </h3>
            <p className="text-sm text-[#64748B] mb-5">
              {isEditMode
                ? "Your case has been updated. Redirecting..."
                : "Your case file has been created and saved. Redirecting..."}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full animate-[progressBar_2.5s_linear_forwards]" />
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => router.push("/case-management")}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {isEditMode && (
                <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Edit3 size={12} /> Edit Mode
                </span>
              )}
              <h2 className="text-2xl font-bold">
                {isEditMode ? "Edit Case" : "Add New Case"}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              {isEditMode
                ? "Update the case details below."
                : "Create a new case file and upload initial documentation."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Case Details */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
              Case Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Case ID */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case ID</label>
                <input
                  type="text"
                  name="caseId"
                  placeholder="e.g. CASE-2026-001"
                  value={formData.caseId || ""}
                  onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("caseId")}`}
                />
                {touched.caseId && errors.caseId && <ErrorMsg message={errors.caseId} />}
              </div>

              {/* Case Title */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Title</label>
                <input
                  type="text"
                  name="caseTitle"
                  placeholder="e.g. State vs. John Doe"
                  value={formData.caseTitle}
                  onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("caseTitle")}`}
                />
                {touched.caseTitle && errors.caseTitle && <ErrorMsg message={errors.caseTitle} />}
              </div>

              {/* Case Number */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Number</label>
                <input
                  type="text"
                  name="caseNo"
                  placeholder="e.g. CR/1234/2026"
                  value={formData.caseNo}
                  onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("caseNo")}`}
                />
                {touched.caseNo && errors.caseNo && <ErrorMsg message={errors.caseNo} />}
              </div>

              {/* Case Type */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Type</label>
                <select
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("caseType")}`}
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
                {touched.caseType && errors.caseType && <ErrorMsg message={errors.caseType} />}
              </div>

              {/* Next Hearing Date */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Next Hearing Date</label>
                <input
                  type="date"
                  name="nextHearingDate"
                  value={formData.nextHearingDate || ""}
                  onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("nextHearingDate")}`}
                />
                {touched.nextHearingDate && errors.nextHearingDate && <ErrorMsg message={errors.nextHearingDate} />}
              </div>
            </div>

            {/* Case Description */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Description</label>
              <textarea
                name="caseDes"
                placeholder="Provide a detailed summary of the legal matter..."
                value={formData.caseDes}
                onChange={handleChange}
                className={`${baseInputClass} ${getBorderClass("caseDes")} resize-y`}
                rows="4"
              />
              {touched.caseDes && errors.caseDes && <ErrorMsg message={errors.caseDes} />}
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-5 pt-4 border-t border-[#F1F5F9]">
            <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Client Name</label>
                <input type="text" name="clientName" placeholder="Full Name" value={formData.clientName} onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("clientName")}`} />
                {touched.clientName && errors.clientName && <ErrorMsg message={errors.clientName} />}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Contact Number</label>
                <input type="tel" name="contactNumber" placeholder="e.g. 9876543210" value={formData.contactNumber} onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("contactNumber")}`} />
                {touched.contactNumber && errors.contactNumber && <ErrorMsg message={errors.contactNumber} />}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" name="emailId" placeholder="client@example.com" value={formData.emailId} onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("emailId")}`} />
                {touched.emailId && errors.emailId && <ErrorMsg message={errors.emailId} />}
              </div>
            </div>
          </div>

          {/* Court Information */}
          <div className="space-y-5 pt-4 border-t border-[#F1F5F9]">
            <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Jurisdiction & Court</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Court Name</label>
                <select name="courtName" value={formData.courtName} onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("courtName")}`}>
                  <option value="">Select Court Name</option>
                  <option value="Supreme Court">Supreme Court</option>
                  <option value="High Court">High Court</option>
                  <option value="District Court">District Court</option>
                  <option value="Family Court">Family Court</option>
                  <option value="Consumer Court">Consumer Court</option>
                  <option value="Motor Accident Tribunal">Motor Accident Tribunal</option>
                </select>
                {touched.courtName && errors.courtName && <ErrorMsg message={errors.courtName} />}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Court Type</label>
                <select name="courtType" value={formData.courtType} onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("courtType")}`}>
                  <option value="">Select Court Type</option>
                  <option value="Civil">Civil</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Family">Family</option>
                  <option value="Consumer">Consumer</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Labour">Labour</option>
                </select>
                {touched.courtType && errors.courtType && <ErrorMsg message={errors.courtType} />}
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-6 pt-4 border-t border-[#F1F5F9]">
            <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Document Upload</h3>

            {/* Advocate dropdown */}
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

            {/* Document rows */}
            {documents.map((doc, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border border-[#E2E8F0] p-5 rounded-2xl bg-[#F8FAFC]"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Document Type</label>
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

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Upload File</label>
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

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDocuments([...documents, { documentType: "", file: null }])
                    }
                    className="bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition"
                  >
                    +
                  </button>
                  {documents.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDocuments(documents.filter((_, i) => i !== index))
                      }
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Status & Submit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F1F5F9] items-end">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                Case Status
              </label>
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

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/case-management")}
                className="px-6 py-3.5 rounded-lg font-medium text-sm border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-8 py-3.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 cursor-pointer"
              >
                {isEditMode ? "Update Case" : "Save Case File"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}