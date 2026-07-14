"use client";

import { API_BASE_URL } from "@/utils/api";
import { getLoggedInUser } from "@/utils/auth";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Bot, User, ArrowLeft, Loader2, X, Sparkles } from "lucide-react";

function AIAssistantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClientName = searchParams ? searchParams.get("clientName") : null;

  const [clientName, setClientName] = useState(initialClientName || "");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: initialClientName 
        ? `Hello! I am your AI Legal Assistant. I've loaded the case history, billing status, and consultation records for client "${initialClientName}". How can I help you with their details today?`
        : "Hello! I am your AI Legal Assistant. How can I help you ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState({ role: "", advocateName: "" });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setUserContext({
        role: user.role || "",
        advocateName: user.name || user.advocateName || user.username || ""
      });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/case-management/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: userMessage.text,
          role: userContext.role,
          advocateName: userContext.advocateName,
          clientName: clientName || undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.response }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I encountered an error while processing your request." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearContext = () => {
    setClientName("");
    setMessages((prev) => [
      ...prev,
      { role: "ai", text: "Client context cleared. I am now in general assistant mode. How can I help you?" }
    ]);
  };

  const generalSuggestions = [
    "What hearings do I have tomorrow?",
    "List the documents for my active cases",
    "Update the status of case cr/1234 to Closed",
    "Draft a legal notice based on my latest case"
  ];

  const clientSuggestions = [
    `Summarize cases for ${clientName}`,
    `Check outstanding billing for ${clientName}`,
    `Show latest consultation with ${clientName}`,
    `Draft case status update for ${clientName}`
  ];

  const suggestions = clientName ? clientSuggestions : generalSuggestions;

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* HEADER */}
      <div className="flex items-center gap-4 bg-white px-6 py-4 border-b border-[#E2E8F0] shadow-sm shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] transition shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6d28d9] flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-[#0F172A] font-bold text-lg">
              {clientName ? (
                <>
                  AI Client Assistant: <span className="text-[#4F46E5] font-extrabold">{clientName}</span>
                </>
              ) : (
                "AI Legal Assistant"
              )}
            </h1>
            <p className="text-[#64748B] text-xs">
              {clientName 
                ? `Ask questions about cases, invoices, and consultations for ${clientName}`
                : "Ask questions about cases, clients, and documents"
              }
            </p>
          </div>
        </div>
      </div>

      {/* CONTEXT BANNER */}
      {clientName && (
        <div className="bg-[#EEF2FF] border-b border-[#C7D2FE] px-6 py-2.5 flex items-center justify-between text-xs text-[#4F46E5] font-semibold animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#6366F1] animate-pulse" />
            <span>AI assistant is scoped to cases, invoices, and consultations for client: <strong className="text-[#3730A3] font-bold">{clientName}</strong></span>
          </div>
          <button 
            onClick={handleClearContext}
            className="flex items-center gap-1 bg-[#E0E7FF] hover:bg-[#C7D2FE] text-[#3730A3] px-2.5 py-1 rounded-lg transition-colors font-bold cursor-pointer"
          >
            <X size={12} /> Clear Context
          </button>
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
          >
            <div
              className={`flex max-w-[80%] gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                  msg.role === "user"
                    ? "bg-[#2563EB] text-white"
                    : "bg-gradient-to-br from-[#7C3AED] to-[#6d28d9] text-white"
                }`}
              >
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#2563EB] text-white rounded-tr-sm"
                    : "bg-white border border-[#E2E8F0] text-[#0F172A] rounded-tl-sm shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6d28d9] text-white flex items-center justify-center mt-1">
                <Bot size={14} />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-[#64748B] rounded-tl-sm shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#7C3AED]" />
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="bg-white p-4 border-t border-[#E2E8F0] shrink-0">
        {/* SUGGESTIONS */}
        <div className="max-w-4xl mx-auto mb-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {suggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInput(prompt)}
              className={`whitespace-nowrap text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all border cursor-pointer flex items-center gap-1.5 ${
                clientName
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 shadow-xs"
                  : "bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
              }`}
            >
              {clientName && <Sparkles size={11} className="text-indigo-500 animate-pulse" />}
              {prompt}
            </button>
          ))}
        </div>
        
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-[#F8FAFC] p-2 rounded-2xl border border-[#E2E8F0] focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/20 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={clientName ? `Ask about cases for ${clientName}...` : "Ask about a case (e.g. 'What is the phone number of the client for case cr/1234/2028?')"}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-sm text-[#0F172A] focus:outline-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 mb-0.5 rounded-xl bg-[#7C3AED] hover:bg-[#6d28d9] disabled:opacity-50 text-white transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-[#94A3B8] mt-3">
          AI Legal Assistant can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

export default function AIAssistantView() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen items-center justify-center bg-[#F8FAFC] text-slate-500">
        <Loader2 size={32} className="animate-spin text-[#7C3AED] mb-2" />
        <span className="text-sm font-semibold">Loading AI Assistant...</span>
      </div>
    }>
      <AIAssistantContent />
    </Suspense>
  );
}
