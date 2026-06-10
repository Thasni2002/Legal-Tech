"use client";

import { useState } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-end gap-6">

        {/* Search Bar */}
        <div className="relative">
          <Search
            className="absolute left-3 top-3 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search cases, documents..."
            className="pl-10 pr-4 py-2 border rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100">
          <Bell size={22} />

          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile Section */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-lg"
          >
            {/* Profile Image */}
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* Name & Role */}
            <div className="text-left">
              <h4 className="font-semibold text-sm">
                Adv. Rahul Sharma
              </h4>

              <p className="text-xs text-gray-500">
                Senior Advocate
              </p>
            </div>

            <ChevronDown size={18} />
          </button>

          {/* Dropdown */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
              <button className="w-full text-left px-4 py-3 hover:bg-gray-100">
                My Profile
              </button>

              <button className="w-full text-left px-4 py-3 hover:bg-gray-100">
                Settings
              </button>

              <button className="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100">
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}