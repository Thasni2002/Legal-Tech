"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import SelectField from "@/components/SelectField/SelectField";

export default function LawfirmAdd({ onCancel, initialData }) {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Convert null values in initialData to empty strings to avoid controlled input warnings
  const sanitizedInitialData = {};
  if (initialData) {
    Object.keys(initialData).forEach((key) => {
      sanitizedInitialData[key] = initialData[key] ?? "";
    });
  }

  const [formData, setFormData] = useState({
    id: null,
    advocateName: "",
    barCouncilId: "",
    enrollmentNumber: "",
    phoneNumber: "",
    emailAddress: "",
    dateOfBirth: "",
    gender: "",
    aadhaarNumber: "",
    panNumber: "",
    practiceArea: "",
    courtType: "",
    yearsOfExperience: "",
    languagesKnown: "",
    lawFirmName: "",
    specialization: "",
    city: "",
    state: "",
    pincode: "",
    chambersAddress: "",
    about: "",
    profileImage: "",
    status: "Active",
    ...sanitizedInitialData,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numberFields = [
      "phoneNumber",
      "aadhaarNumber",
      "pincode",
      "yearsOfExperience",
    ];

    if (numberFields.includes(name)) {
      if (!/^\d*$/.test(value)) return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result,
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      alert("Phone Number must be 10 digits");
      return;
    }

    if (
      formData.aadhaarNumber &&
      !/^\d{12}$/.test(formData.aadhaarNumber)
    ) {
      alert("Aadhaar Number must be 12 digits");
      return;
    }

    if (
      formData.pincode &&
      !/^\d{6}$/.test(formData.pincode)
    ) {
      alert("Pincode must be 6 digits");
      return;
    }

    try {
      const payload = {
        advocateName: formData.advocateName,
        barCouncilId: formData.barCouncilId,
        enrollmentNumber: formData.enrollmentNumber,
        phoneNumber: formData.phoneNumber,
        emailAddress: formData.emailAddress,
        specialization: formData.specialization,
        city: formData.city,
        status: formData.status || "Active",
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
        practiceArea: formData.practiceArea,
        courtType: formData.courtType,
        yearsOfExperience: formData.yearsOfExperience,
        languagesKnown: formData.languagesKnown,
        lawFirmName: formData.lawFirmName,
        state: formData.state,
        pincode: formData.pincode,
        chambersAddress: formData.chambersAddress,
        about: formData.about,
        profileImage: formData.profileImage,
      };

      let response;

      if (formData.id) {
        response = await fetch(
          `http://localhost:8000/lawfirm-management/${formData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch("http://localhost:8000/lawfirm-management/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save advocate");
      }

      const data = await response.json();
      console.log("Saved:", data);

      setSuccessMessage(
        formData.id
          ? "Profile updated successfully!"
          : "Profile saved successfully!"
      );

      setShowSuccessModal(true);


    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex items-center gap-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center w-12 h-12 rounded-full border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors shrink-0"
        >
          <ArrowLeft size={20} className="text-[#0F172A]" />
        </button>

        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Law Firm Management
          </h1>
          <p className="text-[#64748B] mt-1 font-medium">
            Create and manage advocate profiles affiliated with your firm.
          </p>
        </div>
      </div>

      <form
        id="profile-form"
        className="space-y-8"
        onSubmit={handleSubmit}
      >
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-10 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img
                src={
                  formData.profileImage ||
                  "https://ui-avatars.com/api/?name=Advocate&background=E2E8F0&color=64748B&rounded=true&bold=true&size=150"
                }
                alt="profile"
                className="w-36 h-36 rounded-full object-cover border-[6px] border-white shadow-xl shadow-slate-300/50 transition-transform group-hover:scale-105"
              />

              <label className="absolute bottom-1 right-1 bg-[#0F172A] hover:bg-[#1E293B] text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <h2 className="mt-6 text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Law Firm Profile
            </h2>
            <p className="text-[#64748B] text-sm mt-1 font-medium">
              Upload a professional photo for this advocate
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-10 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">👤</span>
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <InputField label="Advocate Name" name="advocateName" value={formData.advocateName} onChange={handleChange} />
            <InputField label="Bar Council ID" name="barCouncilId" value={formData.barCouncilId} onChange={handleChange} />
            <InputField label="Enrollment Number" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} />
            <InputField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} maxLength={10} />
            <InputField label="Email Address" name="emailAddress" value={formData.emailAddress} onChange={handleChange} />
            <InputField label="Date of Birth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />

            <SelectField
              label="Gender"
              options={["Male", "Female", "Other"]}
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            />

            <InputField
              label="Aadhaar Number" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} maxLength={12} />
            <InputField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} />
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-10 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">⚖️</span>
            Professional Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <InputField label="Practice Area" name="practiceArea" value={formData.practiceArea} onChange={handleChange} />
            <InputField label="Court Type" name="courtType" value={formData.courtType} onChange={handleChange} />
            <InputField label="Years of Experience" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} />
            <InputField label="Languages Known" name="languagesKnown" value={formData.languagesKnown} onChange={handleChange} />
            <InputField label="Law Firm Name" name="lawFirmName" value={formData.lawFirmName} onChange={handleChange} />
            <InputField label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} />
            <SelectField
              label="Status"
              options={["Active", "Inactive"]}
              name="status"
              value={formData.status || "Active"}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-10 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">🏢</span>
            Address Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <InputField label="City" name="city" value={formData.city} onChange={handleChange} />
            <InputField label="State" name="state" value={formData.state} onChange={handleChange} />
            <InputField
              label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} maxLength={6} />
          </div>

          <div className="mt-8">
            <label className="block mb-2 text-sm font-medium text-[#0F172A]">
              Chambers Address
            </label>
            <textarea
              rows="4"
              placeholder="Enter Chambers Address"
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
              name="chambersAddress"
              value={formData.chambersAddress}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-10 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">📝</span>
            About Advocate
          </h2>

          <textarea
            rows="5"
            placeholder="Write a short professional bio..."
            className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
            name="about"
            value={formData.about}
            onChange={handleChange}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-12">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] w-full sm:w-auto"
          >
            {formData.id ? "Update Profile" : "Save Profile"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </form>
        { showSuccessModal && mounted && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-md text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-3xl">✓</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Success
              </h2>

              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/lawfirm-management");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}