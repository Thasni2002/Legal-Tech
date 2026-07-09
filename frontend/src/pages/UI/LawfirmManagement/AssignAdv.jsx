"use client";

import { API_BASE_URL } from "@/utils/api";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

export default function AssignAdv({ isOpen, onClose }) {

  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("id");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  const [formData, setFormData] = useState({
    caseName: "",
    caseNumber: "",
    caseTitle: "",
    advocateName: "",
    practiceArea: "",
    priority: "",
    dueDate: "",
    assignmentNotes: "",
    status: "Active",
    clientName: "",
  });

  useEffect(() => {
    if (!caseId) return;

    const fetchCase = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/lawfirm-management/assigned-cases/${caseId}`
        );

        const data = await res.json();

        setFormData({
          caseName: data.case_name || "",
          caseNumber: data.case_number || "",
          caseTitle: data.case_title || "",
          advocateName: data.advocate_name || "",
          practiceArea: data.practice_area || "",
          priority: data.priority || "",
          dueDate: data.due_date || "",
          assignmentNotes: data.assignment_notes || "",
          status: data.status || "Active",
          clientName: data.client_name || "",
        });
      } catch (error) {
        console.error("Error fetching case:", error);
      }
    };

    fetchCase();
  }, [caseId]);


  const [advocates, setAdvocates] = useState([]);

  useEffect(() => {
    const fetchAdvocates = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/lawfirm-management/`
        );

        const data = await res.json();
        setAdvocates(data);
      } catch (error) {
        console.error("Error fetching advocates:", error);
      }
    };

    fetchAdvocates();
  }, []);
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/case-management/");
        if (res.ok) {
          const data = await res.json();
          const mappedCases = data.map((c) => ({
            name: c.case_title || `Case ${c.id}`,
            caseNumber: c.case_no || `CASE-${c.id}`,
            caseTitle: c.case_title || `Case ${c.id}`,
            clientName: c.client_name || "",
          }));
          setCases(mappedCases);
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
      }
    };

    fetchCases();
  }, []);

  const practiceAreas = [
    "Civil Law",
    "Criminal Law",
    "Corporate Law",
    "Family Law",
    "Property Law",
    "Cyber Law",
    "Tax Law",
  ];

  const priorities = ["High", "Medium", "Low"];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle case select
  const handleCaseSelect = (e) => {
    const selectedValue = e.target.value;

    const selectedCase = cases.find(
      (item) => item.name === selectedValue
    );

    if (selectedCase) {
      setFormData({
        ...formData,
        caseName: selectedValue,
        caseNumber: selectedCase.caseNumber,
        caseTitle: selectedCase.caseTitle,
        clientName: selectedCase.clientName,
      });
    } else {
      // Reset when "Select Case" chosen
      setFormData({
        ...formData,
        caseName: "",
        caseNumber: "",
        caseTitle: "",
        clientName: "",
      });
    }
  };

  const handleUnassign = async () => {
    if (!caseId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/${caseId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        if (onClose) onClose();
        else router.back();
      } else {
        alert("Failed to unassign case.");
      }
    } catch (error) {
      console.error("Error unassigning case:", error);
      alert("Error unassigning case.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
       case_name: formData.caseName,
      case_number: formData.caseNumber,
      case_title: formData.caseTitle,
      advocate_name: formData.advocateName,
      practice_area: formData.practiceArea,
      priority: formData.priority,
      due_date: formData.dueDate,
      assignment_notes: formData.assignmentNotes,
      status: formData.status,
      client_name: formData.clientName,
    };

    try {
      const url = caseId
        ? `${API_BASE_URL}/lawfirm-management/assigned-cases/${caseId}`
        : `${API_BASE_URL}/lawfirm-management/assign-case`;
      const method = caseId ? "PUT" : "POST";

      const response = await fetch(
        url,
        {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("Saved:", data);

      if (response.ok) {
        // Reset form
        setFormData({
          caseName: "",
          caseNumber: "",
          caseTitle: "",
          advocateName: "",
          practiceArea: "",
          priority: "",
          dueDate: "",
          assignmentNotes: "",
          status: "Active",
          clientName: "",
        });

        setShowSuccess(true);
      } else {
        console.log("Error:", data);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  if (!isOpen) return null;


  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#E2E8F0] transform transition-all duration-300 scale-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#0F172A] mb-2">
            {caseId ? "Update Successful" : "Assign Successful"}
          </h3>
          <p className="text-[#64748B] text-sm mb-6">
            {caseId
              ? "The case assignment has been successfully updated."
              : "The case has been successfully assigned to the advocate."}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowSuccess(false);
              if (onClose) onClose();
              else router.back();
            }}
            className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white w-full max-w-4xl mx-auto rounded-3xl shadow-xl shadow-slate-200/60 border border-[#E2E8F0]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F5F9] px-8 py-6 sticky top-0 bg-white/95 backdrop-blur z-10">
          <h2 className="text-2xl font-extrabold text-[#0F172A]">
            {caseId ? "Update Assigned Case" : "Assign Case to Advocate"}
          </h2>
          <button
            onClick={onClose || (() => router.back())}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F8FAFC] text-[#64748B] hover:bg-rose-100 hover:text-rose-600 transition-colors"
          >
            <span className="text-xl font-bold">✕</span>
          </button>
        </div>

        {/* Form */}
<form onSubmit={handleSubmit} className="p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {/* Case Name */}
    <div>
      <label className="block mb-2 text-sm font-bold text-[#0F172A]">
        Case Name
      </label>
      <select
        value={formData.caseName}
        onChange={handleCaseSelect}
        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
        required
      >
        <option value="">Select Case</option>
        {cases.map((item, index) => (
          <option key={`${item.caseNumber}-${index}`} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
    </div>

    {/* Case Number */}
    <div>
      <label className="block mb-2 text-sm font-bold text-[#0F172A]">
        Case Number
      </label>
      <input
        type="text"
        value={formData.caseNumber}
        readOnly
        className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3.5 bg-slate-100 text-[#475569] text-sm outline-none cursor-not-allowed"
      />
    </div>

    {/* Case Title */}
    <div>
      <label className="block mb-2 text-sm font-bold text-[#0F172A]">
        Case Title
      </label>
      <input
        type="text"
        value={formData.caseTitle}
        readOnly
        className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3.5 bg-slate-100 text-[#475569] text-sm outline-none cursor-not-allowed"
      />
    </div>

    {/* Advocate Name */}
    <div>
      <label className="block mb-2 text-sm font-bold text-[#0F172A]">
        Advocate Name
      </label>
   <select
  name="advocateName"
  value={formData.advocateName}
  onChange={handleChange}
  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
  required
>
        <option value="">Select Advocate</option>

        {advocates.map((advocate) => (
          <option
            key={advocate.id}
            value={advocate.advocateName}
          >
            {advocate.advocateName}
          </option>
        ))}
      </select>
    </div>

    {/* Practice Area */}
    <div>
      <label className="block mb-2 text-sm font-bold text-[#0F172A]">
        Practice Area
      </label>
      <select
        name="practiceArea"
        value={formData.practiceArea}
        onChange={handleChange}
        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
        required
      >
        <option value="">Select Practice Area</option>
        {practiceAreas.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </select>
    </div>

    {/* Priority */}
    <div>
      <label className="block mb-2 text-sm font-bold text-[#0F172A]">
        Priority
      </label>
      <select
        name="priority"
        value={formData.priority}
        onChange={handleChange}
        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
        required
      >
        <option value="">Select Priority</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>
    </div>

    {/* Due Date */}
    <div>
      <label className="block mb-2 text-sm font-bold text-[#0F172A]">
        Due Date
      </label>
      <input
        type="date"
        name="dueDate"
        value={formData.dueDate}
        onChange={handleChange}
        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
        required
      />
    </div>
  </div>

  {/* Notes */}
  <div className="mt-8">
    <label className="block mb-2 text-sm font-bold text-[#0F172A]">
      Assignment Notes / Instructions
    </label>
    <textarea
      name="assignmentNotes"
      value={formData.assignmentNotes}
      onChange={handleChange}
      rows={4}
      placeholder="Enter instructions for the advocate..."
      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
    />
  </div>

  {/* Footer */}
  <div className="flex justify-end gap-3 mt-10 border-t border-[#F1F5F9] pt-8">
    {caseId && (
      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className="px-8 py-3.5 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto mr-auto"
      >
        Remove Assignment
      </button>
    )}
    <button
      type="button"
      onClick={onClose || (() => router.back())}
      className="px-8 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto"
    >
      Cancel
    </button>

    <button
      type="submit"
      className="px-8 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] w-full sm:w-auto"
    >
      Assign Case
    </button>
  </div>
</form>
      </div>

    {showDeleteConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-900 mt-6">
              Confirm Removal
            </h2>
            <p className="text-center text-slate-500 mt-3 leading-relaxed">
              Are you sure you want to remove this assignment?
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnassign}
                className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold shadow-lg shadow-red-600/30 hover:bg-red-700 transition"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}