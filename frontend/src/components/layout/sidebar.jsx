"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close sidebar when route changes on mobile
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
  }, [pathname, isOpen]);

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Law Firm Management", path: "/lawfirm-management" },
    { name: "Client Management", path: "/client-management" },
    { name: "Case Management", path: "/case-management" },
    { name: "Consultations", path: "/consultations" },
    { name: "Calendar", path: "/calendar" },
    { name: "Court Fee Calculator", path: "/court-fee-calculator" },
    { name: "Billing", path: "/billing" },
    { name: "Notifications", path: "/notifications" },
    { name: "Permissions", path: "/permissions" },
    { name: "Profile Management", path: "/profile-management" },
    { name: "Logout", path: "/logout" },
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
                      block px-4 py-3 rounded-lg font-bold transition-all duration-200
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