"use client";

import { useState } from "react";
import {
  Calendar,
  User,
  Building2,
  FileText,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";

export default function ClientCaseTrackingView() {
  const [advocateName, setAdvocateName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");

  const cases = [
    {
      caseId: "CS/890/2023",
      title: "Property Dispute",
      status: "In Progress",
      advocate: "Adv. Rahul Sharma",
      court: "Civil Court, Prayagraj",
      nextHearing: "25 Jun 2026",
      currentStep: 3, // 0-indexed: which step is currently active
    },
    {
      caseId: "CR/567/2023",
      title: "Bail Application",
      status: "Pending",
      advocate: "Adv. Ankit Verma",
      court: "High Court",
      nextHearing: "30 Jun 2026",
      currentStep: 1,
    },
  ];

  const statusSteps = [
    "Case Filed",
    "Documents Uploaded",
    "Hearing Scheduled",
    "In Progress",
    "Resolved",
  ];

  // Filter cases based on inputs
  const filteredCases = cases.filter((item) => {
    const matchAdvocate =
      advocateName.trim() === "" ||
      item.advocate.toLowerCase().includes(advocateName.toLowerCase());
    const matchCase =
      caseNumber.trim() === "" ||
      item.caseId.toLowerCase().includes(caseNumber.toLowerCase());
    return matchAdvocate && matchCase;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Case Tracking
          </h1>
          {/* <p className="text-gray-500 mt-2">
            Track your case status and progress
          </p> */}
        </div>

        {/* Input Boxes — Advocate Name & Case Number */}
        {/* <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Advocate Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Enter advocate name"
                  value={advocateName}
                  onChange={(e) => setAdvocateName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Case Number
              </label>
              <div className="relative">
                <FileText
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Enter case number"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div> */}

        {/* Case Cards with Status Flow */}
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <p className="text-gray-400 text-lg">No cases found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCases.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Case Info Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {item.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <FileText size={15} className="text-blue-500" />
                        {item.caseId}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User size={15} className="text-blue-500" />
                        {item.advocate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 size={15} className="text-blue-500" />
                        {item.court}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={15} className="text-blue-500" />
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
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
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
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100"
                                  : "bg-slate-200 text-slate-400"
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
                                  ? "text-blue-700 font-semibold"
                                  : "text-gray-400"
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
                                    : "bg-slate-200"
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
                                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                  : "bg-slate-200 text-slate-400"
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
                                    : "bg-slate-200"
                                }`}
                              />
                            )}
                          </div>
                          <span
                            className={`text-sm pt-1 ${
                              isCompleted
                                ? "text-emerald-700 font-medium"
                                : isCurrent
                                ? "text-blue-700 font-medium"
                                : "text-gray-400"
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
    </div>
  );
}
