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
} from "lucide-react";

/**
 * OCRPanel — Drop a document (image or PDF) and extract text via Tesseract OCR.
 *
 * Props:
 *   caseId  {number|null}  Optional case ID to link the OCR result to a case.
 *   onTextExtracted {function(text)}  Optional callback when text is extracted.
 */
export default function OCRPanel({ caseId = null, onTextExtracted = null, onSaveToDocuments = null }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedToDocs, setSavedToDocs] = useState(false);
  const [dragging, setDragging] = useState(false);
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
      if (onTextExtracted && data.extracted_text) {
        onTextExtracted(data.extracted_text);
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Is Tesseract installed?");
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
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#2563EB]" />
          <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
            OCR — Extract Text from Document
          </h4>
        </div>
        {(file || result) && (
          <button
            onClick={reset}
            className="text-xs text-[#64748B] hover:text-red-500 flex items-center gap-1 transition-colors"
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
            {dragging ? "Drop to upload" : "Click or drag & drop"}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            JPG, PNG, TIFF, BMP, WEBP, PDF
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
          className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Extracting text... (this may take a few seconds)
            </>
          ) : (
            "⚡ Extract Text via OCR"
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

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Result meta */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">
                Text extracted — {result.page_count} page{result.page_count !== 1 ? "s" : ""}
              </span>
              {result.languages_used && (
                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  {result.languages_used.split("+").length} languages
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onSaveToDocuments && (
                <button
                  onClick={() => {
                    if (result?.extracted_text) {
                      onSaveToDocuments(result.extracted_text, result.original_filename);
                      setSavedToDocs(true);
                      setTimeout(() => setSavedToDocs(false), 2500);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {savedToDocs ? (
                    <><CheckCircle size={12} className="text-emerald-600" /> Saved to Documents!</>
                  ) : (
                    <><Save size={12} className="text-emerald-600" /> Save to Case Documents</>
                  )}
                </button>
              )}
              <button
                onClick={copyText}
                className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold transition-colors"
              >
                {copied ? (
                  <><CheckCircle size={12} /> Copied!</>
                ) : (
                  <><Copy size={12} /> Copy All</>
                )}
              </button>
              <button
                onClick={reset}
                className="text-xs text-[#64748B] hover:text-[#0F172A] font-medium transition-colors"
              >
                Upload New
              </button>
            </div>
          </div>

          {/* Extracted text box */}
          <textarea
            value={result.extracted_text || "(No text detected in this document)"}
            readOnly
            rows={14}
            className="w-full border border-[#E2E8F0] rounded-xl p-3 text-xs font-mono text-[#0F172A] bg-[#F8FAFC] resize-y focus:outline-none leading-relaxed"
          />

          <p className="text-[10px] text-[#94A3B8]">
            Result saved · ID #{result.id} · {new Date(result.created_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
