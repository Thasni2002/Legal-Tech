"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Briefcase,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  Loader2,
  Pencil,
  Tag,
  Trash2,
  AlertTriangle,
  Pin,
  Check,
  CheckCheck,
  Paperclip,
  File,
  Download,
  Mic,
  Square,
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api";
import { getLoggedInUser } from "@/utils/auth";

const STATUS_CONFIG = {
  todo: { label: "To Do", color: "#64748B", bg: "#F1F5F9" },
  progress: { label: "In Progress", color: "#2563EB", bg: "#EFF6FF" },
  review: { label: "Under Review", color: "#D97706", bg: "#FFFBEB" },
  completed: { label: "Completed", color: "#16A34A", bg: "#F0FDF4" },
};

const PRIORITY_CONFIG = {
  Urgent: { color: "#DC2626", bg: "#FEF2F2" },
  High: { color: "#D97706", bg: "#FFFBEB" },
  Medium: { color: "#2563EB", bg: "#EFF6FF" },
  Low: { color: "#16A34A", bg: "#F0FDF4" },
};

function formatTime(dateStr) {
  if (!dateStr) return "";
  let str = String(dateStr);
  if (!str.endsWith("Z") && !str.includes("+") && !str.includes("Z")) {
    str += "Z";
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateDivider(dateStr) {
  if (!dateStr) return "";
  let str = String(dateStr);
  if (!str.endsWith("Z") && !str.includes("+") && !str.includes("Z")) {
    str += "Z";
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays < 7) {
    return d.toLocaleDateString("en-IN", { weekday: "long" });
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getMsgDateKey(dateStr) {
  if (!dateStr) return "";
  let str = String(dateStr);
  if (!str.endsWith("Z") && !str.includes("+") && !str.includes("Z")) {
    str += "Z";
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function TaskDetailsModal({ task: initialTask, onClose, onStatusChange, isSenior, onEdit, perms, onDelete, onPinToggle, onReadMessages }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [task, setTask] = useState(initialTask);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  const [messages, setMessages] = useState(initialTask?.messages || []);
  const [newMessage, setNewMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState(null); // { file_url, file_name, file_type }
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 0) {
          await uploadVoiceNote(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access is required to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const uploadVoiceNote = async (audioBlob) => {
    const token = localStorage.getItem("token");
    setUploadingFile(true);
    try {
      const formData = new FormData();
      const fileName = `Voice_Note_${Date.now()}.webm`;
      formData.append("file", audioBlob, fileName);

      const res = await fetch(`${API_BASE_URL}/advocate/tasks/upload-attachment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setAttachedFile({
          file_url: data.file_url,
          file_name: `Voice Note (${recordingTime}s)`,
          file_type: "audio/webm",
        });
      }
    } catch (err) {
      console.error("Error uploading voice note:", err);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem("token");
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/advocate/tasks/upload-attachment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setAttachedFile(data);
      }
    } catch (err) {
      console.error("Error uploading attachment:", err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    onDelete && onDelete(task.id);
  };

  const handlePinClick = async () => {
    if (!perms?.edit || !onPinToggle) return;
    const nextPinned = !task.is_pinned;
    setTask(prev => ({ ...prev, is_pinned: nextPinned }));
    await onPinToggle(task.id, task.is_pinned);
  };

  const user = getLoggedInUser();

  const markAsRead = async (taskId) => {
    if (!taskId) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/advocate/tasks/${taskId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onReadMessages) {
        onReadMessages(taskId);
      }
    } catch (e) {
      console.error("Error marking task messages as read:", e);
    }
  };

  useEffect(() => {
    if (!mounted || !task?.id) return;
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [task?.id, mounted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async (silent = false) => {
    const token = localStorage.getItem("token");
    if (!silent) setLoadingMessages(true);
    try {
      await markAsRead(task.id);
      const res = await fetch(`${API_BASE_URL}/advocate/tasks/${task.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !attachedFile) return;
    const token = localStorage.getItem("token");
    setSending(true);
    try {
      const payload = {
        message: newMessage.trim() || (attachedFile ? `Attached file: ${attachedFile.file_name}` : ""),
        message_type: "general",
        file_url: attachedFile?.file_url || null,
        file_name: attachedFile?.file_name || null,
        file_type: attachedFile?.file_type || null,
      };

      const res = await fetch(`${API_BASE_URL}/advocate/tasks/${task.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        setAttachedFile(null);
      }
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const token = localStorage.getItem("token");
    setChangingStatus(true);
    try {
      const res = await fetch(`${API_BASE_URL}/advocate/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTask(updated);
        onStatusChange && onStatusChange(task.id, newStatus, true);
      }
    } catch (e) {
      console.error("Error changing status:", e);
    } finally {
      setChangingStatus(false);
    }
  };

  const status = STATUS_CONFIG[task?.status] || STATUS_CONFIG.todo;
  const priority = PRIORITY_CONFIG[task?.priority] || PRIORITY_CONFIG.Medium;

  const STATUSES = ["todo", "progress", "review", "completed"];

  const isOwnMessage = (msg) => msg.sender_id === user?.id;

  if (!mounted || typeof window === "undefined" || !task) return null;

  return (
    <>
      {createPortal(
        <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "780px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#0F2A6B,#1E3A8A,#2563EB)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px" }}>Task #{task.id}</span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>·</span>
              <span style={{
                background: status.bg,
                color: status.color,
                fontSize: "10.5px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "20px",
              }}>
                {status.label}
              </span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>·</span>
              <span style={{
                background: priority.bg,
                color: priority.color,
                fontSize: "10.5px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "20px",
              }}>
                {task.priority}
              </span>
            </div>
            <h2 style={{ color: "#fff", fontSize: "17px", fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
              {task.title}
            </h2>
          </div>

          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {perms?.edit && (
              <button
                onClick={handlePinClick}
                style={{
                  background: task.is_pinned ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: task.is_pinned ? "#F59E0B" : "#fff",
                  transform: task.is_pinned ? "rotate(-45deg)" : "none",
                  transition: "all 0.2s",
                }}
                title={task.is_pinned ? "Unpin Task" : "Pin Task"}
              >
                <Pin size={16} fill={task.is_pinned ? "#F59E0B" : "none"} />
              </button>
            )}
            {isSenior && perms?.edit && (
              <button
                onClick={() => onEdit && onEdit(task)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                }}
                title="Edit Task"
              >
                <Pencil size={16} />
              </button>
            )}
            {isSenior && perms?.delete && (
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                style={{
                  background: "rgba(239,68,68,0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: deleting ? "not-allowed" : "pointer",
                  color: "#ef4444",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.4)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                  e.currentTarget.style.color = "#ef4444";
                }}
                title="Delete Task"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body: 2 columns */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: Details panel */}
          <div style={{
            width: "280px",
            flexShrink: 0,
            borderRight: "1.5px solid #F1F5F9",
            overflowY: "auto",
            padding: "20px",
            background: "#FAFBFC",
          }}>
            {/* Description */}
            {task.description && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Description</h4>
                <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, margin: 0 }}>{task.description}</p>
              </div>
            )}

            {/* Meta info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {task.case_title && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F0F9FF", borderRadius: "8px", padding: "8px 10px" }}>
                  <Briefcase size={14} color="#0284C7" />
                  <div>
                    <div style={{ fontSize: "10px", color: "#7DD3FC", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Linked Case</div>
                    <div style={{ fontSize: "12.5px", color: "#0369A1", fontWeight: 600 }}>{task.case_title}</div>
                    {task.case_no && <div style={{ fontSize: "11px", color: "#7DD3FC" }}>{task.case_no}</div>}
                  </div>
                </div>
              )}

              {task.due_date && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={14} color="#64748B" />
                  <div>
                    <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Due Date</div>
                    <div style={{ fontSize: "12.5px", color: "#374151", fontWeight: 500 }}>
                      {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={14} color="#64748B" />
                <div>
                  <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Assigned To</div>
                  <div style={{ fontSize: "12.5px", color: "#374151", fontWeight: 500 }}>{task.junior_name || "Junior Advocate"}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={14} color="#64748B" />
                <div>
                  <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Assigned By</div>
                  <div style={{ fontSize: "12.5px", color: "#374151", fontWeight: 500 }}>{task.senior_name || "Senior Advocate"}</div>
                </div>
              </div>
            </div>

            {/* Status changer */}
            <div>
              <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                Update Status
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {STATUSES.map((s) => {
                  const sc = STATUS_CONFIG[s];
                  const isActive = task.status === s;
                  return (
                    <button
                      key={s}
                      disabled={changingStatus || isActive || !perms?.edit}
                      onClick={() => handleStatusChange(s)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: isActive ? `2px solid ${sc.color}` : "1.5px solid #E2E8F0",
                        background: isActive ? sc.bg : "#fff",
                        color: isActive ? sc.color : "#64748B",
                        fontSize: "12.5px",
                        fontWeight: isActive ? 700 : 500,
                        cursor: isActive ? "default" : "pointer",
                        transition: "all 0.15s",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "#F8FAFC")}
                      onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "#fff")}
                    >
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                      {sc.label}
                      {isActive && <span style={{ marginLeft: "auto", fontSize: "10px" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Chat feed */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Messages header */}
            <div style={{
              padding: "14px 20px",
              borderBottom: "1.5px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <MessageSquare size={16} color="#2563EB" />
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>Progress Feed</span>
              <span style={{
                background: "#EFF6FF",
                color: "#2563EB",
                fontSize: "11px",
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: "20px",
                marginLeft: "4px",
              }}>
                {messages.length}
              </span>
            </div>

            {/* Messages list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {loadingMessages ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94A3B8" }}>
                  <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#CBD5E1" }}>
                  <MessageSquare size={32} style={{ margin: "0 auto 10px", display: "block" }} />
                  <p style={{ margin: 0, fontSize: "13px" }}>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const mine = isOwnMessage(msg);
                  const dateKey = getMsgDateKey(msg.created_at);
                  const prevDateKey = index > 0 ? getMsgDateKey(messages[index - 1].created_at) : null;
                  const showDateDivider = index === 0 || dateKey !== prevDateKey;
                  const dateDividerLabel = showDateDivider ? formatDateDivider(msg.created_at) : "";

                  return (
                    <React.Fragment key={msg.id ? `msg-frag-${msg.id}-${index}` : `msg-frag-idx-${index}`}>
                      {showDateDivider && dateDividerLabel && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "12px 0 8px",
                        }}>
                          <span style={{
                            background: "#1E293B",
                            color: "#F8FAFC",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 12px",
                            borderRadius: "12px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                            letterSpacing: "0.02em",
                          }}>
                            {dateDividerLabel}
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: mine ? "flex-end" : "flex-start",
                        }}
                      >
                        {/* Sender header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender_name || "U")}&background=${mine ? "2563EB" : "D97706"}&color=fff&size=40&rounded=true&bold=true`}
                            alt={msg.sender_name}
                            style={{ width: "20px", height: "20px", borderRadius: "50%", order: mine ? 2 : 0 }}
                          />
                          <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>
                            {mine ? "You" : (msg.sender_name || "Advocate")}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div style={{
                          maxWidth: "80%",
                          background: mine ? "linear-gradient(135deg,#2563EB,#1d4ed8)" : "#F1F5F9",
                          color: mine ? "#fff" : "#1E293B",
                          borderRadius: mine ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                          padding: "10px 14px",
                          fontSize: "13px",
                          lineHeight: 1.55,
                        }}>
                          <div>{msg.message}</div>

                          {/* File Attachment / Voice Note Renderer */}
                          {msg.file_url && (
                            <div style={{ marginTop: "6px", marginBottom: "4px" }}>
                              {(() => {
                                const fullUrl = msg.file_url.startsWith("http")
                                  ? msg.file_url
                                  : `${API_BASE_URL.replace(/\/api\/?$/, "")}${msg.file_url}`;
                                const ext = (msg.file_name || msg.file_url).split(".").pop()?.toLowerCase();
                                const isImg = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
                                const isAudio = ["mp3", "wav", "webm", "ogg", "m4a"].includes(ext) || (msg.file_type && msg.file_type.includes("audio"));

                                if (isAudio) {
                                  return (
                                    <div style={{ marginTop: "4px", minWidth: "220px" }}>
                                      <audio
                                        controls
                                        src={fullUrl}
                                        style={{
                                          width: "100%",
                                          height: "36px",
                                          borderRadius: "8px",
                                          outline: "none",
                                        }}
                                      />
                                      <div style={{ fontSize: "10.5px", opacity: 0.85, marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span>{msg.file_name || "Voice Note"}</span>
                                      </div>
                                    </div>
                                  );
                                }

                                if (isImg) {
                                  return (
                                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                                      <img
                                        src={fullUrl}
                                        alt={msg.file_name || "Attachment"}
                                        style={{
                                          maxHeight: "160px",
                                          maxWidth: "100%",
                                          borderRadius: "8px",
                                          objectFit: "cover",
                                          border: "1px solid rgba(255,255,255,0.2)",
                                          marginTop: "4px",
                                        }}
                                      />
                                    </a>
                                  );
                                }

                                return (
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    download={msg.file_name || true}
                                    rel="noopener noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "7px 10px",
                                      borderRadius: "8px",
                                      background: mine ? "rgba(255,255,255,0.18)" : "#E2E8F0",
                                      color: mine ? "#fff" : "#1E293B",
                                      textDecoration: "none",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      maxWidth: "100%",
                                      marginTop: "4px",
                                    }}
                                  >
                                    <Paperclip size={14} style={{ flexShrink: 0 }} />
                                    <span style={{ flex: 1, minWidth: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                      {msg.file_name || "Attachment"}
                                    </span>
                                    <Download size={13} style={{ flexShrink: 0, marginLeft: "4px" }} />
                                  </a>
                                );
                              })()}
                            </div>
                          )}

                          {/* Bottom timestamp + read ticks */}
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "4px",
                            marginTop: "6px",
                            fontSize: "10px",
                            color: mine ? "rgba(255,255,255,0.8)" : "#94A3B8",
                            fontWeight: 500,
                          }}>
                            <span>{formatTime(msg.created_at)}</span>
                            {mine && (
                              <span
                                style={{ display: "inline-flex", alignItems: "center" }}
                                title={msg.is_read ? "Seen by recipient" : "Sent"}
                              >
                                {msg.is_read ? (
                                  <CheckCheck size={13} className="text-sky-300 stroke-[2.5]" />
                                ) : (
                                  <Check size={13} className="text-white/70 stroke-[2.5]" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message input */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1.5px solid #F1F5F9",
              background: "#FAFBFC",
            }}>
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="*/*"
                style={{ display: "none" }}
              />

              {/* Attachment Badge Preview */}
              {attachedFile && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  fontSize: "12px",
                  color: "#1E40AF",
                  fontWeight: 600,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                    <Paperclip size={14} />
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {attachedFile.file_name}
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachedFile(null)}
                    style={{ background: "none", border: "none", color: "#1E40AF", cursor: "pointer", padding: "2px" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                {/* File Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || isRecording}
                  title="Attach file from system (All Formats Supported)"
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1.5px solid #E2E8F0",
                    background: "#fff",
                    color: "#64748B",
                    cursor: (uploadingFile || isRecording) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {uploadingFile ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Paperclip size={18} />}
                </button>

                {/* Voice Recorder Button */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={uploadingFile}
                  title={isRecording ? "Stop Recording" : "Record Voice Note"}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    border: `1.5px solid ${isRecording ? "#EF4444" : "#E2E8F0"}`,
                    background: isRecording ? "#FEF2F2" : "#fff",
                    color: isRecording ? "#DC2626" : "#2563EB",
                    cursor: uploadingFile ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isRecording ? <Square size={18} fill="#DC2626" /> : <Mic size={18} />}
                </button>

                {/* Text Input / Recording Indicator */}
                {isRecording ? (
                  <div style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#FEF2F2",
                    border: "1.5px solid #FCA5A5",
                    borderRadius: "10px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse inline-block" />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B" }}>
                        Recording... ({formatDuration(recordingTime)})
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={cancelRecording}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #FCA5A5",
                          background: "#fff",
                          color: "#991B1B",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={stopRecording}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "none",
                          background: "#DC2626",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={2}
                    placeholder="Type a message, attach file, or record voice note..."
                    style={{
                      flex: 1,
                      padding: "10px 13px",
                      border: "1.5px solid #E2E8F0",
                      borderRadius: "10px",
                      fontSize: "13px",
                      color: "#0F172A",
                      background: "#fff",
                      outline: "none",
                      resize: "none",
                      lineHeight: 1.4,
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                  />
                )}
                <button
                  onClick={handleSend}
                  disabled={sending || (!newMessage.trim() && !attachedFile)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: (sending || (!newMessage.trim() && !attachedFile)) ? "#CBD5E1" : "linear-gradient(135deg,#2563EB,#1d4ed8)",
                    color: "#fff",
                    cursor: (sending || (!newMessage.trim() && !attachedFile)) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    height: "56px",
                    width: "48px",
                    boxShadow: (sending || !newMessage.trim()) ? "none" : "0 4px 12px rgba(37,99,235,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  {sending ? <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={17} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  )}

  {showDeleteConfirm && createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.7)",
        backdropFilter: "blur(10px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={() => setShowDeleteConfirm(false)}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "420px",
          padding: "32px 28px 28px",
          textAlign: "center",
          animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          position: "relative",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Container */}
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#FEF2F2",
          color: "#EF4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 0 0 8px #FEE2E2",
        }}>
          <AlertTriangle size={26} />
        </div>

        <h3 style={{
          fontSize: "19px",
          fontWeight: 800,
          color: "#1E293B",
          margin: "0 0 10px",
          letterSpacing: "-0.01em",
        }}>
          Delete Task
        </h3>
        <p style={{
          fontSize: "13.5px",
          color: "#64748B",
          lineHeight: 1.5,
          margin: "0 0 24px",
        }}>
          Are you sure you want to delete this task? This action cannot be undone and will also remove it from the junior advocate's task board.
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              flex: 1,
              padding: "11px 20px",
              borderRadius: "10px",
              border: "1.5px solid #E2E8F0",
              background: "#fff",
              color: "#64748B",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            style={{
              flex: 1,
              padding: "11px 20px",
              borderRadius: "10px",
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
              transition: "all 0.2s",
            }}
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}
    </>
  );
}
