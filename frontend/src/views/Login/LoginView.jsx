"use client";

import { API_BASE_URL } from "@/utils/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Scale, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles,
  FileText, Calendar, ShieldCheck, ArrowRight, Bot, Zap,
  Briefcase, Users, X, ChevronRight, TrendingUp, Clock,
  ExternalLink, Cpu, CheckCircle2, Activity, Gavel, BookOpen,
  Landmark, Award, Scroll, BarChart2, Hash, ClipboardList
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
@keyframes orbit {
  from { transform: rotate(0deg) translateX(var(--orbit-r,120px)) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(var(--orbit-r,120px)) rotate(-360deg); }
}
@keyframes orbit-ccw {
  from { transform: rotate(0deg) translateX(var(--orbit-r,160px)) rotate(0deg); }
  to   { transform: rotate(-360deg) translateX(var(--orbit-r,160px)) rotate(360deg); }
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
  to   { opacity:1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes stamp-in {
  0%   { transform: scale(1.8) rotate(-15deg); opacity:0; }
  60%  { transform: scale(0.95) rotate(1deg); opacity:1; }
  80%  { transform: scale(1.04) rotate(-0.5deg); }
  100% { transform: scale(1) rotate(0deg); opacity:1; }
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

/* convenience aliases so existing references still resolve */
const crimson  = "#1d4ed8";   /* mapped → blue  */
const crimsonL = "#eff6ff";   /* mapped → blueL */


/* ─────────────────────────────────────────────────────────────
   FONTS — Times New Roman throughout
───────────────────────────────────────────────────────────── */
const fontHeading = { fontFamily: "'Times New Roman', Times, Georgia, serif" };
const fontBody    = { fontFamily: "'Times New Roman', Times, Georgia, serif" };

/* ── Validation ─────────────────────────────────────────── */
function validate(fd) {
  const e = {};
  if (!fd.email) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email))
    e.email = "Enter a valid email.";
  if (!fd.password) e.password = "Password is required.";
  else if (fd.password.length < 6)
    e.password = "Min. 6 characters.";
  return e;
}

export default function Login() {
  const router = useRouter();
  const [formData, setFormData]   = useState({ email: "", password: "" });
  const [errors, setErrors]       = useState({});
  const [touched, setTouched]     = useState({});
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [aiOpen, setAiOpen]       = useState(false);
  const [aiTab, setAiTab]         = useState(0);
  const [heroVisible, setHeroVisible]   = useState(false);
  const [scalesAngle, setScalesAngle]   = useState(0);  // for scales sway tick

  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = email, 2 = otp
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Mouse Parallax Offset
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouse = (e) => {
      setMouseOffset({
        x: (e.clientX - window.innerWidth / 2) * 0.02,
        y: (e.clientY - window.innerHeight / 2) * 0.02,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

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

  // Animated Legal Count-Up
  const [countCases, setCountCases] = useState(0);
  const [countAccuracy, setCountAccuracy] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const stepTime = 30;
    const steps = duration / stepTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setCountCases(Math.floor(progress * 500));
      setCountAccuracy(Number((progress * 100).toFixed(0)));

      if (currentStep >= steps) {
        setCountCases(500);
        setCountAccuracy(100);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  // Canvas ref for particle background
  const canvasRef = useRef(null);

  // Interactive ambient particle canvas effect
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

  // Typewriter animation state machine
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const phrases = [
    "Case Management Streamlined.",
    "Law Firm Operations Simplified.",
    "Consultations & Notes Tracked.",
    "Granular Permission Controls.",
  ];

  useEffect(() => {
    let timer;
    const currentPhrase = phrases[loopNum % phrases.length];

    if (isDeleting) {
      timer = setTimeout(() => {
        setTypedText(currentPhrase.substring(0, typedText.length - 1));
        setTypingSpeed(35);
      }, typingSpeed);
    } else {
      timer = setTimeout(() => {
        setTypedText(currentPhrase.substring(0, typedText.length + 1));
        setTypingSpeed(85);
      }, typingSpeed);
    }

    if (!isDeleting && typedText === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && typedText === "") {
      setIsDeleting(false);
      setLoopNum((prev) => prev + 1);
      setTypingSpeed(250);
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, loopNum, typingSpeed]);

  const handleChange = (e) => {
    const d = { ...formData, [e.target.name]: e.target.value };
    setFormData(d);
    if (touched[e.target.name]) setErrors(validate(d));
  };
  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validate(formData));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const ve = validate(formData);
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

  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    if (forgotLoading) return; // Prevent duplicate requests
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
    if (forgotLoading) return; // Prevent duplicate requests
    setForgotError("");
    setForgotSuccess("");
    if (!forgotOtp || forgotOtp.length < 6) { setForgotError("Please enter the 6-digit OTP."); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password/login-with-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }) });
      const data = await res.json();
      if (res.ok) {
        // OTP correct → save token and go to dashboard
        localStorage.setItem("token", data.access_token);
        setForgotSuccess("OTP verified! Logging you in...");
        setTimeout(() => router.push("/"), 800);
      } else {
        setForgotError(data.detail || "Incorrect OTP. Please try again.");
      }
    } catch { setForgotError("Connection error. Please retry."); }
    finally { setForgotLoading(false); }
  };

  /* ── Content ─────────────────────────────────────────── */
  const aiFeatures = [
    { id: "case_mgmt", icon: <Briefcase className="w-4 h-4" />, tag: "Case Binder",
      title: "Case Management & Tracking",
      description: "Complete lifecycle tracking of legal cases, filing details, hearing schedules, bench assignments, and case stages.",
      prompt: "View Case #LC-2026-089 — Commercial Dispute",
      output: { summary: "Active Case Summary & Status:", bullets: ["Case Title: Apex Tech vs. Horizon Infra (HC Bench 3).", "Assigned Advocate: Senior Advocate Rahul Sharma.", "Hearing Schedule: Next hearing on 18 Aug 2026 at 10:30 AM."] } },
    { id: "lawfirm_mgmt", icon: <Users className="w-4 h-4" />, tag: "Organization",
      title: "Law Firm & Role Management",
      description: "Manage Senior Advocates, Junior Advocates, Clerks, and Clients with dedicated role clearances and team rosters.",
      prompt: "Law Firm Team & Roster Overview",
      output: { summary: "Firm Organization & Access Control:", bullets: ["Roles Provisioned: Senior Advocate, Junior Advocate, Clerk, Client.", "Custom Permissions: Granular view/add/edit/delete clearances per module.", "User Management: Temp password provisioning and active account controls."] } },
    { id: "consultations", icon: <BookOpen className="w-4 h-4" />, tag: "Discussions",
      title: "Case Discussions & Consultations",
      description: "Schedule client meetings, log detailed consultation session notes, track action items, and manage follow-ups.",
      prompt: "Schedule Client Consultation — Advisory Session",
      output: { summary: "Consultation Record & Action Notes:", bullets: ["Client: Priya Nair · Mode: Video Conference / Office Meeting.", "Meeting Notes: Legal strategy finalized, evidence documents attached.", "Task Delegation: Follow-up drafting assigned to Junior Advocate."] } },
    { id: "finance_billing", icon: <BarChart2 className="w-4 h-4" />, tag: "Finance",
      title: "Finance, Billing & Invoicing",
      description: "Comprehensive financial tracking, automated GST-compliant invoice generation, fee status, and payment histories.",
      prompt: "Generate Client Invoice — Retainer Fee",
      output: { summary: "Invoice & Financial History Summary:", bullets: ["Invoice #INV-2026-102: ₹45,000 for Consultation & Case Filing.", "Payment Status: Paid via Client Payment Portal.", "Ledger: Invoice history & retainer balance automatically updated."] } },
  ];

  const coreFeatures = [
    { icon: <Briefcase className="w-5 h-5" />, title: "Case Management",    desc: "Digital case binders — filing info, hearing schedules, and stage tracking." },
    { icon: <Users className="w-5 h-5" />,     title: "Law Firm Portal",    desc: "Role-based portals for Senior Advocates, Junior Advocates, Clerks, and Clients." },
    { icon: <BookOpen className="w-5 h-5" />,  title: "Case Discussions",   desc: "Schedule client consultations, log detailed session notes, and set action items." },
    { icon: <BarChart2 className="w-5 h-5" />, title: "Finance & Invoicing", desc: "Create client invoices, track retainer balances, and record payment histories." },
    { icon: <ClipboardList className="w-5 h-5" />, title: "Clerk Workflows",  desc: "Track court visits, physical file formatting, and document intake." },
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

  /* ── Modal wrapper ──────────────────────────────────── */
  const Modal = ({ open, onClose, children }) =>
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(28,20,9,0.45)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto relative"
          style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 32px 64px rgba(28,20,9,0.18)" }}>
          <button onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-70"
            style={{ backgroundColor: C.surface, color: C.muted }}>
            <X className="w-4 h-4" />
          </button>
          {children}
        </div>
      </div>
    ) : null;

  /* ── Floating legal document tiles data ───────────── */
  const floatingDocs = [
    { label: "Case Binder",      sub: "#LC-2026-089",    icon: <Briefcase size={13} />,   delay: "0s",   dur: "14s", x: "8%",  r: "-4deg",  opS: "0", opE: "0.72" },
    { label: "Law Firm Portal",  sub: "Advocate Roster", icon: <Users size={13} />,       delay: "3s",   dur: "17s", x: "18%", r: "5deg",   opS: "0", opE: "0.65" },
    { label: "Fee Invoice",      sub: "#INV-2026-102",   icon: <BarChart2 size={13} />,   delay: "6s",   dur: "13s", x: "76%", r: "-6deg",  opS: "0", opE: "0.68" },
    { label: "Consultation",     sub: "Meeting Notes",   icon: <BookOpen size={13} />,    delay: "1.5s", dur: "16s", x: "86%", r: "3deg",   opS: "0", opE: "0.70" },
    { label: "Clerk Tasks",      sub: "Court Visits",    icon: <ClipboardList size={13} />, delay: "9s", dur: "18s", x: "44%", r: "-2deg",  opS: "0", opE: "0.55" },
    { label: "Doc Storage",      sub: "Legal Repository",icon: <FileText size={13} />,    delay: "4s",   dur: "15s", x: "60%", r: "7deg",   opS: "0", opE: "0.60" },
    { label: "Leave Requests",   sub: "Schedule Sync",   icon: <Calendar size={13} />,    delay: "11s",  dur: "12s", x: "30%", r: "-5deg",  opS: "0", opE: "0.58" },
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
              {/* Gavel head */}
              <rect x="8" y="4" width="28" height="16" rx="4" fill="#0d1b2e" />
              {/* Handle */}
              <line x1="32" y1="18" x2="68" y2="54" stroke="#0d1b2e" strokeWidth="8" strokeLinecap="round" />
            </g>
            {/* Sound block */}
            <rect x="10" y="64" width="32" height="10" rx="3" fill="#0d1b2e" opacity="0.6" />
          </svg>
        </div>

        {/* Warm ivory gradient vignettes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-50"
          style={{ background: `radial-gradient(circle, ${C.goldL} 0%, transparent 70%)`, transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-40"
          style={{ background: `radial-gradient(circle, ${C.blueL} 0%, transparent 70%)`, transform: "translate(-30%,30%)" }} />
        {/* Fine column lines — legal document texture */}
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
              <p className="text-[10px] font-normal -mt-0.5 tracking-wide flex items-center gap-1" style={{ color: C.muted, ...fontBody }}>
                Advocate Workspace <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            {[
              { label: "Overview",       icon: <Cpu className="w-3.5 h-3.5" />,       action: () => setOverviewOpen(true), href: null },
              { label: "Core Features",  icon: <Briefcase className="w-3.5 h-3.5" />, action: null, href: "#features" },
              { label: "Main Features",  icon: <Sparkles className="w-3.5 h-3.5" />,  action: null, href: "#ai-features" },
            ].map((item) => {
              const cls = "flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer";
              const s   = { color: C.muted, ...fontBody };
              const hover = (e, on) => {
                e.currentTarget.style.color           = on ? C.ink : C.muted;
                e.currentTarget.style.backgroundColor = on ? C.white : "transparent";
                e.currentTarget.style.boxShadow       = on ? `0 1px 4px rgba(28,20,9,0.08)` : "none";
              };
              return item.href
                ? <a key={item.label} href={item.href} className={cls} style={s}
                    onMouseOver={(e) => hover(e, true)} onMouseOut={(e) => hover(e, false)}>
                    {item.icon}{item.label}
                  </a>
                : <button key={item.label} onClick={item.action} className={cls} style={s}
                    onMouseOver={(e) => hover(e, true)} onMouseOut={(e) => hover(e, false)}>
                    {item.icon}{item.label}
                  </button>;
            })}
          </nav>

          {/* Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium shadow-xs"
            style={{ backgroundColor: "#f0faf5", border: "1px solid #bbf0d8", color: "#2d7a54", ...fontBody }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="hidden sm:inline font-bold tracking-tight">SYSTEM ONLINE // LEGAL-TECH PORTAL</span>
          </div>

        </div>
      </header>



      {/* ════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-16 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* ── LEFT: Minimal Hero ───────────────────── */}
            <div className="lg:col-span-7 space-y-9"
              style={{ animation: heroVisible ? "slide-in-left 0.7s cubic-bezier(.25,.8,.25,1) both" : "none" }}>

              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide shadow-xs transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: C.goldL, border: `1px solid #e8d49a`, color: C.gold, ...fontBody }}>
                <Scale className="w-3.5 h-3.5" />
                <span>STATUS: ACTIVE // LAW FIRM WORKSPACE PORTAL</span>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="tracking-tight leading-[1.08]"
                  style={{ ...fontHeading, fontSize: "clamp(40px, 5vw, 62px)", fontWeight: 600, color: C.ink }}>
                  Your Legal Practice,
                  <br />
                  <em style={{ color: C.blue, fontStyle: "italic" }}>{typedText}</em>
                  <span className="inline-block w-1 h-8 ml-1 bg-blue-600 animate-pulse align-middle" />
                </h1>
                <p className="text-sm leading-relaxed max-w-md"
                  style={{ color: C.muted, fontWeight: 400, ...fontBody }}>
                  Case management, consultations, law firm operations, and client invoicing — unified in one portal.
                </p>
              </div>

              {/* Stats — clean interactive cards */}
              <div className="flex flex-wrap items-center gap-8">
                {[
                  { value: `${countCases}+`,  label: "Cases tracked",  color: C.ink },
                  { value: `${countAccuracy}%`, label: "Security rating", color: C.blue },
                  { value: "Active",  label: "Multi-Role Portal", color: "#2d7a54" },
                ].map((s, i, arr) => (
                  <div key={i} className="flex items-center gap-8 group cursor-default">
                    <div className="transition-all duration-300 transform group-hover:-translate-y-1">
                      <p className="font-semibold text-2xl leading-tight"
                        style={{ color: s.color, ...fontHeading }}>{s.value}</p>
                      <p className="text-[11px] mt-0.5 font-normal tracking-wide uppercase"
                        style={{ color: C.faint, ...fontBody, letterSpacing: "0.06em" }}>{s.label}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-px h-10" style={{ backgroundColor: C.border }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Workspace Canvas with Corner Brackets */}
              <div className="relative group p-0.5 rounded-2xl transition-all duration-300 hover:shadow-2xl">

                <div className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 12px 40px rgba(28,20,9,0.10)" }}>

                  {/* Title bar */}
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#e57373" }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ffb74d" }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#66bb6a" }} />
                      <span className="ml-3 text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: C.faint, ...fontBody }}>
                        <Activity size={12} className="text-blue-600 animate-spin" /> Legal-Tech Platform Engine
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "#2d7a54", ...fontBody }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />SYSTEM ONLINE
                    </span>
                  </div>

                  {/* Inner cards */}
                  <div className="grid sm:grid-cols-2 gap-3 p-4">
                    {/* Case Card */}
                    <div className="p-4 rounded-xl space-y-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      style={{ backgroundColor: C.ivory, border: `1px solid ${C.border}` }}>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.gold, ...fontBody }}>
                          <Briefcase className="w-3 h-3" /> Case Management
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "#f0faf5", color: "#2d7a54", border: "1px solid #bbf0d8", ...fontBody }}>LISTED</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: C.ink, ...fontBody }}>Apex Tech vs. Horizon Infra</p>
                      <p className="text-[10px]" style={{ color: C.muted, ...fontBody }}>High Court · Bench 3 · Hearing #14</p>
                    </div>

                    {/* Finance & Consultation Card */}
                    <div className="p-4 rounded-xl space-y-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.blue, ...fontBody }}>
                          <BookOpen className="w-3 h-3" /> Consultations & Finance
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "#dbeafe", color: C.blue, ...fontBody }}>ACTIVE</span>
                      </div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: C.ink, ...fontBody }}>Client Advisory Session</p>
                      <p className="text-[10px]" style={{ color: C.muted, ...fontBody }}>Invoice #INV-2026-089 · Paid</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.surface }}>
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.muted, ...fontBody }}>
                      <Sparkles className="w-3 h-3" style={{ color: C.gold }} />
                      Multi-role law firm operations workspace
                    </span>
                    <button onClick={() => setAiOpen(true)}
                      className="flex items-center gap-0.5 text-[11px] font-semibold cursor-pointer hover:underline"
                      style={{ color: C.blue, ...fontBody }}>
                      Explore <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT: Sign-In Card ───────────────────── */}
            <div id="signin" className="lg:col-span-5 scroll-mt-24 relative group p-0.5 rounded-2xl"
              style={{ animation: heroVisible ? "slide-in-right 0.7s 0.15s cubic-bezier(.25,.8,.25,1) both" : "none" }}>


              <div className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 group-hover:shadow-blue-500/10"
                style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>

                {/* Crimson top accent line */}
                <div className="h-[3px]"
                  style={{ background: `linear-gradient(90deg, ${C.blue} 0%, #2563eb 50%, ${C.gold} 100%)` }} />

                <div className="p-8 sm:p-9">

                  {/* Brand */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: C.blueL, border: `1.5px solid #bfdbfe` }}>
                      <Scale className="w-5 h-5" style={{ color: C.blue }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.blue, ...fontBody }}>Legal-Tech AI</p>
                      <p className="text-[10px] font-normal -mt-0.5" style={{ color: C.faint, ...fontBody }}>Secure Advocate Portal</p>
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="mb-8">
                    <h2 className="tracking-tight leading-tight"
                      style={{ ...fontHeading, fontSize: 32, fontWeight: 600, color: C.ink }}>
                      Welcome back,{" "}
                      <em style={{ color: C.blue, fontStyle: "italic" }}>Counsel.</em>
                    </h2>
                    <p className="text-[13px] mt-2 leading-relaxed" style={{ color: C.muted, ...fontBody }}>
                      Access your case workspace, consultations, and firm management portal.
                    </p>
                  </div>

                  {/* API Error */}
                  {errors.api && (
                    <div className="mb-5 flex items-start gap-2.5 text-[12px] px-4 py-3 rounded-xl"
                      style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe`, color: C.blue, ...fontBody }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errors.api}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">

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
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none"
                          style={{ ...inputStyle("email"), "::placeholder": { color: C.faint } }}
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
                          className="w-full pl-10 pr-11 py-3 rounded-xl text-[13px] outline-none"
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
                    <label className="flex items-center gap-2.5 cursor-pointer">
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
                      className="w-full py-3.5 rounded-xl font-semibold text-[13px] text-white flex items-center justify-center gap-2.5 group cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-1 shadow-lg hover:shadow-blue-500/25"
                      style={{ background: `linear-gradient(135deg, #1e3a8a 0%, ${C.blue} 60%, #2563eb 100%)`, boxShadow: `0 6px 24px rgba(29,78,216,0.2), inset 0 1px 0 rgba(255,255,255,0.12)`, ...fontBody }}
                      suppressHydrationWarning>
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                        style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)" }} />
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

                  {/* Trust badges */}
                  <div className="mt-8 pt-6 grid grid-cols-3 gap-2 text-center"
                    style={{ borderTop: `1px solid ${C.border}` }}>
                    {[
                      { icon: <ShieldCheck className="w-4 h-4" />, label: "256-Bit\nEncrypted" },
                      { icon: <CheckCircle2 className="w-4 h-4" />, label: "ISO 27001\nCertified" },
                      { icon: <Scale className="w-4 h-4" />, label: "Bar Council\nCompliant" },
                    ].map((t, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <span style={{ color: C.faint }}>{t.icon}</span>
                        <span className="text-[10px] font-medium leading-tight whitespace-pre-line"
                          style={{ color: C.faint, ...fontBody }}>{t.label}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          AI FEATURES SECTION
      ════════════════════════════════════════════════ */}
      <section id="ai-features" className="relative z-10 py-24 scroll-mt-16"
        style={{ borderTop: `1px solid ${C.border}`, animation: "slide-in-up 0.7s 0.3s cubic-bezier(.25,.8,.25,1) both" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe`, color: C.blue, ...fontBody }}>
              <Briefcase className="w-3.5 h-3.5" /> Project Features
            </div>
            <h2 className="tracking-tight" style={{ ...fontHeading, fontSize: 36, fontWeight: 600, color: C.ink }}>
              Built for Modern Legal Practice
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: C.muted, ...fontBody }}>
              Integrated case binders, client consultations, law firm management, and invoice tracking.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">

            {/* Tab list */}
            <div className="lg:col-span-5 space-y-2">
              {aiFeatures.map((f, idx) => (
                <div key={f.id} onClick={() => setAiTab(idx)}
                  className="p-4 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: aiTab === idx ? C.white : "transparent",
                    border: aiTab === idx ? `1.5px solid ${C.border}` : `1.5px solid transparent`,
                    boxShadow: aiTab === idx ? "0 4px 16px rgba(28,20,9,0.08)" : "none",
                  }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 font-semibold text-sm"
                      style={{ color: aiTab === idx ? C.ink : C.muted, ...fontBody }}>
                      <span style={{ color: aiTab === idx ? C.blue : C.faint }}>{f.icon}</span>
                      {f.title}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: aiTab === idx ? C.blueL : C.surface, color: aiTab === idx ? C.blue : C.faint, ...fontBody }}>
                      {f.tag}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed line-clamp-2"
                    style={{ color: aiTab === idx ? C.muted : C.faint, ...fontBody }}>{f.description}</p>
                </div>
              ))}
            </div>

            {/* Preview panel */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden"
              style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 12px 40px rgba(28,20,9,0.10)" }}>
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.surface }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#e57373" }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ffb74d" }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#66bb6a" }} />
                  <span className="ml-3 text-[11px] font-mono" style={{ color: C.muted }}>ai_engine.log</span>
                </div>
                <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: C.blueL, color: C.blue, ...fontBody }}>
                  {aiFeatures[aiTab].tag}
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-xl mb-1.5" style={{ ...fontHeading, color: C.ink }}>
                    {aiFeatures[aiTab].title}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: C.muted, ...fontBody }}>
                    {aiFeatures[aiTab].description}
                  </p>
                </div>

                {/* Prompt */}
                <div className="p-4 rounded-xl space-y-1.5"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.gold, ...fontBody }}>Prompt</span>
                  <p className="text-[13px] italic" style={{ color: C.ink, fontFamily: "Georgia, serif" }}>
                    &quot;{aiFeatures[aiTab].prompt}&quot;
                  </p>
                </div>

                {/* Output */}
                <div className="p-4 rounded-xl space-y-3"
                  style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "#2d7a54", ...fontBody }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Module Summary
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: C.faint }}>Active</span>
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: C.ink, ...fontBody }}>
                    {aiFeatures[aiTab].output.summary}
                  </p>
                  <ul className="space-y-1.5">
                    {aiFeatures[aiTab].output.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2 text-[12px] leading-relaxed" style={{ color: C.muted, ...fontBody }}>
                        <span style={{ color: C.blue, flexShrink: 0 }}>·</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURES SECTION
      ════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-24 scroll-mt-16"
        style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: C.goldL, border: `1px solid #e8d49a`, color: C.gold, ...fontBody }}>
              <Briefcase className="w-3.5 h-3.5" /> About Our Features
            </div>
            <h2 className="tracking-tight" style={{ ...fontHeading, fontSize: 36, fontWeight: 600, color: C.ink }}>
              Everything a Law Practice Needs
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: C.muted, ...fontBody }}>
              Unified platform for advocates, senior counsels, and legal teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreFeatures.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl cursor-default transition-all duration-300 group"
                style={{
                  backgroundColor: C.white, border: `1px solid ${C.border}`,
                  animation: `slide-in-up 0.6s ${0.08 * i}s cubic-bezier(.25,.8,.25,1) both`,
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(29,78,216,0.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseOut={(e)  => { e.currentTarget.style.borderColor = C.border;   e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
                  <span style={{ color: C.blue }}>{f.icon}</span>
                </div>
                <h3 className="font-semibold text-base mb-1.5" style={{ ...fontHeading, color: C.ink, fontSize: 18 }}>{f.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: C.muted, ...fontBody }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          OVERVIEW CTA
      ════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <h2 className="tracking-tight" style={{ ...fontHeading, fontSize: 34, fontWeight: 600, color: C.ink }}>
            How It All Works
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: C.muted, ...fontBody }}>
            Client onboarding → AI research & drafting → e-Courts hearing sync → Retainer settlement.
          </p>
          <button onClick={() => setOverviewOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm cursor-pointer transition-all hover:opacity-90"
            style={{ backgroundColor: C.blue, color: "white", boxShadow: `0 6px 20px rgba(29,78,216,0.2)`, ...fontBody }}>
            View Project Overview <ExternalLink className="w-4 h-4" />
          </button>
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
            <span className="font-semibold text-sm" style={{ color: C.ink, ...fontBody }}>Legal-Tech AI</span>
            <span style={{ color: C.faint }}>&nbsp;· Advocate OS 2026</span>
          </div>
          <div className="flex items-center gap-5" style={{ color: C.muted, ...fontBody }}>
            <button onClick={() => setOverviewOpen(true)} className="hover:opacity-70 cursor-pointer">Overview</button>
            <a href="#features"    className="hover:opacity-70">Features</a>
            <a href="#ai-features" className="hover:opacity-70">AI Features</a>
          </div>
          <p style={{ color: C.faint, ...fontBody }}>© 2026 Legal-Tech Inc. · ISO 27001 · Bar Council</p>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════
          FORGOT PASSWORD MODAL
      ════════════════════════════════════════════════ */}
      <Modal open={forgotPasswordOpen} onClose={() => { if (!forgotLoading) { setForgotPasswordOpen(false); setForgotStep(1); setForgotError(""); setForgotSuccess(""); setForgotEmail(""); setForgotOtp(""); } }}>
        <div className="p-7 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
              <Lock className="w-5 h-5" style={{ color: C.blue }} />
            </div>
            <div>
              <h3 className="font-semibold text-xl" style={{ ...fontHeading, color: C.ink }}>
                {forgotStep === 1 ? "Reset Password" : "Enter OTP"}
              </h3>
              <p className="text-[11px]" style={{ color: C.muted, ...fontBody }}>
                {forgotStep === 1 ? "Receive a one-time passcode via email." : "Check your inbox for the 6-digit code."}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    backgroundColor: forgotStep >= s ? C.blue : C.surface,
                    color: forgotStep >= s ? "white" : C.faint,
                    border: `1.5px solid ${forgotStep >= s ? C.blue : C.border}`
                  }}>{s}</div>
                {s < 2 && <div className="w-10 h-0.5 rounded" style={{ backgroundColor: forgotStep > s ? C.blue : C.border }} />}
              </div>
            ))}
            <span className="ml-2 text-[11px]" style={{ color: C.muted, ...fontBody }}>
              {forgotStep === 1 ? "Email" : "OTP Verification"}
            </span>
          </div>

          {/* Messages */}
          {(forgotError || forgotSuccess) && (
            <div className={`mb-4 flex items-start gap-2.5 text-[12px] px-4 py-3 rounded-xl`}
              style={{ 
                backgroundColor: forgotError ? "#fef2f2" : "#f0faf5", 
                border: forgotError ? `1px solid #fecaca` : "1px solid #bbf0d8", 
                color: forgotError ? "#dc2626" : "#2d7a54", 
                ...fontBody 
              }}>
              {forgotError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{forgotError || forgotSuccess}</span>
            </div>
          )}

          {/* Step 1: Email */}
          {forgotStep === 1 && (
            <form onSubmit={handleForgotSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted, ...fontBody }}>Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required
                    placeholder="advocate@lawfirm.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}`, color: C.ink, ...fontBody }} />
                </div>
              </div>
              <button type="submit"
                className="w-full py-3 rounded-xl font-semibold text-[13px] text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: C.blue, 
                  opacity: forgotLoading ? 0.6 : 1,
                  pointerEvents: forgotLoading ? "none" : "auto",
                  ...fontBody 
                }}>
                {forgotLoading ? (
                  <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Sending OTP...</>
                ) : "Send OTP to Email"}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {forgotStep === 2 && (
            <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted, ...fontBody }}>6-Digit OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full px-4 py-4 rounded-xl text-[24px] outline-none text-center font-bold tracking-[0.6em]"
                  style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}`, color: C.ink, letterSpacing: "0.5em" }}
                />
                <p className="text-[11px] text-center" style={{ color: C.faint, ...fontBody }}>Enter the code sent to <strong>{forgotEmail}</strong></p>
                <p className="text-[11px] text-center mt-1 flex items-center justify-center gap-1" style={{ color: "#d97706", ...fontBody }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Also check your <strong>Spam / Junk</strong> folder if not in inbox
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setForgotStep(1); setForgotError(""); setForgotSuccess(""); setForgotOtp(""); }}
                  className="flex-1 py-3 rounded-xl font-medium text-[13px] cursor-pointer transition-all hover:opacity-80"
                  style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}`, color: C.muted, ...fontBody }}>
                  ← Back
                </button>
                <button type="submit" disabled={forgotOtp.length < 6}
                  className="flex-1 py-3 rounded-xl font-semibold text-[13px] text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                  style={{ 
                    backgroundColor: C.blue, 
                    opacity: (forgotLoading || forgotOtp.length < 6) ? 0.6 : 1,
                    pointerEvents: forgotLoading ? "none" : "auto",
                    ...fontBody 
                  }}>
                  {forgotLoading ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Verifying...</>
                  ) : "Verify OTP"}
                </button>
              </div>
              <button type="button" onClick={() => { setForgotError(""); setForgotSuccess(""); handleForgotSendOtp({ preventDefault: () => {} }); }}
                className="w-full text-[11px] text-center hover:underline cursor-pointer pt-1"
                style={{ color: C.blue, ...fontBody }}>Didn't receive the email? Resend OTP</button>
            </form>
          )}
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════
          OVERVIEW MODAL
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
              <p className="text-[11px]" style={{ color: C.muted, ...fontBody }}>Architecture & System Specs</p>
            </div>
          </div>

          <div className="space-y-4 text-[12px]">
            <div className="p-4 rounded-xl" style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
              <h4 className="font-semibold mb-1.5 flex items-center gap-2" style={{ color: C.blue, ...fontBody }}>
                <ShieldCheck className="w-4 h-4" /> Platform Mission
              </h4>
              <p className="leading-relaxed" style={{ color: C.muted, ...fontBody }}>
                Legal-Tech unifies digital case binders, client consultations, law firm management, clerk court visits, and invoice tracking into a high-security workspace for law practice.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Core Framework", value: "Next.js 16 + React 19", sub: "Tailwind CSS v4 · Lucide Icons" },
                { label: "Backend Engine", value: "Python FastAPI + PostgreSQL", sub: "OAuth2 JWT · e-Courts Scraper" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl space-y-1"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.faint, ...fontBody }}>{item.label}</span>
                  <p className="font-semibold text-sm" style={{ color: C.ink, ...fontBody }}>{item.value}</p>
                  <p style={{ color: C.muted, ...fontBody }}>{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm" style={{ color: C.ink, ...fontBody }}>Key Modules</h4>
              {[
                ["Case Management & Filing Records",                        "ACTIVE"],
                ["Law Firm Hierarchy (Advocate, Junior, Clerk, Client)",    "ROLE-BASED"],
                ["Case Discussions & Consultation Notes",                   "LOGGED"],
                ["Invoice Generation & Payment Histories",                  "SECURE"],
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
          AI MODAL
      ════════════════════════════════════════════════ */}
      <Modal open={aiOpen} onClose={() => setAiOpen(false)}>
        <div className="p-7 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: C.blueL, border: `1px solid #bfdbfe` }}>
              <Briefcase className="w-5 h-5" style={{ color: C.blue }} />
            </div>
            <div>
              <h3 className="font-semibold text-xl" style={{ ...fontHeading, color: C.ink }}>Project Features</h3>
              <p className="text-[11px]" style={{ color: C.muted, ...fontBody }}>Core Modules Powering Legal-Tech</p>
            </div>
          </div>

          <div className="space-y-4">
            {aiFeatures.map((f, i) => (
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
                <div className="p-3 rounded-lg"
                  style={{ backgroundColor: C.ivory, border: `1px solid ${C.border}` }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: C.gold, ...fontBody }}>Example</span>
                  <p className="text-[12px] italic" style={{ color: C.ink, fontFamily: "Georgia, serif" }}>
                    &quot;{f.prompt}&quot;
                  </p>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <button onClick={() => setAiOpen(false)}
                className="px-5 py-2.5 rounded-xl font-medium cursor-pointer transition-opacity hover:opacity-80 text-white text-sm"
                style={{ backgroundColor: C.blue, ...fontBody }}>Got It</button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}