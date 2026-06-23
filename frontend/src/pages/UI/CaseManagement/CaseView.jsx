"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  Menu,
  Bell,
  Search,
  Plus,
  Eye,
  Pencil,
  MoreVertical,
} from "lucide-react";

import { usePermissions } from "@/utils/usePermissions";

export default function CaseView() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/case-management/");
      const data = await response.json();
      setCases(data);
    } catch (error) {
      console.error(error);
    }
  };

  // SEARCH FILTER
  const filteredCases = cases.filter((item) =>
    item.case_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.case_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.court_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <h1
        className="text-[#0F172A] font-bold"
        style={{ fontSize: "40px", fontWeight: 700, lineHeight: 1.2 }}
      >
        Case Management
      </h1>

      <p className="text-[#64748B] mt-1.5" style={{ fontSize: "18px" }}>
        Track legal cases, hearings and case progress
      </p>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        <Card
          title="AI Legal Assistant"
          description="Get intelligent legal answers and recommendations."
          buttonText="Open Assistant"
          color="bg-[#7C3AED] hover:bg-[#6d28d9]"
          onClick={() => router.push("/ai-assistant")}
        />

        <Card
          title="Judgment Summary"
          description="Summarize judgments and extract key points."
          buttonText="Explore Judgments"
          color="bg-[#16A34A] hover:bg-[#15803d]"
          onClick={() => router.push("/judgment-summary")}
        />

        <Card
          title="Legal Research"
          description="Search laws, acts and legal provisions."
          buttonText="Start Research"
          color="bg-[#2563EB] hover:bg-[#1d4ed8]"
          onClick={() => router.push("/legal-research")}
        />

        <Card
          title="Document Generation"
          description="Generate legal documents with AI."
          buttonText="Generate Document"
          color="bg-[#D97706] hover:bg-[#b45309]"
          onClick={() => router.push("/document-generation")}
        />
      </div>

      {/* CASES SECTION */}
      <div className="mt-6 bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
        
        {/* HEADER ROW */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="font-bold text-lg text-[#0F172A]">My Cases</h2>

          {hasPermission("Case Management", "add") && (
            <button
              onClick={() => router.push("/case-management/case-add")}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Plus size={16} />
              Add Case
            </button>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-3 text-[#94A3B8]" />

          <input
            type="text"
            placeholder="Search by title, case no, client, court..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8F0] pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-[#64748B] uppercase">
                <th className="pb-3">Case Title</th>
                <th className="pb-3">Case No</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">Court</th>
                <th className="pb-3">Next Hearing</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCases.length > 0 ? (
                filteredCases.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8FAFC]">
                    <td className="py-4 text-sm font-medium">{item.case_title}</td>
                    <td className="py-4 text-sm">{item.case_no}</td>
                    <td className="py-4 text-sm">{item.client_name}</td>
                    <td className="py-4 text-sm text-[#64748B]">{item.court_name}</td>
                    <td className="py-4 text-sm text-[#64748B]">{item.hearing}</td>

                    <td className="py-4 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${
                          item.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-4 text-sm">
                      <div className="flex gap-3 text-[#64748B]">
                        <Eye size={18} className="hover:text-[#2563EB] cursor-pointer transition-colors" />
                        {hasPermission("Case Management", "edit") && (
                          <Pencil size={18} className="hover:text-[#2563EB] cursor-pointer transition-colors" />
                        )}
                        <MoreVertical size={18} className="hover:text-[#2563EB] cursor-pointer transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[#64748B]">
                    No cases found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* CARD COMPONENT */
function Card({ title, description, buttonText, color, onClick }) {
  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm">
      <h3 className="font-semibold text-[#0F172A]">{title}</h3>
      <p className="text-sm text-[#64748B] mt-1">{description}</p>

      <button
        onClick={onClick}
        className={`${color} text-white text-xs font-semibold px-4 py-2 rounded-lg w-full mt-4`}
      >
        {buttonText}
      </button>
    </div>
  );
}