"use client";

import { useState } from "react";
import { Check, CheckCheck, FileText, Download, Play, Pause, Trash2, Edit2, CornerUpLeft } from "lucide-react";
import { API_BASE_URL } from "@/utils/api";

export default function MessageBubble({ message, isOwn, currentUserRole, onEdit, onDelete, onPreviewFile }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFullFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const toggleAudio = (url) => {
    if (!audioRef) {
      const audio = new Audio(getFullFileUrl(url));
      audio.onended = () => setIsPlayingAudio(false);
      setAudioRef(audio);
      audio.play();
      setIsPlayingAudio(true);
    } else {
      if (isPlayingAudio) {
        audioRef.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const canManageMessage = isOwn || currentUserRole?.toLowerCase() === "senioradvocate" || currentUserRole?.toLowerCase() === "admin";

  return (
    <div className={`flex flex-col mb-3.5 ${isOwn ? "items-end" : "items-start"} group`}>
      {/* Sender Header Name & Role */}
      {!isOwn && (
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[11px] font-bold text-slate-700">
            {message.sender_name || "User"}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
            {message.sender_role || "Staff"}
          </span>
        </div>
      )}

      {/* Main Bubble */}
      <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 text-sm shadow-xs transition-all ${
        isOwn 
          ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-xs" 
          : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-slate-100"
      }`}>

        {/* Deleted State */}
        {message.is_deleted ? (
          <p className="italic opacity-70 text-xs flex items-center gap-1.5">
            <CornerUpLeft size={13} /> This message was deleted
          </p>
        ) : (
          <>
            {/* Case Tag Badge */}
            {(message.case_no || message.case_title) && (
              <div className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg mb-1.5 border ${
                isOwn ? "bg-white/20 text-white border-white/30" : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                <span>📋</span>
                <span>{message.case_no ? `Case #${message.case_no}` : message.case_title}</span>
              </div>
            )}

            {/* TEXT MESSAGE */}
            {message.content && (
              <p className="whitespace-pre-wrap break-words leading-relaxed select-text">
                {message.content}
              </p>
            )}

            {/* IMAGE ATTACHMENT */}
            {message.message_type === "image" && message.file_url && (
              <div 
                onClick={() => onPreviewFile && onPreviewFile({ type: "image", url: getFullFileUrl(message.file_url), title: message.file_name })}
                className="mt-1 rounded-xl overflow-hidden border border-black/10 cursor-pointer hover:opacity-95 transition-opacity max-w-xs"
              >
                <img 
                  src={getFullFileUrl(message.file_url)} 
                  alt={message.file_name || "Attachment"} 
                  className="w-full h-auto max-h-60 object-cover"
                />
              </div>
            )}

            {/* VOICE / AUDIO ATTACHMENT */}
            {(message.message_type === "voice" || message.message_type === "audio") && message.file_url && (
              <div className={`flex items-center gap-3 p-2 rounded-xl mt-1 ${isOwn ? "bg-white/15" : "bg-slate-100"}`}>
                <button
                  onClick={() => toggleAudio(message.file_url)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                    isOwn ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                  }`}
                >
                  {isPlayingAudio ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
                <div className="flex-1 min-w-[120px]">
                  <div className="h-1.5 w-full bg-slate-300/50 rounded-full overflow-hidden">
                    <div className={`h-full ${isOwn ? "bg-white" : "bg-blue-600"} ${isPlayingAudio ? "animate-pulse w-full" : "w-1/3"}`} />
                  </div>
                  <span className="text-[10px] font-medium opacity-80 mt-1 block">
                    {message.message_type === "voice" ? "Voice Message" : (message.file_name || "Audio")}
                  </span>
                </div>
              </div>
            )}

            {/* VIDEO ATTACHMENT */}
            {message.message_type === "video" && message.file_url && (
              <div className="mt-1 rounded-xl overflow-hidden border border-black/10 max-w-xs">
                <video 
                  controls 
                  src={getFullFileUrl(message.file_url)} 
                  className="w-full h-auto max-h-60 object-cover"
                />
              </div>
            )}

            {/* DOCUMENT ATTACHMENT */}
            {message.message_type === "document" && message.file_url && (
              <div className={`flex items-center gap-3 p-2.5 rounded-xl mt-1 border ${
                isOwn ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-200"
              }`}>
                <div className={`p-2 rounded-lg ${isOwn ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"}`}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-semibold text-xs truncate" title={message.file_name}>
                    {message.file_name || "Document"}
                  </p>
                  <p className="text-[10px] opacity-75">{message.file_size || "File"}</p>
                </div>
                <a
                  href={getFullFileUrl(message.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className={`p-1.5 rounded-lg transition-colors ${
                    isOwn ? "hover:bg-white/20 text-white" : "hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  <Download size={16} />
                </a>
              </div>
            )}

            {/* Footer Metadata (Time, Edited tag, Read Ticks) */}
            <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none ${
              isOwn ? "text-blue-100" : "text-slate-400"
            }`}>
              {message.is_edited && <span>(edited)</span>}
              <span>{formatTime(message.created_at)}</span>
              {isOwn && (
                message.is_read ? (
                  <CheckCheck size={14} className="text-cyan-300" title="Read" />
                ) : (
                  <Check size={14} className="opacity-80" title="Sent" />
                )
              )}
            </div>
          </>
        )}

        {/* Hover Quick Actions Menu */}
        {!message.is_deleted && canManageMessage && (
          <div className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-md z-10 ${
            isOwn ? "-left-16" : "-right-16"
          }`}>
            {message.content && onEdit && (
              <button 
                onClick={() => onEdit(message)}
                className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                title="Edit message"
              >
                <Edit2 size={12} />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(message.id)}
                className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                title="Delete message"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
