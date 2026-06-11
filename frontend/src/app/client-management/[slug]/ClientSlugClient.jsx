"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Calendar, Briefcase, FileText, User } from "lucide-react";
import Link from "next/link";
import ClientAdd from "@/pages/UI/ClientManagement/ClientAdd";
import ClientEdit from "@/pages/UI/ClientManagement/ClientEdit";

export default function ClientSlugClient({ slug }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load client from localStorage
    const data = localStorage.getItem("clientData");
    if (data) {
      try {
        setClient(JSON.parse(data));
      } catch (err) {
        console.error("Failed to parse client data:", err);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 1. Render Client Add
  if (slug === "client-add") {
    return <ClientAdd />;
  }

  // 2. Render Client Edit
  if (slug === "edit-client") {
    return <ClientEdit />;
  }

  // 3. Render Case Tracking
  if (slug === "case-tracking") {
    const displayClient = client || {
      clientId: "C-9874",
      fullName: "John Doe (Demo Case)",
      caseStatus: "In Progress",
      caseTitle: "Commercial Contract Dispute",
      caseType: "Civil",
      caseNumber: "OS 104/2024",
      courtName: "District Court",
      assignedAdvocate: "Adv. Arjun Menon",
      nextHearing: "2026-06-25",
      phone: "+91 98765 43210",
      email: "john.doe@example.com",
      address: "123 MG Road, Ernakulam",
      city: "Kochi",
      state: "Kerala",
      pincode: "682016"
    };

    const getStatusConfig = (status) => {
      const s = (status || "").toLowerCase();
      if (s.includes("pending")) {
        return {
          label: "Pending",
          color: "text-amber-700 bg-amber-50 border-amber-200",
          barColor: "bg-amber-500",
          progress: 30,
          icon: <Clock size={20} className="text-amber-500" />
        };
      } else if (s.includes("progress") || s.includes("active")) {
        return {
          label: "In Progress",
          color: "text-blue-700 bg-blue-50 border-blue-200",
          barColor: "bg-blue-500",
          progress: 65,
          icon: <AlertCircle size={20} className="text-blue-500" />
        };
      } else if (s.includes("closed")) {
        return {
          label: "Closed",
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          barColor: "bg-emerald-500",
          progress: 100,
          icon: <CheckCircle2 size={20} className="text-emerald-500" />
        };
      }
      return {
        label: status || "Pending",
        color: "text-slate-700 bg-slate-50 border-slate-200",
        barColor: "bg-slate-400",
        progress: 50,
        icon: <Clock size={20} className="text-slate-400" />
      };
    };

    const statusConfig = getStatusConfig(displayClient.caseStatus);

    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/client-management"
              className="flex items-center justify-center w-10 h-10 bg-white border rounded-lg shadow-sm text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Case Tracking Dashboard</span>
              <h1 className="text-2xl font-bold text-slate-800">Track Case Status</h1>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-xl font-bold text-slate-800">{displayClient.caseTitle || "Untitled Case"}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color} flex items-center gap-1`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500">Case ID / Client ID: <span className="font-mono font-semibold text-slate-700">{displayClient.clientId}</span></p>
              </div>
              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Case Number</span>
                <span className="text-base font-bold text-slate-800">{displayClient.caseNumber || "Not Assigned"}</span>
              </div>
            </div>

            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Case Progression</h3>
              <div className="relative mb-2">
                <div className="h-2 bg-slate-100 rounded-full w-full">
                  <div className={`h-2 rounded-full transition-all duration-500 ${statusConfig.barColor}`} style={{ width: `${statusConfig.progress}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 mt-2">
                <div className="text-left">
                  <div className={`mb-1 ${statusConfig.progress >= 30 ? "text-blue-600 font-bold" : ""}`}>1. Filed & Pending</div>
                  <div className="text-slate-400 font-normal">Initial registration</div>
                </div>
                <div className="text-center">
                  <div className={`mb-1 ${statusConfig.progress >= 65 ? "text-blue-600 font-bold" : ""}`}>2. In Progress</div>
                  <div className="text-slate-400 font-normal">Hearings & arguments</div>
                </div>
                <div className="text-right">
                  <div className={`mb-1 ${statusConfig.progress >= 100 ? "text-blue-600 font-bold" : ""}`}>3. Closed</div>
                  <div className="text-slate-400 font-normal">Final judgment</div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Client & Case Details</h3>
                
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block leading-normal">Client Name</span>
                    <span className="text-sm font-bold text-slate-800">{displayClient.fullName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <Briefcase size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block leading-normal">Case Type / Court</span>
                    <span className="text-sm font-bold text-slate-800">{displayClient.caseType} Case &bull; {displayClient.courtName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block leading-normal">Assigned Advocate</span>
                    <span className="text-sm font-bold text-slate-800">{displayClient.assignedAdvocate || "Unassigned"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Milestones & Next Steps</h3>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 block leading-normal">Next Hearing Date</span>
                    <span className="text-sm font-bold text-slate-800">{displayClient.nextHearing || "To be scheduled"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block leading-normal">Contact Information</span>
                    <span className="text-sm text-slate-600 block">{displayClient.phone}</span>
                    <span className="text-xs text-slate-400 truncate block">{displayClient.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Link
                href="/client-management"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm text-center"
              >
                Back to Client Management
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback if unknown slug
  return (
    <div className="p-6 text-center">
      <h1 className="text-xl font-bold">Unknown Action</h1>
      <Link href="/client-management" className="text-blue-600 underline">
        Back to Client Management
      </Link>
    </div>
  );
}
