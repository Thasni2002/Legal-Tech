"use client";

import { API_BASE_URL } from "@/services/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Scale, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles,
  FileText, Calendar, ShieldCheck, ArrowRight, UserPlus, LogIn,
  Briefcase, Users, X, ChevronRight, User, UserCheck,
  ExternalLink, Cpu, CheckCircle2, Activity, Gavel, BookOpen,
  BarChart2, ClipboardList, FolderKanban, CreditCard
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   GLOBAL ANIMATION KEYFRAMES injected once
───────────────────────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes float-up {
  0%   { transform: translateY(0px) rotate(var(--r,0deg)); opacity: var(--op-start, 0); }
  10%  { opacity: var(--op-end, 0.82); }
  90%  { opacity: var(--op-end, 0.82); }
  100% { transform: translateY(-110vh) rotate(calc(var(--r,0deg) + 15deg)); opacity: 0; }
}
@keyframes sway {
  0%,100% { transform: rotate(-6deg); }
  50%     { transform: rotate(6deg); }
}
@keyframes sway-r {
  0%,100% { transform: rotate(6deg); }
  50%     { transform: rotate(-6deg); }
}
@keyframes pulse-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.4); opacity: 0; }
}
@keyframes gavel-strike {
  0%,100% { transform: rotate(-35deg) translateY(0); }
  45%     { transform: rotate(15deg) translateY(8px); }
  55%     { transform: rotate(15deg) translateY(8px); }
  70%     { transform: rotate(-30deg) translateY(-2px); }
}
@keyframes scale-bob {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-6px); }
}
@keyframes slide-in-left {
  from { opacity:0; transform: translateX(-40px); }
  to   { opacity:1; transform: translateX(0); }
}
@keyframes slide-in-right {
  from { opacity:0; transform: translateX(40px); }
  to   { opacity:1; transform: translateX(0); }
}
@keyframes slide-in-up {
  from { opacity:0; transform: translateY(30px); }
  to   { opacity:1; transform: translateX(0); }
}
`;

/* ─────────────────────────────────────────────────────────────
   IVORY PALETTE
───────────────────────────────────────────────────────────── */
const C = {
  ivory:    "#faf7f2",   /* page background — warm cream        */
  surface:  "#f0f4fb",   /* input & secondary surface — cool    */
  white:    "#ffffff",   /* cards                               */
  border:   "#d8e2f0",   /* cool blue-tinted border             */
  ink:      "#0d1b2e",   /* deep navy heading text              */
  muted:    "#4a6080",   /* blue-grey secondary text            */
  faint:    "#8fa8c8",   /* placeholder / very muted blue       */
  blue:     "#1d4ed8",   /* primary royal blue accent           */
  blueL:    "#eff6ff",   /* blue tint background                */
  blueD:    "#1e3a8a",   /* deep navy for gradients             */
  gold:     "#a07828",   /* legal gold — badge eyebrows         */
  goldL:    "#fdf8ee",   /* gold tint                           */
};

/* ─────────────────────────────────────────────────────────────
   FONTS — Times New Roman throughout
───────────────────────────────────────────────────────────── */
const fontHeading = { fontFamily: "'Times New Roman', Times, Georgia, serif" };
const fontBody    = { fontFamily: "'Times New Roman', Times, Georgia, serif" };

/* ── Validation ─────────────────────────────────────────── */
function validateLogin(fd) {
  const e = {};
  if (!fd.email) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email))
    e.email = "Enter a valid email.";
  if (!fd.password) e.password = "Password is required.";
  else if (fd.password.length < 6)
    e.password = "Min. 6 characters.";
  return e;
}

function validateRegister(fd) {
  const e = {};
  if (!fd.first_name) e.first_name = "First name is required.";
  if (!fd.email) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email))
    e.email = "Enter a valid email.";
  if (!fd.password) e.password = "Password is required.";
  else if (fd.password.length < 6)
    e.password = "Min. 6 characters.";
  if (fd.password !== fd.confirmPassword)
    e.confirmPassword = "Passwords do not match.";
  return e;
}

/* ── Password strength evaluator ──────────────────────── */
function getPasswordStrength(pass) {
  if (!pass) {
    return {
      hasMinLen: false,
      hasUpper: false,
      hasNumber: false,
      hasSpecial: false,
      score: 0,
      label: "",
      color: "#94a3b8",
    };
  }
  const hasMinLen = pass.length >= 8;
  const hasUpper  = /[A-Z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  const criteriaMet = [hasMinLen, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  let label = "Too Short";
  let color = "#ef4444"; // red

  if (pass.length >= 8) {
    if (criteriaMet <= 2) {
      label = "Weak";
      color = "#f97316"; // orange
    } else if (criteriaMet === 3) {
      label = "Medium";
      color = "#3b82f6"; // blue
    } else if (criteriaMet === 4) {
      label = "Strong Password";
      color = "#22c55e"; // green
    }
  }

  const score = pass.length < 8 ? (pass.length > 0 ? 1 : 0) : Math.max(1, criteriaMet);

  return {
    hasMinLen,
    hasUpper,
    hasNumber,
    hasSpecial,
    score,
    label,
    color,
  };
}

/* ── Top-level Modal wrapper (prevents focus loss on state change) ────── */
const Modal = ({ open, onClose, children, maxWidth = "max-w-2xl" }) =>
  open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`rounded-3xl ${maxWidth} w-full max-h-[92vh] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative shadow-2xl transition-all duration-300`}
        style={{ backgroundColor: C.white, border: `1px solid rgba(226, 232, 240, 0.8)` }}>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-slate-100 z-10"
          style={{ backgroundColor: C.surface, color: C.muted }}>
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  ) : null;

export default function Login() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"

  // Login form state
  const [formData, setFormData] = useState({ email: "", password: "" });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "Advocate",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors]       = useState({});
  const [touched, setTouched]     = useState({});
  const [showPass, setShowPass]   = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [modulesOpen, setModulesOpen]   = useState(false);
  const [heroVisible, setHeroVisible]   = useState(false);

  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = email, 2 = otp, 3 = new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [loginSuccessMsg, setLoginSuccessMsg] = useState("");

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById("lt-login-kf")) return;
    const style = document.createElement("style");
    style.id = "lt-login-kf";
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("lt-login-kf"); if (el) el.remove(); };
  }, []);

  // Hero entrance
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);

  // Canvas ref for interactive ambient particle background
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    let mouse = { x: width / 2, y: height / 2 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const particleCount = Math.min(Math.floor(width / 24), 50);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.2,
      color: Math.random() > 0.35 ? "rgba(29, 78, 216, " : "rgba(160, 120, 40, ",
      alpha: Math.random() * 0.3 + 0.15,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        const dxMouse = mouse.x - p1.x;
        const dyMouse = mouse.y - p1.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 150) {
          p1.x += dxMouse * 0.008;
          p1.y += dyMouse * 0.008;
        }

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p1.color}${p1.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = (1 - dist / 120) * 0.16;
            ctx.strokeStyle = `rgba(29, 78, 216, ${opacity})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleChange = (e) => {
    const d = { ...formData, [e.target.name]: e.target.value };
    setFormData(d);
    if (touched[e.target.name]) setErrors(validateLogin(d));
  };
  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validateLogin(formData));
  };

  const handleRegisterChange = (e) => {
    const d = { ...registerData, [e.target.name]: e.target.value };
    setRegisterData(d);
    if (touched[e.target.name]) setErrors(validateRegister(d));
  };
  const handleRegisterBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validateRegister(registerData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const ve = validateLogin(formData);
    setErrors(ve);
    if (Object.keys(ve).length) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (res.ok) { 
        localStorage.setItem("token", data.access_token); 
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const nextUrl = params ? params.get("next") : null;
        router.push(nextUrl ? decodeURIComponent(nextUrl) : "/"); 
      }
      else setErrors({ api: data.detail || "Invalid credentials." });
    } catch { setErrors({ api: "Connection error. Please retry." }); }
    finally { setLoading(false); }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setTouched({ first_name: true, email: true, password: true, confirmPassword: true });
    const ve = validateRegister(registerData);
    setErrors(ve);
    if (Object.keys(ve).length) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          first_name: registerData.first_name,
          last_name: registerData.last_name,
          role: registerData.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const nextUrl = params ? params.get("next") : null;
        router.push(nextUrl ? decodeURIComponent(nextUrl) : "/");
      } else {
        setErrors({ api: data.detail || "Failed to create account." });
      }
    } catch {
      setErrors({ api: "Connection error. Please retry." });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    if (forgotLoading) return;
    setForgotError("");
    setForgotSuccess("");
    if (!forgotEmail) { setForgotError("Email is required."); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail }) });
      const data = await res.json();
      if (res.ok) { setForgotStep(2); setForgotSuccess("OTP sent! Check your email inbox."); }
      else setForgotError(data.detail || "Failed to send OTP. Please check the email address.");
    } catch { setForgotError("Connection error. Please retry."); }
    finally { setForgotLoading(false); }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    if (forgotLoading) return;
    setForgotError("");
    setForgotSuccess("");
    if (!forgotOtp || forgotOtp.length < 6) { setForgotError("Please enter the 6-digit OTP."); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }) });
      const data = await res.json();
      if (res.ok) {
        setForgotStep(3);
        setForgotSuccess("OTP verified! Set your new password below.");
      } else {
        setForgotError(data.detail || "Incorrect OTP. Please try again.");
      }
    } catch { setForgotError("Connection error. Please retry."); }
    finally { setForgotLoading(false); }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    if (forgotLoading) return;
    setForgotError("");
    setForgotSuccess("");
    if (!newPassword || newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords do not match. Please check again.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoginSuccessMsg("Password reset successfully! Please log in with your new password.");
        setFormData((prev) => ({ ...prev, email: forgotEmail, password: "" }));
        setForgotPasswordOpen(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setForgotError(data.detail || "Failed to reset password. Please try again.");
      }
    } catch {
      setForgotError("Connection error. Please retry.");
    } finally {
      setForgotLoading(false);
    }
  };

  /* ── Authentic Project Modules ──────────────────────── */
  const projectShowcase = [
    {
      id: "case_mgmt",
      icon: <Briefcase className="w-4 h-4" />,
      tag: "Case Binder",
      title: "Case Management & Tracking",
      description: "Complete lifecycle tracking of legal matters, eCourts details, hearing schedules, bench allocations, and stage tracking.",
      previewTitle: "Active Case Binder",
      output: {
        summary: "Digital Matter Overview:",
        bullets: [
          "Matter Title: Apex Tech vs. Horizon Infra (Commercial Dispute).",
          "Assigned Counsel: Senior Advocate Rahul Sharma & Junior Associate.",
          "Hearing Schedule: Next hearing on 18 Aug 2026 at High Court Bench 3.",
          "Status: Active Case Stage — Evidence & Rejoinder Filing."
        ]
      }
    },
    {
      id: "lawfirm_mgmt",
      icon: <Users className="w-4 h-4" />,
      tag: "Organization",
      title: "Law Firm & Role Management",
      description: "Provision and organize Senior Advocates, Junior Advocates, Clerks, and Clients with dedicated roles and security clearances.",
      previewTitle: "Law Firm Roster & Clearances",
      output: {
        summary: "Firm Hierarchy & Access Controls:",
        bullets: [
          "Roles Configured: Senior Advocate (Admin), Junior Advocate, Clerk, Client.",
          "Granular Permissions: Module-level View / Add / Edit / Delete security rules.",
          "Team Operations: Temp password provisioning and active account activation."
        ]
      }
    },
    {
      id: "consultations",
      icon: <BookOpen className="w-4 h-4" />,
      tag: "Discussions",
      title: "Case Discussions & Consultations",
      description: "Schedule client meetings, document comprehensive consultation session notes, attach evidence, and delegate action items.",
      previewTitle: "Client Consultation Record",
      output: {
        summary: "Consultation Session Summary:",
        bullets: [
          "Client: Priya Nair · Mode: Video Conference / Law Office Session.",
          "Discussion Notes: Strategy formulated, contract clauses reviewed.",
          "Action Items: Brief drafting assigned to Junior Associate for court submission."
        ]
      }
    },
    {
      id: "finance_billing",
      icon: <BarChart2 className="w-4 h-4" />,
      tag: "Finance",
      title: "Billing & Invoicing",
      description: "Professional client invoice creation, retainer balance management, fee status tracking, and structured payment histories.",
      previewTitle: "Client Invoicing & Payment",
      output: {
        summary: "Financial & Ledger Overview:",
        bullets: [
          "Invoice #INV-2026-102: ₹45,000 for Advisory Retainer & Court Filing.",
          "Payment Status: Paid via Razorpay / Client Portal.",
          "Financial Ledger: Retainer balance and client history logged automatically."
        ]
      }
    },
    {
      id: "clerk_workflows",
      icon: <ClipboardList className="w-4 h-4" />,
      tag: "Operations",
      title: "Clerk & Court Operations",
      description: "Manage daily court visit logs, document intake records, physical file formatting, and junior clerk task allocations.",
      previewTitle: "Court Visit & Task Register",
      output: {
        summary: "Court Clerk Operations:",
        bullets: [
          "Court Visits: Physical filing at High Court Registry Bench 3.",
          "File Formatting: Document indexation and physical stamping completed.",
          "Daily Tasks: Cause list verification and certified copy collection logged."
        ]
      }
    },
    {
      id: "permissions",
      icon: <ShieldCheck className="w-4 h-4" />,
      tag: "Security",
      title: "Granular Permission System",
      description: "Strict module-level role access ensuring confidential case files, billing numbers, and documents remain strictly compartmentalized.",
      previewTitle: "Security & Role Access Matrix",
      output: {
        summary: "Access Control Enforcement:",
        bullets: [
          "Advocates: Full firm administration, case lifecycle, and financial management.",
          "Juniors & Clerks: Assigned cases, assigned tasks, and court visit logging.",
          "Clients: Secure case tracking, consultation records, and invoice payments."
        ]
      }
    }
  ];

  const coreFeatures = [
    { icon: <Briefcase className="w-5 h-5" />, title: "Case Management",    desc: "Digital case binders — filing info, hearing schedules, and stage tracking." },
    { icon: <Users className="w-5 h-5" />,     title: "Law Firm Portal",    desc: "Role-based portals for Senior Advocates, Junior Advocates, Clerks, and Clients." },
    { icon: <BookOpen className="w-5 h-5" />,  title: "Case Discussions",   desc: "Schedule client consultations, log detailed session notes, and set action items." },
    { icon: <CreditCard className="w-5 h-5" />, title: "Finance & Invoicing", desc: "Create client invoices, track retainer balances, and record payment histories." },
    { icon: <ClipboardList className="w-5 h-5" />, title: "Clerk Workflows",  desc: "Track court visits, physical file formatting, document intake, and task records." },
    { icon: <ShieldCheck className="w-5 h-5" />, title: "Permission Controls", desc: "Granular view/add/edit/delete security clearances per user role." },
  ];

  /* ── Shared input focus handlers ─────────────────────── */
  const inputFocus = (e) => {
    e.target.style.borderColor = C.blue;
    e.target.style.boxShadow   = `0 0 0 3px ${C.blueL}`;
    e.target.style.backgroundColor = C.white;
  };
  const inputBlurStyle = (field) => (e) => {
    const hasError = errors[field] && touched[field];
    e.target.style.borderColor     = hasError ? C.blue : C.border;
    e.target.style.boxShadow       = hasError ? `0 0 0 3px ${C.blueL}` : "none";
    e.target.style.backgroundColor = C.surface;
  };
  const inputStyle = (field) => ({
    backgroundColor: C.surface,
    border:          `1.5px solid ${errors[field] && touched[field] ? C.blue : C.border}`,
    color:           C.ink,
    boxShadow:       errors[field] && touched[field] ? `0 0 0 3px ${C.blueL}` : "none",
    transition:      "all 0.2s ease",
    ...fontBody,
  });


  /* ── Floating legal document tiles data ───────────── */
  const floatingDocs = [
    { label: "Case Binder",      sub: "#LC-2026-089",      icon: <Briefcase size={13} />,   delay: "0s",   dur: "14s", x: "8%",  r: "-4deg",  opS: "0", opE: "0.72" },
    { label: "Law Firm Portal",  sub: "Advocate Roster",   icon: <Users size={13} />,       delay: "3s",   dur: "17s", x: "18%", r: "5deg",   opS: "0", opE: "0.65" },
    { label: "Fee Invoice",      sub: "#INV-2026-102",     icon: <CreditCard size={13} />,  delay: "6s",   dur: "13s", x: "76%", r: "-6deg",  opS: "0", opE: "0.68" },
    { label: "Consultation",     sub: "Meeting Notes",     icon: <BookOpen size={13} />,    delay: "1.5s", dur: "16s", x: "86%", r: "3deg",   opS: "0", opE: "0.70" },
    { label: "Clerk Tasks",      sub: "Court Visits",      icon: <ClipboardList size={13} />, delay: "9s", dur: "18s", x: "44%", r: "-2deg",  opS: "0", opE: "0.55" },
    { label: "Doc Storage",      sub: "Legal Repository",  icon: <FileText size={13} />,    delay: "4s",   dur: "15s", x: "60%", r: "7deg",   opS: "0", opE: "0.60" },
    { label: "Leave Requests",   sub: "Schedule Sync",     icon: <Calendar size={13} />,    delay: "11s",  dur: "12s", x: "30%", r: "-5deg",  opS: "0", opE: "0.58" },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: C.ivory, ...fontBody }}>

      {/* ════════════════════════════════════════════════
          ADVOCATE WATERMARK OVERLAY & PARTICLE CANVAS
      ════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Interactive Ambient Particle Network */}
        <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none w-full h-full" />

        {/* ── FLOATING LEGAL DOCUMENT TILES ──────────── */}
        {floatingDocs.map((doc, i) => (
          <div key={i} className="absolute bottom-[-80px] flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl pointer-events-none select-none"
            style={{
              left: doc.x,
              width: 130,
              backgroundColor: "rgba(255,255,255,0.82)",
              border: `1px solid ${C.border}`,
              backdropFilter: "blur(6px)",
              boxShadow: "0 4px 16px rgba(29,78,216,0.08)",
              animation: `float-up ${doc.dur} ${doc.delay} linear infinite`,
              "--r": doc.r,
              "--op-start": doc.opS,
              "--op-end": doc.opE,
            }}>
            <span className="flex items-center gap-1.5" style={{ color: C.blue, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>
              {doc.icon}{doc.label}
            </span>
            <span style={{ color: C.faint, fontSize: 9, fontWeight: 500 }}>{doc.sub}</span>
          </div>
        ))}

        {/* ── ANIMATED SCALES OF JUSTICE (large bg) ─── */}
        <svg viewBox="0 0 200 220" fill="none"
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "min(640px,88vw)", opacity: 0.045, color: C.ink,
            overflow: "visible",
          }}>
          {/* Beam */}
          <line x1="100" y1="12" x2="100" y2="195" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="38" x2="172" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          {/* Left pan chain */}
          <g style={{ transformOrigin: "28px 38px", animation: "sway 3.8s ease-in-out infinite" }}>
            <line x1="28" y1="38" x2="10" y2="88" stroke="currentColor" strokeWidth="1.5" />
            <line x1="28" y1="38" x2="46" y2="88" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 88 Q28 102 50 88" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
          {/* Right pan chain */}
          <g style={{ transformOrigin: "172px 38px", animation: "sway-r 3.8s ease-in-out infinite" }}>
            <line x1="172" y1="38" x2="154" y2="88" stroke="currentColor" strokeWidth="1.5" />
            <line x1="172" y1="38" x2="190" y2="88" stroke="currentColor" strokeWidth="1.5" />
            <path d="M150 88 Q172 102 194 88" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
          {/* Base */}
          <rect x="82" y="194" width="36" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
          <line x1="100" y1="201" x2="100" y2="210" stroke="currentColor" strokeWidth="2" />
          <rect x="76" y="210" width="48" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
        </svg>

        {/* ── PULSE GLOW RINGS (courthouse spotlight) ── */}
        <div className="absolute" style={{ top: "45%", left: "50%", transform: "translate(-50%,-50%)" }}>
          {[0, 0.6, 1.2].map((delay, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: 180 + i * 60, height: 180 + i * 60,
                border: `1.5px solid rgba(29,78,216,${0.12 - i * 0.03})`,
                top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                animation: `pulse-ring 4s ${delay}s ease-out infinite`,
              }} />
          ))}
        </div>

        {/* ── GAVEL ANIMATION (bottom right corner) ─── */}
        <div className="absolute bottom-10 right-8 pointer-events-none" style={{ opacity: 0.06 }}>
          <svg viewBox="0 0 80 80" width="120" height="120" fill="none">
            <g style={{ transformOrigin: "20px 20px", animation: "gavel-strike 2.2s ease-in-out infinite" }}>
              <rect x="8" y="4" width="28" height="16" rx="4" fill="#0d1b2e" />
              <line x1="32" y1="18" x2="68" y2="54" stroke="#0d1b2e" strokeWidth="8" strokeLinecap="round" />
            </g>
            <rect x="10" y="64" width="32" height="10" rx="3" fill="#0d1b2e" opacity="0.6" />
          </svg>
        </div>

        {/* Warm ivory gradient vignettes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-50"
          style={{ background: `radial-gradient(circle, ${C.goldL} 0%, transparent 70%)`, transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-40"
          style={{ background: `radial-gradient(circle, ${C.blueL} 0%, transparent 70%)`, transform: "translate(-30%,30%)" }} />
        
        {/* Fine column lines */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, ${C.ink} 0px, ${C.ink} 1px, transparent 1px, transparent 48px)` }} />
      </div>

      {/* ════════════════════════════════════════════════
          FIXED NAVBAR
      ════════════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50"
        style={{ backgroundColor: "rgba(250,247,242,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
              style={{ backgroundColor: C.blue, boxShadow: `0 4px 12px rgba(29,78,216,0.2)` }}>
              <Scale className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight" style={{ color: C.ink, ...fontBody }}>
                Legal-Tech
              </span>
            </div>
          </div>



        </div>
      </header>

      {/* ════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-16 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* ── LEFT: Hero Content ───────────────────── */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6 my-auto"
              style={{ animation: heroVisible ? "slide-in-left 0.7s cubic-bezier(.25,.8,.25,1) both" : "none" }}>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="tracking-tight leading-[1.1]"
                  style={{ ...fontHeading, fontSize: "clamp(42px, 5vw, 64px)", fontWeight: 600, color: C.ink }}>
                  Your Legal Practice,
                  <br />
                  <em style={{ color: C.blue, fontStyle: "italic" }}>Streamlined.</em>
                </h1>
                <p className="text-base sm:text-lg leading-relaxed max-w-lg"
                  style={{ color: C.muted, fontWeight: 400, ...fontBody }}>
                  Case management, consultations, law firm operations, and client invoicing — unified in one portal.
                </p>
              </div>

            </div>

            {/* ── RIGHT: Sign-In / Sign-Up Auth Card ───── */}
            <div id="signin" className="lg:col-span-5 scroll-mt-24 relative group p-0.5 rounded-2xl"
              style={{ animation: heroVisible ? "slide-in-right 0.7s 0.15s cubic-bezier(.25,.8,.25,1) both" : "none" }}>

              <div className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 group-hover:shadow-blue-500/10"
                style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>

                {/* Top accent line */}
                <div className="h-[3px]"
                  style={{ background: `linear-gradient(90deg, ${C.blue} 0%, #2563eb 50%, ${C.gold} 100%)` }} />

                <div className="p-5 sm:p-6">

                  {/* Brand Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: C.blueL, border: `1.5px solid #bfdbfe` }}>
                        <Scale className="w-4.5 h-4.5" style={{ color: C.blue }} />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.blue, ...fontBody }}>Legal-Tech Portal</p>
                        <p className="text-[10px] font-normal -mt-0.5" style={{ color: C.faint, ...fontBody }}>Secure Advocate Workspace</p>
                      </div>
                    </div>
                  </div>

                  {/* ── MODE TAB SWITCHER ─────────────────────────── */}
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-4"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("signin"); setErrors({}); }}
                      className="py-2 px-3 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: authMode === "signin" ? C.white : "transparent",
                        color: authMode === "signin" ? C.ink : C.muted,
                        boxShadow: authMode === "signin" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                        ...fontBody,
                      }}
                    >
                      <LogIn className="w-3.5 h-3.5" style={{ color: authMode === "signin" ? C.blue : C.faint }} />
                      <span>Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("signup"); setErrors({}); }}
                      className="py-2 px-3 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: authMode === "signup" ? C.white : "transparent",
                        color: authMode === "signup" ? C.ink : C.muted,
                        boxShadow: authMode === "signup" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                        ...fontBody,
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5" style={{ color: authMode === "signup" ? C.blue : C.faint }} />
                      <span>Advocate Register</span>
                    </button>
                  </div>

                  {/* API Error */}
                  {errors.api && (
                    <div className="mb-5 flex items-start gap-2.5 text-[12px] px-4 py-3 rounded-xl"
                      style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe`, color: C.blue, ...fontBody }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errors.api}</span>
                    </div>
                  )}

                  {/* Success Message Banner */}
                  {loginSuccessMsg && (
                    <div className="mb-5 flex items-start gap-2.5 text-[12px] px-4 py-3 rounded-xl"
                      style={{ backgroundColor: "#f0faf5", border: `1px solid #bbf0d8`, color: "#2d7a54", ...fontBody }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{loginSuccessMsg}</span>
                    </div>
                  )}

                  {/* ════════════════════════════════════════════
                      MODE 1: SIGN IN FORM
                  ════════════════════════════════════════════ */}
                  {authMode === "signin" ? (
                    <div>
                      <div className="mb-4">
                        <h2 className="tracking-tight leading-tight"
                          style={{ ...fontHeading, fontSize: 28, fontWeight: 600, color: C.ink }}>
                          Welcome back,{" "}
                          <em style={{ color: C.blue, fontStyle: "italic" }}>Counsel.</em>
                        </h2>
                        <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: C.muted, ...fontBody }}>
                          Access your case workspace, consultations, and firm management portal.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} noValidate className="space-y-3">
                        {/* Email */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold uppercase tracking-widest"
                            style={{ color: C.muted, ...fontBody }}>Email address</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
                            <input type="email" name="email"
                              placeholder="advocate@lawfirm.com"
                              value={formData.email}
                              onChange={handleChange} onBlur={handleBlur}
                              onFocus={inputFocus}
                              onBlurCapture={inputBlurStyle("email")}
                              suppressHydrationWarning
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
                              style={{ ...inputStyle("email") }}
                            />
                          </div>
                          {errors.email && touched.email && (
                            <p className="text-[11px] flex items-center gap-1" style={{ color: C.blue, ...fontBody }}>
                              <AlertCircle className="w-3 h-3" /> {errors.email}
                            </p>
                          )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="block text-[11px] font-semibold uppercase tracking-widest"
                              style={{ color: C.muted, ...fontBody }}>Password</label>
                            <button type="button" onClick={() => { setForgotPasswordOpen(true); setForgotStep(1); setForgotError(""); setForgotSuccess(""); setForgotEmail(formData.email); }}
                              className="text-[11px] font-medium hover:underline cursor-pointer" style={{ color: C.blue, ...fontBody }}>
                              Forgot Password?
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
                            <input type={showPass ? "text" : "password"} name="password"
                              placeholder="Enter your password"
                              value={formData.password}
                              onChange={handleChange} onBlur={handleBlur}
                              onFocus={inputFocus}
                              onBlurCapture={inputBlurStyle("password")}
                              suppressHydrationWarning
                              className="w-full pl-10 pr-11 py-2.5 rounded-xl text-[13px] outline-none"
                              style={inputStyle("password")}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer hover:opacity-60 transition-opacity"
                              style={{ color: C.faint }} suppressHydrationWarning>
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.password && touched.password && (
                            <p className="text-[11px] flex items-center gap-1" style={{ color: C.blue, ...fontBody }}>
                              <AlertCircle className="w-3 h-3" /> {errors.password}
                            </p>
                          )}
                        </div>

                        {/* Remember */}
                        <label className="flex items-center gap-2.5 cursor-pointer pt-0.5">
                          <div className="w-4 h-4 rounded flex items-center justify-center"
                            style={{ backgroundColor: C.blue, border: `1.5px solid ${C.blue}` }}>
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-[12px]" style={{ color: C.muted, ...fontBody }}>Keep me signed in</span>
                        </label>

                        {/* CTA */}
                        <button type="submit" disabled={loading}
                          className="w-full py-3.5 rounded-xl font-semibold text-[13px] text-white flex items-center justify-center gap-2.5 group cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg hover:shadow-blue-500/25"
                          style={{ background: `linear-gradient(135deg, #1e3a8a 0%, ${C.blue} 60%, #2563eb 100%)`, boxShadow: `0 6px 24px rgba(29,78,216,0.2), inset 0 1px 0 rgba(255,255,255,0.12)`, ...fontBody }}
                          suppressHydrationWarning>
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              Authenticating...
                            </span>
                          ) : (
                            <>
                              <Gavel className="w-4 h-4 text-amber-300 transition-transform duration-300 group-hover:rotate-[-25deg] group-hover:scale-110" />
                              <span>Continue to Workspace</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </>
                          )}
                        </button>
                      </form>

                      {/* Mode switcher prompt */}
                      <p className="text-[11px] text-center mt-3" style={{ color: C.muted, ...fontBody }}>
                        Don&apos;t have an account?{" "}
                        <button type="button" onClick={() => { setAuthMode("signup"); setErrors({}); }} className="font-semibold hover:underline cursor-pointer" style={{ color: C.blue }}>
                          Create Account
                        </button>
                      </p>
                    </div>
                  ) : (
                    /* ════════════════════════════════════════════
                        MODE 2: SIGN UP / REGISTER FORM
                    ════════════════════════════════════════════ */
                    <div>
                      <div className="mb-5">
                        <h2 className="tracking-tight leading-tight"
                          style={{ ...fontHeading, fontSize: 26, fontWeight: 600, color: C.ink }}>
                          Register Law Firm{" "}
                          <em style={{ color: C.blue, fontStyle: "italic" }}>Workspace.</em>
                        </h2>
                        <p className="text-[11.5px] mt-1.5 leading-relaxed" style={{ color: C.muted, ...fontBody }}>
                          For Senior Advocates & Firm Admins. Junior Advocates, Clerks, and Clients are provisioned inside the workspace.
                        </p>
                      </div>

                      <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3.5">
                        
                        {/* Name Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted, ...fontBody }}>First Name</label>
                            <div className="relative">
                              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
                              <input type="text" name="first_name" placeholder="First Name" value={registerData.first_name}
                                onChange={handleRegisterChange} onBlur={handleRegisterBlur} onFocus={inputFocus} onBlurCapture={inputBlurStyle("first_name")}
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[12px] outline-none" style={inputStyle("first_name")} />
                            </div>
                            {errors.first_name && touched.first_name && (
                              <p className="text-[10px]" style={{ color: C.blue, ...fontBody }}>{errors.first_name}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted, ...fontBody }}>Last Name</label>
                            <input type="text" name="last_name" placeholder="Last Name" value={registerData.last_name}
                              onChange={handleRegisterChange} onFocus={inputFocus} onBlurCapture={inputBlurStyle("last_name")}
                              className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none" style={inputStyle("last_name")} />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted, ...fontBody }}>Email Address</label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
                            <input type="email" name="email" placeholder="advocate@lawfirm.com" value={registerData.email}
                              onChange={handleRegisterChange} onBlur={handleRegisterBlur} onFocus={inputFocus} onBlurCapture={inputBlurStyle("email")}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[12px] outline-none" style={inputStyle("email")} />
                          </div>
                          {errors.email && touched.email && (
                            <p className="text-[10px]" style={{ color: C.blue, ...fontBody }}>{errors.email}</p>
                          )}
                        </div>



                        {/* Password */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted, ...fontBody }}>Password</label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
                            <input type={showPass ? "text" : "password"} name="password" placeholder="Min. 6 characters" value={registerData.password}
                              onChange={handleRegisterChange} onBlur={handleRegisterBlur} onFocus={inputFocus} onBlurCapture={inputBlurStyle("password")}
                              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-[12px] outline-none" style={inputStyle("password")} />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: C.faint }}>
                              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {errors.password && touched.password && (
                            <p className="text-[10px]" style={{ color: C.blue, ...fontBody }}>{errors.password}</p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted, ...fontBody }}>Confirm Password</label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
                            <input type={showConfirmPass ? "text" : "password"} name="confirmPassword" placeholder="Repeat password" value={registerData.confirmPassword}
                              onChange={handleRegisterChange} onBlur={handleRegisterBlur} onFocus={inputFocus} onBlurCapture={inputBlurStyle("confirmPassword")}
                              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-[12px] outline-none" style={inputStyle("confirmPassword")} />
                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: C.faint }}>
                              {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {errors.confirmPassword && touched.confirmPassword && (
                            <p className="text-[10px]" style={{ color: C.blue, ...fontBody }}>{errors.confirmPassword}</p>
                          )}
                        </div>

                        {/* CTA */}
                        <button type="submit" disabled={loading}
                          className="w-full py-3.5 rounded-xl font-semibold text-[13px] text-white flex items-center justify-center gap-2.5 group cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg hover:shadow-blue-500/25"
                          style={{ background: `linear-gradient(135deg, #1e3a8a 0%, ${C.blue} 60%, #2563eb 100%)`, boxShadow: `0 6px 24px rgba(29,78,216,0.2)`, ...fontBody }}>
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                              Creating Account...
                            </span>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 text-amber-300" />
                              <span>Create Account & Continue</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>

                      {/* Mode switcher prompt */}
                      <p className="text-[11px] text-center mt-4" style={{ color: C.muted, ...fontBody }}>
                        Already have an account?{" "}
                        <button type="button" onClick={() => { setAuthMode("signin"); setErrors({}); }} className="font-semibold hover:underline cursor-pointer" style={{ color: C.blue }}>
                          Sign In
                        </button>
                      </p>
                    </div>
                  )}



                </div>
              </div>
            </div>

          </div>
        </div>
      </section>





      {/* ════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════ */}
      <footer className="relative z-10 py-10" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.blue }}>
              <Scale className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: C.ink, ...fontBody }}>Legal-Tech</span>
          </div>
          <p style={{ color: C.faint, ...fontBody }}>© {new Date().getFullYear()} Legal-Tech Practice Management.</p>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════
          FORGOT PASSWORD MODAL
      ════════════════════════════════════════════════ */}
      <Modal open={forgotPasswordOpen} maxWidth="max-w-[440px]" onClose={() => { if (!forgotLoading) { setForgotPasswordOpen(false); setForgotStep(1); setForgotError(""); setForgotSuccess(""); setForgotEmail(""); setForgotOtp(""); setNewPassword(""); setConfirmNewPassword(""); } }}>
        <div className="p-5 sm:p-6 text-center">
          {/* Top Lock Icon Badge */}
          <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2 text-lg shadow-sm"
            style={{ backgroundColor: "#eff6ff", border: "1px solid #dbeafe" }}>
            🔐
          </div>

          {/* Heading & Subtitle */}
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight mb-0.5 font-sans">
            Reset Password
          </h3>
          <p className="text-[11px] text-slate-500 font-normal mb-3.5 font-sans">
            Follow the steps to securely reset your password
          </p>

          {/* 3-Step Tracker */}
          <div className="flex items-center justify-center gap-0 mb-3.5">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                forgotStep === 1
                  ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm scale-105"
                  : forgotStep > 1
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-400 font-semibold"
              }`}>
                1
              </div>
              <span className={`text-[11px] font-semibold mt-1 font-sans ${forgotStep >= 1 ? "text-blue-600" : "text-slate-400"}`}>
                Email
              </span>
            </div>

            {/* Connecting Line 1-2 */}
            <div className={`w-9 h-[2px] mb-4 mx-1 transition-all ${forgotStep > 1 ? "bg-blue-600" : "bg-slate-200"}`} />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                forgotStep === 2
                  ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm scale-105"
                  : forgotStep > 2
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-400 font-semibold"
              }`}>
                2
              </div>
              <span className={`text-[11px] font-semibold mt-1 font-sans ${forgotStep >= 2 ? "text-blue-600" : "text-slate-400"}`}>
                OTP
              </span>
            </div>

            {/* Connecting Line 2-3 */}
            <div className={`w-9 h-[2px] mb-4 mx-1 transition-all ${forgotStep > 2 ? "bg-blue-600" : "bg-slate-200"}`} />

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                forgotStep === 3
                  ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm scale-105"
                  : "bg-slate-100 text-slate-400 font-semibold"
              }`}>
                3
              </div>
              <span className={`text-[11px] font-semibold mt-1 font-sans ${forgotStep === 3 ? "text-blue-600" : "text-slate-400"}`}>
                New Password
              </span>
            </div>
          </div>

          {/* Feedback messages */}
          {(forgotError || forgotSuccess) && (
            <div className={`mb-3 flex items-start gap-2 text-[11px] px-3.5 py-2 rounded-lg text-left font-sans`}
              style={{ 
                backgroundColor: forgotError ? "#fef2f2" : "#f0faf5", 
                border: forgotError ? `1px solid #fecaca` : "1px solid #bbf0d8", 
                color: forgotError ? "#dc2626" : "#2d7a54"
              }}>
              {forgotError ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              <span>{forgotError || forgotSuccess}</span>
            </div>
          )}

          {/* STEP 1: EMAIL */}
          {forgotStep === 1 && (
            <form onSubmit={handleForgotSendOtp} className="space-y-3 text-left font-sans">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Email Address</label>
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required
                  placeholder="advocate@lawfirm.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
                <p className="text-[11px] text-slate-400 mt-1 font-normal">We'll send a 6-digit OTP to this address.</p>
              </div>

              <button type="submit" disabled={forgotLoading}
                className="w-full mt-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed">
                {forgotLoading ? (
                  <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Sending OTP...</>
                ) : (
                  <>Send OTP →</>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {forgotStep === 2 && (
            <form onSubmit={handleForgotVerifyOtp} className="space-y-3 text-left font-sans">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">6-Digit OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-center font-bold text-lg tracking-[0.5em] outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-center font-normal">Enter the 6-digit code sent to <strong className="text-slate-700">{forgotEmail}</strong></p>
              </div>

              <div className="flex gap-2.5 pt-0.5">
                <button type="button" onClick={() => { setForgotStep(1); setForgotError(""); setForgotSuccess(""); setForgotOtp(""); }}
                  className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={forgotLoading || forgotOtp.length < 6}
                  className="flex-1 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all outline-none focus:outline-none disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed">
                  {forgotLoading ? (
                    <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Verifying...</>
                  ) : (
                    <>Verify OTP →</>
                  )}
                </button>
              </div>

              <button type="button" onClick={() => { setForgotError(""); setForgotSuccess(""); handleForgotSendOtp({ preventDefault: () => {} }); }}
                className="w-full text-[11px] text-center text-blue-600 hover:underline cursor-pointer pt-0.5">
                Didn't receive the email? Resend OTP
              </button>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {forgotStep === 3 && (() => {
            const strength = getPasswordStrength(newPassword);
            return (
              <form onSubmit={handleForgotResetPassword} className="space-y-3 text-left font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showForgotPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                      className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                    <button type="button" onClick={() => setShowForgotPass(!showForgotPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showForgotPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((seg) => (
                          <div
                            key={seg}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: seg <= strength.score ? strength.color : "#e2e8f0",
                            }}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <p className="text-[10px] font-semibold mt-1 transition-colors" style={{ color: strength.color }}>
                          {strength.label}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Requirements Checklist (Compact 2x2 Grid) */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px] font-sans">
                    {[
                      { key: "min", label: "At least 8 characters", met: strength.hasMinLen },
                      { key: "upper", label: "One uppercase letter", met: strength.hasUpper },
                      { key: "num", label: "One number", met: strength.hasNumber },
                      { key: "spec", label: "One special character", met: strength.hasSpecial },
                    ].map((rule) => (
                      <div
                        key={rule.key}
                        className={`flex items-center gap-1.5 transition-colors ${
                          rule.met ? "text-slate-700 font-medium" : "text-slate-400 font-normal"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 transition-all ${
                          rule.met ? "bg-emerald-100 text-emerald-600 font-bold" : "border border-slate-300 text-slate-300"
                        }`}>
                          {rule.met ? "✓" : "○"}
                        </span>
                        <span className="truncate">{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showForgotConfirmPass ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                      className={`w-full pl-3.5 pr-9 py-2.5 rounded-xl text-xs outline-none transition-all ${
                        confirmNewPassword
                          ? confirmNewPassword === newPassword
                            ? "bg-emerald-50/20 border-2 border-emerald-500 text-slate-900 focus:ring-4 focus:ring-emerald-100"
                            : "bg-red-50/20 border-2 border-red-500 text-slate-900 focus:ring-4 focus:ring-red-100"
                          : "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      }`}
                    />
                    <button type="button" onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showForgotConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Real-time mismatch error or match success text */}
                  {confirmNewPassword && (
                    <div className="mt-1 text-[11px] font-semibold flex items-center gap-1 font-sans">
                      {confirmNewPassword === newPassword ? (
                        <p className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" /> Passwords match
                        </p>
                      ) : (
                        <p className="text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> Passwords do not match
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => { setForgotStep(2); setForgotError(""); setForgotSuccess(""); }}
                    className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-all">
                    ← Back
                  </button>
                  <button type="submit" disabled={forgotLoading || !newPassword || !confirmNewPassword || confirmNewPassword !== newPassword}
                    className="flex-1 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed">
                    {forgotLoading ? (
                      <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Resetting...</>
                    ) : (
                      <>Reset Password →</>
                    )}
                  </button>
                </div>
              </form>
            );
          })()}
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════
          PROJECT OVERVIEW MODAL
      ════════════════════════════════════════════════ */}
      <Modal open={overviewOpen} onClose={() => setOverviewOpen(false)}>
        <div className="p-7 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
              <Cpu className="w-5 h-5" style={{ color: C.blue }} />
            </div>
            <div>
              <h3 className="font-semibold text-xl" style={{ ...fontHeading, color: C.ink }}>Project Overview</h3>
              <p className="text-[11px]" style={{ color: C.muted, ...fontBody }}>Practice Management Architecture</p>
            </div>
          </div>

          <div className="space-y-4 text-[12px]">
            <div className="p-4 rounded-xl" style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
              <h4 className="font-semibold mb-1.5 flex items-center gap-2" style={{ color: C.blue, ...fontBody }}>
                <ShieldCheck className="w-4 h-4" /> Platform Mission
              </h4>
              <p className="leading-relaxed" style={{ color: C.muted, ...fontBody }}>
                Legal-Tech unifies digital case binders, client consultations, law firm management, clerk court visits, and invoice tracking into a secure workspace for law practice.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm" style={{ color: C.ink, ...fontBody }}>Key Modules</h4>
              {[
                ["Case Management & Filing Records",                        "ACTIVE"],
                ["Law Firm Hierarchy (Advocate, Junior, Clerk, Client)",    "ROLE-BASED"],
                ["Case Discussions & Consultation Notes",                   "LOGGED"],
                ["Invoice Generation & Payment Histories",                  "SECURE"],
                ["Clerk Court Visits & Physical File Formatting",            "REGISTERED"],
                ["Granular Permissions (View, Add, Edit, Delete)",          "PROTECTED"],
              ].map(([label, tag], i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: C.ivory, border: `1px solid ${C.border}` }}>
                  <span className="font-medium" style={{ color: C.ink, ...fontBody }}>{label}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: C.blueL, color: C.blue, ...fontBody }}>{tag}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button onClick={() => setOverviewOpen(false)}
                className="px-5 py-2.5 rounded-xl font-medium cursor-pointer transition-opacity hover:opacity-80 text-white text-sm"
                style={{ backgroundColor: C.blue, ...fontBody }}>Close</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════
          MODULES EXPLORE MODAL
      ════════════════════════════════════════════════ */}
      <Modal open={modulesOpen} onClose={() => setModulesOpen(false)}>
        <div className="p-7 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
              <Briefcase className="w-5 h-5" style={{ color: C.blue }} />
            </div>
            <div>
              <h3 className="font-semibold text-xl" style={{ ...fontHeading, color: C.ink }}>Platform Modules</h3>
              <p className="text-[11px]" style={{ color: C.muted, ...fontBody }}>Core Modules Powering Legal-Tech</p>
            </div>
          </div>

          <div className="space-y-4">
            {projectShowcase.map((f, i) => (
              <div key={i} className="p-4 rounded-xl space-y-2"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-sm" style={{ color: C.ink, ...fontBody }}>
                    <span style={{ color: C.blue }}>{f.icon}</span>{f.title}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: C.blueL, color: C.blue, ...fontBody }}>{f.tag}</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: C.muted, ...fontBody }}>{f.description}</p>
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <button onClick={() => setModulesOpen(false)}
                className="px-5 py-2.5 rounded-xl font-medium cursor-pointer transition-opacity hover:opacity-80 text-white text-sm"
                style={{ backgroundColor: C.blue, ...fontBody }}>Got It</button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
