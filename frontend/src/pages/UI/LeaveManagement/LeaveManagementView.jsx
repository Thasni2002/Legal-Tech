"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertCircle,
  X,
  ChevronDown,
  UserCheck,
  Building,
  Users,
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api";
import { getLoggedInUser } from "@/utils/auth";
import useModulePermission from "@/utils/useModulePermission";
import { getTodayDateString } from "@/utils/dateUtils";
import CustomDatePicker from "@/components/ui/CustomDatePicker";

export default function LeaveManagementView({
  viewMode = "senior", // "senior" | "junior" | "clerk"
  moduleKey = "Leave Management",
}) {
  const { perms, loading: permsLoading } = useModulePermission(moduleKey);
  const user = getLoggedInUser();
  const roleNorm = (user?.role || "").toLowerCase().replace(/\s+/g, "");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if this view can approve/reject leave requests
  const canApprove =
    viewMode === "senior"
      ? ["senioradvocate", "admin"].includes(roleNorm)
      : viewMode === "clerk"
      ? ["clerk", "senioradvocate", "admin"].includes(roleNorm) && perms.edit
      : false;

  const [balances, setBalances] = useState({
    financial_year: "FY 2026-27",
    emergency_leave: { total: 6, used: 0, remaining: 6 },
    sick_leave: { total: 4, used: 0, remaining: 4 },
    floater_leave: { total: 2, used: 0, remaining: 2 },
  });

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Clerk specific tab: "own" vs "team"
  const [clerkTab, setClerkTab] = useState("own"); // "own" | "team"

  // Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState("Approved"); // Approved or Rejected
  const [rejectionReason, setRejectionReason] = useState("");

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    leave_type: "Emergency Leave",
    subject: "",
    description: "",
    from_date: "",
    to_date: "",
    is_half_day: "None",
  });
  const [submitting, setSubmitting] = useState(false);

  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch balances and leave requests
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Fetch Balances
      const resBal = await fetch(`${API_BASE_URL}/leaves/balances`, { headers });
      if (resBal.ok) {
        const balData = await resBal.json();
        setBalances(balData);
      }

      // 2. Fetch Leaves with view_mode and scope
      let queryParams = [`view_mode=${viewMode}`];
      if (viewMode === "clerk") {
        queryParams.push(`scope=${clerkTab}`);
      }
      if (statusFilter !== "All") queryParams.push(`status=${statusFilter}`);
      if (fromDate) queryParams.push(`from_date=${fromDate}`);
      if (toDate) queryParams.push(`to_date=${toDate}`);

      const url = `${API_BASE_URL}/leaves?${queryParams.join("&")}`;
      const resLeaves = await fetch(url, { headers });
      if (resLeaves.ok) {
        const leaveData = await resLeaves.json();
        setLeaves(leaveData);
      } else {
        const errJson = await resLeaves.json();
        setError(errJson.detail || "Failed to load leave records.");
      }
    } catch (err) {
      console.error("Error fetching leave data:", err);
      setError("Network or server connection error.");
    } finally {
      setLoading(false);
    }
  }, [viewMode, clerkTab, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter leaves locally by search input
  const filteredLeaves = leaves.filter((item) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      item.applicant_name?.toLowerCase().includes(term) ||
      item.subject?.toLowerCase().includes(term) ||
      item.leave_type?.toLowerCase().includes(term) ||
      item.applicant_role?.toLowerCase().includes(term)
    );
  });

  // Handle Apply Form submission
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.description.trim()) {
      alert("Please provide a description for your leave request.");
      return;
    }
    if (!applyForm.from_date || !applyForm.to_date) {
      alert("Please select both From Date and To Date.");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/leaves/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(applyForm),
      });

      if (res.ok) {
        setShowApplyModal(false);
        setApplyForm({
          leave_type: "Emergency Leave",
          description: "",
          from_date: "",
          to_date: "",
          is_half_day: "None",
        });
        fetchData();
      } else {
        const errJson = await res.json();
        alert(errJson.detail || "Failed to submit leave request.");
      }
    } catch (err) {
      alert("Error submitting request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Status Update (Approve / Reject)
  const handleStatusUpdate = async () => {
    if (!selectedLeave) return;
    setSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/leaves/${selectedLeave.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: actionType,
          rejection_reason: actionType === "Rejected" ? rejectionReason : null,
        }),
      });

      if (res.ok) {
        const resJson = await res.json();
        setShowActionModal(false);
        setSelectedLeave(null);
        setRejectionReason("");
        fetchData();

        if (resJson.reassigned_cases_count && resJson.reassigned_cases_count > 0) {
          alert(
            `Leave Approved!\n\n${resJson.reassigned_cases_count} case hearing(s) falling on the approved leave dates were automatically transferred to Secondary Junior Advocates:\n\n` +
              (resJson.reassigned_details || []).map((d) => `• ${d}`).join("\n")
          );
        }
      } else {
        const errJson = await res.json();
        alert(errJson.detail || "Failed to update leave status.");
      }
    } catch (err) {
      alert("Error updating status: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel Leave
  const handleCancelLeave = async (id) => {
    if (!confirm("Are you sure you want to cancel this leave application?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/leaves/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      } else {
        const errJson = await res.json();
        alert(errJson.detail || "Failed to cancel leave.");
      }
    } catch (err) {
      alert("Error cancelling leave: " + err.message);
    }
  };

  // EXPORT HANDLERS (CSV, EXCEL, PDF)
  const exportAsCSV = () => {
    setShowExportMenu(false);
    let queryParams = [`view_mode=${viewMode}`];
    if (viewMode === "clerk") queryParams.push(`scope=${clerkTab}`);
    if (statusFilter !== "All") queryParams.push(`status=${statusFilter}`);
    if (fromDate) queryParams.push(`from_date=${fromDate}`);
    if (toDate) queryParams.push(`to_date=${toDate}`);

    const url = `${API_BASE_URL}/leaves/export?${queryParams.join("&")}`;
    window.open(url, "_blank");
  };

  const exportAsExcel = () => {
    setShowExportMenu(false);
    let headers = [
      "ID",
      "Applicant",
      "Role",
      "Leave Type",
      "Subject",
      "Description",
      "From Date",
      "To Date",
      "Days",
      "Status",
      "Approver",
    ];
    let rows = filteredLeaves.map((l) => [
      l.id,
      `"${l.applicant_name}"`,
      `"${l.applicant_role}"`,
      `"${l.leave_type}"`,
      `"${l.subject || ""}"`,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      l.from_date,
      l.to_date,
      l.total_days,
      l.status,
      `"${l.approver_name || ""}"`,
    ]);

    let content = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    let encodedUri = encodeURI(content);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leave_report_${viewMode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsPDF = () => {
    setShowExportMenu(false);
    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <html>
        <head>
          <title>Leave Requests Report (${viewMode.toUpperCase()})</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
            h2 { color: #0f172a; margin-bottom: 4px; }
            p { color: #64748b; font-size: 14px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f1f5f9; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px; }
            .approved { background: #dcfce7; color: #166534; }
            .pending { background: #fef3c7; color: #92400e; }
            .rejected { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <h2>Leave Management Report (${viewMode.toUpperCase()} VIEW)</h2>
          <p>Generated on ${new Date().toLocaleDateString()} | Total Records: ${filteredLeaves.length}</p>
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Role</th>
                <th>Leave Type</th>
                <th>Subject</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLeaves
                .map(
                  (l) => `
                <tr>
                  <td><strong>${l.applicant_name}</strong></td>
                  <td>${l.applicant_role}</td>
                  <td>${l.leave_type}</td>
                  <td>${l.subject || "-"}</td>
                  <td>${l.from_date} to ${l.to_date}</td>
                  <td>${l.total_days}</td>
                  <td><span class="badge ${l.status.toLowerCase()}">${l.status}</span></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Header Titles
  const getHeaderTitle = () => {
    if (viewMode === "junior") return "My Leave";
    if (viewMode === "clerk") return "Clerk Leave & Approvals";
    return "Leave Management";
  };

  const getHeaderSubtitle = () => {
    if (viewMode === "junior") return "Apply and track your personal leave requests";
    if (viewMode === "clerk") return "Apply for leave and manage junior leave applications";
    return "Review employee leave applications and manage balances";
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
          {getHeaderTitle()}
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{getHeaderSubtitle()}</p>
      </div>

      {/* Clerk Dual Mode Switcher (Own Requests vs Team Approvals) */}
      {viewMode === "clerk" && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <button
            onClick={() => setClerkTab("own")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: clerkTab === "own" ? "#0F172A" : "#F1F5F9",
              color: clerkTab === "own" ? "#ffffff" : "#475569",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            My Leave Applications
          </button>
          <button
            onClick={() => setClerkTab("team")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: clerkTab === "team" ? "#0F172A" : "#F1F5F9",
              color: clerkTab === "team" ? "#ffffff" : "#475569",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Users style={{ width: "16px", height: "16px" }} /> Junior Advocate Approvals
          </button>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F1F5F9", padding: "4px", borderRadius: "10px" }}>
            {["All", "Pending", "Approved", "Rejected"].map((tab) => {
              const active = statusFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: active ? "#0F172A" : "transparent",
                    color: active ? "#ffffff" : "#475569",
                    fontWeight: active ? "600" : "500",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Controls: Search, Dates, Export, Apply */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "180px" }}>
              <Search style={{ position: "absolute", left: "10px", top: "10px", width: "16px", height: "16px", color: "#94A3B8" }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: "32px",
                  paddingRight: "12px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>

            {/* From Date */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "2px" }}>
                From Date
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  color: "#1E293B",
                }}
              />
            </div>

            {/* To Date */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "2px" }}>
                To Date
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  color: "#1E293B",
                }}
              />
            </div>



            {/* Apply Leave Button */}
            {perms.add && (
              <button
                onClick={() => setShowApplyModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#0F172A",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                Apply Leave
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Leave Requests Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw style={{ animation: "spin 1s linear infinite", width: "24px", height: "24px", margin: "auto" }} />
            <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading leave applications...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>
            <AlertCircle style={{ width: "28px", height: "28px", margin: "auto", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontWeight: "600" }}>{error}</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            <CalendarIcon style={{ width: "36px", height: "36px", margin: "auto", color: "#94a3b8" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#334155", marginTop: "12px" }}>No Leave Requests Found</h3>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Try adjusting your filters or apply for a new leave.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Applicant</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Leave Type</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Description / Reason</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Dates</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Duration</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Status</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Approver Info</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((req) => {
                  let statusBg = "#FEF3C7";
                  let statusColor = "#92400E";
                  let statusIcon = <Clock style={{ width: "12px", height: "12px" }} />;

                  if (req.status === "Approved") {
                    statusBg = "#DCFCE7";
                    statusColor = "#166534";
                    statusIcon = <CheckCircle style={{ width: "12px", height: "12px" }} />;
                  } else if (req.status === "Rejected") {
                    statusBg = "#FEE2E2";
                    statusColor = "#991B1B";
                    statusIcon = <XCircle style={{ width: "12px", height: "12px" }} />;
                  } else if (req.status === "Cancelled") {
                    statusBg = "#F1F5F9";
                    statusColor = "#64748B";
                    statusIcon = <XCircle style={{ width: "12px", height: "12px" }} />;
                  }

                  const isOwnRequest = user?.id === req.user_id;

                  return (
                    <tr key={req.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      {/* Applicant */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#0F172A" }}>{req.applicant_name}</div>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#F1F5F9",
                            color: "#475569",
                            fontWeight: "500",
                          }}
                        >
                          {req.applicant_role}
                        </span>
                      </td>

                      {/* Leave Type */}
                      <td style={{ padding: "16px 20px", fontWeight: "500", color: "#334155" }}>
                        {req.leave_type}
                      </td>

                      {/* Description / Reason */}
                      <td style={{ padding: "16px 20px", maxWidth: "280px" }}>
                        <div style={{ fontSize: "13px", color: "#334155", fontWeight: "500" }}>
                          {req.description}
                        </div>
                      </td>

                      {/* Dates */}
                      <td style={{ padding: "16px 20px", color: "#334155", fontSize: "13px" }}>
                        <div>{req.from_date}</div>
                        <div style={{ color: "#94A3B8", fontSize: "11px" }}>to {req.to_date}</div>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: "16px 20px", fontWeight: "600", color: "#0F172A" }}>
                        {req.total_days} {req.total_days === 1 ? "day" : "days"}
                        {req.is_half_day && req.is_half_day !== "None" && (
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "normal" }}>({req.is_half_day})</div>
                        )}
                      </td>

                      {/* Status Tag */}
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: statusBg,
                            color: statusColor,
                          }}
                        >
                          {statusIcon}
                          {req.status}
                        </span>
                      </td>

                      {/* Approver Info */}
                      <td style={{ padding: "16px 20px", fontSize: "12px", color: "#64748B" }}>
                        {req.approver_name ? (
                          <div>
                            <div style={{ color: "#334155", fontWeight: "500" }}>{req.approver_name}</div>
                            {req.rejection_reason && (
                              <div style={{ color: "#DC2626", fontStyle: "italic", marginTop: "2px" }}>
                                "{req.rejection_reason}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>Pending review</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          {/* Approver Actions */}
                          {canApprove && req.status === "Pending" && perms.edit && !isOwnRequest && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedLeave(req);
                                  setActionType("Approved");
                                  setShowActionModal(true);
                                }}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#16A34A",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <CheckCircle style={{ width: "14px", height: "14px" }} /> Approve
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedLeave(req);
                                  setActionType("Rejected");
                                  setShowActionModal(true);
                                }}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#DC2626",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <XCircle style={{ width: "14px", height: "14px" }} /> Reject
                              </button>
                            </>
                          )}

                          {/* Applicant Cancel Action */}
                          {isOwnRequest && req.status === "Pending" && (
                            <button
                              onClick={() => handleCancelLeave(req.id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid #CBD5E1",
                                background: "#ffffff",
                                color: "#64748B",
                                fontSize: "12px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPLY LEAVE MODAL */}
      {mounted && showApplyModal && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F8FAFC",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Apply for Leave</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748B" }}
              >
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} style={{ padding: "24px" }}>
              {/* Leave Type */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Leave Type <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <select
                  value={applyForm.leave_type}
                  onChange={(e) => setApplyForm({ ...applyForm, leave_type: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Floater Leave">Floater Leave</option>
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Description / Reason <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide details for your leave request..."
                  value={applyForm.description}
                  onChange={(e) => setApplyForm({ ...applyForm, description: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Date Range: From Date & To Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    From Date <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <CustomDatePicker
                    selected={applyForm.from_date}
                    onChange={(dateStr) => setApplyForm({ ...applyForm, from_date: dateStr })}
                    minDate={new Date()}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    To Date <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <CustomDatePicker
                    selected={applyForm.to_date}
                    onChange={(dateStr) => setApplyForm({ ...applyForm, to_date: dateStr })}
                    minDate={applyForm.from_date ? new Date(applyForm.from_date + "T00:00:00") : new Date()}
                    required
                  />
                </div>
              </div>

              {/* Half Day Option */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Half Day Request
                </label>
                <select
                  value={applyForm.is_half_day}
                  onChange={(e) => setApplyForm({ ...applyForm, is_half_day: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="None">Full Day</option>
                  <option value="First Half">First Half Only</option>
                  <option value="Second Half">Second Half Only</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0F172A",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* APPROVE / REJECT ACTION MODAL */}
      {mounted && showActionModal && selectedLeave && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F8FAFC",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                {actionType === "Approved" ? "Approve Leave Request" : "Reject Leave Request"}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748B" }}
              >
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <p style={{ fontSize: "14px", color: "#334155", margin: "0 0 16px 0" }}>
                You are about to <strong>{actionType.toLowerCase()}</strong> the leave request for{" "}
                <strong>{selectedLeave.applicant_name}</strong> ({selectedLeave.leave_type}, {selectedLeave.total_days} days).
              </p>

              {actionType === "Rejected" && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Reason for Rejection
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter reason for rejecting this leave request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={submitting}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: actionType === "Approved" ? "#16A34A" : "#DC2626",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Updating..." : `Confirm ${actionType}`}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
