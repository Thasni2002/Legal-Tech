"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";
import {
  ArrowLeft,
  Scale,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BookOpen,
  Search,
  TrendingUp,
  Gavel,
  FileText,
  Shield,
  Building2,
  RefreshCw,
  Award,
  Zap,
  Target,
  UserCheck,
  FileCheck2,
  Bookmark,
  Download,
  Info,
  Sliders,
  CheckCircle2,
} from "lucide-react";

// ─── Outcome badge ───────────────────────────────────────────────────────────
function OutcomeBadge({ outcome }) {
  const cfg = {
    Won: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", icon: <CheckCircle size={12} />, label: "WON" },
    Lost: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", icon: <XCircle size={12} />, label: "LOST" },
    Pending: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", icon: <Clock size={12} />, label: "PENDING" },
    Disposed: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", icon: <Scale size={12} />, label: "DISPOSED" },
    Unknown: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", icon: <AlertTriangle size={12} />, label: "UNKNOWN" },
  };
  const c = cfg[outcome] || cfg.Unknown;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-extrabold text-[11px] tracking-wide ${c.bg} ${c.text} ${c.border} shrink-0`}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Source badge ─────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  const isEcourts = (source || "").toLowerCase().includes("ecourts");
  return isEcourts ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
      ⚡ {source || "Verified Source: eCourts"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
      🏛 {source || "Verified Source: Internal Database"}
    </span>
  );
}

export default function SimilarCasesClient({ caseId }) {
  const router = useRouter();
  const [caseData, setCaseData] = useState(null);
  const [similarData, setSimilarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [caseLoading, setCaseLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  // Configurable similarity threshold state (default 50%)
  const [similarityThreshold, setSimilarityThreshold] = useState(50);

  // Fetch active case details
  useEffect(() => {
    if (!caseId) return;
    const fetchCase = async () => {
      setCaseLoading(true);
      let loadedCase = null;
      try {
        const res = await fetch(`${API_BASE_URL}/case-management/${caseId}`);
        if (res.ok) {
          loadedCase = await res.json();
        } else {
          const assignedRes = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/${caseId}`);
          if (assignedRes.ok) {
            const assignedData = await assignedRes.json();
            if (assignedData.case_id) {
              const masterRes = await fetch(`${API_BASE_URL}/case-management/${assignedData.case_id}`);
              if (masterRes.ok) {
                loadedCase = await masterRes.json();
              }
            }
            if (!loadedCase) {
              loadedCase = {
                id: assignedData.id,
                case_id: assignedData.case_id || assignedData.id,
                case_title: assignedData.case_title || assignedData.title || assignedData.caseTitle || `Case #${assignedData.case_number || assignedData.id}`,
                case_no: assignedData.case_number || assignedData.caseNo || assignedData.case_id_code || `ID-${assignedData.id}`,
                case_type: assignedData.practice_area || assignedData.practice_court || "Civil",
                court_name: assignedData.practice_court || assignedData.court_name || "High Court",
                court_type: assignedData.practice_court ? "High Court" : "District Court",
                cnr_number: assignedData.cnr_number || assignedData.cnrNumber || "",
                client_name: assignedData.client_name || assignedData.client || "Client",
                status: assignedData.status || "Active",
                case_description: assignedData.assignment_notes || "",
              };
            }
          }
        }
      } catch (e) {
        console.error("Failed to load parent case:", e);
      }

      if (!loadedCase) {
        loadedCase = {
          id: Number(caseId),
          case_id: Number(caseId),
        };
      }
      setCaseData(loadedCase);
      setCaseLoading(false);
    };
    fetchCase();
  }, [caseId]);

  // Fetch similar cases & AI analysis from backend
  const fetchSimilarCases = async (overrideThreshold = null) => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    const targetThreshold = overrideThreshold !== null ? overrideThreshold : similarityThreshold;
    try {
      const res = await fetch(`${API_BASE_URL}/api/ecourts/similar-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseType: caseData?.case_type || caseData?.practice_area || "",
          courtType: caseData?.court_type || "",
          courtName: caseData?.court_name || "",
          caseId: Number(caseData?.case_id || caseData?.id || caseId),
          caseTitle: caseData?.case_title || "",
          caseDescription: caseData?.case_description || "",
          similarityThreshold: targetThreshold,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimilarData(data);
        setSelectedCaseIdx(0);
        // Hydrate caseData with real title/court/number if available from backend AI analysis
        if (data?.aiAnalysis && caseData) {
          setCaseData(prev => {
            if (!prev || prev.case_title === `Case #${caseId}`) {
              const summaryText = data.aiAnalysis.summary || "";
              const matchTitle = summaryText.match(/AI Case Analysis for '([^']+)'/);
              const realTitle = matchTitle ? matchTitle[1] : prev?.case_title;
              return {
                ...prev,
                case_title: realTitle || prev?.case_title,
              };
            }
            return prev;
          });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Failed to analyze case.");
      }
    } catch (e) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseData) fetchSimilarCases();
  }, [caseData]);

  const handleThresholdChange = (newVal) => {
    setSimilarityThreshold(newVal);
    fetchSimilarCases(newVal);
  };

  const cases = similarData?.cases || [];
  const similarCasesFound = Boolean(similarData?.similarCasesFound && cases.length > 0);
  const master = similarData?.masterStrategy || {};
  const aiAnalysis = similarData?.aiAnalysis || {};
  const activePrecedent = cases[selectedCaseIdx] || null;

  const handleDownloadSummary = () => {
    if (!caseData) return;
    const timeStr = new Date().toLocaleString();
    const fileName = `Legal_Analysis_Case_${caseId}_${Date.now()}.txt`;

    let fileContent = `================================================================================
LEGAL TECH ENTERPRISE — AI CASE ANALYSIS & INTELLIGENCE REPORT
================================================================================
Case Title: ${caseData.case_title || "N/A"}
Case No: ${caseData.case_no || "N/A"} | CNR: ${caseData.cnr_number || "N/A"}
Court: ${caseData.court_name || "N/A"}
Category: ${caseData.case_type || "Civil"}
Generated Date: ${timeStr}
Configured Similarity Threshold: ${similarityThreshold}%
--------------------------------------------------------------------------------
`;

    if (similarCasesFound) {
      fileContent += `
VERIFIED PRECEDENT CASES FOUND: ${cases.length} Case(s)

I. KEY WINNING FORMULA:
${master.winningFormula || "Focus on documentary proof and statutory compliance."}

II. CRITICAL LOOPHOLES & VULNERABILITIES TO PATCH:
${(master.keyLoopholes || []).map((l, i) => `${i + 1}. ${l}`).join("\n")}

III. MAIN LEGAL ARGUMENTS TO PRESENT IN COURT:
${(master.mainArguments || []).map((a, i) => `✓ ${a}`).join("\n")}

IV. STATUTORY SECTIONS TO CITE:
${(master.importantActs || []).join(", ")}

V. SENIOR ADVOCATE TRIAL PLAYBOOK:
${master.advocateRecommendation || "File protective interim applications early."}
================================================================================
`;
    } else {
      fileContent += `
STATUS: NO SIMILAR CASE FOUND ABOVE ${similarityThreshold}% THRESHOLD.
--------------------------------------------------------------------------------
AI ANALYSIS OF CURRENT CASE:

1. SUMMARY & STANDING:
${aiAnalysis.summary || "Case analysis conducted on recorded facts."}

2. KEY LEGAL ISSUES:
${(aiAnalysis.keyIssues || []).map((item, i) => `• ${item}`).join("\n")}

3. RELEVANT FACTS:
${(aiAnalysis.relevantFacts || []).map((item, i) => `• ${item}`).join("\n")}

4. APPLICABLE PROVISIONS:
${(aiAnalysis.applicableProvisions || []).join(", ")}

5. FAVORABLE FACTORS (STRENGTHS):
${(aiAnalysis.strengths || []).map((item, i) => `✓ ${item}`).join("\n")}

6. RISK FACTORS (VULNERABILITIES):
${(aiAnalysis.risks || []).map((item, i) => `⚠ ${item}`).join("\n")}

7. AI OUTCOME ASSESSMENT:
${aiAnalysis.outcomeAssessment || "AI-assisted assessment based on available case information."}
================================================================================
`;
    }

    const element = document.createElement("a");
    const file = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert("✅ AI Analysis Report downloaded successfully!");
  };

  if (caseLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading case details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 pb-20 overflow-x-hidden">
      {/* ── STICKY TOP NAV BAR ────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(`/case-management/view/${caseId}`);
                }
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition cursor-pointer shrink-0"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600 shrink-0" />
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-[#0F172A] truncate">
                  AI Case Analysis &amp; Similar Case Intelligence
                </h1>
              </div>
              {caseData && (
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate max-w-[250px] sm:max-w-[450px] md:max-w-xl lg:max-w-2xl">
                  Target Case: <span className="font-bold text-slate-800">{caseData.case_title}</span>
                  {caseData.case_type && <span className="text-slate-400"> · {caseData.case_type}</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={handleDownloadSummary}
              disabled={loading || !similarData}
              className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              title="Download Brief"
            >
              <Download size={13} />
              <span>Download Report</span>
            </button>

            <button
              onClick={() => fetchSimilarCases()}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>{loading ? "Analyzing…" : "Refresh Analysis"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">



        {/* ── LOADING DISPLAY ────────────────────────────────────────────── */}
        {loading && (
          <div className="bg-white rounded-3xl border border-indigo-200 p-8 sm:p-12 flex flex-col items-center gap-4 shadow-sm text-center">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-indigo-100 rounded-full" />
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Scale size={18} className="text-indigo-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold text-indigo-900">Running AI Case Analysis &amp; Precedent Search</p>
              <p className="text-xs text-indigo-600 mt-1">Evaluating legal attributes against database &amp; eCourts registry…</p>
            </div>
          </div>
        )}

        {/* ── ERROR DISPLAY ──────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <XCircle size={32} className="text-red-400 mx-auto mb-3" />
            <h4 className="font-bold text-red-800 text-sm mb-1">Analysis Failed</h4>
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={() => fetchSimilarCases()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            SCENARIO A: SIMILAR CASES FOUND (similarity >= threshold)
        ═════════════════════════════════════════════════════════════════ */}
        {similarData && !loading && similarCasesFound && (
          <div className="space-y-6">

            {/* Compared Cases Selector Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                    {cases.length}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-[#0F172A]">Verified Similar Precedents Found</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">Matching cases meeting the configured threshold ({similarityThreshold}%)</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 shrink-0">
                  Active View: Case #{selectedCaseIdx + 1}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto p-1 scrollbar-thin">
                {cases.map((c, idx) => {
                  const isSelected = idx === selectedCaseIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCaseIdx(idx);
                        const el = document.getElementById("precedent-detail-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                        isSelected
                          ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-2 ring-indigo-500/20"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isSelected ? "bg-indigo-500 text-white" : "bg-white border border-slate-300 text-slate-600"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[150px] sm:max-w-[220px]">{c.caseTitle}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                        {c.similarityScore}%
                      </span>
                      <OutcomeBadge outcome={c.outcome} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Selected Precedent Card */}
            {activePrecedent && (
              <div id="precedent-detail-section" className="bg-white rounded-3xl border border-indigo-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-3 py-1 bg-emerald-500 text-white font-black text-xs rounded-lg">
                        {activePrecedent.similarityScore}% Similarity Match
                      </span>
                      <OutcomeBadge outcome={activePrecedent.outcome} />
                      <SourceBadge source={activePrecedent.source} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white leading-snug break-words">
                      {activePrecedent.caseTitle}
                    </h2>
                    <p className="text-xs text-indigo-200 font-mono mt-1">CNR: {activePrecedent.cnrNumber || "N/A"} · Case No: {activePrecedent.caseNo || "N/A"}</p>
                  </div>

                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Why this case is similar */}
                  {activePrecedent.reasons && activePrecedent.reasons.length > 0 && (
                    <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-2">
                      <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Target size={15} /> Why this case was identified as similar
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activePrecedent.reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs font-semibold text-indigo-950 bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                            <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Court Name</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">{activePrecedent.courtName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case Type &amp; Filing</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">{activePrecedent.caseType || "—"} {activePrecedent.filingDate ? `(${activePrecedent.filingDate})` : ""}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presiding Judge</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">{activePrecedent.presidingJudge || "Hon'ble Presiding Judge"}</p>
                    </div>
                  </div>

                  {activePrecedent.outcomeDetail && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-2">
                      <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Award size={15} /> Verified Outcome &amp; Judgment Summary
                      </h4>
                      <p className="text-xs sm:text-sm text-emerald-900 font-semibold leading-relaxed">{activePrecedent.outcomeDetail}</p>
                    </div>
                  )}

                  {activePrecedent.mainArgument && (
                    <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-2">
                      <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale size={15} /> Core Legal Argument &amp; Defense Strategy
                      </h4>
                      <p className="text-xs sm:text-sm text-blue-900 leading-relaxed font-medium">{activePrecedent.mainArgument}</p>
                    </div>
                  )}

                  {activePrecedent.loopholes && activePrecedent.loopholes.length > 0 && (
                    <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 sm:p-5 space-y-3">
                      <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle size={15} /> Identified Weaknesses &amp; Procedural Vulnerabilities
                      </h4>
                      <div className="space-y-2">
                        {activePrecedent.loopholes.map((loop, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs font-semibold text-rose-900 bg-white/70 rounded-xl p-3 border border-rose-100">
                            <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                            <span className="leading-relaxed">{loop}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            SCENARIO B: NO SIMILAR CASES FOUND (similarCasesFound === false)
        ═════════════════════════════════════════════════════════════════ */}
        {similarData && !loading && !similarCasesFound && (
          <div className="space-y-6">

            {/* Prominent "No Similar Case Found" Banner */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto">
                <Search size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-amber-950">No Similar Case Found</h3>
              <p className="text-xs sm:text-sm text-amber-900 max-w-xl mx-auto leading-relaxed">
                We could not identify a sufficiently relevant similar case based on the available case information in our records.
              </p>
            </div>

            {/* AI Case Analysis of Current Case */}
            {aiAnalysis && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border-b border-indigo-900">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-indigo-600 text-white font-black text-xs rounded-lg uppercase tracking-wider">
                      AI Case Analysis — Current Case
                    </span>
                    <span className="px-3 py-1 bg-white/10 text-indigo-200 text-xs font-bold rounded-lg border border-white/20">
                      Verified Case Record Analysis
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
                    {caseData?.case_title || "Current Case Analysis"}
                  </h2>
                  <p className="text-xs text-indigo-200 font-mono mt-1">
                    CNR: {caseData?.cnr_number || "N/A"} · Case No: {caseData?.case_no || "N/A"} · Court: {caseData?.court_name || "Court"}
                  </p>
                </div>

                {/* Insufficient details notice */}
                {aiAnalysis.isSufficient === false && (
                  <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center gap-3 text-xs text-rose-900 font-bold">
                    <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                    <span>{aiAnalysis.noticeText || "Insufficient information for a reliable AI assessment. Please provide additional case details or documents."}</span>
                  </div>
                )}

                <div className="p-6 sm:p-8 space-y-7">

                  {/* Summary */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={16} className="text-indigo-600" /> AI Case Summary &amp; Legal Standing
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      {aiAnalysis.summary}
                    </div>
                  </div>

                  {/* Key Issues & Relevant Facts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Key Issues */}
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Target size={15} className="text-blue-600" /> Key Legal Issues
                      </h3>
                      <div className="space-y-2">
                        {(aiAnalysis.keyIssues || []).map((issue, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 font-semibold">
                            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                            <span className="leading-relaxed">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Relevant Facts */}
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <FileCheck2 size={15} className="text-purple-600" /> Relevant Facts &amp; Circumstances
                      </h3>
                      <div className="space-y-2">
                        {(aiAnalysis.relevantFacts || []).map((fact, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-950 font-semibold">
                            <CheckCircle2 size={15} className="text-purple-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Applicable Provisions */}
                  {aiAnalysis.applicableProvisions && aiAnalysis.applicableProvisions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Shield size={15} className="text-indigo-600" /> Applicable Legal Provisions &amp; Statutes
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.applicableProvisions.map((prov, i) => (
                          <span key={i} className="px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800">
                            📜 {prov}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Strengths */}
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle size={15} className="text-emerald-600" /> Favorable Factors (Strengths)
                      </h3>
                      <div className="space-y-2">
                        {(aiAnalysis.strengths || []).map((s, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 font-semibold">
                            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                            <span className="leading-relaxed">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risks */}
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle size={15} className="text-rose-600" /> Potential Risks &amp; Vulnerabilities (To Patch)
                      </h3>
                      <div className="space-y-2">
                        {(aiAnalysis.risks || []).map((r, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-950 font-semibold">
                            <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">⚠</span>
                            <span className="leading-relaxed">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Review */}
                  {aiAnalysis.recommendedReview && (
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Zap size={15} className="text-amber-500" /> Recommended Action Items for Advocate Review
                      </h3>
                      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 space-y-2">
                        <ul className="space-y-1.5">
                          {aiAnalysis.recommendedReview.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-200">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* AI Outcome Assessment Disclaimer Card */}
                  <div className="bg-slate-100 border border-slate-300 rounded-2xl p-5 space-y-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Info size={15} className="text-indigo-600" /> AI Outcome Assessment
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {aiAnalysis.outcomeAssessment}
                    </p>
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                      * Disclaimer: This is an AI-generated legal technology assistance analysis based on available case information and does not constitute a guaranteed prediction or legal representation of judicial outcome.
                    </p>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
