"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const router = useRouter();

  const notifications = [
    "🎂 Today is Rahul Sharma's Birthday",
    "📢 New Supreme Court Judgment Added",
    "⚖️ Case Hearing Tomorrow at 10:00 AM",
    "📄 New Document Uploaded",
  ];

  return (
    <nav className="bg-white border-b px-6 py-3 flex justify-end items-center">

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
            className="relative p-2 rounded-lg hover:bg-gray-100"
          >
            <Bell size={22} />

            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          </button>

          {/* Notification Modal */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-xl z-50">
              <div className="p-4 border-b">
                <h3 className="font-bold text-lg">
                  Notifications
                </h3>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 border-b hover:bg-gray-50"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-lg"
          >
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />

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

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">

              <button
                onClick={() =>
                  router.push("/profile-management")
                }
                className="w-full text-left px-4 py-3 hover:bg-gray-100"
              >
                My Profile
              </button>

              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-100"
              >
                Settings
              </button>

              <button
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>

            </div>
          )}
        </div>

      </div>
    </nav>
  );
}