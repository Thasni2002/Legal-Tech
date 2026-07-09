"use client";

import React, { useState } from "react";
import {
  Calendar,
  AlertCircle,
  Briefcase,
  Clock,
  Pin,
} from "lucide-react";

const COLUMNS = [
  {
    key: "todo",
    label: "To Do",
    color: "#64748B",
    bg: "rgba(100,116,139,0.1)",
    border: "#CBD5E1",
    dot: "#94A3B8",
    headerBg: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
  },
  {
    key: "progress",
    label: "In Progress",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.07)",
    border: "#BFDBFE",
    dot: "#3B82F6",
    headerBg: "linear-gradient(135deg,#eff6ff,#dbeafe)",
  },
  {
    key: "review",
    label: "Under Review",
    color: "#D97706",
    bg: "rgba(217,119,6,0.07)",
    border: "#FDE68A",
    dot: "#F59E0B",
    headerBg: "linear-gradient(135deg,#fffbeb,#fef3c7)",
  },
  {
    key: "completed",
    label: "Completed",
    color: "#16A34A",
    bg: "rgba(22,163,74,0.07)",
    border: "#BBF7D0",
    dot: "#22C55E",
    headerBg: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
  },
];

const PRIORITY_CONFIG = {
  Urgent: { color: "#DC2626", bg: "#FEF2F2", label: "Urgent" },
  High: { color: "#D97706", bg: "#FFFBEB", label: "High" },
  Medium: { color: "#2563EB", bg: "#EFF6FF", label: "Medium" },
  Low: { color: "#16A34A", bg: "#F0FDF4", label: "Low" },
};

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return { formatted, diffDays, overdue: diffDays < 0 };
  } catch {
    return { formatted: dateStr, diffDays: 0, overdue: false };
  }
}

function TaskCard({ task, onOpen, onStatusChange, currentUserId, isSenior, colKey, perms, onPinToggle }) {
  const [hovered, setHovered] = useState(false);
  const due = formatDueDate(task.due_date);
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;

  const handleDragStart = (e) => {
    if (!perms || !perms.edit) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("taskId", String(task.id));
    e.dataTransfer.setData("fromCol", colKey);
    // Use setTimeout so the drag image doesn't capture the 0.5 opacity look
    const target = e.currentTarget;
    setTimeout(() => {
      target.style.opacity = "0.5";
    }, 0);
  };
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  return (
    <div
      draggable={!!perms?.edit}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onOpen(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: task.is_pinned 
          ? "1.5px solid #F59E0B" 
          : (hovered ? "1.5px solid #BFDBFE" : "1.5px solid #E2E8F0"),
        borderRadius: "12px",
        padding: "14px 14px 12px",
        marginBottom: "10px",
        cursor: "pointer",
        boxShadow: task.is_pinned 
          ? (hovered ? "0 6px 16px rgba(245,158,11,0.15), 0 2px 4px rgba(0,0,0,0.06)" : "0 4px 12px rgba(245,158,11,0.08), 0 1px 3px rgba(0,0,0,0.04)")
          : (hovered ? "0 4px 16px rgba(37,99,235,0.10), 0 2px 4px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.04)"),
        transition: "all 0.2s ease",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "6px" }}>
        <span style={{
          background: priority.bg,
          color: priority.color,
          fontSize: "10.5px",
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: "20px",
        }}>
          {priority.label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          {(task.is_pinned || (hovered && perms?.edit)) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPinToggle(task.id, task.is_pinned);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: task.is_pinned ? "#F59E0B" : "#94A3B8",
                opacity: task.is_pinned ? 1 : 0.6,
                transform: task.is_pinned ? "rotate(-45deg)" : "none",
                transition: "all 0.15s ease",
              }}
              title={task.is_pinned ? "Unpin task" : "Pin task"}
            >
              <Pin size={13} fill={task.is_pinned ? "#F59E0B" : "none"} />
            </button>
          )}
          <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>
            #{task.id}
          </span>
        </div>
      </div>

      <h4 style={{
        fontSize: "13.5px",
        fontWeight: 700,
        color: "#1E293B",
        margin: "0 0 6px",
        lineHeight: 1.4,
      }}>{task.title}</h4>

      {task.case_title && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: "#0284C7",
          fontSize: "11px",
          fontWeight: 600,
          marginBottom: "10px",
        }}>
          <Briefcase size={12} />
          <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {task.case_title}
          </span>
        </div>
      )}

      <div style={{
        borderTop: "1.5px solid #F1F5F9",
        paddingTop: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#EFF6FF",
            color: "#2563EB",
            fontSize: "10px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #BFDBFE",
          }}>
            {(task.junior_name || "JA").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>
            {task.junior_name || "Junior"}
          </span>
        </div>

        {due && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: due.overdue ? "#DC2626" : (due.diffDays <= 3 ? "#D97706" : "#64748B"),
          }}>
            {due.overdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
            <span style={{ fontSize: "10.5px", fontWeight: 500 }}>
              {due.overdue ? `Overdue · ${due.formatted}` : due.formatted}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks = [], onOpenTask, onStatusChange, currentUserId, isSenior, perms, onPinToggle }) {
  const tasksByCol = {};
  COLUMNS.forEach((c) => { tasksByCol[c.key] = []; });
  tasks.forEach((t) => {
    const col = t.status in tasksByCol ? t.status : "todo";
    tasksByCol[col].push(t);
  });

  // Sort within columns: pinned tasks first, then by id desc
  COLUMNS.forEach((c) => {
    tasksByCol[c.key].sort((a, b) => {
      const pinA = a.is_pinned ? 1 : 0;
      const pinB = b.is_pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return b.id - a.id;
    });
  });

  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e, targetColKey) => {
    e.preventDefault();
    if (!perms || !perms.edit) return;
    const taskId = parseInt(e.dataTransfer.getData("taskId"), 10);
    const fromCol = e.dataTransfer.getData("fromCol");
    if (!taskId || fromCol === targetColKey) return;
    onStatusChange(taskId, targetColKey);
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(240px, 1fr))",
      gap: "16px",
      minWidth: "min-content",
    }}>
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.key)}
          style={{
            borderRadius: "14px",
            border: `1.5px solid ${col.border}`,
            background: col.bg,
            display: "flex",
            flexDirection: "column",
            minHeight: "200px",
          }}
        >
          {/* Column header */}
          <div style={{
            padding: "14px 16px 12px",
            background: col.headerBg,
            borderRadius: "12px 12px 0 0",
            borderBottom: `1.5px solid ${col.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: col.dot,
                display: "inline-block",
                boxShadow: `0 0 0 2px ${col.border}`,
              }} />
              <span style={{ fontWeight: 700, fontSize: "13px", color: col.color, letterSpacing: "0.02em" }}>
                {col.label}
              </span>
            </div>
            <span style={{
              background: col.border,
              color: col.color,
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: "20px",
            }}>
              {tasksByCol[col.key].length}
            </span>
          </div>

          {/* Cards */}
          <div style={{ padding: "12px", flex: 1 }}>
            {tasksByCol[col.key].length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "32px 16px",
                color: "#CBD5E1",
                fontSize: "12px",
                border: `2px dashed ${col.border}`,
                borderRadius: "10px",
                marginTop: "4px",
              }}>
                <Clock size={22} style={{ margin: "0 auto 6px", display: "block" }} />
                Drop tasks here
              </div>
            ) : (
              tasksByCol[col.key].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  colKey={col.key}
                  onOpen={onOpenTask}
                  onStatusChange={onStatusChange}
                  currentUserId={currentUserId}
                  isSenior={isSenior}
                  perms={perms}
                  onPinToggle={onPinToggle}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
