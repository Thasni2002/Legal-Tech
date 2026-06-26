"use client";

import { API_BASE_URL } from "@/utils/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

function validate(formData) {
  const errors = {};
  if (!formData.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!formData.password) {
    errors.password = "Password is required.";
  } else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    if (touched[e.target.name]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validate(formData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { email: true, password: true };
    setTouched(allTouched);
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        router.push("/");
      } else {
        setErrors({ api: data.detail || "Invalid credentials." });
      }
    } catch {
      setErrors({ api: "Unable to connect. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 bg-white ${
      errors[field] && touched[field]
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #030712 0%, #0b1528 50%, #0e1e38 100%)",
        }}
      >
        {/* Tech grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Glow orbs */}
        <div
          className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full opacity-25 blur-[80px]"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-15 blur-[80px]"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
        />

        {/* Header/Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Scale size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Legal-Tech
          </span>
        </div>

        {/* Floating UI Elements Showcase */}
        <div className="relative my-auto py-12 z-10 flex flex-col items-center justify-center">
          
          {/* Main Visual container with 3D perspective */}
          <div className="relative w-full max-w-[380px] aspect-[4/3] rounded-2xl border border-white/10 bg-slate-900/30 p-6 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden transform hover:scale-[1.02] transition-all duration-500">
            
            {/* Inner glow header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-slate-400 font-medium">
                workspace_v2.0.26
              </div>
            </div>

            {/* Mock Dashboard chart / stats */}
            <div className="space-y-4">
              <div className="h-4 w-1/3 bg-white/10 rounded-md animate-pulse" />
              
              {/* Sleek Line Graph Visualization */}
              <div className="h-24 flex items-end gap-1.5 px-1 pt-4 border-b border-white/5">
                {[35, 55, 40, 75, 50, 85, 70, 90].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div 
                      className="w-full rounded-t bg-gradient-to-t from-blue-600/60 to-indigo-400 transition-all duration-1000" 
                      style={{ height: `${val}%` }}
                    />
                    <span className="text-[7px] text-slate-500">M{idx+1}</span>
                  </div>
                ))}
              </div>

              {/* Status footer bar */}
              <div className="flex justify-between items-center text-[10px] pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-400 font-medium">System Online</span>
                </div>
                <span className="text-indigo-300 font-bold">94.8% Success Rate</span>
              </div>
            </div>

            {/* Overlay Card A: Floating Case Card */}
            <div className="absolute top-8 -right-4 w-40 rounded-xl border border-white/10 bg-slate-950/80 p-3 backdrop-blur-md shadow-xl transform rotate-3 hover:rotate-0 hover:-translate-x-2 transition-all duration-300">
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Active Case</span>
                <span className="px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] font-bold">HEARING</span>
              </div>
              <p className="text-[11px] text-white font-semibold truncate">Sharma vs. State</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Supreme Court • Room 4</p>
              <div className="mt-2.5 flex justify-between items-center border-t border-white/5 pt-1.5">
                <span className="text-[8px] text-emerald-400 font-medium">Tomorrow, 10:30 AM</span>
              </div>
            </div>

            {/* Overlay Card B: AI Assistant Prompt */}
            <div className="absolute -bottom-4 -left-6 w-48 rounded-xl border border-white/10 bg-slate-950/90 p-3 backdrop-blur-md shadow-xl transform -rotate-2 hover:rotate-0 hover:translate-x-2 transition-all duration-300">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">AI</span>
                </div>
                <span className="text-[9px] font-semibold text-white">AI Case Analyser</span>
              </div>
              <p className="text-[9px] text-slate-300 leading-normal">
                "Drafting petition based on latest 2026 amendments. Precedents successfully analyzed."
              </p>
            </div>

          </div>

          {/* Slogan */}
          <div className="text-center mt-10 space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              India&apos;s Smartest Legal Workspace
            </h2>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              Advocacy, automation, and practice management unified in a singular secure environment built for 2026.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-slate-500 text-[10px] mt-auto">
          <span>© 2026 Legal-Tech Inc.</span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            ISO 27001 Certified
          </span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Scale size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">Legal-Tech</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            {/* API Error */}
            {errors.api && (
              <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} className="shrink-0" />
                {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass("email")}
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass("password")} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{
                  background: loading
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #1a56db, #1E3A5F)",
                  boxShadow: "0 4px 14px rgba(26, 86, 219, 0.35)",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>      
          </div>
        </div>
      </div>
    </div>
  );
}