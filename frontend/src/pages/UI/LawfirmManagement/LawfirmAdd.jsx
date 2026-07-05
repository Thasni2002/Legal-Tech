"use client";

import { API_BASE_URL } from "@/utils/api";

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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const specializationOptionsMap = {
    "Civil Law": ["Property Disputes", "Contracts", "Torts", "Consumer Protection"],
    "Criminal Law": ["Bail Matters", "Cyber Crime", "White Collar Crime", "Narcotics"],
    "Corporate Law": ["Mergers & Acquisitions", "Intellectual Property", "Taxation", "Compliance"],
    "Family Law": ["Divorce", "Child Custody", "Alimony", "Domestic Violence"],
    "Property Law": ["Real Estate", "Land Disputes", "Tenant Rights", "Wills & Estates"]
  };

  const getSpecializationOptions = () => {
    return formData?.practiceArea && specializationOptionsMap[formData.practiceArea] 
      ? specializationOptionsMap[formData.practiceArea] 
      : ["Select Practice Area first"];
  };

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


  function validateField(name, value) {
    switch (name) {
      case "advocateName":
        if (!value.trim()) return "Advocate Name is required";
        return "";

      case "barCouncilId":
        if (!value.trim()) return "Bar Council ID is required";
        if (!/^K\/\d{1,5}\/\d{4}$/i.test(value.trim())) return "Must be Kerala format (e.g., K/1234/2023)";
        return "";

      case "enrollmentNumber":
        if (!value.trim()) return "Enrollment Number is required";
        if (!/^K\/\d{1,5}\/\d{4}$/i.test(value.trim())) return "Must be Kerala format (e.g., K/1234/2023)";
        return "";

      case "phoneNumber":
        if (value && !/^\d{10}$/.test(value))
          return "Phone Number must be 10 digits";
        return "";

      case "aadhaarNumber":
        if (value && !/^\d{12}$/.test(value))
          return "Aadhaar Number must be 12 digits";
        return "";

      case "emailAddress":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email address";
        return "";

      case "panNumber":
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value))
          return "Invalid PAN Number format (e.g. ABCDE1234F)";
        return "";

      case "practiceArea":
        if (!value.trim()) return "Practice Area is required";
        return "";

      case "courtType":
        if (!value.trim()) return "Court Type is required";
        return "";

      case "city":
        if (!value.trim()) return "City is required";
        return "";

      case "state":
        if (!value.trim()) return "State is required";
        return "";

      case "pincode":
        if (value && !/^\d{6}$/.test(value))
          return "Pincode must be 6 digits";
        return "";

      case "chambersAddress":
        if (!value.trim()) return "Chambers Address is required";
        return "";

      case "yearsOfExperience":
        if (value && (isNaN(value) || Number(value) < 0))
          return "Years of Experience must be a positive number";
        return "";

      default:
        return "";
    }
  }

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

    let finalValue = value;
    if (name === "panNumber") {
      finalValue = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
      ...(name === "practiceArea" ? { specialization: "" } : {})
    }));

    const error = validateField(name, value);

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: error,
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

  function validateAll() {
    const fields = [
      "advocateName",
      "barCouncilId",
      "enrollmentNumber",
      "phoneNumber",
      "emailAddress",
      "aadhaarNumber",
      "practiceArea",
      "courtType",
      "yearsOfExperience",
      "city",
      "state",
      "pincode",
      "chambersAddress"
    ];

    const newErrors = {};
    const newTouched = {};
    let valid = true;

    fields.forEach((field) => {
      const err = validateField(field, formData[field] || "");
      newErrors[field] = err;
      newTouched[field] = true;

      if (err) valid = false;
    });

    setErrors(newErrors);
    setTouched(newTouched);

    return valid;
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    try {
      const payload = {
        advocateName: formData.advocateName,
        barCouncilId: formData.barCouncilId,
        enrollmentNumber: formData.enrollmentNumber,
        phoneNumber: formData.phoneNumber,
        emailAddress: formData.emailAddress,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
        practiceArea: formData.practiceArea,
        courtType: formData.courtType,
        yearsOfExperience: formData.yearsOfExperience
          ? Number(formData.yearsOfExperience)
          : null,
        languagesKnown: formData.languagesKnown,
        lawFirmName: formData.lawFirmName,
        specialization: formData.specialization,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        chambersAddress: formData.chambersAddress,
        about: formData.about,
        profileImage: formData.profileImage,
        status: formData.status || "Active",
      };

      let response;

      if (formData.id) {
        response = await fetch(
          `${API_BASE_URL}/lawfirm-management/${formData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/lawfirm-management/`, {
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
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
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
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              👤
            </span>
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Advocate Name */}
            <div>
              <InputField
                label="Advocate Name"
                name="advocateName"
                value={formData.advocateName}
                onChange={handleChange}
              />
              {touched.advocateName && errors.advocateName && (
                <p className="text-red-500 text-sm mt-1">{errors.advocateName}</p>
              )}
            </div>

            {/* Bar Council ID */}
            <div>
              <InputField
                label="Bar Council ID"
                name="barCouncilId"
                placeholder="e.g. K/1234/2023"
                value={formData.barCouncilId}
                onChange={handleChange}
              />
              {touched.barCouncilId && errors.barCouncilId && (
                <p className="text-red-500 text-sm mt-1">{errors.barCouncilId}</p>
              )}
            </div>

            {/* Enrollment Number */}
            <div>
              <InputField
                label="Enrollment Number"
                name="enrollmentNumber"
                placeholder="e.g. K/1234/2023"
                value={formData.enrollmentNumber}
                onChange={handleChange}
              />
              {touched.enrollmentNumber && errors.enrollmentNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.enrollmentNumber}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <InputField
                label="Phone Number (Optional)"
                placeholder="e.g. 9876543210"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                maxLength={10}
              />
              {touched.phoneNumber && errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <InputField
                label="Email Address (Optional)"
                type="email"
                placeholder="e.g. example@email.com"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
              />
              {touched.emailAddress && errors.emailAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.emailAddress}</p>
              )}
            </div>

            {/* Date of Birth */}
            <InputField
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />

            {/* Gender */}
            <SelectField
              label="Gender"
              options={["Male", "Female", "Other"]}
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            />

            {/* Aadhaar */}
            <div>
              <InputField
                label="Aadhaar Number (Optional)"
                name="aadhaarNumber"
                placeholder="1234 5678 9012"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                maxLength={12}
              />
              {touched.aadhaarNumber && errors.aadhaarNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.aadhaarNumber}</p>
              )}
            </div>

            {/* PAN */}
            <div>
              <InputField
                label="PAN Number (Optional)"
                placeholder="e.g. ABCDE1234F"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
              />
              {touched.panNumber && errors.panNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.panNumber}</p>
              )}
            </div>

          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-10 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              ⚖️
            </span>
            Professional Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Practice Area */}
            <div>
              <SelectField
                label="Practice Area"
                options={[
                  "Civil Law",
                  "Criminal Law",
                  "Corporate Law",
                  "Family Law",
                  "Property Law"
                ]}
                name="practiceArea"
                value={formData.practiceArea}
                onChange={handleChange}
              />
              {touched.practiceArea && errors.practiceArea && (
                <p className="text-red-500 text-sm mt-1">{errors.practiceArea}</p>
              )}
            </div>

            {/* Specialization */}
            <div>
              <SelectField
                label="Specialization (Optional)"
                options={getSpecializationOptions()}
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                disabled={!formData.practiceArea}
              />
            </div>

            {/* Court Type */}
            <div>
              <SelectField
                label="Court Type"
                options={[
                  "District Court",
                  "High Court",
                  "Supreme Court"
                ]}
                name="courtType"
                value={formData.courtType}
                onChange={handleChange}
              />
              {touched.courtType && errors.courtType && (
                <p className="text-red-500 text-sm mt-1">{errors.courtType}</p>
              )}
            </div>

            {/* Years of Experience */}
            <div>
              <InputField
                label="Years of Experience (Optional)"
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
              />
              {touched.yearsOfExperience && errors.yearsOfExperience && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.yearsOfExperience}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <SelectField
                label="Status"
                options={["Active", "Inactive"]}
                name="status"
                value={formData.status || "Active"}
                onChange={handleChange}
              />
            </div>

          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-10 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              🏢
            </span>
            Address Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* City */}
            <div>
              <InputField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              {touched.city && errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            {/* State */}
            <div>
              <InputField
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
              {touched.state && errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            {/* Pincode */}
            <div>
              <InputField
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                maxLength={6}
              />
              {touched.pincode && errors.pincode && (
                <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
              )}
            </div>

          </div>

          {/* Chambers Address */}
          <div className="mt-8">
            <label className="block mb-2 text-sm font-medium text-[#0F172A]">
              Chambers Address
            </label>

            <textarea
              rows="4"
              placeholder="Enter Chambers Address"
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 outline-none transition-all duration-200 ${
                touched.chambersAddress && errors.chambersAddress
                  ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                  : "border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              }`}
              name="chambersAddress"
              value={formData.chambersAddress}
              onChange={handleChange}
            />

            {touched.chambersAddress && errors.chambersAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.chambersAddress}
              </p>
            )}
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-10 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              📝
            </span>
            About Advocate (Optional)
          </h2>

          <textarea
            rows="5"
            placeholder="Write a short professional bio..."
            className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
            name="about"
            value={formData.about}
            onChange={handleChange}
          />

          {touched.about && errors.about && (
            <p className="text-red-500 text-sm mt-1">
              {errors.about}
            </p>
          )}
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
      {showSuccessModal && mounted && createPortal(
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