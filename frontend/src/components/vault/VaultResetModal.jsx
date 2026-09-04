"use client";

/**
 * VaultResetModal
 * ================
 * 2-step OTP flow to reset a confidential case password.
 * Step 1 → Send OTP to advocate's email
 * Step 2 → Enter OTP + new password
 *
 * Used when the Senior Advocate forgets their case vault password.
 */

import { useState } from "react";
import { API_BASE_URL } from "@/services/api";
import {
  Mail, KeyRound, Lock, Eye, EyeOff,
  ArrowLeft, Loader2, CheckCircle, ShieldCheck
} from "lucide-react";

export default function VaultResetModal({ caseId, onBack, onResetSuccess }) {
  const [step, setStep]           = useState(1); // 1=send-otp, 2=reset
  const [otp, setOtp]             = useState("");
  const [newPassword, setNewPwd]  = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [emailSent, setEmailSent] = useState("");

  const authToken = typeof window !== "undefined"
    ? localStorage.getItem("token") || sessionStorage.getItem("token")
    : null;

  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  // ─── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/vault/cases/${caseId}/forgot-password/send-otp`,
        { method: "POST", headers }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmailSent(data.email || "your registered email");
        setStep(2);
      } else {
        setError(data.detail || "Failed to send OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP + Set New Password ─────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/vault/cases/${caseId}/forgot-password/reset`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ otp, new_password: newPassword }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => onResetSuccess && onResetSuccess(), 2000);
      } else {
        setError(data.detail || "Reset failed. Please check your OTP and try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const panelStyle = {
    background: "linear-gradient(145deg, #0f172a, #1e1b4b)",
    border: "1px solid rgba(139,92,246,0.25)",
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(12px)" }}>
        <div className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl text-center p-10" style={panelStyle}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 32px rgba(16,185,129,0.4)" }}>
            <CheckCircle size={28} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Password Reset!</h2>
          <p className="text-slate-400 text-sm">Your case vault password has been updated. You can now unlock this case with your new password.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl" style={panelStyle}>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center"
          style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.15),rgba(139,92,246,0.1))", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 24px rgba(139,92,246,0.4)" }}>
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-xl mb-1">Reset Case Password</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? "bg-purple-500 text-white"
                    : step > s
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}>{step > s ? "✓" : s}</div>
                {s < 2 && <div className={`w-8 h-0.5 ${step > s ? "bg-emerald-500" : "bg-slate-700"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl text-red-300 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <p className="text-slate-400 text-sm">
                We'll send a 6-digit OTP to your registered email address to verify your identity before resetting the case password.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(139,92,246,0.35)" }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Mail size={16} /> Send OTP to Email</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-slate-400 text-sm">
                OTP sent to <strong className="text-purple-300">{emailSent}</strong>. Expires in 4 minutes.
              </p>

              {/* OTP input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 rounded-xl text-center text-2xl tracking-[12px] font-bold text-white placeholder-slate-600 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.3)" }}
                />
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">New Case Password</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.3)" }}
                  />
                  <button type="button" onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-300 cursor-pointer">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.3)" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !otp || !newPassword || !confirmPwd}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(139,92,246,0.35)" }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting…</> : <><Lock size={16} /> Reset Case Password</>}
              </button>
            </form>
          )}
        </div>

        {/* Back button */}
        <div className="px-8 pb-6 text-center">
          <button
            type="button"
            onClick={step === 2 ? () => setStep(1) : onBack}
            className="text-xs text-slate-500 hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-1.5 mx-auto">
            <ArrowLeft size={12} />
            {step === 2 ? "Back" : "Back to unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}
