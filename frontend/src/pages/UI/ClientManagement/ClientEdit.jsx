"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientEdit({ onSave, onCancel }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    clientId: "",
    fullName: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    assignedAdvocate: "",
    caseTitle: "",
    caseType: "",
    caseNumber: "",
    courtName: "",
    nextHearing: "",
    caseStatus: "",
  });

  const courts = [
    "Supreme Court",
    "High Court",
    "District Court",
    "Family Court",
    "Consumer Court",
    "Labour Court",
    "Sessions Court",
    "Magistrate Court",
  ];

  const advocates = [
    "Adv. Arjun Menon",
    "Adv. Priya Nair",
    "Adv. Rahul Krishnan",
  ];

  useEffect(() => {
    const data = localStorage.getItem("clientData");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch (err) {
        console.error("Failed to parse clientData:", err);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.clientId ||
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.caseType ||
      !formData.courtName
    ) {
      alert("Please fill all required fields");
      return;
    }

    localStorage.setItem("clientData", JSON.stringify(formData));
    alert("Client Updated Successfully");

    if (onSave) {
      onSave(formData);
    } else {
      router.push("/client-management");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">
          Edit Client Details
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Client ID *</label>
              <input
                type="text"
                name="clientId"
                placeholder="Client ID"
                value={formData.clientId}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full bg-slate-50 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Mobile Number *</label>
              <input
                type="text"
                name="phone"
                placeholder="Mobile Number"
                value={formData.phone}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp Number</label>
              <input
                type="text"
                name="whatsapp"
                placeholder="WhatsApp Number"
                value={formData.whatsapp}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Address</label>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">City</label>
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">State</label>
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Pincode</label>
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Assigned Advocate</label>
              <select
                name="assignedAdvocate"
                value={formData.assignedAdvocate}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full text-gray-500"
              >
                <option value="">Select Advocate</option>
                {advocates.map((adv) => (
                  <option key={adv} value={adv}>
                    {adv}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Case Title</label>
              <input
                type="text"
                name="caseTitle"
                placeholder="Case Title"
                value={formData.caseTitle}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Case Type *</label>
              <select
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full text-gray-500"
              >
                <option value="">Select Case Type</option>
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
                <option value="Family">Family</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Case Number</label>
              <input
                type="text"
                name="caseNumber"
                placeholder="Case Number"
                value={formData.caseNumber}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Court Name *</label>
              <select
                name="courtName"
                value={formData.courtName}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full text-gray-500"
              >
                <option value="">Select Court</option>
                {courts.map((court) => (
                  <option key={court} value={court}>
                    {court}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Next Hearing Date</label>
              <input
                type="date"
                name="nextHearing"
                value={formData.nextHearing}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Case Status</label>
              <select
                name="caseStatus"
                value={formData.caseStatus}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full text-gray-500"
              >
                <option value="">Case Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Update Client
            </button>

            <button
              type="button"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  router.push("/client-management");
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}