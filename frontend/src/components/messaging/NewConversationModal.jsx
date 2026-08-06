"use client";

import { useState, useEffect } from "react";
import { X, MessageSquarePlus, LoaderCircle } from "lucide-react";
import { API_BASE_URL } from "@/utils/api";
import { getAuthHeaders } from "@/utils/auth";

export default function NewConversationModal({ onCreateSuccess, onClose }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [clientName, setClientName] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [initialMessage, setInitialMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseChange = (caseId) => {
    setSelectedCaseId(caseId);
    if (caseId) {
      const selected = cases.find((c) => String(c.id) === String(caseId));
      if (selected && selected.client_name) {
        setClientName(selected.client_name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/conversations`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          case_id: selectedCaseId ? Number(selectedCaseId) : null,
          client_name: clientName,
          priority,
          initial_message: initialMessage
        })
      });

      if (res.ok) {
        const conv = await res.json();
        onCreateSuccess(conv.id);
        onClose();
      } else {
        alert("Failed to start conversation.");
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="text-blue-600" size={20} />
            <h3 className="font-bold text-slate-900 text-lg">New Client Thread</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <LoaderCircle size={16} className="animate-spin text-blue-600" />
            Loading cases...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Link to Case (Optional)
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => handleCaseChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-blue-500 outline-none"
              >
                <option value="">-- Direct Client Thread (No Case) --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    Case #{c.case_no}: {c.case_title} ({c.client_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Client Name / Reference *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-blue-500 outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                First Message (Optional)
              </label>
              <textarea
                rows={2}
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Hello, welcome to Legal-Tech communications..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-sm focus:border-blue-500 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !clientName}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase transition-all shadow-md"
              >
                {submitting ? "Starting..." : "Start Conversation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
