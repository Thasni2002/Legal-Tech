"use client";

import { useState } from "react";

export default function AddCaseForm() {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newCase = {
      ...formData,
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
    <div className="bg-white p-6 rounded-xl border shadow max-w-4xl mx-auto">

      {/* Add New Case */}
      <h2 className="text-2xl font-bold mb-6">
        Add New Case
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* Case Information */}
        <div className="space-y-4">

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
            name="caseType"
            placeholder="Case Type"
            value={formData.caseType}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
            required
          />

          <input
            type="text"
            name="caseCat"
            placeholder="Case Category"
            value={formData.caseCat}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
            required
          />

          <textarea
            name="caseDes"
            placeholder="Case Description"
            value={formData.caseDes}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
            rows="4"
            required
          />
        </div>

        {/* Client Information */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Client Information
          </h2>

          <div className="space-y-4">

            <input
              type="text"
              name="clientName"
              placeholder="Client Name"
              value={formData.clientName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              type="tel"
              name="contactNumber"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              type="email"
              name="emailId"
              placeholder="Email ID"
              value={formData.emailId}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>
        </div>

        {/* Court Information */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Court Information
          </h2>

          <div className="space-y-4">

            {/* Court Name Dropdown */}
            <select
              name="courtName"
              value={formData.courtName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            >
              <option value="">
                Select Court Name
              </option>

              <option value="Supreme Court">
                Supreme Court
              </option>

              <option value="High Court">
                High Court
              </option>

              <option value="District Court">
                District Court
              </option>

              <option value="Family Court">
                Family Court
              </option>

              <option value="Consumer Court">
                Consumer Court
              </option>

              <option value="Motor Accident Tribunal">
                Motor Accident Tribunal
              </option>
            </select>

            {/* Court Type Dropdown */}
            <select
              name="courtType"
              value={formData.courtType}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            >
              <option value="">
                Select Court Type
              </option>

              <option value="Civil">
                Civil
              </option>

              <option value="Criminal">
                Criminal
              </option>

              <option value="Family">
                Family
              </option>

              <option value="Consumer">
                Consumer
              </option>

              <option value="Corporate">
                Corporate
              </option>

              <option value="Labour">
                Labour
              </option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Case Status
          </h2>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option value="Active">
              Active
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Closed">
              Closed
            </option>
          </select>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Save Case
        </button>

      </form>
    </div>
  );
}