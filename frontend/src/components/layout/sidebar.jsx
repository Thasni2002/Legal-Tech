"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: "Profile Management", path: "/profile-management" },
    { name: "Law Firm Management", path: "/lawfirm-management" },
    { name: "Client Management", path: "/client-management" },
    { name: "Case Management", path: "/case-management" },
    { name: "Consultations", path: "/consultations" },
    { name: "Calendar", path: "/calendar" },
    { name: "Court Fee Calculator", path: "/court-fee-calculator" },
    { name: "Billing", path: "/billing" },
    { name: "Notifications", path: "/notifications" },
    { name: "Permissions", path: "/permissions" },
    { name: "Logout", path: "/logout" },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-black rounded-md shadow-lg md:hidden"
      >
        ☰
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
          fixed md:static
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
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="p-5">
          <h2 className="text-2xl font-bold text-black mb-6">
            Legal Tech
          </h2>

          <ul className="space-y-2">
            {menuItems.map((item) => {
              const active = pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      block px-4 py-3 rounded-lg transition-all duration-200
                      ${
                        active
                          ? "bg-blue-500 text-white"
                          : "text-black hover:bg-blue-500 hover:text-white hover:pl-6"
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}