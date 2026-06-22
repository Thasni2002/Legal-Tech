"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
export default function AssignAdv({ isOpen, onClose }) {

  const searchParams = useSearchParams();
  const caseId = searchParams.get("id");
  const [showSuccess, setShowSuccess] = useState(false);


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
  });

  useEffect(() => {
    if (!caseId) return;

    const fetchCase = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/lawfirm-management/assigned-cases/${caseId}`
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
          "http://localhost:8000/lawfirm-management/"
        );

        const data = await res.json();
        setAdvocates(data);
      } catch (error) {
        console.error("Error fetching advocates:", error);
      }
    };

    fetchAdvocates();
  }, []);
  // Dummy case data
  const cases = [
    {
      name: "Property Dispute",
      caseNumber: "CASE-2026-001",
      caseTitle: "Ashraf vs ABC Pvt Ltd",
    },
    {
      name: "Cyber Fraud Case",
      caseNumber: "CASE-2026-002",
      caseTitle: "Rahul vs XYZ Tech Solutions",
    },
    {
      name: "Divorce Settlement",
      caseNumber: "CASE-2026-003",
      caseTitle: "Aisha vs Kareem",
    },
    {
      name: "Cheque Bounce Case",
      caseNumber: "CASE-2026-004",
      caseTitle: "HDFC Bank vs Niyas",
    },
    {
      name: "Land Ownership Dispute",
      caseNumber: "CASE-2026-005",
      caseTitle: "Salim vs Municipal Corporation",
    },
  ];

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
      });
    } else {
      // Reset when "Select Case" chosen
      setFormData({
        ...formData,
        caseName: "",
        caseNumber: "",
        caseTitle: "",
      });
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
    };

    try {
      const response = await fetch(
        "http://localhost:8000/lawfirm-management/assign-case",
        {
          method: "POST",
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
          <h3 className="text-xl font-bold text-[#0F172A] mb-2">Assign Successful</h3>
          <p className="text-[#64748B] text-sm mb-6">
            The case has been successfully assigned to the advocate.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowSuccess(false);
              onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5 sticky top-0 bg-white/95 backdrop-blur z-10">
          <h2 className="text-xl font-bold text-[#0F172A]">
            Assign Case to Advocate
          </h2>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#DC2626]"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Form */}
<form onSubmit={handleSubmit} className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

    {/* Case Name */}
    <div>
      <label className="block mb-2 text-sm font-medium text-[#0F172A]">
        Case Name
      </label>
      <select
        value={formData.caseName}
        onChange={handleCaseSelect}
        className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5"
        required
      >
        <option value="">Select Case</option>
        {cases.map((item) => (
          <option key={item.caseNumber} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
    </div>

    {/* Case Number */}
    <div>
      <label className="block mb-2 text-sm font-medium text-[#0F172A]">
        Case Number
      </label>
      <input
        type="text"
        value={formData.caseNumber}
        readOnly
        className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 bg-gray-50"
      />
    </div>

    {/* Case Title */}
    <div>
      <label className="block mb-2 text-sm font-medium text-[#0F172A]">
        Case Title
      </label>
      <input
        type="text"
        value={formData.caseTitle}
        readOnly
        className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 bg-gray-50"
      />
    </div>

    {/* Advocate Name */}
    <div>
      <label className="block mb-2 text-sm font-medium text-[#0F172A]">
        Advocate Name
      </label>
   <select
  name="advocateName"
  value={formData.advocateName}
  onChange={handleChange}
  className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
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
      <label className="block mb-2 text-sm font-medium text-[#0F172A]">
        Practice Area
      </label>
      <select
        name="practiceArea"
        value={formData.practiceArea}
        onChange={handleChange}
        className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5"
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
      <label className="block mb-2 text-sm font-medium text-[#0F172A]">
        Priority
      </label>
      <select
        name="priority"
        value={formData.priority}
        onChange={handleChange}
        className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5"
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
      <label className="block mb-2 text-sm font-medium text-[#0F172A]">
        Due Date
      </label>
      <input
        type="date"
        name="dueDate"
        value={formData.dueDate}
        onChange={handleChange}
        className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5"
        required
      />
    </div>
  </div>

  {/* Notes */}
  <div className="mt-6">
    <label className="block mb-2 text-sm font-medium text-[#0F172A]">
      Assignment Notes / Instructions
    </label>
    <textarea
      name="assignmentNotes"
      value={formData.assignmentNotes}
      onChange={handleChange}
      rows={4}
      placeholder="Enter instructions for the advocate..."
      className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3"
    />
  </div>

  {/* Footer */}
  <div className="flex justify-end gap-3 mt-8 border-t border-[#E2E8F0] pt-5">
    <button
      type="button"
      onClick={onClose}
      className="px-6 py-2.5 border border-[#E2E8F0] rounded-lg"
    >
      Cancel
    </button>

    <button
      type="submit"
      className="px-6 py-2.5 bg-[#2563EB] text-white rounded-lg"
    >
      Assign Case
    </button>
  </div>
</form>
      </div>
    </div>
  );
}