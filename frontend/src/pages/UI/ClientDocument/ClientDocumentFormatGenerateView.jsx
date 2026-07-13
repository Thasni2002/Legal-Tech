"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/utils/api";
import { FileText, Download, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getLoggedInUser } from "@/utils/auth";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";

const BASE_URL = API_BASE_URL || "http://127.0.0.1:8000";

const TEMPLATE_METADATA = {
  name_change_affidavit: {
    name: "Name Change Affidavit",
    description: "An official affidavit declaring a change of name, commonly required for government gazette records.",
    template: `AFFIDAVIT FOR CHANGE OF NAME

I, [Your_Name], daughter of [Father_Name] and wife of [Husband_Name], aged [Your_Age], residing at [Your_Address] hereby solemnly affirm and declare as follows:

That my maiden name is [Maiden_Name].
That I got married to [Husband_Name] on [Marriage_Date] at [Marriage_Place].
That after marriage, my name is [New_Name_After_Marriage].
That my AADHAR number is [AADHAR_Number], which remains unchanged before and after my marriage.
That my PAN number is [PAN_Number], which remains unchanged before and after my marriage.

I state that [Maiden_Name] and [New_Name_After_Marriage] refer to one and the same person, which is myself.

Place: [Place_Name]
Date: [Date]
Signature of Affiant: [Your_Name]
`
  },
  vakalatnama: {
    name: "Vakalatnama (Power of Attorney)",
    description: "A formal document authorizing a specific advocate to represent and plead your case in court.",
    template: `VAKALATNAMA

IN THE COURT OF [Court_Name]
Case No. [Case_Number] of 2026

Between:
[Client_Name] ... Petitioner/Plaintiff
AND
[Opposite_Party] ... Respondent/Defendant

I, [Client_Name], do hereby appoint and authorize Advocate [Advocate_Name] to appear, plead, and act for me in the above-mentioned case.
`
  },
  general_affidavit: {
    name: "General Affidavit",
    description: "A sworn statement used to declare facts under oath for various legal and administrative purposes.",
    template: `GENERAL AFFIDAVIT

I, [Affiant_Name], son/daughter of [Father_Name], aged [Affiant_Age], residing at [Affiant_Address], hereby solemnly affirm and declare as follows:

That I am making this affidavit to declare the following facts or intentions related to [Purpose_of_Affidavit]:
1. [Fact_or_Declaration_1]
2. [Fact_or_Declaration_2]
3. [Fact_or_Declaration_3]

Place: [Place_Name]
Date: [Date]
Signature of Affiant: [Affiant_Name]
`
  }
};

export default function DocumentFormatGenerateView() {
    const router = useRouter();
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [draftText, setDraftText] = useState("");
    const [generatedContent, setGeneratedContent] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [filename, setFilename] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const user = getLoggedInUser();
        const name = user?.username || user?.name || "";

        const fetchCases = async () => {
            try {
                const response = await fetch(`${BASE_URL}/case-management/`);
                if (response.ok) {
                    const casesData = await response.json();
                    
                    // Filter cases for this client
                    const clientCases = Array.isArray(casesData)
                      ? (user
                        ? casesData.filter((c) => {
                          const caseEmail = (c.email_id || "").toLowerCase().trim();
                          const userEmail = (user.email || "").toLowerCase().trim();
                          if (caseEmail && userEmail && caseEmail === userEmail) {
                            return true;
                          }
                          if (c.client_name) {
                            const normalizedName = c.client_name.toLowerCase().replace(/[^a-z0-9]/g, "");
                            const normalizedUsername = name.toLowerCase().replace(/[^a-z0-9]/g, "");
                            if (normalizedName === normalizedUsername) {
                              return true;
                            }
                          }
                          return false;
                        })
                        : casesData)
                      : [];
                    setCases(clientCases);
                }
            } catch (err) {
                console.error("Error fetching cases", err);
            }
        };
        fetchCases();
    }, []);

    const handleSelectTemplate = (key) => {
        setSelectedTemplate(key);
        setDraftText(TEMPLATE_METADATA[key].template);
        setGeneratedContent("");
        setSuccess(false);
        setError(null);
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedCase) {
            setError("Please select a case to attach the generated document.");
            return;
        }
        if (!draftText.trim()) {
            setError("Please enter or edit the format text before generating.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);
        setGeneratedContent("");

        try {
            const response = await fetch(`${BASE_URL}/case-management/generate-format-document`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    case_id: parseInt(selectedCase),
                    template_key: selectedTemplate,
                    draft_text: draftText
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to generate document.");
            }

            const data = await response.json();
            setGeneratedContent(data.document);
            setFileUrl(data.file_url);
            setFilename(data.filename);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = () => {
        if (!generatedContent) return;
        
        const doc = new jsPDF();
        const cleanText = generatedContent
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#/g, '');

        const splitText = doc.splitTextToSize(cleanText, 180);
        
        let y = 15;
        for (let i = 0; i < splitText.length; i++) {
            if (y > 280) {
                doc.addPage();
                y = 15;
            }
            doc.text(splitText[i], 15, y);
            y += 7;
        }

        doc.save(`${filename.replace('.md', '')}.pdf`);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {selectedTemplate && (
                        <button 
                            onClick={() => setSelectedTemplate(null)} 
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-600" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            Document Format Generate
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">
                            Select a standard legal format, edit details, and compile your legal drafts.
                        </p>
                    </div>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Template Selection Grid */}
            {!selectedTemplate && (
                <div className="grid md:grid-cols-3 gap-6">
                    {Object.entries(TEMPLATE_METADATA).map(([key, template]) => (
                        <div 
                            key={key} 
                            onClick={() => handleSelectTemplate(key)}
                            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                                    ⚖️
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    {template.description}
                                </p>
                            </div>
                            <button className="mt-6 w-full py-3 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-bold rounded-xl text-sm transition-all border border-slate-100 hover:border-blue-200">
                                Select Format &rarr;
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Interactive Form & Generation Preview */}
            {selectedTemplate && (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left side: Interactive Draft Editor */}
                    <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {TEMPLATE_METADATA[selectedTemplate].name}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                                    Edit name, address, and details directly below
                                </p>
                            </div>
                            
                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                        Attach to Case
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                                        value={selectedCase}
                                        onChange={(e) => setSelectedCase(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose active case --</option>
                                        {cases.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.case_no} - {c.case_title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                        Document Format Editor
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 font-mono transition-all min-h-[350px] resize-y outline-none"
                                        value={draftText}
                                        onChange={(e) => setDraftText(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Compiling Polished Draft...
                                        </>
                                    ) : (
                                        "Generate Document &rarr;"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right side: Polished Output Preview */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between min-h-[500px]">
                        <div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                                <h3 className="text-lg font-bold text-slate-900">Polished Legal Output</h3>
                                {success && (
                                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Auto-Saved to Case
                                    </div>
                                )}
                            </div>

                            {generatedContent ? (
                                <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-2xl border border-slate-100 max-h-[550px] overflow-y-auto font-medium text-slate-800 leading-relaxed text-sm">
                                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-[350px] flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <FileText className="w-12 h-12 text-slate-300" />
                                    <span className="font-semibold text-sm">Edit the template on the left, then click Generate to view final legal copy</span>
                                </div>
                            )}
                        </div>

                        {generatedContent && (
                            <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleDownloadPdf}
                                    className="flex-1 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Download className="w-5 h-5" />
                                    Download PDF Document
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
