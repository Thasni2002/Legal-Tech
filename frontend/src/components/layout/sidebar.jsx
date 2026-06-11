"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRolesOpen, setUserRolesOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Automatically expand the permissions dropdown if we are on a permissions sub-page
  useEffect(() => {
    if (pathname && pathname.startsWith("/permissions")) {
      setUserRolesOpen(true);
    }
  }, [pathname]);

  const menuItems = [
    {
      title: "Advocate Section",
      items: [
        { name: "Dashboard", path: "/" },
        { name: "Law Firm Management", path: "/lawfirm-management" },
        { name: "Client Management", path: "/client-management" },
        { name: "Case Management", path: "/case-management" },
        { name: "Consultations", path: "/consultations" },
        { name: "Finance Management", path: "/finance-management" },
        { name: "Calendar", path: "/calendar" },
        { name: "Profile", path: "/profile-management" },
        { name: "Logout", path: "/logout" },
      ],
    },
    {
      title: "Client Section",
      items: [
        { name: "Dashboard", path: "/client-management" },
        { name: "Consultation", path: "/client-consultation" },
        { name: "Case Tracking", path: "/client-case-tracking" },
        { name: "Profile", path: "/client-profile" },
        { name: "Logout", path: "/logout" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          name: "User Roles",
          isDropdown: true,
          submenu: [
            { name: "Roles", path: "/permissions/roles" },
            { name: "Users", path: "/permissions/users" },
            { name: "Permissions", path: "/permissions" },
          ],
        },
      ],
    },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-[60] flex items-center justify-center w-10 h-10 bg-black text-white rounded-md shadow-lg md:hidden hover:bg-gray-900 transition-colors cursor-pointer"
        aria-label={isOpen ? "Close Menu" : "Open Menu"}
      >
        <span className="text-xl leading-none">{isOpen ? "✕" : "☰"}</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed
          top-0 left-0
          h-screen
          w-64
          bg-white
          border-r
          shadow-lg
          z-50
          transform
          transition-transform
          duration-300
          ${isOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full pt-14 md:pt-0 overflow-y-auto">
          <div className="p-5 flex-shrink-0">
            <h2 className="text-2xl font-bold text-black mb-6">
              Legal Tech
            </h2>
          </div>

          <div className="px-5 pb-6 space-y-6 overflow-y-auto flex-1">
            {menuItems.map((section) => (
              <div key={section.title}>
                <h3 className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase">
                  {section.title}
                </h3>

                <ul className="space-y-2">
                  {section.items.map((item) => {
                    if (item.isDropdown) {
                      const isAnySubActive = item.submenu.some(
                        (sub) => pathname === sub.path
                      );
                      const isDropdownOpen = userRolesOpen;

                      return (
                        <li key={item.name} className="space-y-1">
                          <button
                            onClick={() => setUserRolesOpen(!userRolesOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                              isAnySubActive
                                ? "bg-[#0d6e53] text-white shadow-sm"
                                : "text-black hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Shield size={18} className="text-current" />
                              <span>{item.name}</span>
                            </div>
                            {isDropdownOpen ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>

                          {isDropdownOpen && (
                            <ul className="pl-4 space-y-1 mt-1 border-l-2 border-emerald-100 ml-6">
                              {item.submenu.map((sub) => {
                                const active = pathname === sub.path;

                                return (
                                  <li key={sub.path}>
                                    <Link
                                      href={sub.path}
                                      onClick={() => setIsOpen(false)}
                                      className={`block px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        active
                                          ? "text-[#0d6e53] bg-emerald-50/70 font-bold"
                                          : "text-gray-600 hover:text-[#0d6e53] hover:bg-gray-50"
                                      }`}
                                    >
                                      {sub.name}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    const active = pathname === item.path;

                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`block px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                            active
                              ? "bg-blue-500 text-white"
                              : "text-black hover:bg-blue-500 hover:text-white hover:pl-6"
                          }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}