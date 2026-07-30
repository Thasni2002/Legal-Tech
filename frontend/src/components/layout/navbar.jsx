"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";
import { Bell, ChevronDown, LoaderCircle, CheckCheck } from "lucide-react";

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const router = useRouter();
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const loadUserData = useCallback(() => {
    const loggedInUser = getLoggedInUser();
    setUser(loggedInUser);

    let name = "";
    let img = null;

    const userKey = (loggedInUser?.email || loggedInUser?.username || "").toLowerCase().trim();
    const savedUserLocal = typeof window !== "undefined" && userKey ? localStorage.getItem(`advocate_profile_${userKey}`) : null;
    const savedGlobal = typeof window !== "undefined" ? localStorage.getItem("advocate_profile") : null;
    const savedProfile = savedUserLocal || savedGlobal;

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.profileImage) {
          img = parsed.profileImage;
        }
        if (parsed.advocateName || parsed.advocate_name) {
          name = parsed.advocateName || parsed.advocate_name;
        }
      } catch (e) {}
    }

    if (!name && loggedInUser) {
      name = [loggedInUser.firstName, loggedInUser.lastName].filter(Boolean).join(" ") || loggedInUser.username;
    }

    if ((loggedInUser?.role || "").toLowerCase() === "clerk" && name) {
      name = name.replace(/\s+Advocate$/i, "");
    }

    setDisplayName(name || loggedInUser?.username || "Guest User");
    setProfileImage(img);

    if (loggedInUser) {
      fetchNotifications(loggedInUser);
    }
  }, []);

  useEffect(() => {
    loadUserData();

    const handleProfileUpdate = () => {
      loadUserData();
    };

    window.addEventListener("permissions_updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("permissions_updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [loadUserData]);

  const fetchNotifications = async (loggedInUser) => {
    setLoadingNotifs(true);
    try {
      const params = new URLSearchParams();
      if (loggedInUser.id) params.set("user_id", loggedInUser.id);
      if (loggedInUser.role) params.set("role", loggedInUser.role);

      const res = await fetch(`${API_BASE_URL}/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Backend now returns is_read field per notification
        setNotifications(data);
      }
    } catch (err) {
      // Quietly ignore transient network/dev-server reload errors
    } finally {
      setLoadingNotifs(false);
    }
  };

  /**
   * Mark one notification as read — persisted in MySQL via backend API.
   */
  const markAsRead = useCallback(async (notifId) => {
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser?.id) return;

    // Optimistic UI update immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );

    try {
      await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: loggedInUser.id,
          notification_ids: [notifId],
        }),
      });
    } catch (err) {
      console.warn("Could not mark notification as read:", err.message);
    }
  }, []);

  /**
   * Mark ALL notifications as read — persisted in MySQL via backend API.
   */
  const markAllAsRead = useCallback(async () => {
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser?.id) return;

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic UI update immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: loggedInUser.id,
          notification_ids: unreadIds,
        }),
      });
    } catch (err) {
      console.warn("Could not mark all notifications as read:", err.message);
    }
  }, [notifications]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setShowProfile(false);
    router.push("/login");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 md:px-6 pl-14 md:pl-6 py-3 flex justify-between items-center font-sans shadow-xs">
      {/* Left Side: Legal Tech Futuristic Brand Header */}
      <div className="flex items-center gap-3">
        <span className="font-legaltech text-base md:text-lg font-black tracking-wider bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 bg-clip-text text-transparent uppercase">
          LEGAL TECH
        </span>
        <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 tracking-wider font-sans uppercase">
          Enterprise
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <style>{`
            @keyframes bellShake {
              0%, 100% { transform: rotate(0deg); }
              10% { transform: rotate(16deg); }
              20% { transform: rotate(-14deg); }
              30% { transform: rotate(14deg); }
              40% { transform: rotate(-10deg); }
              50% { transform: rotate(6deg); }
              60% { transform: rotate(-4deg); }
              70% { transform: rotate(0deg); }
            }
            .animate-bell-shake {
              animation: bellShake 2.2s ease-in-out infinite;
              transform-origin: top center;
            }
          `}</style>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
          >
            <Bell
              size={20}
              className={`${
                unreadCount > 0
                  ? "text-[#0F172A] animate-bell-shake"
                  : "text-[#64748B]"
              }`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#DC2626] text-white text-[10px] font-semibold h-[18px] w-[18px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-[#E2E8F0] rounded-3xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-[#F1F5F9] flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[16px] text-[#0F172A] tracking-tight">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-[#0F172A] font-semibold hover:text-[#64748B] transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-sm">
                    <LoaderCircle size={16} className="animate-spin" />
                    <span>Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Bell size={32} className="mb-2 opacity-30" />
                    <p className="text-sm font-medium">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isRead = item.is_read;
                    return (
                      <div
                        key={item.id}
                        onClick={() => !isRead && markAsRead(item.id)}
                        className={`flex items-start gap-4 p-3 rounded-2xl transition-colors duration-200 group ${
                          isRead
                            ? "bg-slate-50 opacity-60"
                            : "hover:bg-slate-100/80 cursor-pointer"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg shadow-sm transition-transform duration-200 ${
                            isRead ? "opacity-60" : "group-hover:scale-110"
                          } ${item.bg} ${item.color}`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-tight transition-colors ${
                              isRead
                                ? "font-normal text-[#64748B]"
                                : "font-bold text-[#1E293B] group-hover:text-[#0F172A]"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs font-medium text-[#94A3B8] mt-1">
                            {item.time}
                          </p>
                        </div>
                        {/* Unread indicator dot */}
                        {!isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 animate-pulse" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer: all read */}
              {notifications.length > 0 && unreadCount === 0 && (
                <div className="px-6 py-3 border-t border-[#F1F5F9] text-center bg-slate-50">
                  <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                    <CheckCheck size={13} className="text-emerald-500" />
                    All caught up!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors duration-200"
          >
            {user ? (
              <img
                src={profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user.firstName || user.username)}&background=2563EB&color=fff&rounded=true&bold=true&size=150`}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100 shadow-sm transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold ring-2 ring-slate-200">
                ?
              </div>
            )}

            <div className="text-left hidden sm:block">
              <h4 className="font-semibold text-sm text-[#0F172A] capitalize">
                {displayName}
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
                onClick={() => router.push("/profile-management")}
                className="w-full text-left px-4 py-3 text-sm text-[#0F172A] hover:bg-slate-50 transition-colors duration-150"
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
