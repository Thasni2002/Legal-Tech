"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userRolesOpen, setUserRolesOpen] = useState(() =>
    pathname?.startsWith("/permissions") || false
  );

  // Sync state during render when pathname changes
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
    if (pathname?.startsWith("/permissions")) {
      setUserRolesOpen(true);
    }
  }

  // Later replace with JWT/localStorage
  const role = "senior"; // senior | junior | client

  // Senior
  const seniorMenu = [
    {
      title: "Advocate Section",
      items: [
        { name: "Dashboard", path: "/" },
        {
          name: "Law Firm Management",
          path: "/lawfirm-management",
        },
        {
          name: "Client Management",
          path: "/client-management",
        },
        {
          name: "Case Management",
          path: "/case-management",
        },
        {
          name: "Consultations",
          path: "/consultations",
        },
        {
          name: "Finance Management",
          path: "/finance-management",
        },
        { name: "Calendar", path: "/calendar" },
        {
          name: "Notifications",
          path: "/senior-notifications",
        },
        {
          name: "Profile",
          path: "/senior-profile",
        },

        {
          name: "User Roles",
          isDropdown: true,
          submenu: [
            {
              name: "Roles",
              path: "/permissions/roles",
            },
            {
              name: "Users",
              path: "/permissions/users",
            },
            {
              name: "Permissions",
              path: "/permissions",
            },
          ],
        },

        { name: "Logout", path: "/logout" },
      ],
    },
  ];

  // Junior
  const juniorMenu = [
    {
      title: "Junior Advocate",
      items: [
        {
          name: "Dashboard",
          path: "/junior-dashboard",
        },
        {
          name: "Assigned Cases",
          path: "/assigned-cases",
        },
        {
          name: "Documents",
          path: "/assigned-documents",
        },
        { name: "Tasks", path: "/tasks" },
        {
          name: "Calendar",
          path: "/junior-calendar",
        },
        {
          name: "Notifications",
          path: "/junior-notifications",
        },
        {
          name: "Profile",
          path: "/junior-profile",
        },
        { name: "Logout", path: "/logout" },
      ],
    },
  ];

  // Client
  const clientMenu = [
    {
      title: "Client Section",
      items: [
        {
          name: "Dashboard",
          path: "/client-dashboard",
        },
        {
          name: "Consultation",
          path: "/client-consultation",
        },
        {
          name: "Case Tracking",
          path: "/client-case-tracking",
        },
        {
          name: "Documents",
          path: "/client-documents",
        },
        {
          name: "Payments",
          path: "/client-payments",
        },
        {
          name: "Notifications",
          path: "/client-notifications",
        },
        {
          name: "Profile",
          path: "/client-profile",
        },
        { name: "Logout", path: "/logout" },
      ],
    },
  ];

  const menuItems = [...seniorMenu, ...juniorMenu, ...clientMenu];

  return (
    <>
      {/* Mobile button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-[60] flex items-center justify-center w-10 h-10 bg-black text-white rounded-md shadow-lg md:hidden"
      >
        <span className="text-xl">
          {isOpen ? "✕" : "☰"}
        </span>
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
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo */}
          <div className="p-5 border-b">
            <h2 className="text-2xl font-bold text-black">
              Legal Tech
            </h2>
          </div>

          {/* Menu */}
          <div className="px-5 py-6 flex-1 overflow-y-auto">
            {menuItems.map((section) => (
              <div
                key={section.title}
                className="mb-6"
              >
                <h3 className="px-4 mb-3 text-xs font-bold text-gray-500 uppercase">
                  {section.title}
                </h3>

                <ul className="space-y-2">
                  {section.items.map((item) => {
                    if (item.isDropdown) {
                      return (
                        <li key={section.title + "-" + item.name}>
                          <button
                            onClick={() =>
                              setUserRolesOpen(
                                !userRolesOpen
                              )
                            }
                            className="flex items-center justify-between w-full px-4 py-3 rounded-lg font-semibold hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <Shield size={18} />
                              {item.name}
                            </div>

                            {userRolesOpen ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>

                          {userRolesOpen && (
                            <ul className="pl-4 mt-2 ml-4 border-l-2 border-blue-100 space-y-1">
                              {item.submenu.map(
                                (sub) => (
                                  <li
                                    key={sub.path}
                                  >
                                    <Link
                                      href={sub.path}
                                      className="block px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
                                    >
                                      {sub.name}
                                    </Link>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    const active =
                      pathname === item.path;

                    return (
                      <li key={section.title + "-" + item.path}>
                        <Link
                          href={item.path}
                          className={`block px-4 py-3 rounded-lg font-semibold ${
                            active
                              ? "bg-blue-500 text-white"
                              : "hover:bg-blue-500 hover:text-white"
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