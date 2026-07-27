"use client";

import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "@/utils/api";
import { getLoggedInUser } from "@/utils/auth";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  History,
  CheckCircle2,
  Clock,
  Check,
  X,
  Trash2,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ClientConsultationHistoryView() {
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
  });
  const [selectedTimeDate, setSelectedTimeDate] = useState(null);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Pagination state (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [successToast, setSuccessToast] = useState({ show: false, message: "", type: "success" });

  const triggerSuccess = (message, type = "success") => {
    setSuccessToast({ show: true, message, type });
    setTimeout(() => {
      setSuccessToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const getBookedHeaderLabel = (dateStr) => {
    if (!dateStr) return "BOOKED ON UNKNOWN DATE";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `BOOKED ON ${String(dateStr).toUpperCase()}`;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const dayName = d.toLocaleDateString("en-US", { weekday: 'long' }).toUpperCase();
    const monthName = d.toLocaleDateString("en-US", { month: 'long' }).toUpperCase();
    const dayNum = d.getDate();
    const year = d.getFullYear();

    const fullFormatted = `${dayName}, ${monthName} ${dayNum}, ${year}`;

    if (targetDate.getTime() === today.getTime()) {
      return `BOOKED TODAY - ${fullFormatted}`;
    }
    if (targetDate.getTime() === yesterday.getTime()) {
      return `BOOKED YESTERDAY - ${fullFormatted}`;
    }
    return `BOOKED ON ${fullFormatted}`;
  };

  const fetchHistory = async (currentUser) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/consultations`;
      const clientId = currentUser?.id || currentUser?.user_id || currentUser?.sub;
      if (clientId && !isNaN(Number(clientId))) {
        url += `?client_id=${clientId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const hist = data.filter(
          (item) =>
            item.status === "Completed" ||
            item.status === "Approved" ||
            item.status === "Rescheduled" ||
            item.status === "Scheduled" ||
            item.status === "Pending Advocate"
        );
        setHistory(hist);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
      triggerSuccess("Failed to load consultation history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const loggedIn = getLoggedInUser();
    setUser(loggedIn);
    fetchHistory(loggedIn);
  }, []);

  // Filtering logic
  const filteredHistory = useMemo(() => {
    const now = new Date();
    return history.filter((item) => {
      // 1. Specific Calendar Date Selection
      if (selectedDate) {
        const itemDateStr = (item.created_at || item.date || "").split("T")[0];
        if (itemDateStr !== selectedDate) return false;
        return true;
      }

      // 3. Time Period Dropdown Filter
      const dVal = item.created_at || item.date;
      if (!dVal) return true;
      const itemDate = new Date(dVal);
      if (isNaN(itemDate.getTime())) return true;

      if (timeFilter === "today") {
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getDate() === now.getDate()
        );
      }

      if (timeFilter === "week") {
        const firstDayOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        return itemDate >= firstDayOfWeek && itemDate <= lastDayOfWeek;
      }

      if (timeFilter === "month") {
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth()
        );
      }

      if (timeFilter === "year") {
        return itemDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [history, searchQuery, timeFilter, selectedDate]);

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, selectedDate]);

  // Sort items by booked date descending
  const sortedHistory = useMemo(() => {
    return [...filteredHistory].sort((a, b) => {
      const dateA = new Date(a.created_at || a.date).getTime() || 0;
      const dateB = new Date(b.created_at || b.date).getTime() || 0;
      return dateB - dateA;
    });
  }, [filteredHistory]);

  // Pagination Calculations
  const totalItems = sortedHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentTableData = sortedHistory.slice(startIndex, endIndex);

  const handleResetFilters = () => {
    setTimeFilter("all");
    setSelectedDate("");
    setCurrentPage(1);
  };

  const handleTimeChange = (date) => {
    setSelectedTimeDate(date);
    if (date) {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeString = `${hours}:${minutes} ${ampm}`;
      setFormData((prev) => ({ ...prev, time: timeString }));
    } else {
      setFormData((prev) => ({ ...prev, time: "" }));
    }
  };

  const handleReschedule = async () => {
    if (!formData.date || !formData.time) {
      triggerSuccess("Please fill Date and Time", "warning");
      return;
    }

    const rescheduleData = {
      date: formData.date,
      time: formData.time,
      reason: "Rescheduled by client",
    };

    try {
      const res = await fetch(
        `${API_BASE_URL}/consultations/${rescheduleId}/reschedule`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rescheduleData),
        }
      );

      if (res.ok) {
        triggerSuccess("Rescheduled successfully!");
        setShowModal(false);
        setRescheduleId(null);
        fetchHistory(user);
        setFormData({
          date: "",
          time: "",
        });
        setSelectedTimeDate(null);
      } else {
        triggerSuccess("Failed to reschedule consultation", "error");
      }
    } catch (err) {
      console.error("Error rescheduling:", err);
      triggerSuccess("Error connecting to server", "error");
    }
  };

  const handleDeleteConsultation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this consultation?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/consultations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerSuccess("Deleted successfully!");
        fetchHistory(user);
      } else {
        triggerSuccess("Failed to delete consultation", "error");
      }
    } catch (err) {
      console.error("Error deleting:", err);
      triggerSuccess("Error connecting to server", "error");
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* ──── HEADER ──── */}
      <div className="mb-6 md:mb-8 flex items-center gap-4 border-b border-[#E2E8F0] pb-6">
        <Link
          href="/client-consultation"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#2563EB] hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-[#0F172A] font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-tight">
              Meeting History
            </h1>
            <span className="text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200 px-3 py-1 rounded-full">
              {totalItems} Records
            </span>
          </div>
          <p className="text-sm sm:text-base text-[#64748B]">
            View your past and approved meetings
          </p>
        </div>
      </div>

      {/* Combined Card: Filter Controls + History Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-[#E2E8F0]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Time Period Dropdown */}
            <div className="lg:col-span-5">
              <select
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  if (e.target.value !== "custom") {
                    setSelectedDate("");
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all cursor-pointer"
              >
                <option value="all">All Meetings</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Calendar Date Selection */}
            <div className="lg:col-span-5 relative">
              <DatePicker
                selected={selectedDate ? new Date(selectedDate + "T00:00:00") : null}
                onChange={(date) => {
                  if (!date) {
                    setSelectedDate("");
                    setTimeFilter("all");
                    return;
                  }
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  setSelectedDate(`${year}-${month}-${day}`);
                  setTimeFilter("custom");
                }}
                placeholderText="Select Date on Calendar"
                dateFormat="yyyy-MM-dd"
                isClearable
                className="w-full pl-10 pr-8 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all cursor-pointer"
              />
              <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            </div>

            {/* Reset Button */}
            {(timeFilter !== "all" || selectedDate) && (
              <div className="lg:col-span-2 flex justify-end">
                <button
                  onClick={handleResetFilters}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Reset Filters"
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History Table Content */}
        <div className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Client</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Time</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Duration</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Summary</th>
                  <th className="p-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-[#64748B] font-medium">
                      Loading history...
                    </td>
                  </tr>
                ) : currentTableData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-[#64748B] font-medium">
                      No previous consultations found.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    let lastGroupKey = null;
                    return currentTableData.map((item) => {
                      const rawDate = item.created_at || item.date || "";
                      const dateKey = typeof rawDate === "string" ? rawDate.split("T")[0] : String(rawDate);
                      const showHeader = dateKey !== lastGroupKey;
                      if (showHeader) {
                        lastGroupKey = dateKey;
                      }
                      return (
                        <React.Fragment key={item.id}>
                          {showHeader && (
                            <tr className="bg-[#F8FAFC] border-t border-b border-[#E2E8F0]">
                              <td colSpan={8} className="py-2.5 px-4 text-xs font-extrabold text-[#334155] tracking-wider uppercase border-l-4 border-l-[#2563EB]">
                                {getBookedHeaderLabel(item.created_at || item.date)}
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-[#F8FAFC] transition-colors duration-150">
                            <td className="p-4 font-bold text-[#0F172A] capitalize whitespace-nowrap">{item.client_name || item.client}</td>
                            <td className="p-4 text-[#475569] whitespace-nowrap">{item.date}</td>
                            <td className="p-4 text-[#475569] whitespace-nowrap font-medium">{item.time || "N/A"}</td>
                            <td className="p-4 text-[#475569] whitespace-nowrap">{item.type}</td>
                            <td className="p-4 text-[#475569] whitespace-nowrap">{item.duration || "30 mins"}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                item.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'Rescheduled'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200'
                              }`}>
                                <CheckCircle2 size={11} />
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4 text-[#475569] max-w-xs truncate" title={item.summary || "No notes yet."}>
                              {item.summary || "No notes yet."}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleDeleteConsultation(item.id)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar (10 per page) */}
          {totalItems > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
              <p className="text-xs font-medium text-[#64748B]">
                Showing <span className="font-bold text-[#0F172A]">{startIndex + 1}</span> to{" "}
                <span className="font-bold text-[#0F172A]">{endIndex}</span> of{" "}
                <span className="font-bold text-[#0F172A]">{totalItems}</span> entries
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? "bg-[#2563EB] text-white shadow-xs"
                          : "text-[#64748B] hover:bg-slate-100 border border-transparent"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {mounted && showModal && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-[#0F172A]">
                Reschedule Consultation
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F8FAFC] text-[#64748B] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Date</label>
                <CustomDatePicker
                  selected={formData.date}
                  onChange={(dateStr) => setFormData({ ...formData, date: dateStr })}
                  minDate={new Date()}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 block">Time</label>
                <div className="w-full border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB] transition-all cursor-pointer">
                  <DatePicker
                    selected={selectedTimeDate}
                    onChange={handleTimeChange}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    placeholderText="Select Time"
                    wrapperClassName="w-full"
                    className="w-full p-3 text-[#0F172A] bg-transparent outline-none text-sm font-medium cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#F1F5F9]">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleReschedule}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* Custom Toast Notification */}
      {successToast.show && (
        <div className={`fixed top-5 right-5 z-[10000] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all duration-300 max-w-sm animate-in fade-in slide-in-from-top-4 ${
          successToast.type === "error"
            ? "bg-rose-600 text-white border-rose-500"
            : successToast.type === "warning"
            ? "bg-amber-600 text-white border-amber-500"
            : "bg-emerald-600 text-white border-emerald-500"
        }`}>
          {successToast.type === "error" ? (
            <X size={20} className="text-white shrink-0" />
          ) : successToast.type === "warning" ? (
            <Clock size={20} className="text-white shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="text-white shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold text-sm leading-tight">
              {successToast.type === "error" ? "Error" : successToast.type === "warning" ? "Notice" : "Success"}
            </p>
            <p className="text-xs font-medium mt-0.5 opacity-90">{successToast.message}</p>
          </div>
          <button
            onClick={() => setSuccessToast({ show: false, message: "", type: "success" })}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
