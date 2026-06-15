"use client";

import React, { useState } from "react";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import SelectField from "@/components/SelectField/SelectField";

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
    <div className="w-full space-y-6 md:space-y-8">
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
              Profile Management
            </h1>
            <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
              Manage your personal and professional profile details
            </p>
          </div>
          <Button
            title="Save Profile"
            type="submit"
            form="profile-form"
            variant="primary"
          />
        </div>

        <form id="profile-form" className="space-y-8" onSubmit={handleSubmit}>
          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={formData.profileImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43?w=400"}
                  alt="profile"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                />

                <label className="absolute bottom-0 right-0 bg-[#2563EB] text-white w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                  📷
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <h2 className="mt-4 text-xl font-bold text-[#0F172A]">
                Advocate Profile
              </h2>

              <p className="text-[#64748B] text-sm">
                Update your personal and professional details
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
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
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
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
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
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

            <div className="mt-6">
              <label className="block mb-2 font-medium text-[#334155]">
                Chambers Address
              </label>

              <textarea
                rows="4"
                placeholder="Enter Chambers Address"
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] placeholder:text-[#0F172A] focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none"
                name="chambersAddress"
                value={formData.chambersAddress}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
              About Advocate
            </h2>

            <textarea
              rows="5"
              placeholder="Write a short professional bio..."
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] placeholder:text-[#0F172A] focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none"
              name="about"
              value={formData.about}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              title="Save Profile"
              type="submit"
              variant="primary"
            />

            <Button
              title="Cancel"
              type="button"
              variant="secondary"
              onClick={onCancel}
            />
          </div>
        </form>
    </div>
  );
}