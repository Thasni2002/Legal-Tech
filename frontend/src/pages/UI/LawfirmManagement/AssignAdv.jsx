"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
export default function AssignAdv({ isOpen, onClose }) {

  const searchParams = useSearchParams();
  const caseId = searchParams.get("id");


  const [formData, setFormData] = useState({
    caseName: "",
    caseNumber: "",
    caseTitle: "",
    advocateName: "",
    practiceArea: "",
    priority: "",
    dueDate: "",
    assignmentNotes: "",
  });

  useEffect(() => {
    if (!caseId) return;

    const fetchCase = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/lawfirm-management/assigned-cases/${caseId}`
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
          "http://127.0.0.1:8000/lawfirm-management/"
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
    };

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/lawfirm-management/assign-case",
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
        alert("Case Assigned Successfully");

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
        });

        onClose();
      } else {
        console.log("Error:", data);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  if (!isOpen) return null;

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