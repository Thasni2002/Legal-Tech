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
    <nav className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex justify-end items-center">

      {/* Right Side */}
      <div className="flex items-end gap-3">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
            className="relative p-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors duration-200"
          >
            <Bell size={20} className="text-[#64748B]" />

            <span className="absolute -top-0.5 -right-0.5 bg-[#DC2626] text-white text-[10px] font-semibold h-[18px] w-[18px] rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          </button>

          {/* Notification Modal */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.1)] z-50">
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <h3 className="font-semibold text-[15px] text-[#0F172A]">
                  Notifications
                </h3>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.map((item, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] text-sm text-[#1E293B] transition-colors duration-150 cursor-pointer"
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
            className="flex items-center gap-3 hover:bg-[#F1F5F9] px-3 py-2 rounded-lg transition-colors duration-200"
          >
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#E2E8F0]"
            />

            <div className="text-left">
              <h4 className="font-semibold text-sm text-[#0F172A]">
                Adv. Rahul Sharma
              </h4>

              <p className="text-xs text-[#64748B]">
                Senior Advocate
              </p>
            </div>

            <ChevronDown size={16} className="text-[#94A3B8]" />
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.1)] z-50 overflow-hidden">

              <button
                onClick={() =>
                  router.push("/profile-management")
                }
                className="w-full text-left px-4 py-3 text-sm text-[#1E293B] hover:bg-[#F1F5F9] transition-colors duration-150"
              >
                My Profile
              </button>

              <button
                className="w-full text-left px-4 py-3 text-sm text-[#1E293B] hover:bg-[#F1F5F9] transition-colors duration-150"
              >
                Settings
              </button>

              <div className="border-t border-[#F1F5F9]">
                <button
                  className="w-full text-left px-4 py-3 text-sm text-[#DC2626] hover:bg-red-50 transition-colors duration-150"
                >
                  Logout
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </nav>
  );
}