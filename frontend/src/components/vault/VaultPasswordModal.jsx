"use client";

/**
 * VaultPasswordModal
 * ==================
 * Shown when a Senior Advocate opens a confidential case that is currently locked.
 * Features:
 *  - Password entry with show/hide toggle
 *  - Failed attempt counter (shows warning after 3 failures)
 *  - "Forgot Password?" link → switches to VaultResetModal
 *  - Glassmorphic dark design matching the platform aesthetic
 */

import { useState } from "react";
import { API_BASE_URL } from "@/services/api";
import { setVaultSession } from "@/utils/vaultSession";
import { Lock, Eye, EyeOff, ShieldAlert, Loader2, KeyRound, RefreshCw } from "lucide-react";

export default function VaultPasswordModal({ caseId, caseTitle, onSuccess, onForgotPassword }) {
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failCount, setFailCount] = useState(0);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("token") || sessionStorage.getItem("token")
        : null;

      const res = await fetch(`${API_BASE_URL}/vault/cases/${caseId}/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        setVaultSession(caseId, data.vault_token);
        onSuccess(data.vault_token);
      } else {
        const errData = await res.json().catch(() => ({}));
        setFailCount((c) => c + 1);
        setError(errData.detail || "Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Full-screen backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(2, 6, 23, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #0f172a, #1e1b4b)",
          border: "1px solid rgba(139,92,246,0.25)",
        }}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(79,70,229,0.15), rgba(139,92,246,0.1))",
            borderBottom: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          {/* Animated lock icon */}
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              boxShadow: "0 0 32px rgba(139,92,246,0.4)",
              animation: "vaultPulse 2s ease-in-out infinite",
            }}
          >
            <Lock size={28} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-xl mb-1">Confidential Case Vault</h2>
          <p className="text-purple-300 text-sm font-medium tracking-widest px-4" title="Confidential Case Locked">
            ••••••••••••••••
          </p>
          <p className="text-slate-400 text-xs mt-2">
            Enter your case password to unlock this vault
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="px-8 py-6 space-y-5">
          {/* Error message */}
          {error && (
            <div
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <ShieldAlert size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Too many failures warning */}
          {failCount >= 3 && (
            <div
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <ShieldAlert size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-300 text-xs">
                Multiple failed attempts detected. Use{" "}
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="underline font-semibold text-amber-200 hover:text-white cursor-pointer"
                >
                  Forgot Password
                </button>{" "}
                to reset your case vault password.
              </p>
            </div>
          )}

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Case Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <KeyRound size={16} className="text-purple-400" />
              </div>
              <input
                id="vault-password-input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter case password…"
                autoFocus
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(139,92,246,0.7)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.15), inset 0 1px 3px rgba(0,0,0,0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(139,92,246,0.3)";
                  e.target.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.2)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-300 transition-colors cursor-pointer"
                title={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Unlock button */}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? "rgba(79,70,229,0.5)"
                : "linear-gradient(135deg, #4f46e5, #7c3aed)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(139,92,246,0.35)",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <Lock size={16} />
                Unlock Vault
              </>
            )}
          </button>

          {/* Forgot password */}
          <div className="text-center">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-slate-500 hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw size={12} />
              Forgot case password?
            </button>
          </div>
        </form>

        {/* Security footer */}
        <div
          className="px-8 py-4 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-slate-600 text-[11px]">
            🔐 This vault is protected with bcrypt encryption. All access attempts are logged.
          </p>
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes vaultPulse {
          0%, 100% { box-shadow: 0 0 32px rgba(139,92,246,0.4); }
          50% { box-shadow: 0 0 48px rgba(139,92,246,0.7); }
        }
      `}</style>
    </div>
  );
}
