"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  ClipboardList,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  Tag,
  Kanban,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api";
import { getLoggedInUser } from "@/utils/auth";
import useModulePermission from "@/utils/useModulePermission";
import KanbanBoard from "./KanbanBoard";
import TaskFormModal from "./TaskFormModal";
import TaskDetailsModal from "./TaskDetailsModal";

const STATS_CONFIG = [
  { key: "todo", label: "To Do", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0", icon: Tag },
  { key: "progress", label: "In Progress", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: Clock },
  { key: "review", label: "Under Review", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: Eye },
  { key: "completed", label: "Completed", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: CheckCircle2 },
];

const PRIORITY_FILTERS = ["All", "Urgent", "High", "Medium", "Low"];

export default function AssignedTasksView({ isJuniorView = false }) {
  const { perms, loading: permsLoading } = useModulePermission(
    isJuniorView ? "Junior Assigned Tasks" : "Assigned Tasks"
  );
  const user = getLoggedInUser();
  const role = (user?.role || "").toLowerCase();
  const isSenior = !role.includes("junior");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async (silent = false) => {
    const token = localStorage.getItem("token");
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/advocate/tasks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      setError("Could not load tasks. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (perms?.view) {
      fetchTasks();
    }
  }, [fetchTasks, perms?.view]);

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.junior_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.case_title || "").toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  // Stats
  const stats = STATS_CONFIG.map((s) => ({
    ...s,
    count: tasks.filter((t) => t.status === s.key).length,
  }));

  const handleTaskSaved = (savedTask, isEdit) => {
    if (isEdit && !perms.edit) return;
    if (!isEdit && !perms.add) return;
    if (isEdit) {
      setTasks((prev) => prev.map((t) => (t.id === savedTask.id ? savedTask : t)));
    } else {
      setTasks((prev) => [savedTask, ...prev]);
    }
    setShowForm(false);
    setEditingTask(null);
  };

  const handleStatusChange = async (taskId, newStatus, skipPersist = false) => {
    if (!perms.edit) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    // Update selected task if open
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => ({ ...prev, status: newStatus }));
    }

    if (!skipPersist) {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_BASE_URL}/advocate/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          console.warn("Failed to persist task status change in backend, reverting...");
          fetchTasks(true);
        }
      } catch (err) {
        console.error("Error persisting task status change:", err);
        fetchTasks(true);
      }
    }
  };

  const handleEditTask = (task) => {
    if (!perms.edit) return;
    setSelectedTask(null);
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!perms.delete) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/advocate/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setSelectedTask(null);
      } else {
        alert("Failed to delete task.");
      }
    } catch (e) {
      console.error("Error deleting task:", e);
      alert("Error deleting task.");
    }
  };

  if (permsLoading || (perms?.view && loading)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "14px", background: "linear-gradient(160deg,#F0F4FF 0%,#F8FAFC 60%,#EFF6FF 100%)" }}>
        <div style={{
          background: "linear-gradient(135deg,#2563EB,#1d4ed8)",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
        }}>
          <Loader2 size={28} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>Loading task board...</p>
      </div>
    );
  }

  if (!permsLoading && !perms?.view) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#F0F4FF 0%,#F8FAFC 60%,#EFF6FF 100%)" }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "40px", maxWidth: "360px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1E293B", margin: 0 }}>Access Restricted</h2>
          <p style={{ color: "#64748B", fontSize: "14.5px", marginTop: "10px", lineHeight: "1.5" }}>You do not have permission to view Assigned Tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFC",
      padding: "24px",
    }}>
      {/* ─── Hero / Page Header ─── */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: "24px 28px 24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        marginBottom: "24px",
      }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: "-60px", right: "80px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(37,99,235,0.015)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-80px", right: "300px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(37,99,235,0.02)", pointerEvents: "none" }} />

        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                background: "#EFF6FF",
                borderRadius: "10px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Kanban size={22} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ color: "#0F172A", fontSize: "22px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                  Assigned Tasks
                </h1>
                <p style={{ color: "#64748B", fontSize: "13px", margin: "2px 0 0" }}>
                  {isSenior && !isJuniorView
                    ? "Manage and track tasks assigned to your team"
                    : "Your assigned tasks — stay on top of your work"}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => fetchTasks(true)}
              disabled={refreshing}
              style={{
                padding: "9px 16px",
                borderRadius: "9px",
                border: "1px solid #E2E8F0",
                background: "#ffffff",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
            >
              <RefreshCw size={14} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
              Refresh
            </button>

            {!isJuniorView && isSenior && perms.add && (
              <button
                onClick={() => { setEditingTask(null); setShowForm(true); }}
                style={{
                  padding: "9px 20px",
                  borderRadius: "9px",
                  border: "none",
                  background: "#2563EB",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#2563EB"; }}
              >
                <Plus size={16} />
                Assign New Task
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "12px",
          marginTop: "24px",
          position: "relative",
        }}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} style={{
                background: "rgba(220, 237, 238, 0.91)",
                borderRadius: "12px",
                padding: "14px 16px",
                border: "1.5px solid " + s.border,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <div style={{
                  background: s.bg,
                  borderRadius: "9px",
                  padding: "7px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={16} color={s.color} />
                </div>
                <div>
                  <div style={{ color: "#475569", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                  <div style={{ color: "#0F172A", fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>{s.count}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Filters bar ─── */}
      <div style={{
        padding: "16px 36px",
        background: "#fff",
        borderBottom: "1.5px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "420px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task, case, or advocate..."
            style={{
              width: "100%",
              padding: "9px 13px 9px 36px",
              border: "1.5px solid #E2E8F0",
              borderRadius: "9px",
              fontSize: "13.5px",
              color: "#0F172A",
              background: "#FAFBFC",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
            onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
          />
        </div>

        {/* Priority filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={14} color="#94A3B8" />
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Priority:</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  border: `1.5px solid ${priorityFilter === p ? "#2563EB" : "#E2E8F0"}`,
                  background: priorityFilter === p ? "#2563EB" : "#fff",
                  color: priorityFilter === p ? "#fff" : "#64748B",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginLeft: "auto", fontSize: "12px", color: "#94A3B8", fontWeight: 500 }}>
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div style={{ padding: "24px 36px 36px", overflowX: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "14px" }}>
            <div style={{
              background: "linear-gradient(135deg,#2563EB,#1d4ed8)",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
            }}>
              <Loader2 size={28} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>Loading task board...</p>
          </div>
        ) : error ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "60px 0",
            gap: "12px",
            color: "#DC2626",
          }}>
            <AlertCircle size={32} />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>{error}</p>
            <button onClick={() => fetchTasks()} style={{
              padding: "8px 18px", borderRadius: "8px", border: "1.5px solid #DC2626",
              background: "#FEF2F2", color: "#DC2626", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>
              Try Again
            </button>
          </div>
        ) : filteredTasks.length === 0 && tasks.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: "14px" }}>
            <div style={{
              background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 4px 20px rgba(37,99,235,0.1)",
            }}>
              <ClipboardList size={40} color="#93C5FD" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1E293B", margin: 0 }}>No Tasks Yet</h3>
            <p style={{ color: "#64748B", fontSize: "13.5px", margin: 0, textAlign: "center", maxWidth: "340px" }}>
              {isSenior && !isJuniorView
                ? "Get started by assigning your first task to a junior advocate."
                : "You have no assigned tasks yet. Check back later."}
            </p>
            {!isJuniorView && isSenior && perms.add && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: "10px 22px",
                  borderRadius: "9px",
                  border: "none",
                  background: "linear-gradient(135deg,#2563EB,#1d4ed8)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                }}
              >
                <Plus size={16} />
                Assign First Task
              </button>
            )}
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            onOpenTask={setSelectedTask}
            onStatusChange={handleStatusChange}
            currentUserId={user?.id}
            isSenior={isSenior}
            perms={perms}
          />
        )}
      </div>

      {/* ─── Modals ─── */}
      {showForm && (
        <TaskFormModal
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          onSaved={handleTaskSaved}
          editTask={editingTask}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          isSenior={isSenior}
          onEdit={handleEditTask}
          perms={perms}
          onDelete={handleDeleteTask}
        />
      )}

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}
