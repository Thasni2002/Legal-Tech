"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scale, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2,
} from "lucide-react";

function validate(formData) {
  const errors = {};

  if (!formData.username) {
    errors.username = "Username is required.";
  } else if (formData.username.length < 3) {
    errors.username = "Username must be at least 3 characters.";
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    errors.username = "Only letters, numbers, and underscores allowed.";
  }

  if (!formData.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!formData.password) {
    errors.password = "Password is required.";
  } else if (formData.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(formData.password)) {
    errors.password = "Must contain at least one uppercase letter.";
  } else if (!/[0-9]/.test(formData.password)) {
    errors.password = "Must contain at least one number.";
  }

  return errors;
}

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= strength ? colors[strength] : "#e2e8f0" }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className="text-xs" style={{ color: colors[strength] }}>
          {labels[strength]} password
        </p>
      )}
    </div>
  );
};

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "", email: "", password: "",
  });
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
    const allTouched = { username: true, email: true, password: true };
    setTouched(allTouched);
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/login");
      } else {
        setErrors({ api: data.detail || "Registration failed. Please try again." });
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
        : touched[field] && !errors[field]
        ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #090514 0%, #110c26 50%, #1e133a 100%)",
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
          className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-30 blur-[80px]"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-100px] right-[-100px] w-96 h-96 rounded-full opacity-15 blur-[80px]"
          style={{ background: "radial-gradient(circle, #ec4899, transparent 70%)" }}
        />

        {/* Header/Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Scale size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Legal-Tech
          </span>
        </div>

        {/* Floating UI Elements Showcase */}
        <div className="relative my-auto py-12 z-10 flex flex-col items-center justify-center">
          
          {/* Main Visual container with 3D perspective */}
          <div className="relative w-full max-w-[380px] aspect-[4/3] rounded-2xl border border-white/10 bg-slate-950/30 p-6 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden transform hover:scale-[1.02] transition-all duration-500">
            
            {/* Inner glow header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-indigo-400 font-bold">C</span>
                <span className="text-[10px] text-slate-300 font-semibold">Secure Cloud Workspace</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-emerald-400 font-medium">Encrypted</span>
              </div>
            </div>

            {/* Setup Progress */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-medium">
                  <span>Workspace Setup Status</span>
                  <span className="text-indigo-400">80% Done</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full" style={{ width: "80%" }} />
                </div>
              </div>

              {/* Task Items List (Visual) */}
              <div className="space-y-2 pt-1.5">
                {[
                  { title: "Configure advocacy profile", done: true },
                  { title: "Link secure client vault", done: true },
                  { title: "Invite associate advocates", done: false }
                ].map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${task.done ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400' : 'border-slate-600 text-transparent'}`}>
                        {task.done && <span className="text-[8px] font-bold">✓</span>}
                      </div>
                      <span className={`text-[10px] ${task.done ? 'text-slate-400 line-through' : 'text-white font-medium'}`}>{task.title}</span>
                    </div>
                    {!task.done && <span className="text-[8px] text-pink-400 font-semibold animate-pulse">ACTION REQ</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Overlay Card A: Floating Security Badge */}
            <div className="absolute top-10 -right-4 w-36 rounded-xl border border-white/10 bg-slate-900/90 p-3 backdrop-blur-md shadow-xl transform rotate-3 hover:rotate-0 hover:-translate-x-2 transition-all duration-300">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">🔒</span>
                <span className="text-[10px] font-bold text-white">Security Shield</span>
              </div>
              <p className="text-[8.5px] text-slate-400 leading-normal">
                AES-256 database protection active.
              </p>
            </div>

            {/* Overlay Card B: Floating Collaborators */}
            <div className="absolute -bottom-4 -left-6 w-44 rounded-xl border border-white/10 bg-slate-900/90 p-3 backdrop-blur-md shadow-xl transform -rotate-3 hover:rotate-0 hover:translate-x-2 transition-all duration-300">
              <span className="text-[8.5px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">Team Directory</span>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5 overflow-hidden">
                  <div className="inline-block h-5.5 w-5.5 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 border-2 border-slate-900 flex items-center justify-center text-[7px] text-white font-bold">AK</div>
                  <div className="inline-block h-5.5 w-5.5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-slate-900 flex items-center justify-center text-[7px] text-white font-bold">SM</div>
                </div>
                <button className="text-[8px] text-indigo-400 font-bold hover:underline">+ Invite Advocate</button>
              </div>
            </div>

          </div>

          {/* Slogan */}
          <div className="text-center mt-10 space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Scale Your Legal Practice
            </h2>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              Digitise client onboarding, case management, secure filing, and billing in under 2 minutes.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-slate-500 text-[10px] mt-auto">
          <span>© 2026 Legal-Tech Inc.</span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-indigo-500" />
            Made for Indian Advocates
          </span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Scale size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">Legal-Tech</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
              <p className="text-slate-500 text-sm mt-1">Fill in the details below to get started</p>
            </div>

            {/* API Error */}
            {errors.api && (
              <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} className="shrink-0" />
                {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. rahul_sharma"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass("username")}
                  />
                  {touched.username && !errors.username && (
                    <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.username && touched.username && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
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
                  {touched.email && !errors.email && (
                    <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
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
                <PasswordStrength password={formData.password} />
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
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}