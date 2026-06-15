"use client";

import React from "react";

export default function ProfileView({ profile = {}, onEdit }) {
  // Compute role label dynamically
  const roleParts = [];
  if (profile.courtType) roleParts.push(profile.courtType);
  if (profile.specialization) roleParts.push(profile.specialization);
  const roleLabel = roleParts.length > 0 ? `${roleParts.join(" (")} Advocate${roleParts.length > 1 ? ")" : ""}` : "Advocate";

  return (
    <div className="w-full space-y-6 md:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-8 items-center flex-1">
              {/* Profile Image */}
              <div>
                <img
                  src={profile.profileImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43?w=400"}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover border-4 border-blue-100 shadow-sm"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
                  {profile.advocateName || "Advocate Name"}
                </h1>

                <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
                  {roleLabel}
                </p>

                <p className="text-[#64748B] mt-3 whitespace-pre-wrap">
                  {profile.about || "No professional bio provided."}
                </p>
              </div>
            </div>

            {onEdit && (
              <div className="mt-4 md:mt-0">
                <button
                  onClick={onEdit}
                  className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-medium px-6 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Personal Information */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-xl font-semibold mb-6">
              Personal Information
            </h2>

            <div className="space-y-4">
              <InfoRow
                label="Phone"
                value={profile.phoneNumber}
              />

              <InfoRow
                label="Email"
                value={profile.emailAddress}
              />

              <InfoRow
                label="Date of Birth"
                value={profile.dateOfBirth}
              />

              <InfoRow
                label="Gender"
                value={profile.gender}
              />

              <InfoRow
                label="Aadhaar Number"
                value={profile.aadhaarNumber}
              />

              <InfoRow
                label="PAN Number"
                value={profile.panNumber}
              />

              <InfoRow
                label="City"
                value={profile.city}
              />

              <InfoRow
                label="State"
                value={profile.state}
              />

              <InfoRow
                label="Pincode"
                value={profile.pincode}
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-xl font-semibold mb-6">
              Professional Information
            </h2>

            <div className="space-y-4">
              <InfoRow
                label="Bar Council ID"
                value={profile.barCouncilId}
              />

              <InfoRow
                label="Enrollment No"
                value={profile.enrollmentNumber}
              />

              <InfoRow
                label="Experience"
                value={profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : ""}
              />

              <InfoRow
                label="Practice Area"
                value={profile.practiceArea}
              />

              <InfoRow
                label="Court Type"
                value={profile.courtType}
              />

              <InfoRow
                label="Specialization"
                value={profile.specialization}
              />

              <InfoRow
                label="Law Firm Name"
                value={profile.lawFirmName}
              />

              <InfoRow
                label="Languages Known"
                value={profile.languagesKnown}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">
            Chambers Address
          </h2>

          <p className="text-[#334155] whitespace-pre-wrap">
            {profile.chambersAddress || "-"}
          </p>
        </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-[#E2E8F0] pb-3">
      <span className="font-medium text-[#475569]">
        {label}
      </span>

      <span className="text-[#0F172A]">
        {value || "-"}
      </span>
    </div>
  );
}