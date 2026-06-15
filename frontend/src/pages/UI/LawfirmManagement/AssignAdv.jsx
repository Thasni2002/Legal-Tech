"use client";

import { useState } from "react";

export default function AssignAdv({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    caseNumber: "",
    caseTitle: "",
    advocateName: "",
    enrollmentNumber: "",
    role: "",
    practiceArea: "",
    priority: "",
    dueDate: "",
    assignmentNotes: "",
  });

  const roles = [
    "Senior Associate",
    "Associate",
    "Junior Advocate",
    "Intern",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Assigned Case:", formData);
    alert("Case Assigned Successfully");
    onClose();
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
            className="text-[#64748B] hover:text-[#DC2626] transition-colors duration-200"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Case Number */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#0F172A]">
                Case Number
              </label>
              <input
                type="text"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                placeholder="CASE-2026-001"
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Case Title */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#0F172A]">
                Case Title
              </label>
              <input
                type="text"
                name="caseTitle"
                value={formData.caseTitle}
                onChange={handleChange}
                placeholder="Ashraf vs ABC Pvt Ltd"
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Advocate Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#0F172A]">
                Advocate Name
              </label>
              <input
                type="text"
                name="advocateName"
                value={formData.advocateName}
                onChange={handleChange}
                placeholder="Enter Advocate Name"
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Enrollment Number */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#0F172A]">
                Enrollment Number
              </label>
              <input
                type="text"
                name="enrollmentNumber"
                value={formData.enrollmentNumber}
                onChange={handleChange}
                placeholder="BAR123456"
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#0F172A]">
                Advocate Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
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
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
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
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
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
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Assignment Notes */}
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
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 border-t border-[#E2E8F0] pt-5">
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
              Assign Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
