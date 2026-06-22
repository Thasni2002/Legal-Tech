"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import SelectField from "@/components/SelectField/SelectField";

export default function LawfirmAdd({ onCancel, initialData }) {
  const router = useRouter();

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
          `http://127.0.0.1:8000/lawfirm-management/${formData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch("http://127.0.0.1:8000/lawfirm-management/", {
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

      router.push("/lawfirm-management");
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F1F5F9] pb-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Law Firm Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create and manage advocate profiles affiliated with your firm.
          </p>
        </div>

        <Button
          title={formData.id ? "Update Profile" : "Save Profile"}
          type="submit"
          form="profile-form"
          variant="primary"
        />
      </div>

      <form
        id="profile-form"
        className="space-y-6 md:space-y-8"
        onSubmit={handleSubmit}
      >
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={
                  formData.profileImage ||
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43?w=400"
                }
                alt="profile"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-[#E2E8F0]"
              />

              <label className="absolute bottom-1 right-1 bg-[#2563EB] text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-md">
                📷
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <h2 className="mt-4 text-base font-bold text-[#0F172A]">
              Law Firm Profile
            </h2>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-5">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <InputField label="Advocate Name" name="advocateName" value={formData.advocateName} onChange={handleChange} />
            <InputField label="Bar Council ID" name="barCouncilId" value={formData.barCouncilId} onChange={handleChange} />
            <InputField label="Enrollment Number" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} />
            <InputField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
            <InputField label="Email Address" name="emailAddress" value={formData.emailAddress} onChange={handleChange} />
            <InputField label="Date of Birth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />

            <SelectField
              label="Gender"
              options={["Male", "Female", "Other"]}
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            />

            <InputField label="Aadhaar Number" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} />
            <InputField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} />
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-5">
            Professional Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-5">
            Address Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <InputField label="City" name="city" value={formData.city} onChange={handleChange} />
            <InputField label="State" name="state" value={formData.state} onChange={handleChange} />
            <InputField label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
          </div>

          <div className="mt-5">
            <textarea
              rows="4"
              placeholder="Enter Chambers Address"
              className="w-full rounded-lg border px-4 py-3"
              name="chambersAddress"
              value={formData.chambersAddress}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-5">About Advocate</h2>

          <textarea
            rows="5"
            placeholder="Write a short professional bio..."
            className="w-full rounded-lg border px-4 py-3"
            name="about"
            value={formData.about}
            onChange={handleChange}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-row gap-3 pt-4 border-t border-[#F1F5F9]">
          <Button
            title={formData.id ? "Update Profile" : "Save Profile"}
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