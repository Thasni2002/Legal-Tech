"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, Paperclip, Mic, Smile, Search, UserCheck, Shield, ChevronDown, 
  ChevronUp, ArrowLeft, LoaderCircle, Image as ImageIcon, FileText, Video
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";
import { API_BASE_URL } from "@/services/api";
import { getAuthHeaders } from "@/utils/auth";

export default function ChatWindow({
  conversation,
  messages,
  loadingMessages,
  currentUserId,
  currentUserRole,
  typingUserNames,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onSendTypingSignal,
  onAssignJunior,
  onTogglePin,
  onBackMobile,
  onPreviewFile
}) {
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCaseInfo, setShowCaseInfo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [clientCases, setClientCases] = useState([]);
  const [selectedTagCase, setSelectedTagCase] = useState(null);

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);
  const prevConvIdRef = useRef(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.current;
    // User is considered scrolled up if they are more than 120px away from bottom
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 120;
    isUserScrolledUpRef.current = !isAtBottom;
  };

  // Scroll to bottom when conversation changes or when user is at bottom or sent a message
  useEffect(() => {
    if (!conversation?.id) return;

    const convChanged = prevConvIdRef.current !== conversation.id;
    prevConvIdRef.current = conversation.id;

    if (convChanged) {
      isUserScrolledUpRef.current = false;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 50);
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const isOwnLastMsg = lastMsg && lastMsg.sender_id === currentUserId;

    // Only auto-scroll if user is already at the bottom or sent the last message
    if (!isUserScrolledUpRef.current || isOwnLastMsg) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, conversation?.id, currentUserId]);

  // Fetch all cases for this client conversation
  useEffect(() => {
    if (!conversation?.id) return;
    const fetchCases = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/messaging/conversations/${conversation.id}/cases`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setClientCases(data);
          // If conversation has default case_no, preselect it
          if (conversation.case_no && data.length > 0) {
            const found = data.find(c => c.case_no === conversation.case_no);
            if (found) setSelectedTagCase(found);
          }
        }
      } catch (err) {
        console.warn("Could not fetch conversation cases:", err);
      }
    };
    fetchCases();
  }, [conversation?.id, conversation?.case_no]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 text-center text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-200/60 flex items-center justify-center mb-3">
          <Send size={24} className="text-slate-400" />
        </div>
        <h4 className="text-base font-bold text-slate-700 mb-1">Client Messaging Hub</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Select a conversation from the list to view real-time messages and case communications.
        </p>
      </div>
    );
  }

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage({ 
      content: inputText.trim(), 
      message_type: "text",
      case_no: selectedTagCase?.case_no || null,
      case_title: selectedTagCase?.case_title || null
    });
    setInputText("");
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    onSendTypingSignal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/messaging/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        let msgType = "document";
        if (file.type.startsWith("image/")) msgType = "image";
        else if (file.type.startsWith("video/")) msgType = "video";
        else if (file.type.startsWith("audio/")) msgType = "audio";

        onSendMessage({
          message_type: msgType,
          file_url: data.file_url,
          file_name: data.file_name,
          file_size: data.file_size,
          content: data.file_name,
          case_no: selectedTagCase?.case_no || null,
          case_title: selectedTagCase?.case_title || null
        });
      } else {
        alert("Failed to upload file.");
      }
    } catch (err) {
      console.error("File upload error:", err);
      alert("Error uploading file attachment.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/messaging/conversations/${conversation.id}/search?q=${encodeURIComponent(searchQuery)}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const canManageAssignment = ["senioradvocate", "clerk", "admin"].includes(currentUserRole?.toLowerCase());
  const isClientRole = currentUserRole?.toLowerCase() === "client";
  const headerTitle = isClientRole 
    ? (conversation.assigned_junior_name || "Senior Advocate & Legal Team")
    : (conversation.client_name || "Client");
  const avatarInitial = headerTitle.charAt(0).toUpperCase();

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white relative overflow-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-200/90 bg-white flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackMobile}
            className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"
          >
            <ArrowLeft size={18} />
          </button>

          <div className={`w-10 h-10 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center shadow-xs ${
            isClientRole ? "bg-gradient-to-br from-indigo-600 to-purple-700" : "bg-gradient-to-br from-blue-600 to-indigo-700"
          }`}>
            {avatarInitial}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                {headerTitle}
              </h3>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                {conversation.priority || "Medium"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isClientRole ? (
                conversation.case_title ? `Case #${conversation.case_no} — ${conversation.case_title}` : "Your Legal Consultation"
              ) : (
                conversation.case_title ? <>Case #{conversation.case_no} — <span className="font-bold text-slate-700">{conversation.case_title}</span></> : "Direct Client Thread"
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {conversation.case_id && (
            <button
              onClick={() => setShowCaseInfo(!showCaseInfo)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
              title="Toggle Case Info"
            >
              <Shield size={14} />
              <span className="hidden sm:inline">Case Info</span>
              {showCaseInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {canManageAssignment && (
            <button
              onClick={onAssignJunior}
              className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Assign / Reassign Advocate"
            >
              <UserCheck size={14} />
              <span className="hidden sm:inline">
                {conversation.assigned_junior_name ? conversation.assigned_junior_name : "Assign"}
              </span>
            </button>
          )}

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Search Messages"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Collapsible Case Info Strip */}
      {showCaseInfo && (
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 text-xs animate-in slide-in-from-top-2 duration-150 flex flex-wrap justify-between items-center gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Linked Case</span>
            <p className="font-extrabold text-sm text-blue-400">#{conversation.case_no} — {conversation.case_title}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Assigned Advocate</span>
            <p className="font-bold text-slate-200">{conversation.assigned_junior_name || "Unassigned"}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Status</span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700 text-[10px] font-bold uppercase">
              {conversation.status || "Active"}
            </span>
          </div>
        </div>
      )}

      {/* Embedded Search Panel */}
      {showSearch && (
        <div className="p-3 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words in this conversation..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase"
            >
              {searching ? "..." : "Search"}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-xl p-2">
              {searchResults.map((r) => (
                <div key={r.id} className="p-1.5 hover:bg-slate-50 text-xs rounded border-b border-slate-100 last:border-0">
                  <span className="font-bold text-slate-700">{r.sender_name}: </span>
                  <span className="text-slate-600">{r.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Stream Container with Smart Auto-Scrolling */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 space-y-2.5 bg-[#F8FAFC]"
      >
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full gap-2 text-slate-400 text-xs font-medium">
            <LoaderCircle size={18} className="animate-spin text-blue-600" />
            <span>Loading conversation messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xs font-semibold text-slate-500">No messages exchanged yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Start the conversation using the input bar below.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUserId}
              currentUserRole={currentUserRole}
              onEdit={(m) => {
                const updated = prompt("Edit message:", m.content);
                if (updated && updated !== m.content) {
                  onEditMessage(m.id, updated);
                }
              }}
              onDelete={onDeleteMessage}
              onPreviewFile={onPreviewFile}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUserNames.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium italic animate-pulse">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>{typingUserNames.join(", ")} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Case Tag Selection Bar */}
      {clientCases.length > 0 && (
        <div className="px-3.5 py-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none z-20 shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Tag Case:
          </span>

          <button
            onClick={() => setSelectedTagCase(null)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              selectedTagCase === null
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            💬 General Chat
          </button>

          {clientCases.map((c) => {
            const isSelected = selectedTagCase?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedTagCase(c)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
                title={c.case_title}
              >
                <span>📋</span>
                <span>Case #{c.case_no}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-3 border-t border-slate-200/90 bg-white relative">
        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <EmojiPicker
            onSelectEmoji={(emoji) => {
              setInputText((prev) => prev + emoji);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {/* Voice Recorder Bar or Input Bar */}
        {showVoiceRecorder ? (
          <VoiceRecorder
            onSendVoice={(voiceData) => {
              onSendMessage({
                ...voiceData,
                case_no: selectedTagCase?.case_no || null,
                case_title: selectedTagCase?.case_title || null
              });
              setShowVoiceRecorder(false);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="Attach File"
            >
              {uploadingFile ? <LoaderCircle size={18} className="animate-spin text-blue-600" /> : <Paperclip size={18} />}
            </button>

            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
              title="Emojis"
            >
              <Smile size={18} />
            </button>

            {/* Voice Record Button */}
            <button
              onClick={() => setShowVoiceRecorder(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Voice Message"
            >
              <Mic size={18} />
            </button>

            {/* Text Input */}
            <textarea
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send)"
              className="flex-1 bg-slate-100 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none resize-none max-h-24"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-2xl transition-all cursor-pointer shadow-md ${
                inputText.trim()
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              title="Send"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
