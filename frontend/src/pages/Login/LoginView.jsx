"use client";

import { API_BASE_URL } from "@/utils/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  FileText,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Bot,
  Zap,
  Briefcase,
  Users,
  X,
  ChevronRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Cpu,
  CheckCircle2,
} from "lucide-react";

/* ─── Palette ─────────────────────────────────────────── */
const C = {
  navy:    "#030c14",
  crimson: "#731d20",
  ash:     "#ffffff",
  slate:   "#8fa3b8",
};

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
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState(0);

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    if (touched[e.target.name]) setErrors(validate(updated));
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
    if (Object.keys(ve).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) { localStorage.setItem("token", data.access_token); router.push("/"); }
      else setErrors({ api: data.detail || "Invalid credentials." });
    } catch { setErrors({ api: "Unable to connect. Please try again." }); }
    finally { setLoading(false); }
  };

  /* AI Features */
  const aiFeatures = [
    { id: "analyzer", title: "AI Case & Precedent Analyzer", icon: <Bot className="w-4 h-4" />, tag: "Research", description: "Automatically matches Supreme Court & High Court precedents with relevant citation numbers from your petitions.", samplePrompt: "Extract constitutional precedents under Article 21 for bail petition.", sampleOutput: { summary: "3 SC precedents identified:", bullets: ["Hussainara Khatoon v. State of Bihar (1980) — Right to speedy trial.", "Abdul Rehman Antulay v. R.S. Nayak (1992) — Delay evaluation guidelines.", "Satender Kumar Antil v. CBI (2022) — Statutory bail directives."] } },
    { id: "drafter", title: "Smart Petition Drafter", icon: <FileText className="w-4 h-4" />, tag: "Drafting", description: "Generates bail applications, Sec 138 NI Act notices, and writ petitions in court-specific formats.", samplePrompt: "Draft Section 138 NI Act notice for dishonoured cheque of ₹15,00,000.", sampleOutput: { summary: "Court-compliant notice generated:", bullets: ["PARTIES: M/s Apex Tech vs M/s Horizon Infrastructure.", "DEMAND: ₹15,00,000 with 15-day statutory payment window.", "DEFAULT: Prosecution under Sec 138/141 NI Act & Sec 420 IPC."] } },
    { id: "hearings", title: "Cause List & Hearing Monitor", icon: <Calendar className="w-4 h-4" />, tag: "Live Sync", description: "Real-time e-Courts API integration. Auto-scrapes daily cause lists and alerts you via notifications.", samplePrompt: "Show tomorrow's High Court Bench 4 cause list.", sampleOutput: { summary: "Hearing alerts dispatched:", bullets: ["Item #14: Sharma vs State — HC Bench 4 — 10:30 AM.", "Item #28: Apex vs Union — Courtroom 12 — Post-lunch.", "Client WhatsApp notifications queued."] } },
    { id: "summarizer", title: "Judgment Summarizer", icon: <Zap className="w-4 h-4" />, tag: "Research", description: "Converts lengthy judgments into concise executive briefs with Ratio Decidendi and key holdings.", samplePrompt: "Summarize 2026 SC judgment on arbitration enforcement.", sampleOutput: { summary: "Executive brief generated:", bullets: ["RATIO: Unstamped arbitration agreements valid pre-impounding.", "REASONING: Sec 11(6A) prioritises minimal judicial intervention.", "IMPACT: Interim relief expedited by ~45 days on average."] } },
  ];

  /* Core Features */
  const coreFeatures = [
    { icon: <Scale className="w-5 h-5" />, title: "e-Courts Sync", desc: "Live cause list, case status, and order tracking via national e-Courts API." },
    { icon: <Briefcase className="w-5 h-5" />, title: "Case Management", desc: "Digital case binders with FIRs, evidence, vakalatnamas, and client files." },
    { icon: <Bot className="w-5 h-5" />, title: "Legal AI Engine", desc: "AI trained on Indian jurisprudence, bare acts, and SC precedent digests." },
    { icon: <Users className="w-5 h-5" />, title: "Team Delegation", desc: "Role-based access for junior advocates, clerks, and client portals." },
    { icon: <TrendingUp className="w-5 h-5" />, title: "Billing & Retainers", desc: "GST-compliant invoices, retainer tracking, and Razorpay integration." },
    { icon: <ShieldCheck className="w-5 h-5" />, title: "Bank-Grade Security", desc: "ISO 27001 certified. 256-bit encryption. Zero-trust architecture." },
  ];

  /* Inline styles for the palette */
  const bg      = { backgroundColor: C.navy };
  const bgCard  = { backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
  const textAsh = { color: C.ash };
  const textSl  = { color: C.slate };
  const textCr  = { color: C.crimson };
  const crimsonBg = { backgroundColor: C.crimson };

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden" style={bg}>

      {/* ── Advocate overlay watermark ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Large translucent scales of justice SVG */}
        <svg
          className="absolute opacity-[0.04]"
          style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "900px", height: "900px" }}
          viewBox="0 0 24 24" fill={C.ash}
        >
          <path d="M12 3L2 7l2 4.5A5 5 0 0 0 9 16H7v1h10v-1h-2a5 5 0 0 0 5-4.5L22 7 12 3zm0 2.2L19.5 8 18 11.5A3 3 0 0 1 15 14H9a3 3 0 0 1-3-2.5L4.5 8 12 5.2zM11 17h2v3h-2v-3z"/>
        </svg>
        {/* Crimson top-left accent orb */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: C.crimson }} />
        {/* Navy-lighter bottom-right orb */}
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]" style={{ backgroundColor: C.slate }} />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: `radial-gradient(${C.ash} 1px, transparent 1px)`, backgroundSize: "32px 32px" }}
        />
        {/* Horizontal rule lines — legal document feel */}
        {[15, 30, 45, 60, 75].map((p) => (
          <div key={p} className="absolute w-full h-px" style={{ top: `${p}%`, backgroundColor: C.ash, opacity: 0.03 }} />
        ))}
      </div>

      {/* ── Fixed Navbar ── */}
      <header
        className="fixed top-0 inset-x-0 z-50"
        style={{ backgroundColor: "rgba(8,20,30,0.88)", backdropFilter: "blur(16px)", borderBottom: `1px solid rgba(255,255,255,0.06)` }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: C.crimson, boxShadow: `0 0 20px rgba(115,29,32,0.5)` }}
            >
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight" style={textAsh}>Legal-Tech</span>
              <p className="text-[10px] font-medium -mt-0.5" style={textSl}>Advocate Workspace</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 rounded-full px-2 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { label: "Overview", icon: <Cpu className="w-3.5 h-3.5" />, action: () => setIsOverviewOpen(true), href: null },
              { label: "Features", icon: <Sparkles className="w-3.5 h-3.5" />, action: null, href: "#features" },
              { label: "AI Features", icon: <Bot className="w-3.5 h-3.5" />, action: null, href: "#ai-features" },
            ].map((item) =>
              item.href ? (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 hover:bg-white/10"
                  style={{ color: `${C.ash}99` }}
                  onMouseOver={e => { e.currentTarget.style.color = C.ash; }}
                  onMouseOut={e => { e.currentTarget.style.color = `${C.ash}99`; }}
                >
                  {item.icon}{item.label}
                </a>
              ) : (
                <button key={item.label} onClick={item.action}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 hover:bg-white/10 cursor-pointer"
                  style={{ color: `${C.ash}99` }}
                  onMouseOver={e => { e.currentTarget.style.color = C.ash; }}
                  onMouseOut={e => { e.currentTarget.style.color = `${C.ash}99`; }}
                >
                  {item.icon}{item.label}
                </button>
              )
            )}
          </nav>

          {/* Status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(217,220,226,0.1)", color: "#6ee7b7" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="hidden sm:inline">All Systems Live</span>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-16">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* LEFT — Minimal Hero */}
            <div className="lg:col-span-7 space-y-8">

              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ border: `1px solid rgba(115,29,32,0.5)`, backgroundColor: "rgba(115,29,32,0.15)", color: "#f9a8a8" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={crimsonBg} />
                India&apos;s AI-Powered Legal Workspace
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="font-extrabold tracking-tight leading-[1.1]" style={{ fontSize: "clamp(36px, 5vw, 58px)", color: C.ash }}>
                  Your Legal Practice,
                  <br />
                  <span style={{ color: C.crimson }}>Supercharged.</span>
                </h1>
                <p className="text-sm leading-relaxed max-w-md" style={{ color: C.slate }}>
                  Cause-list sync, AI petition drafting, and client management — built for Indian advocates.
                </p>
              </div>

              {/* Stats — inline separator */}
              <div className="flex items-center gap-8 pt-2">
                {[
                  { value: "50k+", label: "Cases tracked", color: C.ash },
                  { value: "99.4%", label: "Draft accuracy", color: "#f9a8a8" },
                  { value: "Live", label: "e-Courts API", color: "#6ee7b7" },
                ].map((s, i, arr) => (
                  <div key={i} className="flex items-center gap-8">
                    <div>
                      <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: C.slate }}>{s.label}</p>
                    </div>
                    {i < arr.length - 1 && <div className="w-px h-10" style={{ backgroundColor: "rgba(217,220,226,0.12)" }} />}
                  </div>
                ))}
              </div>

              {/* Canvas Mockup */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid rgba(217,220,226,0.10)`, backgroundColor: "rgba(255,255,255,0.03)", boxShadow: "0 24px 48px rgba(0,0,0,0.4)" }}
              >
                {/* Title bar */}
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(217,220,226,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                    <span className="ml-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.slate }}>Advocate Workspace</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: "#6ee7b7" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live
                  </span>
                </div>

                {/* Cards */}
                <div className="grid sm:grid-cols-2 gap-3 p-3">
                  {/* Cause list */}
                  <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(217,220,226,0.08)" }}>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: "#fbbf24" }}>
                        <Clock className="w-3 h-3" /> Cause List
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(110,231,183,0.15)", color: "#6ee7b7" }}>LISTED</span>
                    </div>
                    <p className="text-xs font-semibold" style={textAsh}>Sharma vs. State of Delhi</p>
                    <p className="text-[10px]" style={textSl}>HC Bench 4 · Item #14 · 10:30 AM</p>
                  </div>

                  {/* AI card */}
                  <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: "rgba(115,29,32,0.15)", border: "1px solid rgba(115,29,32,0.25)" }}>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: "#f9a8a8" }}>
                        <Bot className="w-3 h-3" /> AI Match
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(115,29,32,0.3)", color: "#f9a8a8" }}>98.2%</span>
                    </div>
                    <p className="text-xs font-semibold leading-tight" style={textAsh}>Article 21 — speedy trial precedent</p>
                    <p className="text-[10px]" style={textSl}>Satender Kumar Antil v. CBI (2022)</p>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid rgba(217,220,226,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.slate }}>
                    <Sparkles className="w-3 h-3" style={{ color: C.crimson }} />
                    AI ready to draft petitions
                  </span>
                  <button onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-0.5 text-[11px] font-bold cursor-pointer transition-opacity hover:opacity-80"
                    style={{ color: "#f9a8a8" }}
                  >
                    Explore <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT — Sign In Card */}
            <div id="signin" className="lg:col-span-5 scroll-mt-24">
              <div
                className="rounded-2xl relative overflow-hidden"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(217,220,226,0.10)",
                  boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
                  backdropFilter: "blur(24px)",
                }}
              >
                {/* Crimson top edge */}
                <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${C.crimson}, transparent)` }} />

                <div className="p-8 sm:p-9">

                  {/* Logo mark */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(115,29,32,0.25)", border: `1px solid rgba(115,29,32,0.4)` }}>
                      <Scale className="w-5 h-5" style={{ color: "#f9a8a8" }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#f9a8a8" }}>Legal-Tech AI</p>
                      <p className="text-[10px] -mt-0.5" style={textSl}>Secure Advocate Portal</p>
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="mb-7">
                    <h2 className="text-2xl font-extrabold tracking-tight" style={textAsh}>
                      Welcome back,<br />
                      <span style={{ color: C.crimson }}>Counsel.</span>
                    </h2>
                    <p className="text-xs mt-2 leading-relaxed" style={textSl}>
                      Access your workspace, AI tools, and live court data.
                    </p>
                  </div>

                  {/* API Error */}
                  {errors.api && (
                    <div className="mb-5 flex items-start gap-2 text-xs px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(115,29,32,0.2)", border: `1px solid rgba(115,29,32,0.4)`, color: "#f9a8a8" }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errors.api}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-widest block" style={{ color: C.slate }}>
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
                        <input
                          type="email" name="email"
                          placeholder="advocate@lawfirm.com"
                          value={formData.email}
                          onChange={handleChange} onBlur={handleBlur}
                          suppressHydrationWarning
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 placeholder:text-[#4b5c6e] focus:ring-2"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: errors.email && touched.email ? `1px solid rgba(115,29,32,0.7)` : `1px solid rgba(217,220,226,0.12)`,
                            color: C.ash,
                            boxShadow: errors.email && touched.email ? `0 0 0 3px rgba(115,29,32,0.15)` : undefined,
                          }}
                          onFocus={e => {
                            e.target.style.border = `1px solid rgba(115,29,32,0.6)`;
                            e.target.style.boxShadow = `0 0 0 3px rgba(115,29,32,0.12)`;
                          }}
                          onBlurCapture={e => {
                            if (!(errors.email && touched.email)) {
                              e.target.style.border = `1px solid rgba(217,220,226,0.12)`;
                              e.target.style.boxShadow = "none";
                            }
                          }}
                        />
                      </div>
                      {errors.email && touched.email && (
                        <p className="text-[11px] flex items-center gap-1" style={{ color: "#f9a8a8" }}>
                          <AlertCircle className="w-3 h-3" /> {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-widest block" style={{ color: C.slate }}>
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange} onBlur={handleBlur}
                          suppressHydrationWarning
                          className="w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none transition-all duration-300 placeholder:text-[#4b5c6e]"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: errors.password && touched.password ? `1px solid rgba(115,29,32,0.7)` : `1px solid rgba(217,220,226,0.12)`,
                            color: C.ash,
                          }}
                          onFocus={e => {
                            e.target.style.border = `1px solid rgba(115,29,32,0.6)`;
                            e.target.style.boxShadow = `0 0 0 3px rgba(115,29,32,0.12)`;
                          }}
                          onBlurCapture={e => {
                            if (!(errors.password && touched.password)) {
                              e.target.style.border = `1px solid rgba(217,220,226,0.12)`;
                              e.target.style.boxShadow = "none";
                            }
                          }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70 cursor-pointer"
                          style={{ color: C.slate }} suppressHydrationWarning>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && touched.password && (
                        <p className="text-[11px] flex items-center gap-1" style={{ color: "#f9a8a8" }}>
                          <AlertCircle className="w-3 h-3" /> {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-4 h-4 rounded border flex items-center justify-center transition-all" style={{ borderColor: "rgba(217,220,226,0.3)", backgroundColor: "rgba(115,29,32,0.35)" }}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs" style={{ color: C.slate }}>Keep me signed in</span>
                    </label>

                    {/* CTA Button */}
                    <button
                      type="submit" disabled={loading}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 group cursor-pointer relative overflow-hidden transition-all duration-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: loading ? C.slate : `linear-gradient(135deg, #5c1618 0%, ${C.crimson} 50%, #8b2224 100%)`,
                        boxShadow: loading ? "none" : `0 8px 32px rgba(115,29,32,0.45), 0 2px 8px rgba(115,29,32,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
                      }}
                      suppressHydrationWarning
                    >
                      {!loading && (
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)" }} />
                      )}
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
                          <span>Continue to Workspace</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </button>

                  </form>

                  {/* Trust footer */}
                  <div className="mt-8 pt-6 grid grid-cols-3 gap-2 text-center" style={{ borderTop: "1px solid rgba(217,220,226,0.08)" }}>
                    {[
                      { icon: <ShieldCheck className="w-4 h-4" />, label: "256-Bit\nEncrypted" },
                      { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, label: "ISO 27001\nCertified" },
                      { icon: <Scale className="w-4 h-4" />, label: "Bar Council\nCompliant" },
                    ].map((t, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <span style={{ color: C.slate }}>{t.icon}</span>
                        <span className="text-[10px] font-medium leading-tight whitespace-pre-line" style={{ color: `${C.slate}` }}>{t.label}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── AI FEATURES SECTION ── */}
      <section id="ai-features" className="relative z-10 py-24 scroll-mt-16" style={{ borderTop: "1px solid rgba(217,220,226,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ border: `1px solid rgba(115,29,32,0.4)`, backgroundColor: "rgba(115,29,32,0.12)", color: "#f9a8a8" }}>
              <Bot className="w-3.5 h-3.5" />
              Our Project AI Features
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={textAsh}>
              AI Built for Indian Legal Practice
            </h2>
            <p className="text-sm leading-relaxed" style={textSl}>
              From precedent research to petition drafting — powered by Indian jurisprudence.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">

            {/* Tabs */}
            <div className="lg:col-span-5 space-y-2">
              {aiFeatures.map((f, idx) => (
                <div key={f.id} onClick={() => setActiveAiTab(idx)} className="p-4 rounded-xl transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: activeAiTab === idx ? "rgba(115,29,32,0.2)" : "rgba(255,255,255,0.03)",
                    border: activeAiTab === idx ? `1px solid rgba(115,29,32,0.4)` : "1px solid rgba(217,220,226,0.07)",
                    transform: activeAiTab === idx ? "scale(1.01)" : "scale(1)",
                  }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span style={{ color: activeAiTab === idx ? "#f9a8a8" : C.slate }}>{f.icon}</span>
                      <span className="font-bold text-sm" style={{ color: activeAiTab === idx ? C.ash : C.slate }}>{f.title}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(115,29,32,0.2)", color: "#f9a8a8" }}>{f.tag}</span>
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: activeAiTab === idx ? `${C.ash}99` : `${C.slate}` }}>
                    {f.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="lg:col-span-7 rounded-2xl p-6 sm:p-7 relative overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(217,220,226,0.08)", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: C.crimson }} />

              <div className="flex items-center justify-between border-b pb-3 mb-5" style={{ borderColor: "rgba(217,220,226,0.08)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" /><div className="w-2 h-2 rounded-full bg-amber-400" /><div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-[11px] font-mono" style={textSl}>ai_engine.py</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: "rgba(115,29,32,0.2)", color: "#f9a8a8" }}>
                  {aiFeatures[activeAiTab].tag}
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-lg font-bold mb-1.5" style={textAsh}>{aiFeatures[activeAiTab].title}</h4>
                  <p className="text-xs leading-relaxed" style={textSl}>{aiFeatures[activeAiTab].description}</p>
                </div>

                <div className="p-3.5 rounded-xl text-xs space-y-1.5" style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(217,220,226,0.08)" }}>
                  <span className="text-[10px] font-bold uppercase flex items-center gap-1.5" style={{ color: "#fbbf24" }}>
                    <Sparkles className="w-3 h-3" /> Prompt:
                  </span>
                  <p className="font-mono italic" style={textAsh}>&quot;{aiFeatures[activeAiTab].samplePrompt}&quot;</p>
                </div>

                <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: "rgba(115,29,32,0.12)", border: "1px solid rgba(115,29,32,0.25)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: "#6ee7b7" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> AI Response
                    </span>
                    <span className="text-[9px] font-mono" style={textSl}>0.42s</span>
                  </div>
                  <p className="text-xs font-semibold" style={textAsh}>{aiFeatures[activeAiTab].sampleOutput.summary}</p>
                  <ul className="space-y-1.5">
                    {aiFeatures[activeAiTab].sampleOutput.bullets.map((b, i) => (
                      <li key={i} className="text-xs flex gap-2 leading-relaxed" style={textSl}>
                        <span style={{ color: C.crimson }}>•</span><span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="relative z-10 py-24 scroll-mt-16" style={{ borderTop: "1px solid rgba(217,220,226,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ border: `1px solid rgba(75,92,110,0.4)`, backgroundColor: "rgba(75,92,110,0.12)", color: C.ash }}>
              <Briefcase className="w-3.5 h-3.5" />
              About Our Features
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={textAsh}>
              Everything a Law Practice Needs
            </h2>
            <p className="text-sm leading-relaxed" style={textSl}>
              Unified platform for advocates, senior counsels, and legal teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreFeatures.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl transition-all duration-300 group cursor-default"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(217,220,226,0.07)" }}
                onMouseOver={e => { e.currentTarget.style.border = `1px solid rgba(115,29,32,0.3)`; e.currentTarget.style.backgroundColor = "rgba(115,29,32,0.08)"; }}
                onMouseOut={e => { e.currentTarget.style.border = "1px solid rgba(217,220,226,0.07)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(115,29,32,0.2)", border: `1px solid rgba(115,29,32,0.3)` }}>
                  <span style={{ color: "#f9a8a8" }}>{f.icon}</span>
                </div>
                <h3 className="font-bold text-base mb-2" style={textAsh}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={textSl}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OVERVIEW CTA ── */}
      <section className="relative z-10 py-20" style={{ borderTop: "1px solid rgba(217,220,226,0.07)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={textAsh}>How It All Works</h2>
          <p className="text-sm leading-relaxed" style={textSl}>
            Client onboarding → AI research & drafting → e-Courts hearing sync → Retainer settlement.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button onClick={() => setIsOverviewOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: C.crimson, color: "white", boxShadow: `0 8px 24px rgba(115,29,32,0.4)` }}
            >
              View Project Overview <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-10" style={{ borderTop: "1px solid rgba(217,220,226,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={crimsonBg}>
              <Scale className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-sm" style={textAsh}>Legal-Tech AI</span>
            <span style={textSl}>| Advocate OS 2026</span>
          </div>
          <div className="flex items-center gap-5" style={textSl}>
            <button onClick={() => setIsOverviewOpen(true)} className="hover:opacity-70 transition-opacity cursor-pointer">Overview</button>
            <a href="#features" className="hover:opacity-70 transition-opacity">Features</a>
            <a href="#ai-features" className="hover:opacity-70 transition-opacity">AI Features</a>
          </div>
          <p style={textSl}>© 2026 Legal-Tech Inc. · ISO 27001 · Bar Council</p>
        </div>
      </footer>

      {/* ── OVERVIEW MODAL ── */}
      {isOverviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(8,31,45,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative p-6 sm:p-8"
            style={{ backgroundColor: "#0d2838", border: "1px solid rgba(217,220,226,0.1)", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}>
            <button onClick={() => setIsOverviewOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full cursor-pointer transition-opacity hover:opacity-70"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: C.ash }}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(115,29,32,0.25)", border: `1px solid rgba(115,29,32,0.4)` }}>
                <Cpu className="w-5 h-5" style={{ color: "#f9a8a8" }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={textAsh}>Project Overview</h3>
                <p className="text-xs" style={textSl}>Legal-Tech Architecture & System Specs</p>
              </div>
            </div>

            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(115,29,32,0.12)", border: `1px solid rgba(115,29,32,0.25)` }}>
                <h4 className="font-bold mb-1.5 flex items-center gap-2" style={{ color: "#f9a8a8" }}><ShieldCheck className="w-4 h-4" /> Platform Mission</h4>
                <p className="leading-relaxed" style={textSl}>Legal-Tech unifies case files, e-Courts cause list syncing, AI-assisted research, and client billing into a single high-security workspace for Indian advocates.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: "Core Framework", value: "Next.js 16 + React 19", sub: "Tailwind CSS v4, Lucide Icons" },
                  { label: "Backend Engine", value: "Python FastAPI + PostgreSQL", sub: "OAuth2 JWT + e-Courts Scraper" },
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl space-y-1" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(217,220,226,0.08)" }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={textSl}>{item.label}</span>
                    <p className="font-bold text-sm" style={textAsh}>{item.value}</p>
                    <p style={textSl}>{item.sub}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm" style={textAsh}>Key Modules</h4>
                {[
                  { label: "e-Courts National Portal Integration", tag: "AUTOMATED" },
                  { label: "AI Precedent Vector Search (SC & High Courts)", tag: "SEMANTIC" },
                  { label: "Multi-Role Permissions (Advocate, Junior, Clerk, Client)", tag: "ROLE-BASED" },
                  { label: "Razorpay Legal Retainer & Fee Gateway", tag: "SECURE" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(217,220,226,0.07)" }}>
                    <span className="font-semibold" style={textAsh}>{m.label}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(115,29,32,0.25)", color: "#f9a8a8" }}>{m.tag}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setIsOverviewOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-opacity hover:opacity-80"
                  style={{ backgroundColor: C.crimson, color: "white" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI FEATURES MODAL ── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(8,31,45,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative p-6 sm:p-8"
            style={{ backgroundColor: "#0d2838", border: "1px solid rgba(217,220,226,0.1)", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}>
            <button onClick={() => setIsAiModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full cursor-pointer transition-opacity hover:opacity-70"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: C.ash }}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(115,29,32,0.25)", border: `1px solid rgba(115,29,32,0.4)` }}>
                <Bot className="w-5 h-5" style={{ color: "#f9a8a8" }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={textAsh}>AI Features</h3>
                <p className="text-xs" style={textSl}>How AI Powers Legal-Tech</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {aiFeatures.map((f, i) => (
                <div key={i} className="p-4 rounded-xl space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(217,220,226,0.08)" }}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-sm" style={textAsh}>
                      <span style={{ color: "#f9a8a8" }}>{f.icon}</span>{f.title}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(115,29,32,0.2)", color: "#f9a8a8" }}>{f.tag}</span>
                  </div>
                  <p className="leading-relaxed" style={textSl}>{f.description}</p>
                  <div className="p-3 rounded-lg space-y-1" style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(217,220,226,0.07)" }}>
                    <span className="text-[10px] font-bold uppercase" style={{ color: "#fbbf24" }}>Example prompt:</span>
                    <p className="font-mono italic" style={textAsh}>&quot;{f.samplePrompt}&quot;</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button onClick={() => setIsAiModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-opacity hover:opacity-80"
                  style={{ backgroundColor: C.crimson, color: "white" }}>
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}