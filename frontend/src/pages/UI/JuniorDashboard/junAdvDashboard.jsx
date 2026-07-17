"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";
import {
  Briefcase,
  Calendar,
  FileText,
  FolderOpen,
} from "lucide-react";

const ROLE_BADGE = {
  "Junior Advocate": "bg-indigo-100 text-indigo-700",
  "Senior Advocate": "bg-slate-100 text-slate-700",
  "Client": "bg-rose-100 text-rose-700",
  "Advocate": "bg-slate-100 text-slate-600",
};

export default function JunAdvDashView() {
  const router = useRouter();

  const [cases, setCases] = useState([]);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({ assignedCases: 0, activeCases: 0, hearings: 0 });
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);

  const tasks = [
    "Prepare case notes",
    "Upload hearing documents",
    "Review client affidavit",
  ];

  useEffect(() => {
    const user = getLoggedInUser();
    if (user && user.username) {
      setUserName(user.username);
    }

    const fetchAssignedCases = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases`);
        const data = await res.json();

        let casesToShow = data;
        if (user && user.role && user.role.toLowerCase().includes("junior")) {
          casesToShow = data.filter((item) => {
            if (!item.advocate_name) return false;
            const normalizedAssignedName = item.advocate_name.toLowerCase().replace(/[^a-z0-9]/g, "");
            return normalizedAssignedName === user.username;
          });
        }

        // --- Stats ---
        const todayStr = new Date().toISOString().split("T")[0];
        const assignedCasesCount = casesToShow.length;
        const activeCasesCount = casesToShow.filter(
          (item) => item.status === "Active" || item.status === "Hearing"
        ).length;
        const hearingsCount = casesToShow.filter(
          (item) => item.due_date && item.due_date !== "No date" && item.due_date.split("T")[0] >= todayStr
        ).length;

        setStats({
          assignedCases: assignedCasesCount,
          activeCases: activeCasesCount,
          hearings: hearingsCount,
        });

        // --- Recent Documents ---
        const juniorDocs = [];
        casesToShow.forEach((item, index) => {
          const docs = Array.isArray(item.assigned_documents) ? item.assigned_documents : [];
          docs.forEach((doc, idx) => {
            const fname = doc.file || doc.filename || doc.name || "Document";
            const doc_type = doc.documentType || doc.document_type || "File";
            const uploaded_by = doc.advocate || doc.uploadedBy || doc.uploaded_by || item.advocate_name || "Unknown";
            
            // Determine uploader role label
            const ul_lower = uploaded_by.toLowerCase();
            let role_label = "Advocate";
            if (ul_lower.includes("junior")) {
              role_label = "Junior Advocate";
            } else if (ul_lower.includes("client")) {
              role_label = "Client";
            } else if (ul_lower.includes("senior")) {
              role_label = "Senior Advocate";
            }

            // Build file URL
            let file_url = doc.url || doc.file_url;
            if (!file_url && fname) {
              file_url = `${API_BASE_URL}/uploads/case_documents/${encodeURIComponent(fname)}`;
            }

            // Fallback for timestamp display
            let timestampDisplay = "Recently";
            const rawTime = doc.uploaded_at || doc.created_at || doc.timestamp || item.updated_at || item.created_at;
            if (rawTime) {
              try {
                const diffMs = new Date() - new Date(rawTime);
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                if (diffDays > 0) {
                  timestampDisplay = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
                } else if (diffHours > 0) {
                  timestampDisplay = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
                } else if (diffMins > 0) {
                  timestampDisplay = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
                } else {
                  timestampDisplay = "Just now";
                }
              } catch (e) {
                timestampDisplay = "Recently";
              }
            }

            juniorDocs.push({
              id: doc.id || `doc_${item.id || index}_${idx}`,
              filename: fname,
              document_type: doc_type,
              uploaded_by: uploaded_by,
              uploaded_by_role: role_label,
              case_title: item.case_title || item.case_name || "",
              case_no: item.case_number || item.case_no || "",
              client_name: item.client_name || "",
              timestamp_display: timestampDisplay,
              file_url: file_url,
            });
          });
        });

        // Take latest 8 documents and reverse
        const sortedDocs = juniorDocs.slice(-8).reverse();
        setRecentDocuments(sortedDocs);

        // --- Cases table ---
        const formattedCases = casesToShow.map((item) => ({
          title: item.case_title || item.case_name,
          hearing: item.due_date ? item.due_date.split("T")[0] : "No date",
          status: item.status || "Active",
          clientName: item.client_name || "N/A",
        }));

        setCases(formattedCases);
      } catch (error) {
        console.error("Error fetching dashboard cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedCases();
  }, []);

  const hour = new Date().getHours();
  let greeting = "";

  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const assignedCasesList = cases;
  const activeCasesList = cases.filter(
    (c) => c.status === "Active" || c.status === "Hearing"
  );
  const upcomingHearingsList = cases.filter(
    (c) => c.hearing !== "No date" && c.hearing >= todayStr
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 lg:space-y-5 animate-in fade-in zoom-in-95 duration-500">

      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            {greeting}, {userName ? <span className="capitalize">{userName}</span> : ""}
          </h1>
          <p className="text-[#64748B] mt-2 text-lg font-medium">
            Junior Advocate {userName ? <span className="capitalize">{userName}</span> : ""}
          </p>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
          <div className="text-left md:text-right bg-[#F8FAFC] px-6 py-4 rounded-2xl border border-[#E2E8F0] w-full md:w-auto">
            <p className="text-[#475569] font-bold text-sm uppercase tracking-wider">Today's Date</p>
            <p className="text-[#0F172A] font-extrabold text-lg mt-1">{currentDate}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end w-full lg:w-auto">
            <button
              onClick={() => router.push("/junior-calendar")}
              className="w-full lg:w-auto flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              View Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Assigned Cases"
          value={loading ? "—" : stats.assignedCases}
          icon={<Briefcase className="w-5 h-5" />}
          color="bg-blue-50 text-blue-600 border-blue-200"
          activeColor="border-blue-400 ring-2 ring-blue-200"
          isActive={selectedCard === "assignedCases"}
          onClick={() => setSelectedCard(selectedCard === "assignedCases" ? null : "assignedCases")}
          loading={loading}
        />

        <StatCard
          title="Active Cases"
          value={loading ? "—" : stats.activeCases}
          icon={<FolderOpen className="w-5 h-5" />}
          color="bg-emerald-50 text-emerald-600 border-emerald-200"
          activeColor="border-emerald-400 ring-2 ring-emerald-200"
          isActive={selectedCard === "activeCases"}
          onClick={() => setSelectedCard(selectedCard === "activeCases" ? null : "activeCases")}
          loading={loading}
        />

        <StatCard
          title="Upcoming Hearings"
          value={loading ? "—" : stats.hearings}
          icon={<Calendar className="w-5 h-5" />}
          color="bg-purple-50 text-purple-600 border-purple-200"
          activeColor="border-purple-400 ring-2 ring-purple-200"
          isActive={selectedCard === "upcomingHearings"}
          onClick={() => setSelectedCard(selectedCard === "upcomingHearings" ? null : "upcomingHearings")}
          loading={loading}
        />
      </div>

      {/* Dynamic Detail Panel */}
      {selectedCard && (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-extrabold text-[#0F172A]">
              {selectedCard === "assignedCases" && "All Assigned Cases"}
              {selectedCard === "activeCases" && "Active Cases"}
              {selectedCard === "upcomingHearings" && "Upcoming Hearings"}
            </h3>
            <span className="text-sm text-[#64748B] font-semibold">
              {selectedCard === "assignedCases" && `${assignedCasesList.length} cases`}
              {selectedCard === "activeCases" && `${activeCasesList.length} cases`}
              {selectedCard === "upcomingHearings" && `${upcomingHearingsList.length} hearings`}
            </span>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0]">
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Case</th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">
                    {selectedCard === "upcomingHearings" ? "Hearing Date" : "Client Name"}
                  </th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {selectedCard === "assignedCases" &&
                  assignedCasesList.map((item, index) => (
                    <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">{item.title}</td>
                      <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{item.clientName}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          item.status === "Active" || item.status === "Hearing"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                }
                {selectedCard === "activeCases" &&
                  activeCasesList.map((item, index) => (
                    <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">{item.title}</td>
                      <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{item.clientName}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          item.status === "Active" || item.status === "Hearing"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                }
                {selectedCard === "upcomingHearings" &&
                  upcomingHearingsList.map((item, index) => (
                    <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">{item.title}</td>
                      <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{item.hearing}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          item.status === "Active" || item.status === "Hearing"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                }
                {((selectedCard === "assignedCases" && assignedCasesList.length === 0) ||
                  (selectedCard === "activeCases" && activeCasesList.length === 0) ||
                  (selectedCard === "upcomingHearings" && upcomingHearingsList.length === 0)) && (
                  <tr>
                    <td colSpan="3" className="p-10 text-center text-[#94A3B8] font-medium text-sm">
                      No cases found for this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Cases Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#0F172A]">
              Assigned Cases
            </h2>

            <button
              onClick={() => router.push("/assigned-cases")}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0]">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#64748B] font-medium">Loading cases…</p>
                </div>
              </div>
            ) : cases.length === 0 ? (
              <div className="p-10 text-center text-[#94A3B8] font-medium text-sm">
                No assigned cases found.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-[#E2E8F0]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Case</th>
                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Client Name</th>
                    <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {cases.map((item, index) => (
                    <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">
                        {item.title}
                      </td>
                      <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">
                        {item.clientName}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${item.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-[#0F172A]">
              Recent Documents
            </h2>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] lg:max-h-[480px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center p-6 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#64748B]">No documents found.</p>
                <p className="text-xs text-[#94A3B8] mt-1">Assigned case documents will appear here.</p>
              </div>
            ) : (
              recentDocuments.map((doc, index) => {
                const roleBadgeClass = ROLE_BADGE[doc.uploaded_by_role] || "bg-slate-100 text-slate-600";
                return (
                  <div
                    key={doc.id || index}
                    className="p-4 rounded-2xl bg-[#F8FAFC] hover:bg-white border border-transparent hover:border-[#E2E8F0] hover:shadow-md transition-all duration-300 cursor-pointer group"
                    onClick={() => {
                      if (doc.file_url) window.open(doc.file_url, "_blank");
                    }}
                  >
                    {/* Top row: icon + filename */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B] group-hover:text-[#2563EB] transition-colors leading-tight truncate">
                          {doc.filename}
                        </p>

                        {/* Doc type badge + View Case button */}
                        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                          {doc.document_type && doc.document_type !== "File" && (
                            <span className="inline-flex text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {doc.document_type}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/assigned-cases");
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 cursor-pointer"
                          >
                            View Case
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Case info */}
                    {doc.case_title && (
                      <p className="text-[10px] text-[#475569] font-medium mt-2 truncate">
                        📁 {doc.case_title}
                        {doc.case_no && <span className="text-[#94A3B8] ml-1">({doc.case_no})</span>}
                      </p>
                    )}

                    {/* Uploader + time row */}
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                      <div className="flex items-center flex-wrap gap-1">
                        <span className="text-[10px] text-[#94A3B8]">by</span>
                        <span className="text-[10px] font-semibold text-[#0F172A]">{doc.uploaded_by}</span>
                        <span className="text-[#CBD5E1] text-[10px]">·</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeClass}`}>
                          {doc.uploaded_by_role}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#94A3B8] font-medium">
                        {doc.timestamp_display}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, activeColor, isActive, onClick, loading }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-md border p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-pointer group ${
        isActive ? activeColor : "border-[#E2E8F0] hover:shadow-slate-200/60"
      }`}
    >
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm border`}>
        {icon}
      </div>

      <p className="text-[#475569] text-[10px] font-bold uppercase tracking-wider mb-1">
        {title}
      </p>

      <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
        {loading ? (
          <span className="inline-block w-12 h-8 rounded-lg bg-slate-100 animate-pulse" />
        ) : (
          value
        )}
      </h2>
    </div>
  );
}
