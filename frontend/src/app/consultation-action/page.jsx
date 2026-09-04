"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/services/api";
import { CheckCircle2, Calendar, Clock, Video, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";

function ConsultationActionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const initialAction = searchParams.get("action") || "approve";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [statusUpdated, setStatusUpdated] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(initialAction === "reschedule");

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Invalid consultation ID.");
      setLoading(false);
      return;
    }

    const fetchAndProcess = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/consultations/${id}/public-details`);
        if (!res.ok) {
          throw new Error("Consultation record not found.");
        }
        const data = await res.json();
        setDetails(data);

        // Execute approval automatically if action is approve
        if (initialAction === "approve" && data.status !== "Approved") {
          const actionRes = await fetch(`${API_BASE_URL}/consultations/${id}/public-action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve" })
          });
          if (actionRes.ok) {
            const updated = await actionRes.json();
            setDetails(updated);
            setStatusUpdated(true);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load consultation details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcess();
  }, [id, initialAction]);

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      alert("Please select a new date and time.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/consultations/${id}/public-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          date: newDate,
          time: newTime,
          reason: reason || "Requested via email action"
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setDetails(updated);
        setStatusUpdated(true);
        setIsRescheduling(false);
      } else {
        alert("Failed to submit reschedule request.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Processing meeting status update...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Process Request</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <a
            href="http://localhost:3000/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
          >
            Go to Portal <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold uppercase tracking-widest mb-3">
          <ShieldCheck size={16} /> Legal-Tech Management System
        </div>
      </div>

      <div className="max-w-xl w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* VIEW 1: APPROVED STATE */}
        {!isRescheduling && (details?.status === "Approved" || initialAction === "approve") && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              Appointment Confirmed!
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
              The consultation session has been successfully approved. Confirmation email notifications have been sent to both the client and senior advocate.
            </p>

            {/* Details Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-left mb-6 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/80">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Client Name</span>
                <span className="text-[#0F172A] font-bold text-sm">{details?.client_name}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/80">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Mode / Type</span>
                <span className="text-blue-600 font-bold text-sm flex items-center gap-1.5">
                  <Video size={14} /> {details?.type || "Consultation"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/80">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Date & Time</span>
                <span className="text-emerald-700 font-bold text-sm flex items-center gap-1.5">
                  <Calendar size={14} /> {details?.date} at {details?.time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Status</span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase">
                  Approved
                </span>
              </div>
            </div>

            {/* Google Meet Link if present */}
            {details?.meeting_link && (
              <a
                href={details.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mb-4 py-3.5 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video size={18} /> Join Google Meet Video Call
              </a>
            )}

            <button
              onClick={() => setIsRescheduling(true)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors underline cursor-pointer mt-2"
            >
              Need to reschedule this appointment?
            </button>
          </div>
        )}

        {/* VIEW 2: RESCHEDULE FORM */}
        {isRescheduling && (
          <div>
            <div className="w-14 h-14 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mb-4">
              <RefreshCw size={28} />
            </div>

            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-1">
              Request Reschedule
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mb-6">
              Select your preferred new date and time for consultation with <strong>{details?.client_name}</strong>.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  New Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  New Time *
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Reason for Rescheduling (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Conflict with court schedule..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? "Updating..." : "Submit New Slot"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: RESCHEDULED CONFIRMATION STATE */}
        {!isRescheduling && details?.status === "Rescheduled" && initialAction !== "approve" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 border border-amber-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Clock size={36} />
            </div>

            <h1 className="text-2xl font-extrabold text-[#0F172A] mb-2">
              Reschedule Submitted
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mb-6">
              The appointment status has been updated to <strong>Rescheduled</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-left mb-6 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/80">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Client Name</span>
                <span className="text-[#0F172A] font-bold text-sm">{details?.client_name}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/80">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Updated Slot</span>
                <span className="text-amber-700 font-bold text-sm">{details?.date} at {details?.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Status</span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase">
                  Rescheduled
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-slate-400">
        &copy; 2026 Legal-Tech Management System. Authorized action portal.
      </p>
    </div>
  );
}

export default function ConsultationActionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center">
        <p className="text-sm font-semibold">Loading action portal...</p>
      </div>
    }>
      <ConsultationActionContent />
    </Suspense>
  );
}
