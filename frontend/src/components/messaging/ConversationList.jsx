"use client";

import { useState } from "react";
import { Search, Pin, MessageSquarePlus, Filter, User, AlertCircle, Clock } from "lucide-react";

export default function ConversationList({
  conversations,
  activeConvId,
  onSelectConversation,
  onOpenNewModal,
  onTogglePin,
  currentUserRole
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // all, unread, pinned

  const canCreateThread = ["senioradvocate", "clerk", "admin", "junioradvocate"].includes(
    currentUserRole?.toLowerCase()
  );

  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (conv.client_name && conv.client_name.toLowerCase().includes(q)) ||
      (conv.case_title && conv.case_title.toLowerCase().includes(q)) ||
      (conv.case_no && conv.case_no.toLowerCase().includes(q)) ||
      (conv.last_message && conv.last_message.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterTab === "unread") return conv.unread_count > 0;
    if (filterTab === "pinned") return conv.is_pinned;
    return true;
  });

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getPriorityColor = (p) => {
    switch ((p || "").toLowerCase()) {
      case "urgent": return "bg-rose-500";
      case "high": return "bg-amber-500";
      case "medium": return "bg-blue-500";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 border-r border-slate-200/80 w-full md:w-80 lg:w-96 shrink-0">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-slate-200/80 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
            Conversations
          </h3>
          {canCreateThread && (
            <button
              onClick={onOpenNewModal}
              className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Start New Thread"
            >
              <MessageSquarePlus size={16} />
              <span>New</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-2.5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client, case no, or text..."
            className="w-full bg-slate-100/80 border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[11px] font-bold">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterTab === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            onClick={() => setFilterTab("unread")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterTab === "unread"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterTab("pinned")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterTab === "pinned"
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Pinned
          </button>
        </div>
      </div>

      {/* Conversations Scroll List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain divide-y divide-slate-100">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-500">No conversations found</p>
            <p className="text-[10px] opacity-75 mt-0.5">Try adjusting search or filters</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConvId;

            const isClientRole = currentUserRole?.toLowerCase() === "client";
            const displayName = isClientRole 
              ? (conv.assigned_junior_name || "Senior Advocate & Legal Team")
              : (conv.client_name || "Client");
            const avatarInitial = displayName.charAt(0).toUpperCase();

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 transition-all cursor-pointer relative group flex items-start gap-3 ${
                  isActive
                    ? "bg-blue-50/70 border-l-4 border-blue-600"
                    : conv.unread_count > 0
                    ? "bg-white hover:bg-slate-100/80 font-semibold"
                    : "bg-slate-50/40 hover:bg-white"
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-10 h-10 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center shadow-xs ${
                    isClientRole ? "bg-gradient-to-br from-indigo-600 to-purple-700" : "bg-gradient-to-br from-blue-600 to-indigo-700"
                  }`}>
                    {avatarInitial}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getPriorityColor(
                      conv.priority
                    )}`}
                    title={`Priority: ${conv.priority}`}
                  />
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {displayName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                      {formatRelativeTime(conv.last_message_at)}
                    </span>
                  </div>

                  {conv.case_title && (
                    <p className="text-[10px] font-bold text-blue-600 truncate mb-1">
                      {conv.case_no ? `#${conv.case_no} ` : ""}{conv.case_title}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 truncate leading-tight line-clamp-1">
                    {conv.last_message || "No messages yet"}
                  </p>

                  {/* Badges / Pin row */}
                  <div className="flex items-center gap-2 mt-2">
                    {!isClientRole && conv.assigned_junior_name && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[120px]">
                        Advocate: {conv.assigned_junior_name}
                      </span>
                    )}

                    {isClientRole && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 truncate">
                        Legal Counsel
                      </span>
                    )}

                    {conv.is_pinned && (
                      <Pin size={11} className="text-amber-500 fill-amber-500 ml-auto" />
                    )}

                    {conv.unread_count > 0 && (
                      <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pin button on hover */}
                {onTogglePin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-500 transition-opacity absolute right-2 top-2"
                    title={conv.is_pinned ? "Unpin" : "Pin"}
                  >
                    <Pin size={13} className={conv.is_pinned ? "fill-amber-500 text-amber-500" : ""} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
