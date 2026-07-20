"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderOpen, Scale, User, CheckSquare } from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";

export default function ClerkDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
    }
  }, [router]);

  const clerkActions = [
    {
      id: "doc-draft-btn",
      title: "Document Draft",
      description: "Draft legal documents, fill templates (Petitions, Affidavits) and export for court filing.",
      icon: FileText,
      color: "from-blue-500 to-indigo-600",
      path: "/clerk/document-draft",
    },
    {
      id: "physical-file-btn",
      title: "Format Physical File",
      description: "Log cabinet locations, organize shelving indices, and print folder spine labels.",
      icon: FolderOpen,
      color: "from-emerald-500 to-teal-600",
      path: "/clerk/format-physical-file",
    },
    {
      id: "case-number-btn",
      title: "Case Number from Court",
      description: "Link diary/CNR numbers received from court, record filing dates, and track schedules.",
      icon: Scale,
      color: "from-violet-500 to-purple-600",
      path: "/clerk/case-number",
    },
  ];

  if (!user) {
    return (
      <div className="w-full h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 text-sm animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-40 -mr-16 -mt-16"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold uppercase tracking-wider">
            🏛️ Clerk Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Welcome back, <span className="capitalize">{user.firstName || user.username || "Clerk"}</span>
          </h1>
          <p className="text-[#64748B] font-medium max-w-xl">
            Access court drafting tools, manage physical file shelf indices, and record official court case numbers.
          </p>
        </div>

        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => router.push("/profile-management")}
            className="flex items-center gap-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-sm px-5 py-3 rounded-xl transition duration-200"
          >
            <User size={16} />
            My Profile
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-blue-100">
            <FileText size={22} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Physical File Templates</p>
          <h3 className="text-2xl font-extrabold text-[#0F172A] mt-2">12 Ready Templates</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
            <FolderOpen size={22} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Shelf Cabinets</p>
          <h3 className="text-2xl font-extrabold text-[#0F172A] mt-2">4 Active Cabinets</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-4 border border-violet-100">
            <Scale size={22} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Court Numbers</p>
          <h3 className="text-2xl font-extrabold text-[#0F172A] mt-2">2 Cases Pending</h3>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clerkActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-slate-300 shadow-sm p-6 hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-md`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-[#0F172A] font-extrabold text-lg mb-2">{action.title}</h3>
                  <p className="text-[#64748B] text-sm font-medium leading-relaxed mb-6">{action.description}</p>
                </div>
                <button
                  id={action.id}
                  onClick={() => router.push(action.path)}
                  className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition duration-200 shadow-sm"
                >
                  Open Tool
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist for interactive feel */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#0F172A] mb-4 flex items-center gap-2">
          <CheckSquare size={20} className="text-blue-600" />
          Clerk Checklist & Task Tracker
        </h2>
        <div className="divide-y divide-[#F1F5F9] font-medium text-sm text-[#334155]">
          <div className="py-3.5 flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
            <span className="line-through text-slate-400">Generate Vakalatnama printout for Adv. Ram</span>
          </div>
          <div className="py-3.5 flex items-center gap-3">
            <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
            <span>Format physical file folders for cases registered in District Court yesterday</span>
          </div>
          <div className="py-3.5 flex items-center gap-3">
            <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
            <span>Check court registry for case numbers for the petition filed on Friday</span>
          </div>
        </div>
      </div>
    </div>
  );
}
