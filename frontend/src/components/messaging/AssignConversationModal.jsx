"use client";

import { useState, useEffect } from "react";
import { X, UserCheck, LoaderCircle } from "lucide-react";
import { API_BASE_URL } from "@/services/api";
import { getAuthHeaders } from "@/utils/auth";

export default function AssignConversationModal({ conversation, onAssign, onClose }) {
  const [advocates, setAdvocates] = useState([]);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdvocates();
  }, []);

  const fetchAdvocates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAdvocates(data);
      }
    } catch (err) {
      console.error("Error fetching advocates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdvocateId) return;

    const adv = advocates.find((a) => String(a.id) === String(selectedAdvocateId));
    const name = adv ? adv.advocate_name || adv.advocateName : "Junior Advocate";

    setSubmitting(true);
    await onAssign(conversation.id, selectedAdvocateId, name);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="text-blue-600" size={20} />
            <h3 className="font-bold text-slate-900 text-lg">Assign Junior Advocate</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-4">
          Assign or forward conversation for <strong>{conversation.client_name || "Client"}</strong> to a Junior Advocate.
        </p>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <LoaderCircle size={16} className="animate-spin text-blue-600" />
            Loading advocates...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Select Junior Advocate
              </label>
              <select
                value={selectedAdvocateId}
                onChange={(e) => setSelectedAdvocateId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-blue-500 outline-none"
              >
                <option value="">-- Choose Advocate --</option>
                {advocates.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.advocate_name || adv.advocateName} ({adv.role || "Advocate"})
                  </option>
                ))}
              </select>
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
                disabled={submitting || !selectedAdvocateId}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase transition-all shadow-md"
              >
                {submitting ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
