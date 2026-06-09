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

return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"> <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

    {/* Header */}
    <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
      <h2 className="text-2xl font-bold text-gray-800">
        Assign Case to Advocate
      </h2>

      <button
        onClick={onClose}
        className="text-3xl text-gray-500 hover:text-red-500"
      >
        ×
      </button>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Case Number */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Case Number
          </label>
          <input
            type="text"
            name="caseNumber"
            value={formData.caseNumber}
            onChange={handleChange}
            placeholder="CASE-2026-001"
            className="w-full h-11 border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Case Title */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Case Title
          </label>
          <input
            type="text"
            name="caseTitle"
            value={formData.caseTitle}
            onChange={handleChange}
            placeholder="Ashraf vs ABC Pvt Ltd"
            className="w-full h-11 border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Advocate Name */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Advocate Name
          </label>
          <input
            type="text"
            name="advocateName"
            value={formData.advocateName}
            onChange={handleChange}
            placeholder="Enter Advocate Name"
            className="w-full h-11 border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Enrollment Number */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Enrollment Number
          </label>
          <input
            type="text"
            name="enrollmentNumber"
            value={formData.enrollmentNumber}
            onChange={handleChange}
            placeholder="BAR123456"
            className="w-full h-11 border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Role */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Advocate Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full h-11 border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <label className="block mb-2 font-medium text-gray-700">
            Practice Area
          </label>
          <select
            name="practiceArea"
            value={formData.practiceArea}
            onChange={handleChange}
            className="w-full h-11 border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <label className="block mb-2 font-medium text-gray-700">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full h-11 border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <label className="block mb-2 font-medium text-gray-700">
            Due Date
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full h-11 border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
      </div>

      {/* Assignment Notes */}
      <div className="mt-5">
        <label className="block mb-2 font-medium text-gray-700">
          Assignment Notes / Instructions
        </label>

        <textarea
          name="assignmentNotes"
          value={formData.assignmentNotes}
          onChange={handleChange}
          rows={4}
          placeholder="Enter instructions for the advocate..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 border-t pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Assign Case
        </button>
      </div>
    </form>
  </div>
</div>


);
}
