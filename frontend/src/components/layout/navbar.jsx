"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const [showProfile, setShowProfile] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const notifications = [
    {
      title: "🎂 Birthday Reminder",
      message:
        "Client Rahul Sharma's birthday today.",
    },
    {
      title: "⚖️ Court Hearing",
      message:
        "State vs Rajesh Kumar hearing tomorrow.",
    },
    {
      title: "📄 Document Update",
      message:
        "New affidavit uploaded successfully.",
    },
    {
      title: "📰 Legal News",
      message:
        "New Supreme Court judgment published.",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm px-6 py-3">
      <div className="flex items-center justify-between">

        {/* Logo */}
        <div>
          <h1 className="text-xl font-bold text-blue-600">
            LegalTech
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-5">

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

          {/* Notification Section */}
          <div className="relative">

            <button
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
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
              <div className="absolute right-0 mt-3 w-96 bg-white border rounded-xl shadow-xl z-50">

                <div className="p-4 border-b">
                  <h3 className="font-bold text-lg">
                    Notifications
                  </h3>
                </div>

                <div className="max-h-80 overflow-y-auto">

                  {notifications.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                      >
                        <h4 className="font-semibold">
                          {item.title}
                        </h4>

                        <p className="text-sm text-gray-500 mt-1">
                          {item.message}
                        </p>
                      </div>
                    )
                  )}

                </div>

                <div className="p-3 text-center border-t">
                  <button className="text-blue-600 font-medium">
                    View All Notifications
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="relative">

            <button
              onClick={() =>
                setShowProfile(!showProfile)
              }
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
              <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg z-50">

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
      </div>
    </nav>
  );
}