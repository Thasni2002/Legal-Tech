"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ClientEdit({ onSave, onCancel }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    clientId: "",
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const data = localStorage.getItem("clientData");

    if (data) {
      try {
        const parsed = JSON.parse(data);

        setFormData({
          clientId: parsed.clientId || "",
          fullName: parsed.fullName || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
        });
      } catch (err) {
        console.error("Failed to parse client data:", err);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.clientId ||
      !formData.fullName ||
      !formData.email ||
      !formData.phone
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
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/client-management"
            className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">
            Edit Client Details
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Client ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Client ID *
              </label>

              <input
                type="text"
                name="clientId"
                value={formData.clientId}
                disabled
                className="border p-3 rounded-lg w-full bg-slate-100 cursor-not-allowed"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Full Name *
              </label>

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
                placeholder="Enter Full Name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Email Address *
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
                placeholder="Enter Email Address"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Mobile Number *
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
                placeholder="Enter Mobile Number"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}