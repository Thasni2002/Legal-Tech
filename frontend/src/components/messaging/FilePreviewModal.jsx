"use client";

import { X, Download, ExternalLink } from "lucide-react";

export default function FilePreviewModal({ file, onClose }) {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <h4 className="text-sm font-bold text-white truncate pr-4">
            {file.title || "Attachment Preview"}
          </h4>
          <div className="flex items-center gap-2">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Download"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[300px]">
          {file.type === "image" && (
            <img 
              src={file.url} 
              alt={file.title || "Preview"} 
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
            />
          )}

          {file.type === "video" && (
            <video 
              controls 
              autoPlay 
              src={file.url} 
              className="max-w-full max-h-[75vh] rounded-xl shadow-lg"
            />
          )}

          {file.type === "document" && (
            <div className="text-center p-8">
              <p className="text-slate-300 mb-4 text-sm font-medium">Previewing document: {file.title}</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Open Full Document <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
