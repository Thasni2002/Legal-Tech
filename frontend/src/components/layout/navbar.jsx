"use client";

import { useState } from "react";

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 md:px-6 text-black">
      {/* Left Side */}
      <div>
        <h1 className="text-lg md:text-xl font-semibold">
          Legal Tech
        </h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Notifications */}
        <button className="px-3 py-2 rounded-md text-black hover:bg-gray-100 transition duration-200">
          Notifications
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="px-3 py-2 rounded-md text-black hover:bg-gray-100 transition duration-200"
          >
            Profile
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                className="block w-full text-left px-4 py-3 text-black hover:bg-gray-100"
                onClick={() => setShowProfile(false)}
              >
                My Profile
              </button>

              <button
                className="block w-full text-left px-4 py-3 text-black hover:bg-gray-100"
                onClick={() => setShowProfile(false)}
              >
                Settings
              </button>

              <button
                className="block w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100"
                onClick={() => setShowProfile(false)}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}