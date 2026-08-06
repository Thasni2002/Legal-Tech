"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { useMessaging } from "@/utils/useMessaging";
import { getLoggedInUser } from "@/utils/auth";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import FilePreviewModal from "./FilePreviewModal";
import AssignConversationModal from "./AssignConversationModal";
import NewConversationModal from "./NewConversationModal";

export default function MessagingHub({ onClose }) {
  const {
    conversations,
    activeConvId,
    activeConversation,
    messages,
    unreadCount,
    loadingConvs,
    loadingMsgs,
    typingUserNames,
    selectConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingSignal,
    togglePin,
    assignJunior,
    refreshConversations
  } = useMessaging();

  const [previewFile, setPreviewFile] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileView, setMobileView] = useState("list"); // list or chat
  const [mounted, setMounted] = useState(false);

  const user = getLoggedInUser() || {};

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select first conversation if available
  useEffect(() => {
    if (conversations.length > 0 && !activeConvId) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, activeConvId, selectConversation]);

  const handleSelectConv = (id) => {
    selectConversation(id);
    setMobileView("chat");
  };

  if (!mounted) return null;

  const hubContent = (
    <div className={`fixed transition-all duration-300 animate-in fade-in zoom-in-95 z-[9999] ${
      isExpanded 
        ? "inset-0 w-screen h-screen p-0 m-0" 
        : "right-2 sm:right-6 top-16 w-[96vw] sm:w-[540px] md:w-[720px] lg:w-[860px] h-[580px] md:h-[640px]"
    }`}>
      <div className={`w-full h-full bg-white overflow-hidden flex flex-col font-sans ${
        isExpanded ? "rounded-none border-0 shadow-none" : "border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-400/30"
      }`}>
        
        {/* Floating Hub Top Title Bar */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <MessageCircle size={14} />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              Client Messaging Hub
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 uppercase tracking-wider">
              RBAC Protected
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={refreshConversations}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Threads"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Hub"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Dual-Pane Interface */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Conversation List Panel */}
          <div className={`${mobileView === "list" ? "flex" : "hidden"} md:flex h-full w-full md:w-auto shrink-0`}>
            <ConversationList
              conversations={conversations}
              activeConvId={activeConvId}
              onSelectConversation={handleSelectConv}
              onOpenNewModal={() => setShowNewModal(true)}
              onTogglePin={togglePin}
              currentUserRole={user.role}
            />
          </div>

          {/* Active Chat Window Panel */}
          <div className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex flex-1 h-full`}>
            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              loadingMessages={loadingMsgs}
              currentUserId={user.id}
              currentUserRole={user.role}
              typingUserNames={typingUserNames}
              onSendMessage={sendMessage}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onSendTypingSignal={sendTypingSignal}
              onAssignJunior={() => setShowAssignModal(true)}
              onTogglePin={togglePin}
              onBackMobile={() => setMobileView("list")}
              onPreviewFile={(f) => setPreviewFile(f)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {showAssignModal && activeConversation && (
        <AssignConversationModal
          conversation={activeConversation}
          onAssign={assignJunior}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {showNewModal && (
        <NewConversationModal
          onCreateSuccess={(newId) => selectConversation(newId)}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );

  return createPortal(hubContent, document.body);
}
