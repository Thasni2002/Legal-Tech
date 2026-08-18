"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "@/utils/api";
import { getLoggedInUser } from "@/utils/auth";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function ConfigureRazorpayModal({ profile = {}, onClose, onSuccess }) {
  const [keyId, setKeyId] = useState(profile.razorpayKeyId || profile.razorpay_key_id || "");
  const [keySecret, setKeySecret] = useState(profile.razorpayKeySecret || profile.razorpay_key_secret || "");
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateFields = (idVal, secretVal) => {
    const errs = {};
    if (!idVal || !idVal.trim()) {
      errs.keyId = "Razorpay Key ID is required.";
    } else if (!idVal.trim().startsWith("rzp_live_") && !idVal.trim().startsWith("rzp_test_")) {
      errs.keyId = "Key ID must start with 'rzp_live_' or 'rzp_test_'.";
    }

    if (!secretVal || !secretVal.trim()) {
      errs.keySecret = "Razorpay Key Secret is required.";
    }
    return errs;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setTouched({ keyId: true, keySecret: true });

    const errs = validateFields(keyId, keySecret);
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      setErrorMsg("Please enter both valid Razorpay Key ID and Key Secret to proceed.");
      return;
    }

    setIsSaving(true);

    try {
      const user = getLoggedInUser();
      const userKey = (user?.email || user?.username || "").toLowerCase().trim();

      const updatedPayload = {
        ...profile,
        razorpayKeyId: keyId.trim(),
        razorpayKeySecret: keySecret.trim(),
      };

      let savedData = null;
      if (profile.id) {
        const res = await fetch(`${API_BASE_URL}/lawfirm-management/${profile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPayload),
        });
        if (res.ok) {
          savedData = await res.json();
        } else {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.detail || "Failed to update profile on server.");
        }
      }

      const finalProfile = savedData || updatedPayload;

      // Update localStorage caches
      if (userKey) {
        localStorage.setItem(`advocate_profile_${userKey}`, JSON.stringify(finalProfile));
      }
      localStorage.setItem("advocate_profile", JSON.stringify(finalProfile));

      if (onSuccess) {
        onSuccess(finalProfile);
      }
      onClose();
    } catch (err) {
      console.error("Save Razorpay keys error:", err);
      setErrorMsg(err.message || "Failed to save Razorpay credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">Configure Razorpay Gateway</h3>
            <p className="text-blue-100 text-xs mt-0.5 font-medium">Payment gateway settings</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} noValidate className="p-6 md:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Razorpay Key ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="rzp_live_xxxxxxxxxxxxxx"
                value={keyId}
                onChange={(e) => {
                  const val = e.target.value;
                  setKeyId(val);
                  if (touched.keyId) {
                    setFieldErrors(prev => ({ ...prev, ...validateFields(val, keySecret) }));
                  }
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, keyId: true }));
                  setFieldErrors(prev => ({ ...prev, ...validateFields(keyId, keySecret) }));
                }}
                className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-mono transition-all ${
                  touched.keyId && fieldErrors.keyId
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/40"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                }`}
              />
              {touched.keyId && fieldErrors.keyId ? (
                <p className="text-xs text-rose-500 mt-1.5 font-semibold">{fieldErrors.keyId}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Copy from your <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">Razorpay Dashboard</a> &gt; Settings &gt; API Keys
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Razorpay Key Secret <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  placeholder="Enter your Razorpay Key Secret"
                  value={keySecret}
                  onChange={(e) => {
                    const val = e.target.value;
                    setKeySecret(val);
                    if (touched.keySecret) {
                      setFieldErrors(prev => ({ ...prev, ...validateFields(keyId, val) }));
                    }
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, keySecret: true }));
                    setFieldErrors(prev => ({ ...prev, ...validateFields(keyId, keySecret) }));
                  }}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border outline-none text-sm font-mono transition-all ${
                    touched.keySecret && fieldErrors.keySecret
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/40"
                      : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showSecret ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {touched.keySecret && fieldErrors.keySecret ? (
                <p className="text-xs text-rose-500 mt-1.5 font-semibold">{fieldErrors.keySecret}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Keep your secret key safe and confidential.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );

  return createPortal(content, document.body);
}
