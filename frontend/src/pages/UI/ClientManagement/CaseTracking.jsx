"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CaseTracking() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    caseId: "",
    caseStatus: "",
    shortNote: "",
    nextHearingDate: "",
  });

  const cases = [
    "CR/2026/101",
    "CR/2026/102",
    "CR/2026/103",
  ];

  const statuses = [
    "Filed",
    "Hearing Scheduled",
    "Adjourned",
    "Under Arguments",
    "Judgment Reserved",
    "Closed",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    console.log("Case Update:", formData);

    // API call here

    alert("Case updated successfully");

    router.push("/case-tracking");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-2xl font-bold mb-6">
          Update Case Status
        </h2>

        {/* Case Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Case *
          </label>
          <select
            name="caseId"
            value={formData.caseId}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Choose Case</option>
            {cases.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Case Status */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Case Status *
          </label>
          <select
            name="caseStatus"
            value={formData.caseStatus}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select Status</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Short Note */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Short Note (Optional)
          </label>

          <textarea
            rows={4}
            name="shortNote"
            value={formData.shortNote}
            onChange={handleChange}
            placeholder="Enter case update..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Next Hearing Date */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Next Hearing Date
          </label>

          <input
            type="date"
            name="nextHearingDate"
            value={formData.nextHearingDate}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Save Update
          </button>

          <button
            onClick={() => router.back()}
            className="border px-6 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
