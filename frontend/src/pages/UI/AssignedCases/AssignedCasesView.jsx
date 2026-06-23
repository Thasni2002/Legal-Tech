"use client";

import React, { useState } from "react";
import {
  Eye,
  FileText,
  Calendar,
  X,
  User,
  Building2,
  Download,
  Briefcase,
  File,
  Gavel,
} from "lucide-react";
import useModulePermission from "@/utils/useModulePermission";


const assignedCases = [
  {
    title: "State of U.P. vs. Rajesh Kumar",
    caseNo: "CR/1234/2023",
    client: "Rajesh Kumar",
    court: "CJM Court, Prayagraj",
    hearing: "28 May 2026",
    status: "Active",
    documents: [
      { name: "Charge_Sheet_Rajesh.pdf", size: "2.4 MB", type: "pdf", content: "IN THE CJM COURT, PRAYAGRAJ\n\nSTATE OF U.P.\nVS.\nRAJESH KUMAR\n\nCHARGE SHEET\nFiled under Section 302 of the IPC.\n\nAccused Rajesh Kumar stands charged with committing the offense of culpable homicide amounting to murder on the night of November 14, 2023. The prosecution submits that the circumstantial evidence and witness reports place the accused at the scene of crime with clear motive.\n\nKey witnesses scheduled for examination:\n1. Inspector Suresh Mishra (Investigating Officer)\n2. Dr. Ramesh Gupta (Medical Examiner)\n\nPrepared by District Prosecution Office." },
      { name: "Bail_Application_Filed.pdf", size: "1.1 MB", type: "pdf", content: "IN THE CJM COURT, PRAYAGRAJ\n\nIN THE MATTER OF BAIL APPLICATION FOR RAJESH KUMAR\n\nMay it please the court:\nThe applicant Rajesh Kumar submits this bail application under Section 439 of CrPC. The applicant has been in judicial custody since November 20, 2023. It is respectfully submitted that:\n1. The applicant has a clean record and no prior criminal history.\n2. The applicant is willing to cooperate with the investigations and comply with all court restrictions.\n3. There is no risk of the applicant absconding or tampering with witness testimony.\n\nHence, it is prayed that the applicant be released on bail." },
      { name: "Witness_1_Statement.pdf", size: "850 KB", type: "pdf", content: "STATEMENT OF WITNESS NO. 1\n(Under Section 161 of CrPC)\n\nName: Amit Singh\nAge: 34\nOccupation: Shopkeeper\n\nStatement:\n'On the night of Nov 14, 2023, around 10:15 PM, I was closing my shop near the town square. I saw a person matching Rajesh Kumar's height and clothing walking hastily towards the victim's residential lane. He looked agitated. I cannot confirm if he was carrying any object, but I recognize him as the accused who lives in the neighborhood.'" }
    ],
    notes: "Client has provided the primary alibi witnesses. Need to prepare cross-examination for Prosecution Witness 1 and verify timestamps from local CCTV."
  },
  {
    title: "ABC Pvt. Ltd. vs. XYZ Corp.",
    caseNo: "CS/890/2023",
    client: "ABC Pvt. Ltd.",
    court: "High Court",
    hearing: "04 Jun 2026",
    status: "Active",
    documents: [
      { name: "Commercial_Agreement.pdf", size: "5.2 MB", type: "pdf", content: "COMMERCIAL AGREEMENT\n\nBetween:\nABC Private Limited (Plaintiff)\nAnd:\nXYZ Corporation (Defendant)\n\nDate: 12th October 2021\n\nSubject: Dispute pertains to Clause 14 (Force Majeure) and outstanding rentals for the commercial space at Tech Plaza. Plaintiff claims arrears of INR 45,00,000 for the pandemic period. Defendant invokes Force Majeure claiming complete shutdown of corporate offices." },
      { name: "Written_Statement_XYZ.pdf", size: "1.8 MB", type: "pdf", content: "IN THE HIGH COURT OF JUDICATURE\n\nABC PVT. LTD. VS. XYZ CORP.\n\nWRITTEN STATEMENT OF THE DEFENDANT\n\nXYZ Corp. denies all allegations of breach and willful default. The defendant asserts that:\n1. The space was completely inaccessible due to government lockdowns, triggering Clause 14 of the Commercial Agreement.\n2. ABC Pvt. Ltd. failed to provide essential maintenance during the lockdown period, breaching its own landlord covenants.\n\nTherefore, the defendant prays for dismissal of the suit with costs." }
    ],
    notes: "Arbitration clause is invoked by respondent. Next hearing scheduled for oral arguments on interim relief request. Check recent SC judgments on arbitration scope during lockdowns."
  },
  {
    title: "Neha Singh vs. RTO Dept.",
    caseNo: "MA/334/2023",
    client: "Neha Singh",
    court: "Motor Accident Tribunal",
    hearing: "12 Jun 2026",
    status: "To Do",
    documents: [
      { name: "FIR_Accident_Report.pdf", size: "1.2 MB", type: "pdf", content: "FIRST INFORMATION REPORT\n\nFIR No: 442/2023\nDate of Incident: 03/11/2023\nTime: 14:30 Hours\nLocation: Sector 62 Crossing\n\nDetails:\nA collision was reported between a private hatchback (RTO registration DL-3C-XX-XXXX) driven by Neha Singh and a public bus. Eye-witness accounts indicate that the bus ran a red light. Immediate transport of the driver to City Hospital was arranged." },
      { name: "Medical_Certificate.pdf", size: "900 KB", type: "pdf", content: "MEDICAL CERTIFICATE & EVALUATION REPORT\n\nPatient Name: Neha Singh\nDate of Admission: 03/11/2023\nHospital: City Emergency Care\n\nInjuries Found:\n1. Fracture of left humerus requiring orthopedic intervention.\n2. Lacerations on face and shoulder.\n3. Mild concussion.\nDisability index: assessed at 15% temporary physical impairment." }
    ],
    notes: "Verify the insurance policy validity of the offending public bus. Request additional medical receipts for hospital stays and rehabilitation expenses."
  },
];

const getStatusSelectClass = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "Closed":
      return "bg-red-100 text-red-700 border-red-200";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "To Do":
      return "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-50 text-green-700 border border-green-100";
    case "Closed":
      return "bg-red-50 text-red-700 border border-red-100";
    case "In Progress":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "Active":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "To Do":
      return "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]";
    default:
      return "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]";
  }
};

export default function AssignedCasesView() {
  const { perms, loading } = useModulePermission("Assigned Cases");
  const [cases, setCases] = useState(assignedCases);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalViewMode, setModalViewMode] = useState("full");

  // No view access
  if (!loading && !perms.view) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 max-w-sm text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-sm mt-2">You do not have permission to view Assigned Cases.</p>
        </div>
      </div>
    );
  }

  const handleOpenDetails = (caseItem, viewMode = "full") => {
    setSelectedCase(caseItem);
    setModalViewMode(viewMode);
    setSelectedDocument(caseItem.documents && caseItem.documents.length > 0 ? caseItem.documents[0] : null);
  };

  const closeModal = () => {
    setSelectedCase(null);
    setSelectedDocument(null);
  };

  const handleStatusChange = (caseNo, newStatus) => {
    if (!perms.edit) return; // blocked if no edit permission
    setCases((prevCases) =>
      prevCases.map((c) =>
        c.caseNo === caseNo ? { ...c, status: newStatus } : c
      )
    );
    if (selectedCase && selectedCase.caseNo === caseNo) {
      setSelectedCase((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const filteredCases = cases.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.caseNo.toLowerCase().includes(query) ||
      item.client.toLowerCase().includes(query) ||
      item.court.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full space-y-6 md:space-y-8">

        {/* Page Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
            Assigned Cases
          </h1>
          <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
            View and manage your assigned legal cases
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#64748B] text-sm font-medium">
              Total Assigned Cases
            </h3>
            <p className="text-3xl font-bold text-[#0F172A] mt-2">
              12
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#64748B] text-sm font-medium">
              Active Cases
            </h3>
            <p className="text-3xl font-bold text-[#16A34A] mt-2">
              8
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#64748B] text-sm font-medium">
              Upcoming Hearings
            </h3>
            <p className="text-3xl font-bold text-[#2563EB] mt-2">
              4
            </p>
          </div>

        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
          <input
            type="text"
            placeholder="Search by case title, case no, client or court..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">

          <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A]">My Assigned Cases</h2>
            <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full">{filteredCases.length} cases</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Case Title</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Case No</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Court</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Next Hearing</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredCases.length > 0 ? (
                  filteredCases.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors duration-150 group"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-[#0F172A] max-w-[200px] truncate">
                        {item.title}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-lg">
                          {item.caseNo}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569] font-medium">
                        {item.client}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {item.court}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg">
                          {item.hearing}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {perms.edit ? (
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.caseNo, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 cursor-pointer transition-colors ${getStatusSelectClass(item.status)}`}
                          >
                            <option value="Completed" className="bg-white text-[#0F172A]">Completed</option>
                            <option value="Closed" className="bg-white text-[#0F172A]">Closed</option>
                            <option value="In Progress" className="bg-white text-[#0F172A]">In Progress</option>
                            <option value="Active" className="bg-white text-[#0F172A]">Active</option>
                            <option value="To Do" className="bg-white text-[#0F172A]">To Do</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block ${getStatusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDetails(item, "full")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="See Case Details"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          <button
                            onClick={() => handleOpenDetails(item, "document")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
                            title="Case Documents"
                          >
                            <FileText size={14} />
                            Docs
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={32} className="text-[#CBD5E1]" />
                        <p className="text-[#64748B] text-sm font-medium">No matching assigned cases found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#F8FAFC]/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl w-full max-w-5xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F1F5F9]/50">
              <div className="flex items-center gap-3">
                <span className="bg-blue-50 text-[#2563EB] p-2.5 rounded-2xl border border-blue-100">
                  <Gavel size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-[#0F172A] text-xl leading-tight">
                    {selectedCase.title}
                  </h3>
                  <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mt-1">
                    Case No: {selectedCase.caseNo}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-[#64748B] hover:text-[#64748B] rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body: Split Layout */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 min-h-0 bg-white">
              
              {/* Left Column: Details & Documents (col-span-3 in full mode, col-span-2 in document mode) */}
              <div className={`${modalViewMode === "full" ? "lg:col-span-3" : "lg:col-span-2"} overflow-y-auto pr-2 space-y-6 flex flex-col h-full`}>
                
                {modalViewMode === "full" && (
                  <>
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F1F5F9]/70 p-5 rounded-2xl border border-[#E2E8F0]">
                      <div className="space-y-1">
                        <span className="text-xxs font-bold text-[#64748B] uppercase tracking-wider block">Client</span>
                        <div className="flex items-center gap-2">
                          <User size={15} className="text-[#64748B]" />
                          <span className="text-sm font-bold text-[#0F172A]">{selectedCase.client}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xxs font-bold text-[#64748B] uppercase tracking-wider block">Court / Forum</span>
                        <div className="flex items-center gap-2">
                          <Building2 size={15} className="text-[#64748B]" />
                          <span className="text-sm font-semibold text-[#0F172A]">{selectedCase.court}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xxs font-bold text-[#64748B] uppercase tracking-wider block">Next Hearing</span>
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-blue-500" />
                          <span className="text-sm font-semibold text-[#0F172A]">{selectedCase.hearing}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xxs font-bold text-[#64748B] uppercase tracking-wider block">Case Status</span>
                        <span className={`inline-block px-2.5 py-0.5 mt-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${getStatusBadgeClass(selectedCase.status)}`}>
                          {selectedCase.status}
                        </span>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase size={14} className="text-[#64748B]" />
                        <span>Case Strategy & Advocate Notes</span>
                      </h4>
                      <div className="bg-amber-50/30 border border-amber-200/40 p-4 rounded-2xl text-[#64748B] text-sm font-medium leading-relaxed italic">
                        "{selectedCase.notes}"
                      </div>
                    </div>
                  </>
                )}

                {/* Documents Section */}
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    Assigned Documents ({selectedCase.documents?.length || 0})
                  </h4>
                  <div className={`space-y-2 overflow-y-auto flex-1 pr-1 ${modalViewMode === "full" ? "max-h-[220px]" : ""}`}>
                    {selectedCase.documents?.map((doc, idx) => {
                      const isSelected = selectedDocument?.name === doc.name;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                            isSelected
                              ? "bg-blue-50/50 border-blue-200 text-blue-900 shadow-sm"
                              : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#E2E8F0] hover:bg-[#F1F5F9]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} className={isSelected ? "text-[#2563EB]" : "text-[#64748B]"} />
                            <div>
                              <p className="text-xs font-bold truncate max-w-[160px] sm:max-w-[260px]">
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-[#64748B] mt-0.5">{doc.size}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setSelectedDocument(doc)}
                            className={`px-4 py-1.5 rounded-xl text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#2563EB] text-white shadow-sm"
                                : "bg-[#F8FAFC] text-[#64748B] hover:bg-slate-200"
                            }`}
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Document Viewer (col-span-2 in full mode, col-span-3 in document mode) */}
              <div className={`${modalViewMode === "full" ? "lg:col-span-2" : "lg:col-span-3"} bg-[#F1F5F9] rounded-3xl border border-[#E2E8F0]/50 flex flex-col overflow-hidden h-full min-h-[300px]`}>
                
                {selectedDocument ? (
                  <div className="flex flex-col h-full">
                    {/* Doc Preview Header */}
                    <div className="p-3.5 bg-[#F8FAFC]/80 border-b border-[#E2E8F0]/60 flex items-center justify-between text-xs font-bold text-[#64748B]">
                      <span className="truncate pr-4 flex items-center gap-1.5">
                        <File size={14} className="text-blue-500" />
                        {selectedDocument.name}
                      </span>
                      <button
                        className="flex items-center gap-1 p-1 px-2.5 rounded-lg hover:bg-slate-200 text-[#64748B] hover:text-[#0F172A] transition-colors text-xxs font-bold uppercase tracking-wider bg-white/80 border border-[#E2E8F0]/40 cursor-pointer"
                        onClick={() => alert(`Downloading ${selectedDocument.name}...`)}
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>

                    {/* Doc Preview Content (Simulated Document Sheet) */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-200/30 flex justify-center items-start">
                      <div className="bg-white w-full shadow-sm border border-[#E2E8F0] rounded-xl p-5 min-h-[320px] font-serif text-[#0F172A] text-[11px] leading-relaxed flex flex-col relative select-none">
                        
                        {/* Decorative Legal Document Top Header */}
                        <div className="border-b border-double border-slate-300 pb-2 mb-3 text-center">
                          <p className="uppercase tracking-widest text-[8px] font-sans font-bold text-[#64748B]">IN THE COURT OF THE LAW</p>
                          <p className="font-sans font-bold text-[9px] text-[#64748B] mt-0.5 uppercase">{selectedCase.court}</p>
                          <div className="flex justify-between text-[7px] font-sans text-[#64748B] mt-1.5">
                            <span>CASE: {selectedCase.caseNo}</span>
                            <span>OFFICIAL PREVIEW</span>
                          </div>
                        </div>

                        {/* Document Title */}
                        <h5 className="font-bold text-center underline text-xs mb-3 uppercase text-[#0F172A]">
                          {selectedDocument.name.replace('.pdf', '').replaceAll('_', ' ')}
                        </h5>

                        {/* Document Simulated Body Text */}
                        <div className="whitespace-pre-wrap flex-1 text-[#64748B] font-serif italic border-l border-[#E2E8F0] pl-2">
                          {selectedDocument.content}
                        </div>

                        {/* Bottom stamp marker */}
                        <div className="mt-6 border-t border-[#E2E8F0] pt-3 flex justify-between items-center text-[7px] font-sans text-[#64748B]">
                          <span>VERIFIED VIA LEGALPORTAL</span>
                          <span className="bg-blue-50 text-[#2563EB] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border border-blue-100">PREVIEW ONLY</span>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#64748B] mb-4 border border-[#E2E8F0]/50">
                      <FileText size={20} />
                    </div>
                    <h5 className="font-bold text-[#0F172A] text-xs">
                      No Document Selected
                    </h5>
                    <p className="text-[11px] text-[#64748B] max-w-[200px] mt-1.5 leading-normal">
                      Click the <span className="font-bold text-blue-500">View</span> button on any document to see a live preview.
                    </p>
                  </div>
                )}

              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E2E8F0] flex justify-end bg-[#F1F5F9]/50">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-slate-900 text-white hover:bg-[#1E293B] text-xs font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer"
              >
                Close Case Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}