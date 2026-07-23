"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  User, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle,
  Play,
  Square
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkCourtVisit() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [resVisits, resCases] = await Promise.all([
        fetch(`${API_BASE_URL}/clerk/court-visit`),
        fetch(`${API_BASE_URL}/case-management/`)
      ]);

      let visitList = [];
      let caseList = [];

      if (resVisits.ok) {
        visitList = await resVisits.json();
      }
      if (resCases.ok) {
        caseList = await resCases.json();
      }

      setVisits(visitList);
      setCases(caseList);
    } catch (e) {
      console.error("Failed to load court visits or cases:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      fetchAllData().finally(() => setIsLoading(false));
    }
  }, [router]);

  // Combine system cases and custom visits into a unified list
  const combinedItems = React.useMemo(() => {
    const items = [];

    // Map existing visit logs
    const visitMapByCaseNo = {};
    visits.forEach((v) => {
      if (v.case_no) visitMapByCaseNo[v.case_no] = v;
    });

    // Add all system cases
    cases.forEach((c) => {
      const existingVisit = visitMapByCaseNo[c.case_no] || visits.find(v => v.court_name === c.court_name && v.notes?.includes(c.case_no));
      items.push({
        id: `sys_case_${c.id}_${existingVisit ? existingVisit.id : 'none'}`,
        dbVisitId: existingVisit ? existingVisit.id : null,
        case_id: c.id,
        case_no: c.case_no || c.case_id || `CASE-#${c.id}`,
        case_title: c.case_title || "Untitled Case",
        court_name: c.court_name || "District Court",
        court_hall: existingVisit ? existingVisit.court_hall : "Hall #01",
        judge_name: existingVisit ? existingVisit.judge_name : "Bench Judge",
        purpose_of_visit: existingVisit ? existingVisit.purpose_of_visit : "Cause List & Hearing",
        visit_status: existingVisit ? existingVisit.visit_status : "Pending",
        check_in_time: existingVisit ? existingVisit.check_in_time : null,
        check_out_time: existingVisit ? existingVisit.check_out_time : null,
        client_name: c.client_name || "N/A",
        next_hearing_date: c.next_hearing_date || "Today",
        isSystemCase: true
      });
    });

    // Add visits that don't belong to a system case
    visits.forEach((v) => {
      const existsInCases = cases.some((c) => c.case_no === v.case_no || (v.notes && v.notes.includes(c.case_no)));
      if (!existsInCases) {
        items.push({
          id: `custom_visit_${v.id}`,
          dbVisitId: v.id,
          case_no: v.case_no || "General Visit",
          case_title: v.court_name,
          court_name: v.court_name,
          court_hall: v.court_hall || "Main Hall",
          judge_name: v.judge_name || "",
          purpose_of_visit: v.purpose_of_visit,
          visit_status: v.visit_status,
          check_in_time: v.check_in_time,
          check_out_time: v.check_out_time,
          client_name: "General",
          next_hearing_date: v.visit_date || "Today",
          isSystemCase: false
        });
      }
    });

    return items;
  }, [cases, visits]);

  // Filter items by search & status
  const filteredItems = combinedItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.case_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.case_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.court_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || item.visit_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCheckIn = async (item) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      if (item.dbVisitId) {
        const response = await fetch(`${API_BASE_URL}/clerk/court-visit/${item.dbVisitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visit_status: "In Court",
            check_in_time: nowStr
          })
        });
        if (response.ok) fetchAllData();
      } else {
        const response = await fetch(`${API_BASE_URL}/clerk/court-visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            court_name: item.court_name,
            court_hall: item.court_hall,
            judge_name: item.judge_name,
            purpose_of_visit: item.purpose_of_visit,
            visit_status: "In Court",
            check_in_time: nowStr,
            notes: `Case: ${item.case_no} - ${item.case_title}`,
            visit_date: new Date().toISOString().split("T")[0]
          })
        });
        if (response.ok) fetchAllData();
      }
    } catch (err) {
      console.error("Check-in error:", err);
    }
  };

  const handleCheckOut = async (item) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      if (item.dbVisitId) {
        const response = await fetch(`${API_BASE_URL}/clerk/court-visit/${item.dbVisitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visit_status: "Completed",
            check_out_time: nowStr
          })
        });
        if (response.ok) fetchAllData();
      }
    } catch (err) {
      console.error("Check-out error:", err);
    }
  };

  const handleDelete = async (dbVisitId) => {
    if (!dbVisitId) return;
    if (!confirm("Are you sure you want to delete this visit log?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/court-visit/${dbVisitId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider">
            🏛️ Daily Movement & Cause List Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Court Visit Tracker
          </h1>
          <p className="text-emerald-100 text-sm max-w-2xl font-medium">
            All system cases are automatically tracked here. Record check-in/out timestamps and monitor daily cause list progress.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case no, title, court..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["All", "Pending", "In Court", "Completed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "All" ? `All Cases (${combinedItems.length})` : status}
            </button>
          ))}
        </div>
      </div>

      {/* Visit / Case List */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
          <p className="text-slate-400 text-sm font-medium">Loading cases and court visit logs...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Cases Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {searchQuery ? "No cases match your search query." : "All newly added cases will automatically appear here for court visit tracking."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    item.visit_status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    item.visit_status === 'In Court' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {item.visit_status}
                  </span>
                  {item.dbVisitId && (
                    <button onClick={() => handleDelete(item.dbVisitId)} className="text-slate-400 hover:text-red-600 p-1" title="Delete Log">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {item.case_no}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{item.case_title}</h3>
                </div>
                
                <div className="space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400" />
                    <span>Court: <strong>{item.court_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span>Hall: <strong>{item.court_hall}</strong></span>
                  </div>
                  {item.client_name && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span>Client: <strong>{item.client_name}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span>Hearing: <strong>{item.next_hearing_date}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Check In / Check Out */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>In: {item.check_in_time || '--:--'}</span>
                  <span>Out: {item.check_out_time || '--:--'}</span>
                </div>

                <div className="flex gap-2">
                  {item.visit_status === 'Pending' && (
                    <button
                      onClick={() => handleCheckIn(item)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
                    >
                      <Play size={14} /> Check In Now
                    </button>
                  )}
                  {item.visit_status === 'In Court' && (
                    <button
                      onClick={() => handleCheckOut(item)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                    >
                      <Square size={14} /> Check Out & Complete
                    </button>
                  )}
                  {item.visit_status === 'Completed' && (
                    <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200">
                      ✓ Visit Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
