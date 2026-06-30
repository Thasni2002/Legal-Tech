"use client";

import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/utils/api";
import { Bot, FileText, Send, Download, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

export default function DocumentGenerationView() {
    const router = useRouter();
    const documentRef = useRef(null);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState("");
    const [prompt, setPrompt] = useState("");
    const [generatedDoc, setGeneratedDoc] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Fetch active cases for the dropdown
        const fetchCases = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/case-management/`);
                if (response.ok) {
                    const data = await response.json();
                    setCases(data);
                }
            } catch (err) {
                console.error("Error fetching cases", err);
            }
        };
        fetchCases();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedCase || !prompt) {
            setError("Please select a case and provide instructions.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);
        setGeneratedDoc("");

        try {
            const response = await fetch(`${API_BASE_URL}/case-management/${selectedCase}/generate-document`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to generate document");
            }

            const data = await response.json();
            setGeneratedDoc(data.document);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = () => {
        if (!generatedDoc) return;
        
        const doc = new jsPDF();
        
        // Basic markdown character stripping for clean text PDF
        const cleanText = generatedDoc
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#/g, '');

        const splitText = doc.splitTextToSize(cleanText, 180);
        
        // Handle pagination for long texts
        let y = 15;
        for (let i = 0; i < splitText.length; i++) {
            if (y > 280) {
                doc.addPage();
                y = 15;
            }
            doc.text(splitText[i], 15, y);
            y += 7;
        }

        doc.save('legal_document.pdf');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()} 
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <Bot className="w-8 h-8 text-blue-600" />
                            AI Document Generation
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">
                            Generate legal drafts instantly using case details and AI.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Form */}
                <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Instructions
                    </h2>
                    
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Case</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all"
                                value={selectedCase}
                                onChange={(e) => setSelectedCase(e.target.value)}
                            >
                                <option value="">-- Choose a case --</option>
                                {cases.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.case_no} - {c.case_title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-bold text-slate-700">Prompt / Instructions</label>
                            </div>
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none transition-all min-h-[160px]"
                                placeholder="e.g. Draft a bail petition for this case focusing on the client's medical condition..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            
                            {/* Quick Prompts */}
                            <div className="mt-3">
                                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Quick Examples:</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Draft a standard Bail Petition.",
                                        "Write a Legal Notice for breach of contract.",
                                        "Generate a sworn Affidavit for the client.",
                                        "Draft an application for an adjournment of hearing."
                                    ].map((example, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPrompt(example)}
                                            className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer text-left"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Generate Document
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Right Column: Output */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[700px]">
                    <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                            Generated Output
                        </h2>
                        {success && generatedDoc && (
                            <button 
                                onClick={handleDownloadPdf}
                                className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                                <Download className="w-3 h-3" />
                                Download PDF
                            </button>
                        )}
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                                <p className="font-medium animate-pulse">AI is drafting the document...</p>
                            </div>
                        ) : generatedDoc ? (
                            <div ref={documentRef} className="prose prose-slate max-w-none text-slate-800 p-4 bg-white rounded-lg border border-slate-100">
                                <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <FileText className="w-16 h-16 opacity-20" />
                                <p className="font-medium">Select a case and enter instructions to see the output here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
