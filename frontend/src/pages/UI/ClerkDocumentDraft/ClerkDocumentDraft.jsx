"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Eye, FileText } from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";

export default function ClerkDocumentDraft() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [template, setTemplate] = useState("vakalatnama");
  const [clientName, setClientName] = useState("John Doe");
  const [advocateName, setAdvocateName] = useState("Adv. K. R. Ram");
  const [caseTitle, setCaseTitle] = useState("John Doe v. State of Kerala");
  const [courtName, setCourtName] = useState("District Court, Ernakulam");

  // Kerala Batta/Process specific parameters
  const [battaFee, setBattaFee] = useState("50");
  const [modeOfSummons, setModeOfSummons] = useState("Registered Post with AD");
  const [numberOfSummons, setNumberOfSummons] = useState("1");

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
    }
  }, [router]);

  const getModeOfSummonsRate = (mode) => {
    switch (mode) {
      case "Registered Post with AD":
        return 50;
      case "Speed Post":
        return 40;
      case "Court Process Server (Ordinary)":
        return 25;
      case "Dasti (In person by Client)":
        return 10;
      default:
        return 50;
    }
  };

  useEffect(() => {
    const rate = getModeOfSummonsRate(modeOfSummons);
    const count = parseInt(numberOfSummons) || 1;
    setBattaFee((rate * count).toString());
  }, [modeOfSummons, numberOfSummons]);

  const templates = {
    vakalatnama: {
      title: "Vakalatnama (Power of Attorney)",
      content: `IN THE COURT OF: ${courtName || "_________________"}

Suit / Case No: _________________ of 2026

In the Matter of:
${caseTitle || "_________________"}

I/We, ${clientName || "_________________"}, Plaintiff(s) / Defendant(s) in the above Suit/Case, do hereby appoint and retain:

${advocateName || "_________________"} (hereinafter called the Advocate) to advocate, appear and act for me/us as my/our Counsel in the above-mentioned Suit / Case, and to conduct and manage all proceedings relating thereto.

IN WITNESS WHEREOF I/We do hereunto set my/our hand(s) to these presents on this _____ day of _______________, 2026.



_______________________                     _______________________
Client Signature                            Accepted: Advocate Signature

--------------------------------------------------------------------
[KERALA COURT FEES & WELFARE STAMPS REGISTRY]
- Kerala Advocate Welfare Fund Act Stamp: Rs. 100.00 [Affixed]
- Kerala Legal Benefit Fund / Clerk Welfare Stamp: Rs. 10.00 [Affixed]
- Court Fee Stamp: Rs. 10.00 [Affixed]`
    },
    affidavit: {
      title: "Affidavit of Solemn Affirmation",
      content: `IN THE COURT OF: ${courtName || "_________________"}

In the Matter of:
${caseTitle || "_________________"}

AFFIDAVIT

I, ${clientName || "_________________"}, aged about ____ years, residing at _____________________________________, do hereby solemnly affirm and state on oath as under:

1. I am the petitioner in the above-mentioned matter and am fully conversant with the facts of the case.
2. I say that the statements contained in paragraphs 1 to 10 of the accompanying petition are true and correct to the best of my knowledge, belief, and legal information.
3. I say that no part of it is false and nothing material has been concealed therefrom.

DEPONENT: _______________________

VERIFICATION:
Verified at ${(courtName.split(",")[1] || "").trim() || "____________"} on this _____ day of _______________, 2026, that the contents of this affidavit are true and correct.`
    },
    petition: {
      title: "Civil Petition under Section 9 CPC",
      content: `IN THE COURT OF: ${courtName || "_________________"}

Civil Suit No: _________________ of 2026

In the Matter of:
${clientName || "_________________"}
... Plaintiff

v.

The Opponent Party
... Defendant

PETITION FOR PERMANENT INJUNCTION UNDER SECTION 9 OF THE CODE OF CIVIL PROCEDURE

The Plaintiff above-named states as follows:
1. The Plaintiff resides at _____________________________________.
2. The Defendant is a resident of _____________________________________.
3. The dispute relates to property situated in ${(courtName.split(",")[1] || "").trim() || "the jurisdiction of this Hon'ble Court"}.
4. The cause of action arose on _____ day of _______________, 2026.

PRAYER:
Wherefore, it is most respectfully prayed that this Hon'ble Court may be pleased to grant a decree of permanent injunction restraining the Defendant from interfering with the Plaintiff's peaceful possession of the suit property.

Drafted By: ${advocateName || "_________________"}
Advocate for Plaintiff`
    },
    batta: {
      title: "Batta Memo (Process Memo)",
      content: `IN THE COURT OF: ${courtName || "_________________"}

Suit / Case No: _________________ of 2026

In the Matter of:
${caseTitle || "_________________"}

MEMO FILED BY THE PLAINTIFF / PETITIONER UNDER RULE 125 OF KERALA CIVIL RULES OF PRACTICE
-------------------------------------------------------------------------------------------

1. The Plaintiff / Petitioner herein pays the process fee (Batta) of Rs. ${battaFee || "___"}/- for the issue of summons / notice to the Defendant(s) / Respondent(s) by ${modeOfSummons || "_________________"}.

2. Number of summons/notices to be issued: ${numberOfSummons || "___"}.

3. Particulars of Batta Stamps affixed:
   - Summons Process Fee (Rs. ${getModeOfSummonsRate(modeOfSummons)} per party × ${numberOfSummons}): Rs. ${battaFee || "0.00"}
   - Court Fee Stamp: Rs. 10.00
   - Clerk Welfare Fund Stamp: Rs. 5.00
   - Total Stamp Value: Rs. ${(parseFloat(battaFee || 0) + 15.00).toFixed(2)}

Dated this the _____ day of _______________, 2026.



_______________________________
Counsel for Plaintiff/Petitioner`
    }
  };

  const currentTemplate = templates[template] || templates.vakalatnama;

  const handlePrint = () => {
    window.print();
  };

  if (!user) {
    return (
      <div className="w-full h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 text-sm animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
            font-family: serif;
            font-size: 14pt;
            line-height: 1.8;
            color: #000;
            background: #fff;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/clerk/dashboard")}
            className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 flex items-center justify-center transition active:scale-95 shadow-sm"
          >
            <ArrowLeft size={16} className="text-[#475569]" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">Document Drafting</h1>
            <p className="text-[#64748B] text-sm font-medium">Draft, format, and print standard court filings.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition shadow-md active:scale-98"
          >
            <Printer size={16} />
            Print Document
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6 h-fit">
          <h2 className="text-lg font-extrabold text-[#0F172A] border-b pb-3 flex items-center gap-2">
            <span className="text-blue-500">📝</span> Template & Parameters
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition duration-200"
              >
                <option value="vakalatnama">Vakalatnama (Power of Attorney)</option>
                <option value="batta">Batta Memo (Process Fee)</option>
                <option value="affidavit">Affidavit of Affirmation</option>
                <option value="petition">Civil Petition (Sec 9 CPC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Client / Deponent Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Advocate Name</label>
              <input
                type="text"
                value={advocateName}
                onChange={(e) => setAdvocateName(e.target.value)}
                placeholder="e.g. Adv. Ram"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Case / Petition Title</label>
              <input
                type="text"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                placeholder="e.g. John Doe v. State"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Court & Jurisdiction</label>
              <input
                type="text"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                placeholder="e.g. District Court, Ernakulam"
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            {/* Render conditional Batta fields if template === 'batta' */}
            {template === "batta" && (
              <div className="border-t border-dashed border-slate-200 pt-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Kerala Batta Parameters</h3>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Batta / Process Fee Amount (Rs.)</label>
                  <input
                    type="number"
                    value={battaFee}
                    onChange={(e) => setBattaFee(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-slate-50"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Calculated automatically (Rs. {getModeOfSummonsRate(modeOfSummons)}/party), but can be customized.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mode of Summons</label>
                  <select
                    value={modeOfSummons}
                    onChange={(e) => setModeOfSummons(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] font-semibold outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  >
                    <option value="Registered Post with AD">Registered Post with AD</option>
                    <option value="Speed Post">Speed Post</option>
                    <option value="Court Process Server (Ordinary)">Court Process Server (Ordinary)</option>
                    <option value="Dasti (In person by Client)">Dasti (By Client)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">No. of Summons / Parties</label>
                  <input
                    type="number"
                    value={numberOfSummons}
                    onChange={(e) => setNumberOfSummons(e.target.value)}
                    placeholder="1"
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden h-[650px]">
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-4 flex justify-between items-center">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
              <Eye size={14} className="text-blue-500" />
              Live Court Formatted Preview
            </span>
          </div>

          <div className="flex-1 p-8 sm:p-12 overflow-y-auto bg-slate-100/50 flex justify-center">
            {/* The Sheet layout */}
            <div
              id="print-area"
              className="bg-white w-[595px] h-fit min-h-[842px] border border-slate-200 shadow-lg p-12 whitespace-pre-wrap font-serif text-sm leading-relaxed text-[#1E293B] relative"
            >
              {/* Stamp Paper Placeholder */}
              <div className="w-full h-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs font-semibold mb-8 uppercase tracking-widest bg-slate-50/50 select-none">
                [ Space Reserved For Court Stamp Paper ]
              </div>

              <h3 className="text-center font-bold text-base underline mb-8 uppercase">
                {currentTemplate.title}
              </h3>

              <div className="text-justify whitespace-pre-wrap leading-[2]">
                {currentTemplate.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
