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
    <div className="w-full space-y-6 md:space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold text-[40px]">
          Law Firm Management
        </h1>
        <p className="text-[#64748B] mt-1.5 text-[18px]">
          Manage law firms, branches and firm information
        </p>
      </div>

      {/* Action Cards */}
      {allowedActions.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${allowedActions.length} gap-5`}>
          {allowedActions.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6"
              >
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center mb-4 border border-blue-100">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-bold text-[#0F172A] mb-4">
                    {item.title}
                  </h3>
                </div>

                <button
                  onClick={() => router.push(item.path)}
                  className={`${item.color} text-white w-full py-2.5 rounded-lg`}
                >
                  {item.button}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="w-11 h-11 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-[#64748B] text-sm">Total Advocates</p>
          <h3 className="text-3xl md:text-4xl font-bold mt-2 text-[#0F172A]">
            {advocates.length}
          </h3>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-[#64748B] text-sm">Active Advocates</p>
          <h3 className="text-3xl md:text-4xl font-bold mt-2 text-[#0F172A]">
            {advocates.filter((a) => a.status === "Active" || !a.status).length}
          </h3>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="w-11 h-11 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-[#64748B] text-sm">Inactive Advocates</p>
          <h3 className="text-3xl md:text-4xl font-bold mt-2 text-[#0F172A]">
            {advocates.filter((a) => a.status === "Inactive").length}
          </h3>
        </div>
      </div>

      {/* Search + Filter + Table Card */}
      {!loading && advocates.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header with Search + Filter */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2 w-full md:w-96 bg-gray-50">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search advocate..."
                className="w-full ml-3 bg-transparent outline-none text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Table */}
          {filteredAdvocates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Profile
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Specialization
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      City
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAdvocates.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition duration-200"
                    >
                      {/* Profile */}
                      {/* Profile */}
                      <td className="px-6 py-4">
                        <Image
                          src={
                            item.profileImage?.trim()
                              ? item.profileImage
                              : "https://images.unsplash.com/photo-1500648767791-00dcc994a43?w=400"
                          }
                          alt={item.advocateName || "Advocate"}
                          width={64}
                          height={64}
                          className="rounded-full object-cover border border-gray-200"
                        />
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {item.advocateName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {item.specialization}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {item.phoneNumber}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {item.city}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-4 py-1 rounded-full text-xs font-medium ${item.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.status || "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() =>
                              router.push(`/lawfirm-management/view?id=${item.id}`)
                            }
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                          >
                            <Eye size={18} />
                          </button>

                           {hasPermission("Law Firm Management", "delete") && (
                            <button
                              onClick={() => handleAdvocateDelete(item.id)}
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                            >
                              <Trash2 size={18} />
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
            <div className="p-8 text-center text-gray-500 text-sm">
              No advocates found matching the filters.
            </div>
          )}
        </div>
      )}

 {assignedCases.length > 0 && (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-8">

    {/* Header */}
    <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
      <h2 className="text-lg font-bold text-[#0F172A]">
        Assigned Cases
      </h2>

      {/* Search */}
      <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2 w-full md:w-80 bg-gray-50">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search case..."
          className="w-full ml-3 bg-transparent outline-none text-sm"
          value={caseSearch}
          onChange={(e) => setCaseSearch(e.target.value)}
        />
      </div>

      {/* Filter */}
      <select
        className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white"
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
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
              Case Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
              Case Number
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
              Case Title
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
              Advocate Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
              Priority
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
              Due Date
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
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
                className="border-b last:border-0 hover:bg-gray-50"
              >
                <td className="px-6 py-4">{item.case_name}</td>
                <td className="px-6 py-4">{item.case_number}</td>
                <td className="px-6 py-4">{item.case_title}</td>
                <td className="px-6 py-4">{item.advocate_name}</td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
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

                <td className="px-6 py-4">{item.due_date}</td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-3">
                    {hasPermission("Law Firm Management", "edit") && (
                      <button
                        onClick={() =>
                          router.push(
                            `/lawfirm-management/assign-advocate?id=${item.id}`
                          )
                        }
                        className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition"
                      >
                        Edit
                      </button>
                    )}

                    {hasPermission("Law Firm Management", "delete") && (
                      <button
                        onClick={() => handleCaseDelete(item.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                      >
                        <Trash2 size={18} />
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