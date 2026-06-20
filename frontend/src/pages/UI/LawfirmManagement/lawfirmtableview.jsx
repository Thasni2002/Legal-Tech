"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import LawfirmAdd from "./LawfirmAdd";

export default function LawfirmTableView({ advocate }) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);

  if (!advocate) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <p className="text-red-500">Advocate not found</p>
      </div>
    );
  }

  // Edit in same page
  if (editMode) {
    return (
      <LawfirmAdd
        initialData={advocate}
        onCancel={() => setEditMode(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">

        {/* Top buttons */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={() => setEditMode(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600"
          >
            <Pencil size={16} />
            Edit
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center border-b border-[#F1F5F9] pb-6 mb-6">
          {/* Profile Image */}
          <div>
            <img
              src={advocate.profileImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43?w=400"}
              alt="Profile"
              className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-blue-50 shadow-sm"
            />
          </div>

          {/* Title Info */}
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {advocate.advocateName}
            </h2>
            <p className="text-gray-500 mt-1 text-[16px]">
              {advocate.specialization || "Advocate"} • {advocate.lawFirmName || "Independent"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                advocate.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {advocate.status || "Active"}
              </span>
              {advocate.yearsOfExperience && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {advocate.yearsOfExperience} Years Exp
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
              Personal Information
            </h3>
            <div className="space-y-3">
              <InfoRow label="Phone Number" value={advocate.phoneNumber} />
              <InfoRow label="Email Address" value={advocate.emailAddress} />
              <InfoRow label="Date of Birth" value={advocate.dateOfBirth} />
              <InfoRow label="Gender" value={advocate.gender} />
              <InfoRow label="Aadhaar Number" value={advocate.aadhaarNumber} />
              <InfoRow label="PAN Number" value={advocate.panNumber} />
              <InfoRow label="City" value={advocate.city} />
              <InfoRow label="State" value={advocate.state} />
              <InfoRow label="Pincode" value={advocate.pincode} />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
              Professional Information
            </h3>
            <div className="space-y-3">
              <InfoRow label="Bar Council ID" value={advocate.barCouncilId} />
              <InfoRow label="Enrollment Number" value={advocate.enrollmentNumber} />
              <InfoRow label="Practice Area" value={advocate.practiceArea} />
              <InfoRow label="Court Type" value={advocate.courtType} />
              <InfoRow label="Languages Known" value={advocate.languagesKnown} />
              <InfoRow label="Law Firm Name" value={advocate.lawFirmName} />
              <InfoRow label="Specialization" value={advocate.specialization} />
            </div>
          </div>
        </div>

        {/* Address */}
        {advocate.chambersAddress && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Chambers Address</h3>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">{advocate.chambersAddress}</p>
          </div>
        )}

        {/* About */}
        {advocate.about && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">About Advocate</h3>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">{advocate.about}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-2 text-sm">
      <span className="font-medium text-gray-500">{label}</span>
      <span className="text-gray-900 font-semibold">{value || "-"}</span>
    </div>
  );
}