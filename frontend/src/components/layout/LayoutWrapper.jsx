"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

export default function LayoutWrapper({ children }) {
  // shared collapse state for sidebar & main content
  const [isCollapsed, setIsCollapsed] = useState(false);

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
