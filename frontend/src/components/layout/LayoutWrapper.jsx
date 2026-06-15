"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

// Pages that should NOT show the sidebar/navbar
const AUTH_ROUTES = ["/login", "/register"];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  // shared collapse state for sidebar & main content
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auth pages render standalone — no sidebar or navbar
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col  ${isCollapsed ? "md:pl-20" : "md:pl-64 "} min-h-screen`}>
        <Navbar />
        <main className="flex-1 p-4 md:p-6 lg:p-12">{children}</main>
      </div>
    </div>
  );
}
