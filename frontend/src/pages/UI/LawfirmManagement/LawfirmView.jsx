"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  History,
  Briefcase,
  Search,
  Eye,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { usePermissions } from "@/utils/usePermissions";

export default function LawfirmView() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [advocates, setAdvocates] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [assignedCases, setAssignedCases] = useState([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState("All");
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  
  const actions = [
    {
      title: "Add Advocate",
      icon: Building2,
      button: "Add Advocate",
      color: "bg-blue-600",
      path: "/lawfirm-management/add-manage-firm",
      permissionAction: "add"
    },
    {
      title: "Assign Advocate",
      icon: Users,
      button: "Assign Advocate",
      color: "bg-green-600",
      path: "/lawfirm-management/assign-advocate",
      permissionAction: "add"
    },
  ];

  const allowedActions = actions.filter(item => hasPermission("Law Firm Management", item.permissionAction));

  useEffect(() => {
    const fetchAdvocates = async () => {
      try {
        const response = await fetch("http://localhost:8000/lawfirm-management/");
        const data = await response.json();

        setAdvocates(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error("Error fetching advocates:", error);
        setAdvocates([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchAssignedCases = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/lawfirm-management/assigned-cases"
        );

        const data = await response.json();
        setAssignedCases(data);
      } catch (error) {
        console.error("Error fetching assigned cases:", error);
      }
    };

    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/advocate/dashboard");
        const data = await response.json();
        setDashboardStats(data.stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchAdvocates();
    fetchDashboardStats();
    fetchAssignedCases();
  }, []);

const handleAdvocateDelete = async (id) => {
  try {
    await fetch(`http://localhost:8000/lawfirm-management/${id}`, {
      method: "DELETE",
    });

    setAdvocates((prev) =>
      prev.filter((item) => item.id !== id)
    );
  } catch (error) {
    console.error("Delete advocate failed:", error);
  }
};

const handleCaseDelete = async (id) => {
  try {
    await fetch(
      `http://localhost:8000/lawfirm-management/assigned-cases/${id}`,
      {
        method: "DELETE",
      }
    );

    setAssignedCases((prev) =>
      prev.filter((item) => item.id !== id)
    );
  } catch (error) {
    console.error("Delete case failed:", error);
  }
};

  const filteredAdvocates = advocates.filter((item) => {
    const matchesSearch =
      item.advocateName?.toLowerCase().includes(search.toLowerCase()) ||
      item.specialization?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ? true : item.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-[#E2E8F0] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[#0F172A] font-extrabold text-3xl tracking-tight">
            Law Firm Management
          </h1>
          <p className="text-[#64748B] mt-2 font-medium">
            Manage law firms, branches and firm information
          </p>
        </div>
      </div>

      {/* Action Cards */}
      {allowedActions.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${allowedActions.length} gap-6`}>
          {allowedActions.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/40 p-8 hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
                    <Icon className="w-7 h-7" />
                  </div>

                  <h3 className="font-extrabold text-xl text-[#0F172A] mb-6">
                    {item.title}
                  </h3>
                </div>

                <button
                  onClick={() => router.push(item.path)}
                  className={`px-8 py-3.5 rounded-full text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] w-full ${item.color}`}
                >
                  {item.button}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/40 p-8 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 border border-purple-200">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-[#64748B] text-sm font-semibold uppercase tracking-wider">Total Advocates</p>
            <h3 className="text-4xl md:text-5xl font-extrabold mt-3 text-[#0F172A]">
              {advocates.length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/40 p-8 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 border border-green-200">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-[#64748B] text-sm font-semibold uppercase tracking-wider">Active Advocates</p>
            <h3 className="text-4xl md:text-5xl font-extrabold mt-3 text-[#0F172A]">
              {advocates.filter((a) => a.status === "Active" || !a.status).length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/40 p-8 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6 border border-red-200">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-[#64748B] text-sm font-semibold uppercase tracking-wider">Inactive</p>
            <h3 className="text-4xl md:text-5xl font-extrabold mt-3 text-[#0F172A]">
              {advocates.filter((a) => a.status === "Inactive").length}
            </h3>
          </div>
        </div>
      </div>

      {/* Search + Filter + Table Card */}
      {!loading && advocates.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/40 overflow-hidden">
          {/* Header with Search + Filter */}
          <div className="p-8 border-b border-[#F1F5F9] flex flex-col md:flex-row gap-6 justify-between items-center bg-white">
            <div className="flex items-center border border-[#E2E8F0] rounded-full px-5 py-3 w-full md:w-[400px] bg-[#F8FAFC] focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB] transition-all">
              <Search className="w-5 h-5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search advocate..."
                className="w-full ml-3 bg-transparent outline-none text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="border border-[#E2E8F0] rounded-full px-6 py-3 text-sm bg-[#F8FAFC] text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Table */}
          {filteredAdvocates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                      Profile
                    </th>
                    <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                      Name
                    </th>
                    <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                      Specialization
                    </th>
                    <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                      Phone
                    </th>
                    <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                      City
                    </th>
                    <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                      Status
                    </th>
                    <th className="px-8 py-5 text-center text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredAdvocates.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition duration-200 group"
                    >
                      {/* Profile */}
                      <td className="px-8 py-5">
                        <img
                          src={
                            item.profileImage?.trim()
                              ? item.profileImage
                              : `https://ui-avatars.com/api/?name=${item.advocateName || 'Advocate'}&background=E2E8F0&color=64748B&rounded=true&bold=true`
                          }
                          alt={item.advocateName || "Advocate"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-[#E2E8F0] group-hover:ring-[#CBD5E1] transition-all"
                        />
                      </td>

                      {/* Name */}
                      <td className="px-8 py-5">
                        <div>
                          <p className="font-bold text-[#0F172A] text-sm">
                            {item.advocateName}
                          </p>
                          <p className="text-xs text-[#64748B] mt-1 font-medium">
                            {item.emailAddress || item.email || "No Email"}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-[#475569]">
                        {item.specialization || "-"}
                      </td>

                      <td className="px-8 py-5 text-sm font-medium text-[#475569]">
                        {item.phoneNumber || "-"}
                      </td>

                      <td className="px-8 py-5 text-sm font-medium text-[#475569]">
                        {item.city || "-"}
                      </td>

                      {/* Status */}
                      {/* Status */}
                      <td className="px-8 py-5">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.status === "Active" || !item.status
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.status || "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              router.push(`/lawfirm-management/view?id=${item.id}`)
                            }
                            className="w-9 h-9 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors"
                          >
                            <Eye size={16} />
                          </button>

                           {hasPermission("Law Firm Management", "delete") && (
                            <button
                              onClick={() => handleAdvocateDelete(item.id)}
                              className="w-9 h-9 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4 border border-[#E2E8F0]">
                <Search className="w-8 h-8 text-[#94A3B8]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-1">No advocates found</h3>
              <p className="text-[#64748B] text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      )}

 {assignedCases.length > 0 && (
  <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/40 overflow-hidden mt-8">

    {/* Header */}
    <div className="p-8 border-b border-[#F1F5F9] flex flex-col md:flex-row gap-6 justify-between items-center bg-white">
      <h2 className="text-xl font-extrabold text-[#0F172A]">
        Assigned Cases
      </h2>

      {/* Search */}
      <div className="flex items-center border border-[#E2E8F0] rounded-full px-5 py-3 w-full md:w-80 bg-[#F8FAFC] focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB] transition-all">
        <Search className="w-5 h-5 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search case..."
          className="w-full ml-3 bg-transparent outline-none text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
          value={caseSearch}
          onChange={(e) => setCaseSearch(e.target.value)}
        />
      </div>

      {/* Filter */}
      <select
        className="border border-[#E2E8F0] rounded-full px-6 py-3 text-sm bg-[#F8FAFC] text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
        value={caseFilter}
        onChange={(e) => setCaseFilter(e.target.value)}
      >
        <option value="All">All Priority</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    </div>

    {/* Table */}
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
              Case Name
            </th>
            <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
              Case Number
            </th>
            <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
              Case Title
            </th>
            <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
              Advocate Name
            </th>
            <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
              Priority
            </th>
            <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
              Due Date
            </th>
            <th className="px-8 py-5 text-center text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#F1F5F9]">
          {assignedCases
            .filter((item) => {
              const matchesSearch =
                item.case_title
                  ?.toLowerCase()
                  .includes(caseSearch.toLowerCase()) ||
                item.case_number
                  ?.toLowerCase()
                  .includes(caseSearch.toLowerCase());

              const matchesFilter =
                caseFilter === "All" || item.priority === caseFilter;

              return matchesSearch && matchesFilter;
            })
            .map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/50 transition duration-200 group"
              >
                <td className="px-8 py-5 text-sm font-bold text-[#0F172A]">{item.case_name}</td>
                <td className="px-8 py-5 text-sm font-medium text-[#475569]">{item.case_number}</td>
                <td className="px-8 py-5 text-sm font-medium text-[#475569]">{item.case_title}</td>
                <td className="px-8 py-5 text-sm font-medium text-[#475569]">
                  <div className="flex items-center gap-2">
                    <img src={`https://ui-avatars.com/api/?name=${item.advocate_name || 'Advocate'}&background=E2E8F0&color=64748B&rounded=true&bold=true`} className="w-6 h-6 rounded-full" />
                    {item.advocate_name}
                  </div>
                </td>

                <td className="px-8 py-5">
                  <span
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      item.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : item.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.priority}
                  </span>
                </td>

                <td className="px-8 py-5 text-sm font-medium text-[#475569]">{item.due_date}</td>

                {/* Actions */}
                <td className="px-8 py-5">
                  <div className="flex justify-center gap-2">
                    {hasPermission("Law Firm Management", "edit") && (
                      <button
                        onClick={() =>
                          router.push(
                            `/lawfirm-management/assign-advocate?id=${item.id}`
                          )
                        }
                        className="px-4 py-1.5 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-yellow-100 hover:text-yellow-600 text-[11px] font-bold uppercase tracking-widest transition-colors"
                      >
                        Edit
                      </button>
                    )}

                    {hasPermission("Law Firm Management", "delete") && (
                      <button
                        onClick={() => handleCaseDelete(item.id)}
                        className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}

    </div>
  );
}