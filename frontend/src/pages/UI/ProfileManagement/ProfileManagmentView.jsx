"use client";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import SelectField from "@/components/SelectField/SelectField";


export default function ProfileManagmentView() {
  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Profile Management
            </h1>

            <p className="text-gray-500 mt-1">
              Dashboard &gt; Profile Management
            </p>
          </div>

          <Button
            title="Save Profile"
            variant="primary"
          />
        </div>

        <form className="space-y-8">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43?w=400"
                  alt="profile"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                />

                <label className="absolute bottom-0 right-0 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                  📷
                  <input type="file" className="hidden" />
                </label>
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-800">
                Advocate Profile
              </h2>

              <p className="text-gray-500 text-sm">
                Update your personal and professional details
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <InputField
                label="Advocate Name"
                placeholder="Enter Advocate Name"
              />

              <InputField
                label="Bar Council ID"
                placeholder="Enter Bar Council ID"
              />

              <InputField
                label="Enrollment Number"
                placeholder="Enter Enrollment Number"
              />

              <InputField
                label="Phone Number"
                placeholder="Enter Phone Number"
              />

              <InputField
                label="Email Address"
                type="email"
                placeholder="Enter Email Address"
              />

              <InputField
                label="Date of Birth"
                type="date"
              />

              <SelectField
                label="Gender"
                options={["Male", "Female", "Other"]}
              />

              <InputField
                label="Aadhaar Number"
                placeholder="Enter Aadhaar Number"
              />

              <InputField
                label="PAN Number"
                placeholder="Enter PAN Number"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
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
              />

              <SelectField
                label="Court Type"
                options={[
                  "District Court",
                  "High Court",
                  "Supreme Court",
                ]}
              />

              <InputField
                label="Years of Experience"
                type="number"
                placeholder="Enter Experience"
              />

              <InputField
                label="Languages Known"
                placeholder="English, Hindi, Malayalam"
              />

              <InputField
                label="Law Firm Name"
                placeholder="Enter Law Firm Name"
              />

              <InputField
                label="Specialization"
                placeholder="Enter Specialization"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Address Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <InputField
                label="City"
                placeholder="Enter City"
              />

              <InputField
                label="State"
                placeholder="Enter State"
              />

              <InputField
                label="Pincode"
                placeholder="Enter Pincode"
              />
            </div>

            <div className="mt-6">
              <label className="block mb-2 font-medium text-gray-700">
                Chambers Address
              </label>

              <textarea
                rows="4"
                placeholder="Enter Chambers Address"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-black focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              About Advocate
            </h2>

            <textarea
              rows="5"
              placeholder="Write a short professional bio..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-black focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
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
              type="reset"
              variant="secondary"
            />
          </div>
        </form>
      </div>
    </div>
  );
}