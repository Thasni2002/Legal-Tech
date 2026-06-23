"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import SelectField from "@/components/SelectField/SelectField";
import { getLoggedInUser } from "@/utils/auth";

export default function ProfileManagmentView({ onSubmit, onCancel, initialData }) {
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
    ...initialData,
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getLoggedInUser());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const handleSubmit = (e) => {
    e.preventDefault();
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
              <InputField
                label="Advocate Name"
                placeholder="Enter Advocate Name"
                name="advocateName"
                value={formData.advocateName}
                onChange={handleChange}
              />

              <InputField
                label="Bar Council ID"
                placeholder="Enter Bar Council ID"
                name="barCouncilId"
                value={formData.barCouncilId}
                onChange={handleChange}
              />

              <InputField
                label="Enrollment Number"
                placeholder="Enter Enrollment Number"
                name="enrollmentNumber"
                value={formData.enrollmentNumber}
                onChange={handleChange}
              />

              <InputField
                label="Phone Number"
                placeholder="Enter Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />

              <InputField
                label="Email Address"
                type="email"
                placeholder="Enter Email Address"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
              />

              <InputField
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />

              <SelectField
                label="Gender"
                options={["Male", "Female", "Other"]}
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              />

              <InputField
                label="Aadhaar Number"
                placeholder="Enter Aadhaar Number"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleChange}
              />

              <InputField
                label="PAN Number"
                placeholder="Enter PAN Number"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">⚖️</span>
              Professional Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

              <InputField
                label="Years of Experience"
                type="number"
                placeholder="Enter Experience"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
              />

              <InputField
                label="Languages Known"
                placeholder="English, Hindi, Malayalam"
                name="languagesKnown"
                value={formData.languagesKnown}
                onChange={handleChange}
              />

              <InputField
                label="Law Firm Name"
                placeholder="Enter Law Firm Name"
                name="lawFirmName"
                value={formData.lawFirmName}
                onChange={handleChange}
              />

              <InputField
                label="Specialization"
                placeholder="Enter Specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">🏢</span>
              Address Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <InputField
                label="City"
                placeholder="Enter City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />

              <InputField
                label="State"
                placeholder="Enter State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />

              <InputField
                label="Pincode"
                placeholder="Enter Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
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

          {/* About Section */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
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