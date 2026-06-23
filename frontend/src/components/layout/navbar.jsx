"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLoggedInUser } from "@/utils/auth";
import {
  Bell,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const router = useRouter();

  useEffect(() => {
    setUser(getLoggedInUser());
    const savedProfile = localStorage.getItem("advocate_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.profileImage) {
          setProfileImage(parsed.profileImage);
        }
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setShowProfile(false);
    router.push("/login");
  };

  const notifications = [
    {
      id: 1,
      icon: "🎂",
      title: "Today is Rahul Sharma's Birthday",
      time: "Just now",
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      id: 2,
      icon: "📢",
      title: "New Supreme Court Judgment Added",
      time: "1 hour ago",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      id: 3,
      icon: "⚖️",
      title: "Case Hearing Tomorrow at 10:00 AM",
      time: "4 hours ago",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      id: 4,
      icon: "📄",
      title: "New Document Uploaded",
      time: "1 day ago",
      color: "text-purple-600",
      bg: "bg-purple-50"
    }
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
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-[#E2E8F0] rounded-3xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-[#F1F5F9] flex justify-between items-center bg-[#F8FAFC]">
                <h3 className="font-extrabold text-[16px] text-[#0F172A] tracking-tight">
                  Notifications
                </h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {notifications.length} New
                </span>
              </div>

              <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer group"
                  >
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg ${item.bg} ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1E293B] truncate leading-tight group-hover:text-[#2563EB] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs font-medium text-[#64748B] mt-1">
                        {item.time}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t border-[#F1F5F9] bg-white">
                <button className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors">
                  View All Notifications
                </button>
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
            {user ? (
              <img
                src={profileImage || `https://ui-avatars.com/api/?name=${user.firstName || user.username}&background=2563EB&color=fff&rounded=true&bold=true&size=150`}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100 shadow-sm transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold ring-2 ring-slate-200">
                ?
              </div>
            )}

            <div className="text-left">
              <h4 className="font-semibold text-sm text-[#0F172A] capitalize">
                {user ? user.username : "Guest User"}
              </h4>

              <p className="text-xs text-[#64748B]">
                {user ? user.role : "Viewer"}
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

              <div className="border-t border-[#F1F5F9]">
                <button
                  onClick={handleLogout}
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