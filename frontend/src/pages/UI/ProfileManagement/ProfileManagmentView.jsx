"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import SelectField from "@/components/SelectField/SelectField";
import { getLoggedInUser } from "@/utils/auth";

export default function ProfileManagmentView({ onSubmit, onCancel, initialData }) {
  const specializationOptionsMap = {
    "Civil Law": ["Property Disputes", "Contracts", "Torts", "Consumer Protection"],
    "Criminal Law": ["Bail Matters", "Cyber Crime", "White Collar Crime", "Narcotics"],
    "Corporate Law": ["Mergers & Acquisitions", "Intellectual Property", "Taxation", "Compliance"],
    "Family Law": ["Divorce", "Child Custody", "Alimony", "Domestic Violence"],
    "Property Law": ["Real Estate", "Land Disputes", "Tenant Rights", "Wills & Estates"]
  };

  const cleanInitialData = initialData
    ? Object.fromEntries(Object.entries(initialData).map(([k, v]) => [k, v === null ? "" : v]))
    : {};

  const [formData, setFormData] = useState({
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
    ...cleanInitialData,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [user, setUser] = useState(null);
  const isClient = user?.role?.toLowerCase() === "client";

  useEffect(() => {
    setUser(getLoggedInUser());
  }, []);

  function validateField(name, value) {
    switch (name) {
      case "advocateName": if (!value.trim()) return isClient ? "Full Name is required" : "Advocate Name is required"; return "";
      case "barCouncilId": if (!isClient) { if (!value.trim()) return "Bar Council ID is required"; if (!/^K\/\d{1,5}\/\d{4}$/i.test(value.trim())) return "Must be Kerala format (e.g., K/1234/2023)"; } return "";
      case "enrollmentNumber": if (!isClient) { if (!value.trim()) return "Enrollment Number is required"; if (!/^K\/\d{1,5}\/\d{4}$/i.test(value.trim())) return "Must be Kerala format (e.g., K/1234/2023)"; } return "";
      case "phoneNumber": if (value && !/^\d{10}$/.test(value)) return "Phone Number must be 10 digits"; return "";
      case "aadhaarNumber": if (value && !/^\d{12}$/.test(value)) return "Aadhaar Number must be 12 digits"; return "";
      case "emailAddress": if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address"; return "";
      case "panNumber": if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) return "Invalid PAN Number format (e.g. ABCDE1234F)"; return "";
      case "practiceArea": if (!isClient && !value.trim()) return "Practice Area is required"; return "";
      case "courtType": if (!isClient && !value.trim()) return "Court Type is required"; return "";
      case "city": if (!value.trim()) return "City is required"; return "";
      case "state": if (!value.trim()) return "State is required"; return "";
      case "pincode": if (value && !/^\d{6}$/.test(value)) return "Pincode must be 6 digits"; return "";
      case "chambersAddress": if (!isClient && !value.trim()) return "Address is required"; return "";
      case "yearsOfExperience": if (value && (isNaN(value) || Number(value) < 0)) return "Experience must be positive"; return "";
      default: return "";
    }
  }

  function validateAll() {
    const fields = ["advocateName", "barCouncilId", "enrollmentNumber", "phoneNumber", "emailAddress", "aadhaarNumber", "practiceArea", "courtType", "yearsOfExperience", "city", "state", "pincode", "chambersAddress"];
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



  const getSpecializationOptions = () => {
    return formData?.practiceArea && specializationOptionsMap[formData.practiceArea] 
      ? specializationOptionsMap[formData.practiceArea] 
      : ["Select Practice Area first"];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const numberFields = ["phoneNumber", "aadhaarNumber", "pincode", "yearsOfExperience"];
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

    const error = validateField(name, finalValue);
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: error }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-[#0F172A] font-extrabold text-3xl tracking-tight">
              Edit Profile
            </h1>
            <p className="text-[#64748B] mt-2 font-medium">
              Manage your personal and professional profile details
            </p>
          </div>
          <button
            type="submit"
            form="profile-form"
            className="px-8 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] shrink-0"
          >
            Save Profile
          </button>
        </div>

        <form id="profile-form" className="space-y-8" onSubmit={handleSubmit}>
          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-10 flex flex-col items-center">
            <div className="relative group">
              <img
                src={formData.profileImage || (user ? `https://ui-avatars.com/api/?name=${user.firstName || user.username}&background=2563EB&color=fff&rounded=true&bold=true&size=150` : "https://ui-avatars.com/api/?name=?&background=E2E8F0&color=64748B&rounded=true&bold=true&size=150")}
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
              Profile Photo
            </h2>
            <p className="text-[#64748B] text-sm mt-1 font-medium">
              Upload a professional photo for your profile
            </p>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">👤</span>
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div>
              <InputField
                label={isClient ? "Full Name" : "Advocate Name"}
                placeholder={isClient ? "Enter Full Name" : "Enter Advocate Name"}
                name="advocateName"
                value={formData.advocateName}
                onChange={handleChange}
              />
              {touched.advocateName && errors.advocateName && (
                <p className="text-red-500 text-sm mt-1">{errors.advocateName}</p>
              )}
            </div>



              {!isClient && (
                <>
                  <div>
                    <InputField
                      label="Bar Council ID"
                      placeholder="e.g. K/1234/2023"
                      name="barCouncilId"
                      value={formData.barCouncilId}
                      onChange={handleChange}
                    />
                    {touched.barCouncilId && errors.barCouncilId && (
                      <p className="text-red-500 text-sm mt-1">{errors.barCouncilId}</p>
                    )}
                  </div>

                  <div>
                    <InputField
                      label="Enrollment Number"
                      placeholder="e.g. K/1234/2023"
                      name="enrollmentNumber"
                      value={formData.enrollmentNumber}
                      onChange={handleChange}
                    />
                    {touched.enrollmentNumber && errors.enrollmentNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.enrollmentNumber}</p>
                    )}
                  </div>
                </>
              )}

              <div>
              <InputField
                label="Phone Number"
                placeholder="Enter Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {touched.phoneNumber && errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>

              <div>
              <InputField
                label="Email Address"
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

              <div>
              <InputField
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {touched.dateOfBirth && errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

              <div>
              <SelectField
                label="Gender"
                options={["Male", "Female", "Other"]}
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              />
              {touched.gender && errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>

              <div>
              <InputField
                label="Aadhaar Number"
                placeholder="Enter Aadhaar Number"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleChange}
              />
              {touched.aadhaarNumber && errors.aadhaarNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.aadhaarNumber}</p>
              )}
            </div>

              {!isClient && (
                <div>
                  <InputField
                    label="PAN Number"
                    placeholder="e.g. ABCDE1234F"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                  />
                  {touched.panNumber && errors.panNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.panNumber}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          {!isClient && (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
              <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">⚖️</span>
                Professional Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div>
                <SelectField
                  label="Practice Area"
                  options={[
                    "Civil Law",
                    "Criminal Law",
                    "Corporate Law",
                    "Family Law",
                    "Property Law",
                  ]}
                  name="practiceArea"
                  value={formData.practiceArea}
                  onChange={handleChange}
                />
                {touched.practiceArea && errors.practiceArea && (
                  <p className="text-red-500 text-sm mt-1">{errors.practiceArea}</p>
                )}
              </div>

                <div>
                <SelectField
                  label="Court Type"
                  options={[
                    "District Court",
                    "High Court",
                    "Supreme Court",
                  ]}
                  name="courtType"
                  value={formData.courtType}
                  onChange={handleChange}
                />
                {touched.courtType && errors.courtType && (
                  <p className="text-red-500 text-sm mt-1">{errors.courtType}</p>
                )}
              </div>

                <div>
                <InputField
                  label="Years of Experience"
                  type="number"
                  placeholder="Enter Experience"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                />
                {touched.yearsOfExperience && errors.yearsOfExperience && (
                  <p className="text-red-500 text-sm mt-1">{errors.yearsOfExperience}</p>
                )}
              </div>

                <div>
                <SelectField
                  label="Specialization"
                  options={getSpecializationOptions()}
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  disabled={!formData.practiceArea}
                />
                {touched.specialization && errors.specialization && (
                  <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>
                )}
              </div>
              </div>
            </div>
          )}

          {/* Address Information */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">🏢</span>
              Address Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div>
              <InputField
                label="City"
                placeholder="Enter City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              {touched.city && errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

              <div>
              <InputField
                label="State"
                placeholder="Enter State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
              {touched.state && errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

              <div>
              <InputField
                label="Pincode"
                placeholder="Enter Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
              {touched.pincode && errors.pincode && (
                <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
              )}
            </div>
            </div>

            <div className="mt-8">
              <label className="block mb-2 text-sm font-medium text-[#0F172A]">
                {isClient ? "Residential Address" : "Chambers Address"}
              </label>

              <div>
                <textarea
                  rows="4"
                  placeholder={isClient ? "Enter Residential Address" : "Enter Chambers Address"}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 outline-none transition-all duration-200 ${
                  touched.chambersAddress && errors.chambersAddress
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                }`}
                name="chambersAddress"
                value={formData.chambersAddress}
                onChange={handleChange}
              />
              {touched.chambersAddress && errors.chambersAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.chambersAddress}</p>
              )}</div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">📝</span>
              {isClient ? "About Me" : "About Advocate"}
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
          <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-8">
            <button
              type="submit"
              className="px-8 py-3.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] w-full sm:w-auto"
            >
              Save Profile
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
    </div>
  );
}