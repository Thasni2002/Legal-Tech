"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, AlertCircle, Loader2, Briefcase, User, Calendar, FileText } from "lucide-react";
import { API_BASE_URL } from "@/utils/api";

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

const inputStyle = {
  width: "100%",
  padding: "10px 13px",
  border: "1.5px solid #E2E8F0",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#0F172A",
  background: "#FAFBFC",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#64748B",
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export default function TaskFormModal({ onClose, onSaved, editTask = null }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [juniors, setJuniors] = useState([]);
  const [cases, setCases] = useState([]);
  const [workflowDocuments, setWorkflowDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: editTask?.title || "",
    description: editTask?.description || "",
    priority: editTask?.priority || "Medium",
    due_date: editTask?.due_date || "",
    junior_advocate_id: editTask?.junior_advocate_id || "",
    case_id: editTask?.case_id || "",
    case_title: editTask?.case_title || "",
    case_no: editTask?.case_no || "",
    workflow_document_id: editTask?.workflow_document_id || "",
  });

  useEffect(() => {
    fetchJuniors();
    if (editTask?.junior_advocate_id) {
      fetchCasesForJunior(editTask.junior_advocate_id);
      fetchWorkflowDocumentsForJunior(editTask.junior_advocate_id);
    } else {
      fetchCases();
    }
  }, []);

  const fetchJuniors = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/permissions/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const users = await res.json();
        setJuniors(users.filter((u) => u.role && u.role.toLowerCase().includes("junior")));
      }
    } catch (e) {
      console.error("Error fetching juniors:", e);
    }
  };

  const fetchCases = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (e) {
      console.error("Error fetching cases:", e);
    }
  };

  const fetchCasesForJunior = async (juniorId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/by-junior/${juniorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const firmCases = await res.json();
        
        // Fetch all case_management cases to map IDs
        const caseMgmtRes = await fetch(`${API_BASE_URL}/case-management/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (caseMgmtRes.ok) {
          const casesData = await caseMgmtRes.json();
          const matched = casesData.filter(c => 
            firmCases.some(f => f.case_number === c.case_no)
          );
          setCases(matched);
        }
      }
    } catch (e) {
      console.error("Error fetching junior cases:", e);
    }
  };

  const fetchWorkflowDocumentsForJunior = async (juniorId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/workflow/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter(d => String(d.junior_id) === String(juniorId));
        setWorkflowDocuments(filtered);
      }
    } catch (e) {
      console.error("Error fetching workflow docs:", e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "case_id") {
      if (!value) {
        setForm((f) => ({ ...f, case_id: "", case_title: "", case_no: "" }));
      } else {
        const found = cases.find((c) => String(c.id) === String(value));
        setForm((f) => ({
          ...f,
          case_id: value,
          case_title: found ? found.case_title : "",
          case_no: found ? found.case_no : "",
        }));
      }
    } else if (name === "junior_advocate_id") {
      setForm((f) => ({ 
        ...f, 
        junior_advocate_id: value, 
        case_id: "", 
        case_title: "", 
        case_no: "", 
        workflow_document_id: "" 
      }));
      if (value) {
        fetchCasesForJunior(value);
        fetchWorkflowDocumentsForJunior(value);
      } else {
        fetchCases();
        setWorkflowDocuments([]);
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Task title is required."); return; }
    if (!form.junior_advocate_id) { setError("Please select a Junior Advocate."); return; }

    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        priority: form.priority,
        due_date: form.due_date || null,
        junior_advocate_id: parseInt(form.junior_advocate_id, 10),
        case_id: form.case_id ? parseInt(form.case_id, 10) : null,
        case_title: form.case_title || null,
        case_no: form.case_no || null,
        workflow_document_id: form.workflow_document_id ? parseInt(form.workflow_document_id, 10) : null,
      };

      const url = editTask
        ? `${API_BASE_URL}/advocate/tasks/${editTask.id}`
        : `${API_BASE_URL}/advocate/tasks/`;
      const method = editTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      if (!res.ok) {
        let detail = `Server error (${res.status})`;
        try {
          const data = JSON.parse(responseText);
          detail = data.detail || detail;
        } catch {}
        setError(detail);
        return;
      }

      const saved = JSON.parse(responseText);
      onSaved(saved, !!editTask);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(6px)",
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
          boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
          width: "100%",
          maxWidth: "540px",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#1E3A8A,#2563EB)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, margin: 0 }}>
              {editTask ? "Edit Task" : "Assign New Task"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: "2px 0 0" }}>
              {editTask ? "Update task details below" : "Create and assign a task to a Junior Advocate"}
            </p>
          </div>
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
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {error && (
            <div style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#DC2626",
              fontSize: "13px",
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label style={labelStyle}>Task Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Research case precedents"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Add detailed instructions for the junior advocate..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            />
          </div>

          {/* Priority + Due Date row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>
                <AlertCircle size={10} style={{ marginRight: "4px", display: "inline" }} />
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                <Calendar size={10} style={{ marginRight: "4px", display: "inline" }} />
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>
          </div>

          {/* Junior Advocate */}
          <div>
            <label style={labelStyle}>
              <User size={10} style={{ marginRight: "4px", display: "inline" }} />
              Assign To (Junior Advocate) *
            </label>
            <select
              name="junior_advocate_id"
              value={form.junior_advocate_id}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            >
              <option value="">— Select Junior Advocate —</option>
              {juniors.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.username || `${j.first_name || ""} ${j.last_name || ""}`.trim() || `User #${j.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Case linkage (optional) */}
          <div>
            <label style={labelStyle}>
              <Briefcase size={10} style={{ marginRight: "4px", display: "inline" }} />
              Link to Case (Optional)
            </label>
            <select
              name="case_id"
              value={form.case_id}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            >
              <option value="">— Standalone Task (No Case Link) —</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_title} ({c.case_no})
                </option>
              ))}
            </select>
          </div>

          {/* Document workflow linkage (optional) */}
          {form.junior_advocate_id && (
            <div>
              <label style={labelStyle}>
                <FileText size={10} style={{ marginRight: "4px", display: "inline" }} />
                Link Workflow Document (Optional)
              </label>
              <select
                name="workflow_document_id"
                value={form.workflow_document_id}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              >
                <option value="">— No Document Link —</option>
                {workflowDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.status})
                  </option>
                ))}
              </select>
            </div>
          )}


          {/* Footer buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: "9px",
                border: "1.5px solid #E2E8F0",
                background: "#fff",
                color: "#64748B",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 24px",
                borderRadius: "9px",
                border: "none",
                background: loading ? "#94A3B8" : "linear-gradient(135deg,#2563EB,#1d4ed8)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                boxShadow: loading ? "none" : "0 4px 12px rgba(37,99,235,0.3)",
                transition: "all 0.2s",
              }}
            >
              {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
              {loading ? "Saving..." : (editTask ? "Update Task" : "Assign Task")}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
}
