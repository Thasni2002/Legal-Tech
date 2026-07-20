"use client";

import { useState, useEffect } from "react";
import { Calendar, Briefcase, User } from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

const BASE_URL = API_BASE_URL;

export default function ClientDashboard() {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assignedAdvocates, setAssignedAdvocates] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const user = getLoggedInUser();
    const name = user?.username || user?.name || "";

    const safeFetch = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.results || data.data || []);
      } catch (err) {
        return [];
      }
    };

    const fetchAll = async () => {
      setUserName(name);
      try {
        const [casesData, consultData, invoicesData, advocatesData] = await Promise.all([
          safeFetch(`${BASE_URL}/case-management/`),
          safeFetch(`${BASE_URL}/consultations`),
          safeFetch(`${BASE_URL}/finance/invoices${name ? `?client_name=${encodeURIComponent(name)}` : ""}`),
          safeFetch(`${BASE_URL}/lawfirm-management/`),
        ]);

        setInvoices(invoicesData);

        // Filter cases for this client by email or client_name matching username
        const clientCases = Array.isArray(casesData)
          ? (user
            ? casesData.filter((c) => {
              // 1. Match by email
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
            })
            : casesData)
          : [];

        setCases(clientCases);

        // Derive upcoming hearings from client's active cases that have next_hearing_date
        const clientHearings = clientCases
          .filter((c) => c.next_hearing_date && c.next_hearing_date !== "N/A")
          .map((c) => ({
            case_title: c.case_title || "Untitled Case",
            court: c.court_name || "Civil Court",
            advocate_name: c.selected_advocate || "—",
            date: c.next_hearing_date,
            time: "10:00 AM",
            status: "Scheduled",
          }));

        setHearings(clientHearings);

        // Filter consultations for this client by client_name
        const clientConsults = name
          ? consultData.filter((c) => {
            const normalized = (c.client_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            const normalizedUser = name.toLowerCase().replace(/[^a-z0-9]/g, "");
            return (
              normalized.includes(normalizedUser) ||
              normalizedUser.includes(normalized)
            );
          })
          : consultData;

        setConsultations(
          Array.isArray(clientConsults)
            ? clientConsults.slice(-5).reverse()
            : []
        ); const recentActivities = [];

        // Latest case updates
        clientCases.forEach((c) => {
          recentActivities.push({
            title: `Case updated: ${c.case_title}`,
            timestamp: c.updated_at || c.created_at,
          });
        });

        // Latest hearings
        clientHearings.forEach((h) => {
          recentActivities.push({
            title: `Hearing scheduled for ${h.case_title}`,
            timestamp: h.date,
          });
        });

        // Latest consultations
        clientConsults.forEach((c) => {
          recentActivities.push({
            title: `Consultation ${c.status}`,
            timestamp: c.date,
          });
        });

        // Latest payments
        invoicesData.forEach((inv) => {
          recentActivities.push({
            title: `Payment ${inv.status} - ₹${inv.grand_total}`,
            timestamp: inv.created_at,
          });
        });

        // Sort latest first
        recentActivities.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        // Show top 4
        setActivities(recentActivities.slice(0, 4));
        // Derive unique assigned advocate names across cases and hearings
        const advocateNamesInCases = clientCases
          .map((c) => c.selected_advocate)
          .filter((name) => name && name !== "—" && name !== "");

        const advocateNamesInHearings = clientHearings
          .map((h) => h.advocate_name)
          .filter((name) => name && name !== "—" && name !== "");

        const uniqueAdvocateNames = Array.from(
          new Set([...advocateNamesInCases, ...advocateNamesInHearings])
        );

        const advocatesList = uniqueAdvocateNames.map((name) => {
          const matchedAdvocate = Array.isArray(advocatesData)
            ? advocatesData.find(
              (adv) => (adv.advocate_name || adv.advocateName || "").toLowerCase().trim() === name.toLowerCase().trim()
            )
            : null;

          if (matchedAdvocate) {
            return {
              name: matchedAdvocate.advocate_name || matchedAdvocate.advocateName || name,
              phone: matchedAdvocate.phone_number || matchedAdvocate.phoneNumber || "—",
              email: matchedAdvocate.email_address || matchedAdvocate.emailAddress || "—",
              specialization: matchedAdvocate.specialization || "—",
            };
          } else {
            return {
              name: name,
              phone: "—",
              email: "—",
              specialization: "—",
            };
          }
        });

        setAssignedAdvocates(advocatesList);
      } catch (err) {
        console.error("ClientDashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Derived stats
  const activeCasesCount = cases.filter((c) => c.status === "Active").length;
  const upcomingHearingsCount = hearings.length;

  // Payment summary derived from invoices
  const totalPaid = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

  const totalPending = invoices
    .filter((inv) => inv.status !== "Paid")
    .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

  const nextDueInvoice = invoices
    .filter((inv) => inv.status !== "Paid")
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

  const fmtCurrency = (amount) =>
    amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : "₹0";

  // Format a date string nicely
  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };



  const hour = new Date().getHours();

  let greeting = "";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 17) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 lg:space-y-5 animate-in fade-in zoom-in-95 duration-500">

      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            {greeting}
            {userName ? `, ${userName}` : ""}
          </h1>
          <p className="text-[#64748B] mt-2 text-lg font-medium">
            Here's an overview of your legal matters.
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">

        <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer group">
          <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[#475569] text-[10px] font-bold uppercase tracking-wider mb-1">
            Active Cases
          </p>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
            {loading ? (
              <span className="inline-block w-12 h-8 rounded-lg bg-slate-100 animate-pulse" />
            ) : activeCasesCount}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer group">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[#475569] text-[10px] font-bold uppercase tracking-wider mb-1">
            Upcoming Hearings
          </p>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
            {loading ? (
              <span className="inline-block w-12 h-8 rounded-lg bg-slate-100 animate-pulse" />
            ) : upcomingHearingsCount}
          </h2>
        </div>

      </div>


      {/* Upcoming Hearings */}
      {!loading && hearings.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden">
          <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">Upcoming Hearings</h2>
          <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0]">
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Case</th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Court</th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Advocate</th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Hearing Date</th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {hearings.map((h, i) => (
                  <tr key={i} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 text-sm font-bold text-[#0F172A] whitespace-nowrap">{h.case_title}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{h.court}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">{h.advocate_name || "—"}</td>
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">{fmtDate(h.date)}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${h.status === "Scheduled"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : h.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Cases */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-[#0F172A]">My Cases</h2>
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
              No cases found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">
                    Title / Type
                  </th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">
                    Advocate
                  </th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">
                    Court
                  </th>
                  <th className="p-4 text-left text-xs font-bold text-[#475569] uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {cases.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap font-medium">
                      <span className="block font-bold text-[#0F172A]">
                        {item.case_title}
                      </span>
                      <span className="text-xs text-[#64748B]">
                        {item.case_type}
                      </span>
                    </td>

                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">
                      {item.selected_advocate || "Not Assigned"}
                    </td>

                    <td className="p-4 text-sm text-[#475569] whitespace-nowrap">
                      {item.court_name}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${item.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "Hearing"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                      >
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

      {/* Consultation + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Consultation History */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col">
          <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">
            Meeting History
          </h2>

          <div className="space-y-4 flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center text-[#94A3B8] font-medium text-sm py-6">
                No consultations found.
              </div>
            ) : (
              consultations.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-2xl border border-transparent hover:border-[#E2E8F0] hover:bg-white hover:shadow-md transition-all duration-300"
                >
                  <div>
                    <span className="block font-bold text-[#1E293B] mb-1">{fmtDate(item.date)}</span>
                    <span className="text-xs font-medium text-[#64748B]">
                      Meeting Type:  {item.type}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${item.status === "Completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : item.status === "In Progress"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col">
          <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8">
            Recent Activity
          </h2>

          <div className="space-y-4 flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center text-[#94A3B8] font-medium text-sm py-6">
                No recent activity.
              </div>
            ) : (
              activities.map((item, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <div className="flex-1 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] group-hover:bg-white group-hover:shadow-md transition-all">
                    <span className="font-bold text-[#1E293B] block">{item.title}</span>
                    <span className="text-xs text-[#64748B] mt-1 block">{fmtDate(item.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>



      {/* Assigned Advocates */}
      {!loading && assignedAdvocates && assignedAdvocates.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10">
          <h2 className="text-2xl font-extrabold text-[#0F172A] mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            Assigned Advocates
          </h2>
          
          <div className="space-y-6">
            {assignedAdvocates.map((adv, index) => (
              <div key={index} className="border border-[#E2E8F0] rounded-3xl p-6 bg-white hover:shadow-md transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
                    <span className="block text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Name</span>
                    <span className="font-extrabold text-lg text-[#0F172A]">{adv.name}</span>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
                    <span className="block text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Phone</span>
                    <span className="font-bold text-[#1E293B]">{adv.phone}</span>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
                    <span className="block text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Email</span>
                    <span className="font-bold text-[#1E293B]">{adv.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}