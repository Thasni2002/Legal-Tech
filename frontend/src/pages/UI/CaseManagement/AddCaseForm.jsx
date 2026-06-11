"use client";

import { useState } from "react";

export default function AddCaseForm({ onSave }) {
  const [formData, setFormData] = useState({
    caseTitle: "",
    caseNo: "",
    client: "",
    court: "",
    nextHearing: "",
    status: "Active",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      title: formData.caseTitle,
      caseNo: formData.caseNo,
      client: formData.client,
      court: formData.court,
      hearing: formData.nextHearing,
      status: formData.status,
    });

    setFormData({
      caseTitle: "",
      caseNo: "",
      client: "",
      court: "",
      nextHearing: "",
      status: "Active",
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow">
      <h2 className="text-2xl font-bold mb-6">
        Add New Case
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="caseTitle"
          placeholder="Case Title"
          value={formData.caseTitle}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
          required
        />

        <input
          type="text"
          name="caseNo"
          placeholder="Case Number"
          value={formData.caseNo}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
          required
        />

        <input
          type="text"
          name="client"
          placeholder="Client Name"
          value={formData.client}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
          required
        />

        <input
          type="text"
          name="court"
          placeholder="Court Name"
          value={formData.court}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
          required
        />

        <input
          type="date"
          name="nextHearing"
          value={formData.nextHearing}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
          required
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        >
          <option>Active</option>
          <option>Pending</option>
          <option>Closed</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Save Case
        </button>

      </form>
    </div>
  );
}