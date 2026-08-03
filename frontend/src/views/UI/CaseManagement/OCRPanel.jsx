"use client";

import { useState, useRef } from "react";
import { API_BASE_URL } from "@/utils/api";
import {
  FileText,
  Upload,
  Loader2,
  Copy,
  CheckCircle,
  Trash2,
  AlertCircle,
  ImageIcon,
  FileIcon,
  Save,
  Printer,
  Edit3,
  Sparkles,
  Code,
  Check,
  Tag,
} from "lucide-react";

/**
 * OCRPanel — Drop a document (image or PDF), extract text + format-preserved digitized document,
 * and detect document type with top section selection bar.
 *
 * Props:
 *   caseId  {number|null}  Optional case ID to link the OCR result to a case.
 *   onTextExtracted {function(text, filename, docType)}  Optional callback when text is extracted.
 *   onSaveToDocuments {function(text, filename, docType)}  Optional callback to save to case documents.
 *   showEditLayout {boolean}  Control visibility of Edit Layout button (default: true).
 *   showPrint {boolean}  Control visibility of Print PDF button (default: true).
 *   showSaveToDocuments {boolean}  Control visibility of Save to Documents button (default: true).
 */
export default function OCRPanel({
  caseId = null,
  onTextExtracted = null,
  onSaveToDocuments = null,
  showEditLayout = true,
  showPrint = true,
  showSaveToDocuments = true,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedToDocs, setSavedToDocs] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  // Digitized View States
  const [viewTab, setViewTab] = useState("digitized"); // "digitized" | "raw"
  const [editedHtml, setEditedHtml] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Document Type Detection State
  const [selectedDocType, setSelectedDocType] = useState("");

  const inputRef = useRef(null);

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
    "image/bmp",
    "image/webp",
    "application/pdf",
  ];

  const handleFile = (selected) => {
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError(`Unsupported file type: ${selected.type}. Use JPG, PNG, TIFF, BMP, WEBP or PDF.`);
      return;
    }
    setFile(selected);
    setResult(null);
    setEditedHtml("");
    setSelectedDocType("");
    setError("");

    // Generate preview for images
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (caseId) fd.append("case_id", String(caseId));

      const res = await fetch(`${API_BASE_URL}/ocr/extract`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "OCR extraction failed");
      }

      const data = await res.json();
      setResult(data);
      setEditedHtml(data.digitized_html || "");
      setSelectedDocType(data.document_type || "Legal Document");
      setViewTab("digitized");

      if (onTextExtracted && (data.extracted_text || data.digitized_html)) {
        onTextExtracted(
          data.extracted_text,
          file.name,
          data.document_type || "OCR Extracted Text",
          data.digitized_html || ""
        );
      }
    } catch (e) {
      setError(e.message || "Something went wrong during OCR extraction.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    if (result?.extracted_text) {
      navigator.clipboard.writeText(result.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setEditedHtml("");
    setSelectedDocType("");
    setIsEditing(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePrint = () => {
    const content = editedHtml || result?.digitized_html || result?.extracted_text || "";
    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Please allow popups to print.");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${result?.original_filename || "Digitized Document"}</title>
          <style>
            body { font-family: Georgia, 'Times New Roman', serif; padding: 40px; color: #0f172a; line-height: 1.8; }
            u { text-decoration: underline; display: inline-block; min-width: 100px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[#2563EB]" />
          <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
            OCR — Extract & Digitize Document Format
          </h4>
        </div>
        {(file || result) && (
          <button
            onClick={reset}
            className="text-xs text-[#64748B] hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Drop Zone */}
      {!file && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragging
              ? "border-[#2563EB] bg-blue-50"
              : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-blue-50/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.tiff,.tif,.bmp,.webp,.pdf"
            onChange={handleInputChange}
            className="hidden"
          />
          <Upload size={28} className="text-[#94A3B8] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#475569]">
            {dragging ? "Drop to upload" : "Click or drag & drop document"}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            JPG, PNG, TIFF, BMP, WEBP, PDF (Vakalatnama, ID Cards, Petitions, Notices)
          </p>
        </div>
      )}

      {/* File Info + Preview */}
      {file && !result && (
        <div className="border border-[#E2E8F0] rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              {file.type === "application/pdf" ? (
                <FileIcon size={18} className="text-[#2563EB]" />
              ) : (
                <ImageIcon size={18} className="text-[#2563EB]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] truncate">{file.name}</p>
              <p className="text-xs text-[#64748B]">
                {formatSize(file.size)} · {file.type.split("/")[1].toUpperCase()}
              </p>
            </div>
          </div>

          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-contain rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
            />
          )}
        </div>
      )}

      {/* Extract Button */}
      {file && !result && (
        <button
          onClick={handleExtract}
          disabled={loading}
          className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Digitizing document layout via OCR... (please wait)
            </>
          ) : (
            <>
              <Sparkles size={16} /> Digitize Document & Extract Layout
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Result Container */}
      {result && (
        <div className="space-y-4">
          {/* TOP SECTION: Document Type Detection Bar */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                  <Tag size={13} className="text-emerald-700" />
                  Document Type Detected:
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="bg-white border border-emerald-300 text-emerald-900 font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs focus:ring-2 focus:ring-emerald-400 outline-none cursor-pointer"
                >
                  <option value="Election ID Card">Election ID Card</option>
                  <option value="Vakalatnama">Vakalatnama</option>
                  <option value="Bail Application">Bail Application</option>
                  <option value="Court Petition">Court Petition</option>
                  <option value="Affidavit">Affidavit</option>
                  <option value="Legal Notice">Legal Notice</option>
                  <option value="Court Order">Court Order</option>
                  <option value="Proof Affidavit">Proof Affidavit</option>
                  <option value="Summons">Summons</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="OCR Extracted Text">OCR Extracted Text</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-2">
              <span>File: <strong className="text-emerald-900">{result.original_filename}</strong></span>
              <span>•</span>
              <span>{result.page_count} page{result.page_count !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Action & View Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded-xl">
            {/* View Switcher Tabs */}
            <div className="flex bg-white rounded-lg p-1 border border-[#E2E8F0] shadow-xs">
              <button
                type="button"
                onClick={() => setViewTab("digitized")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === "digitized"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Sparkles size={13} />
                Digitized Document (Exact Format)
              </button>
              <button
                type="button"
                onClick={() => setViewTab("raw")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === "raw"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Code size={13} />
                Extracted Raw Text
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {showEditLayout && viewTab === "digitized" && (
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 text-xs font-bold border rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    isEditing
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {isEditing ? <Check size={13} /> : <Edit3 size={13} />}
                  {isEditing ? "Done Editing" : "Edit Layout"}
                </button>
              )}

              {showPrint && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Printer size={13} /> Print / Export PDF
                </button>
              )}

              {showSaveToDocuments && onSaveToDocuments && (
                <button
                  type="button"
                  onClick={() => {
                    if (result?.extracted_text || editedHtml) {
                      onSaveToDocuments(
                        result.extracted_text,
                        result.original_filename,
                        selectedDocType || result.document_type || "OCR Extracted Text",
                        editedHtml || result.digitized_html || ""
                      );
                      setSavedToDocs(true);
                      setTimeout(() => setSavedToDocs(false), 2500);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  {savedToDocs ? (
                    <><CheckCircle size={13} className="text-emerald-600" /> Saved to Case Docs!</>
                  ) : (
                    <><Save size={13} className="text-emerald-600" /> Save to Documents</>
                  )}
                </button>
              )}

              {viewTab === "raw" && (
                <button
                  type="button"
                  onClick={copyText}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy Text"}
                </button>
              )}
            </div>
          </div>

          {/* View Tab 1: Digitized Document Canvas (Exact Layout View) */}
          {viewTab === "digitized" && (
            <div className="border border-[#E2E8F0] rounded-2xl bg-[#FFFDF5] p-6 md:p-8 shadow-sm overflow-x-auto min-h-[350px]">
              {isEditing ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <Edit3 size={12} /> Edit mode enabled: Modify HTML structure, labels, or fill-in blanks directly below.
                  </p>
                  <textarea
                    value={editedHtml}
                    onChange={(e) => setEditedHtml(e.target.value)}
                    rows={16}
                    className="w-full font-mono text-xs p-4 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none leading-relaxed"
                  />
                </div>
              ) : (
                <div
                  className="prose max-w-none text-[#0F172A] font-serif leading-relaxed text-sm"
                  dangerouslySetInnerHTML={{ __html: editedHtml || result.digitized_html || "<p>No layout formatting available.</p>" }}
                />
              )}
            </div>
          )}

          {/* View Tab 2: Raw Extracted Text View */}
          {viewTab === "raw" && (
            <textarea
              value={result.extracted_text || "(No text detected in this document)"}
              readOnly
              rows={14}
              className="w-full border border-[#E2E8F0] rounded-xl p-4 text-xs font-mono text-[#0F172A] bg-[#F8FAFC] resize-y focus:outline-none leading-relaxed"
            />
          )}
        </div>
      )}
    </div>
  );
}
