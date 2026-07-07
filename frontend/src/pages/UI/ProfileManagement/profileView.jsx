"use client";

import React, { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";

export default function ProfileView({ profile = {}, onEdit }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getLoggedInUser());
  }, []);

  const isClient = user?.role?.toLowerCase() === "client";

  // Compute role label dynamically
  const roleParts = [];
  if (profile.courtType) roleParts.push(profile.courtType);
  if (profile.specialization) roleParts.push(profile.specialization);
  const roleLabel = isClient ? "Client" : (roleParts.length > 0 ? `${roleParts.join(" (")} Advocate${roleParts.length > 1 ? ")" : ""}` : "Advocate");

  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-8 items-center flex-1">
              {/* Profile Image */}
              <div className="shrink-0">
                <img
                  src={profile.profileImage || (user ? `https://ui-avatars.com/api/?name=${user.firstName || user.username}&background=2563EB&color=fff&rounded=true&bold=true&size=150` : "https://ui-avatars.com/api/?name=?&background=E2E8F0&color=64748B&rounded=true&bold=true&size=150")}
                  alt="Profile"
                  className="w-36 h-36 rounded-full object-cover border-[6px] border-white shadow-xl shadow-slate-300/50 bg-white"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-[#0F172A] font-extrabold text-4xl tracking-tight">
                  {profile.advocateName || profile.clientName || user?.username || (isClient ? "Client Name" : "Advocate Name")}
                </h1>

                <p className="text-[#64748B] mt-2 text-lg font-medium">
                  {roleLabel}
                </p>

                <p className="text-[#475569] mt-4 max-w-2xl text-sm leading-relaxed whitespace-pre-wrap">
                  {profile.about || "No professional bio provided."}
                </p>
              </div>
            </div>

            {onEdit && (
              <div className="mt-6 md:mt-0">
                <button
                  onClick={onEdit}
                  className="px-8 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] cursor-pointer shrink-0"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">👤</span>
              Personal Information
            </h2>

            <div className="space-y-5">
              <InfoRow label="Phone" value={profile.phoneNumber} />
              <InfoRow label="Email" value={profile.emailAddress} />
              <InfoRow label="Date of Birth" value={profile.dateOfBirth} />
              <InfoRow label="Gender" value={profile.gender} />
              <InfoRow label="Aadhaar Number" value={profile.aadhaarNumber} />
              {!isClient && <InfoRow label="PAN Number" value={profile.panNumber} />}
              <InfoRow label="City" value={profile.city} />
              <InfoRow label="State" value={profile.state} />
              <InfoRow label="Pincode" value={profile.pincode} />
            </div>
          </div>

          {/* Professional Information */}
          {!isClient && (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
              <h2 className="text-xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">⚖️</span>
                Professional Information
              </h2>

              <div className="space-y-5">
                <InfoRow label="Bar Council ID" value={profile.barCouncilId} />
                <InfoRow label="Enrollment No" value={profile.enrollmentNumber} />
                <InfoRow label="Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : ""} />
                <InfoRow label="Practice Area" value={profile.practiceArea} />
                <InfoRow label="Court Type" value={profile.courtType} />
                <InfoRow label="Specialization" value={profile.specialization} />
              </div>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
          <h2 className="text-xl font-extrabold text-[#0F172A] mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">🏢</span>
            {isClient ? "Residential Address" : "Chambers Address"}
          </h2>

          <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0]">
            <p className="text-[#334155] font-medium text-sm leading-relaxed whitespace-pre-wrap">
              {profile.chambersAddress || (isClient ? "No residential address provided." : "No chambers address provided.")}
            </p>
          </div>
        </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
      <span className="font-bold text-[11px] uppercase tracking-widest text-[#64748B]">
        {label}
      </span>

      <span className="text-sm font-semibold text-[#0F172A] text-right max-w-[60%] truncate">
        {value || "-"}
      </span>
    </div>
  );
}