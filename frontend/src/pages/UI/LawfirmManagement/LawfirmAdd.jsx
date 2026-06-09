"use client";

import { useState } from "react";

export default function LawfirmAdd({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    registrationNumber: "",
    establishedDate: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);

    alert("Firm Added Successfully");

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Add / Manage Firm
          </h2>

          <button
            onClick={onClose}
            className="text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">
                Registration Number
              </label>

              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Established Date
              </label>

              <input
                type="date"
                name="establishedDate"
                value={formData.establishedDate}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Firm Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1 font-medium">
                Address
              </label>

              <textarea
                rows="4"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Save Firm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}