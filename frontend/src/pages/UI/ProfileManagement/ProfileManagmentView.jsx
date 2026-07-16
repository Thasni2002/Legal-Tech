"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import SelectField from "@/components/SelectField/SelectField";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";
import ResetPasswordModal from "./ResetPasswordModal";

/* ─── tiny Eye icons ─── */
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ─── Password strength helper ─── */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: "Too Short", color: "bg-red-400" },
    { label: "Weak", color: "bg-red-400" },
    { label: "Fair", color: "bg-yellow-400" },
    { label: "Good", color: "bg-blue-400" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  return { score, ...map[score] };
}

/* ────────────────────────────────────────────────────────── */
export default function ProfileManagmentView({ onSubmit, onCancel, initialData }) {
  const specializationOptionsMap = {
    "Civil Law": ["Property Disputes", "Contracts", "Torts", "Consumer Protection"],
    "Criminal Law": ["Bail Matters", "Cyber Crime", "White Collar Crime", "Narcotics"],
    "Corporate Law": ["Mergers & Acquisitions", "Intellectual Property", "Taxation", "Compliance"],
    "Family Law": ["Divorce", "Child Custody", "Alimony", "Domestic Violence"],
    "Property Law": ["Real Estate", "Land Disputes", "Tenant Rights", "Wills & Estates"],
  };

  const cleanInitialData = initialData
    ? Object.fromEntries(Object.entries(initialData).map(([k, v]) => [k, v === null ? "" : v]))
    : {};

  /* ── Profile form state ── */
  const [formData, setFormData] = useState({
    advocateName: "",
    barCouncilId: "",
    enrollmentNumber: "",
    phoneNumber: "",
    emailAddress: "",
    gender: "",
    panNumber: "",
    practiceCourt: "",
    courtType: "",
    yearsOfExperience: "",
    specialization: "",
    city: "",
    state: "",
    pincode: "",
    chambersAddress: "",
    profileImage: "",
    ...cleanInitialData,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /* ── Reset-Password modal state ── */
  const [showResetModal, setShowResetModal] = useState(false);

  const [user, setUser] = useState(null);
  const isClient = user?.role?.toLowerCase() === "client";

  useEffect(() => {
    setTimeout(() => {
      setUser(getLoggedInUser());
    }, 0);
  }, []);

  /* ── Profile validation ── */
  function validateField(name, value) {
    switch (name) {
      case "advocateName": if (!value.trim()) return isClient ? "Full Name is required" : "Advocate Name is required"; return "";
      case "barCouncilId": if (!isClient) { if (!value.trim()) return "Bar Council ID is required"; if (!/^K\/\d{1,5}\/\d{4}$/i.test(value.trim())) return "Must be Kerala format (e.g., K/1234/2023)"; } return "";
      case "phoneNumber": if (value && !/^\d{10}$/.test(value)) return "Phone Number must be 10 digits"; return "";
      case "emailAddress": if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address"; return "";
      case "practiceCourt": if (!isClient && !value.trim()) return "Practice Court is required"; return "";
      case "city": return "";      
      case "state": return "";
      case "pincode": if (value && !/^\d{6}$/.test(value)) return "Pincode must be 6 digits"; return "";
      case "chambersAddress": return "";      
      case "yearsOfExperience": if (value && (isNaN(value) || Number(value) < 0)) return "Experience must be positive"; return "";
      default: return "";
    }
  }

  function validateAll() {
    const fields = ["advocateName", "barCouncilId",  "phoneNumber", "emailAddress", "practiceCourt", "yearsOfExperience"];
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

  /* ── Profile change/submit ── */


  const handleChange = (e) => {
    const { name, value } = e.target;
    const numberFields = ["phoneNumber", "pincode", "yearsOfExperience"];
    if (numberFields.includes(name)) {
      if (!/^\d*$/.test(value)) return;
    }
    let finalValue = value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
      ...(name === "practiceCourt" ? { specialization: "" } : {}),
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
        setFormData((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    if (onSubmit) onSubmit(formData);
  };

  /* ── Render ── */
  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto">
      <form id="profile-form" className="space-y-8" onSubmit={handleSubmit}>
        {/* Profile Photo Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-10 flex flex-col items-center">
          {/* Header Action Row inside Card */}
          <div className="w-full flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] shrink-0 cursor-pointer"
            >
              Save Profile
            </button>
          </div>

          <div className="relative group">
            <img
              src={formData.profileImage || (user ? `https://ui-avatars.com/api/?name=${user.firstName || user.username}&background=2563EB&color=fff&rounded=true&bold=true&size=150` : "https://ui-avatars.com/api/?name=?&background=E2E8F0&color=64748B&rounded=true&bold=true&size=150")}
              alt="profile"
              className="w-36 h-36 rounded-full object-cover border-[6px] border-white shadow-xl shadow-slate-300/50 transition-transform group-hover:scale-105"
            />
            <label className="absolute bottom-1 right-1 bg-[#0F172A] hover:bg-[#1E293B] text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-[#0F172A] tracking-tight">Profile Photo</h2>
          <p className="text-[#64748B] text-sm mt-1 font-medium">Upload a professional photo for your profile</p>
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
                  <InputField label="Bar Council ID" placeholder="e.g. K/1234/2023" name="barCouncilId" value={formData.barCouncilId} onChange={handleChange} />
                  {touched.barCouncilId && errors.barCouncilId && <p className="text-red-500 text-sm mt-1">{errors.barCouncilId}</p>}
                </div>
              </>
            )}

            <div>
              <InputField label="Phone Number" placeholder="Enter Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
              {touched.phoneNumber && errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>
            <div>
              <InputField label="Email Address" type="email" placeholder="e.g. example@email.com" name="emailAddress" value={formData.emailAddress} onChange={handleChange} />
              {touched.emailAddress && errors.emailAddress && <p className="text-red-500 text-sm mt-1">{errors.emailAddress}</p>}
            </div>

            <div>
              <SelectField label="Gender" options={["Male", "Female", "Other"]} name="gender" value={formData.gender} onChange={handleChange} />
              {touched.gender && errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>
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
                <SelectField label="Practice Court" options={[
                  "District Court",
                  "High Court",
                  "Supreme Court",
                  "Family Court",
                  "Consumer Court",
                  "Labour Court",
                  "Tribunal"
                ]} name="practiceCourt" value={formData.practiceCourt} onChange={handleChange} />
                {touched.practiceCourt && errors.practiceCourt && <p className="text-red-500 text-sm mt-1">{errors.practiceCourt}</p>}
              </div>

              <div>
                <InputField label="Years of Experience" type="number" placeholder="Enter Experience" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} />
                {touched.yearsOfExperience && errors.yearsOfExperience && <p className="text-red-500 text-sm mt-1">{errors.yearsOfExperience}</p>}
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
              <InputField label="City (Optional)" placeholder="Enter City" name="city" value={formData.city} onChange={handleChange} />
              {touched.city && errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            <div>
              <InputField label="State (Optional)" placeholder="Enter State" name="state" value={formData.state} onChange={handleChange} />
              {touched.state && errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>
            <div>
              <InputField label="Pincode" placeholder="Enter Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
              {touched.pincode && errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
            </div>
          </div>
          <div className="mt-8">
            <label className="block mb-2 text-sm font-medium text-[#0F172A]">
              {isClient ? "Residential Address (Optional)" : "Chambers Address (Optional)"}
            </label>
            <div>
              <textarea
                rows="4"
                placeholder={isClient ? "Enter Residential Address" : "Enter Chambers Address"}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 outline-none transition-all duration-200 ${touched.chambersAddress && errors.chambersAddress ? "border-red-500 focus:ring-red-500/20" : "border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"}`}
                name="chambersAddress"
                value={formData.chambersAddress}
                onChange={handleChange}
              />
              {touched.chambersAddress && errors.chambersAddress && <p className="text-red-500 text-sm mt-1">{errors.chambersAddress}</p>}
            </div>
          </div>
        </div>

        {/* About Section */}
        {isClient && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">📝</span>
              About Me
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
        )}

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

      {/* ── Reset Password Card (opens modal) ── */}
      {user && (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-base">🔒</span>
                Reset Password
              </h2>
              <p className="text-[#64748B] text-sm mt-1 ml-11">
                Change your password securely using email OTP verification.
              </p>
            </div>
            <button
              type="button"
              id="open-reset-modal-btn"
              onClick={() => setShowResetModal(true)}
              className="px-7 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Reset Password
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showResetModal && (
        <ResetPasswordModal onClose={() => setShowResetModal(false)} />
      )}
    </div>
  );
}