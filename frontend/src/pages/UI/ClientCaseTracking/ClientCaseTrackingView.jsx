"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Building2,
  FileText,
  CheckCircle2,
  Circle,
  ChevronRight,
  Briefcase,
  Search,
} from "lucide-react";
import useModulePermission from "@/utils/useModulePermission";
import { getLoggedInUser } from "@/utils/auth";

export default function ClientCaseTrackingView() {
  const { perms, loading } = useModulePermission("Case Tracking");
  const [advocateName, setAdvocateName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [searchClient, setSearchClient] = useState("");

  // No view access
  if (!loading && !perms.view) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 max-w-sm text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-sm mt-2">You do not have permission to view Case Tracking.</p>
        </div>
      </div>
    );
  }

  const [cases, setCases] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch cases dynamically
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const user = getLoggedInUser();
        const res = await fetch("http://127.0.0.1:8000/case-management/");
        const data = await res.json();
        
        let clientCases = data;
        if (user) {
          const role = (user.role || "").toLowerCase().replace(/\s+/g, "");
          if (role === "client") {
            clientCases = data.filter((c) => {
              // 1. Match by email (robust match)
              const caseEmail = (c.email_id || "").toLowerCase().trim();
              const userEmail = (user.email || "").toLowerCase().trim();
              if (caseEmail && userEmail && caseEmail === userEmail) {
                return true;
              }

              // 2. Match by normalized client name vs username
              if (c.client_name) {
                const normalizedName = c.client_name.toLowerCase().replace(/[^a-z0-9]/g, "");
                const normalizedUsername = (user.username || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                if (normalizedName === normalizedUsername) {
                  return true;
                }
              }
              return false;
            });
          }
        }

        const mappedCases = clientCases.map(item => {
          let step = 0;
          const statusLower = (item.status || "").toLowerCase();
          if (statusLower.includes("submit") || statusLower.includes("file")) step = 0;
          else if (statusLower.includes("document")) step = 1;
          else if (statusLower.includes("schedule") || statusLower.includes("hearing")) step = 2;
          else if (statusLower.includes("progress") || statusLower.includes("active")) step = 3;
          else if (statusLower.includes("close") || statusLower.includes("resolve")) step = 4;
          else step = 0;

          return {
            caseId: item.case_no || "N/A",
            title: item.case_title || "Untitled Case",
            status: item.status || "Case Submit",
            advocate: item.selected_advocate || "Advocate",
            clientName: item.client_name || "Client",
            court: item.court_name || "Civil Court",
            nextHearing: item.next_hearing_date || "To be scheduled",
            currentStep: step,
          };
        });
        setCases(mappedCases);
      } catch (err) {
        console.error("Error fetching case tracking data:", err);
      } finally {
        setDataLoading(false);
      }
    };
    if (perms.view) {
      fetchCases();
    }
  }, [perms.view]);

  const statusSteps = [
    "Case Submit",
    "Document Upload",
    "Hearing Scheduled",
    "In Progress",
    "Closed",
  ];

  // Filter cases based on inputs
  const filteredCases = cases.filter((item) => {
    const matchClient =
      searchClient.trim() === "" ||
      (item.clientName || "").toLowerCase().includes(searchClient.toLowerCase().trim());
    const matchAdvocate =
      advocateName.trim() === "" ||
      item.advocate.toLowerCase() === advocateName.toLowerCase();
    const matchCase =
      caseNumber.trim() === "" ||
      item.caseId.toLowerCase() === caseNumber.toLowerCase();
    return matchClient && matchAdvocate && matchCase;
  });

  const uniqueAdvocates = [...new Set(cases.map(c => c.advocate))];
  const uniqueCaseNumbers = [...new Set(cases.map(c => c.caseId))];

  return (
    <div className="w-full space-y-6 md:space-y-8">

        {/* Page Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
            Case Tracking
          </h1>
          <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
            Track your case status and progress
          </p>
        </div>

        {/* Search Filter */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <input
              type="text"
              placeholder="Search by client name..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-[#0F172A] font-medium placeholder:text-[#94A3B8]"
            />
            {searchClient && (
              <button
                onClick={() => setSearchClient("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                title="Clear search"
              >
                <span className="text-xs font-bold">×</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Boxes — Advocate Name & Case Number */}
        {/* <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">
                Advocate Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                />
                <select
                  value={advocateName}
                  onChange={(e) => setAdvocateName(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">All Advocates</option>
                  {uniqueAdvocates.map((adv, idx) => (
                    <option key={idx} value={adv}>{adv}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">
                Case Number
              </label>
              <div className="relative">
                <FileText
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                />
                <select
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">All Case Numbers</option>
                  {uniqueCaseNumbers.map((cno, idx) => (
                    <option key={idx} value={cno}>{cno}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Case Cards with Status Flow */}
        {dataLoading ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-sm">
            <p className="text-[#64748B] text-lg animate-pulse">Loading cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-sm">
            <p className="text-[#64748B] text-lg">No cases found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCases.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Case Info Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#0F172A]">
                      {item.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 text-sm text-[#64748B]">
                      <span className="flex items-center gap-1.5" title="Case Number">
                        <FileText size={15} className="text-[#2563EB]" />
                        {item.caseId}
                      </span>
                      <span className="flex items-center gap-1.5" title="Client Name">
                        <User size={15} className="text-[#2563EB]" />
                        Client: {item.clientName}
                      </span>
                      <span className="flex items-center gap-1.5" title="Advocate Name">
                        <Briefcase size={15} className="text-[#2563EB]" />
                        Advocate: {item.advocate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 size={15} className="text-[#2563EB]" />
                        {item.court}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={15} className="text-[#2563EB]" />
                        Next: {item.nextHearing}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`mt-3 md:mt-0 inline-flex px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase ${
                      item.status === "In Progress"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Status Flow */}
                <div className="bg-[#F1F5F9] rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">
                    Case Progress
                  </h3>

                  {/* Desktop Flow — horizontal */}
                  <div className="hidden md:flex items-center justify-between">
                    {statusSteps.map((step, stepIdx) => {
                      const isCompleted = stepIdx < item.currentStep;
                      const isCurrent = stepIdx === item.currentStep;
                      const isFuture = stepIdx > item.currentStep;

                      return (
                        <div key={stepIdx} className="flex items-center flex-1 last:flex-none">
                          {/* Step circle + label */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                isCompleted
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                  : isCurrent
                                  ? "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20 ring-4 ring-blue-100"
                                  : "bg-[#E2E8F0] text-[#64748B]"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={18} />
                              ) : (
                                <Circle size={14} />
                              )}
                            </div>
                            <span
                              className={`mt-2 text-xs text-center max-w-[80px] leading-tight ${
                                isCompleted
                                  ? "text-emerald-700 font-semibold"
                                  : isCurrent
                                  ? "text-[#2563EB] font-semibold"
                                  : "text-[#64748B]"
                              }`}
                            >
                              {step}
                            </span>
                          </div>

                          {/* Connector line */}
                          {stepIdx < statusSteps.length - 1 && (
                            <div className="flex-1 mx-2">
                              <div
                                className={`h-0.5 w-full rounded transition-all ${
                                  stepIdx < item.currentStep
                                    ? "bg-emerald-400"
                                    : "bg-[#E2E8F0]"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Flow — vertical */}
                  <div className="md:hidden space-y-4">
                    {statusSteps.map((step, stepIdx) => {
                      const isCompleted = stepIdx < item.currentStep;
                      const isCurrent = stepIdx === item.currentStep;

                      return (
                        <div key={stepIdx} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                isCompleted
                                  ? "bg-emerald-500 text-white"
                                  : isCurrent
                                  ? "bg-[#2563EB] text-white ring-4 ring-blue-100"
                                  : "bg-[#E2E8F0] text-[#64748B]"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <Circle size={10} />
                              )}
                            </div>
                            {stepIdx < statusSteps.length - 1 && (
                              <div
                                className={`w-0.5 h-6 mt-1 ${
                                  stepIdx < item.currentStep
                                    ? "bg-emerald-400"
                                    : "bg-[#E2E8F0]"
                                }`}
                              />
                            )}
                          </div>
                          <span
                            className={`text-sm pt-1 ${
                              isCompleted
                                ? "text-emerald-700 font-medium"
                                : isCurrent
                                ? "text-[#2563EB] font-medium"
                                : "text-[#64748B]"
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
  );
}
