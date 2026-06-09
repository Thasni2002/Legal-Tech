"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientAdd() {
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
    // totalFee: "",
    // amountPaid: "",
    // outstandingAmount: "",
    // notes: "",
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   console.log(formData);
  //   alert("Client Saved Successfully");
  // };

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

  localStorage.setItem(
    "clientData",
    JSON.stringify(formData)
  );

  alert("Client Saved Successfully");

  router.push("/client-management");
};

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">
          Add / Manage Client
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="clientId"
              placeholder="Client ID"
              value={formData.clientId}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            <input
              type="text"
              name="phone"
              placeholder="Mobile Number"
              value={formData.phone}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            <input
              type="text"
              name="whatsapp"
              placeholder="WhatsApp Number"
              value={formData.whatsapp}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            {/* <input
              type="text"
              name="assignedAdvocate"
              placeholder="Assigned Advocate"
              value={formData.assignedAdvocate}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            /> */}

            <select
  name="advocate"
  value={formData.advocate}
  onChange={handleChange}
  className="border p-3 rounded-lg w-full text-gray-500"
>
  <option value="">Select Advocate</option>
  <option value="Adv. Arjun Menon">Adv. Arjun Menon</option>
  <option value="Adv. Priya Nair">Adv. Priya Nair</option>
  <option value="Adv. Rahul Krishnan">Adv. Rahul Krishnan</option>
</select>

            <input
              type="text"
              name="caseTitle"
              placeholder="Case Title"
              value={formData.caseTitle}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

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

            <input
              type="text"
              name="caseNumber"
              placeholder="Case Number"
              value={formData.caseNumber}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />

            {/* <input
              type="text"
              name="courtName"
              placeholder="Court Name"
              value={formData.courtName}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            /> */}

            <select
  name="courtName"
  value={formData.courtName}
  onChange={handleChange}
  className="border p-3 rounded-lg w-full text-gray-500"
>
  <option value="">Select Court</option>
  <option value="Supreme Court">Supreme Court</option>
  <option value="High Court">High Court</option>
  <option value="District Court">District Court</option>
  <option value="Family Court">Family Court</option>
  <option value="Consumer Court">Consumer Court</option>
  <option value="Labour Court">Labour Court</option>
  <option value="Sessions Court">Sessions Court</option>
  <option value="Magistrate Court">Magistrate Court</option>
</select>

            <input
              type="date"
              name="nextHearing"
              value={formData.nextHearing}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full text-gray-500"
            />

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

            {/* <input
              type="number"
              name="totalFee"
              placeholder="Total Fee"
              value={formData.totalFee}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            /> */}

            {/* <input
              type="number"
              name="amountPaid"
              placeholder="Amount Paid"
              value={formData.amountPaid}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            /> */}

            {/* <input
              type="number"
              name="outstandingAmount"
              placeholder="Outstanding Amount"
              value={formData.outstandingAmount}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            /> */}
          </div>

          {/* <textarea
            name="notes"
            placeholder="Notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg mt-4"
            rows="4"
          /> */}

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Save Client
            </button>

            <button
              type="reset"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}