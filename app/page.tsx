"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";

const FloatingCalc = dynamic(
  () => import("../src/components/patrimonio/FloatingCalc"),
  { ssr: false }
);

// ── Phone components ──────────────────────────────────────────────

function TabBar({ active }: { active: 0 | 1 | 2 | 3 }) {
  const strokes = [0, 1, 2, 3].map(i => i === active ? "#6366f1" : "#5f6672");
  return (
    <div className="flex justify-around items-center pt-2.5 pb-1 mt-2 phone-tab">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokes[0]} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokes[1]} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokes[2]} strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /></svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokes[3]} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0112 0v2" /></svg>
    </div>
  );
}

function PhoneShell({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  return (
    <div className="phone-shell overflow-hidden relative" style={{ width: w, height: h }}>
      <div className="phone-notch absolute top-3 left-1/2 -translate-x-1/2 z-10" />
      <div className="flex flex-col h-full pt-14 px-4 pb-3">{children}</div>
    </div>
  );
}

function PhoneAccounts() {
  const accounts = [
    { bg: "#f7c94822", color: "#f7c948", label: "BC", name: "Bancolombia", sub: "Ahorros", amount: "$18.5M" },
    { bg: "#a855f722", color: "#a855f7", label: "NQ", name: "Nequi", sub: "Corriente", amount: "$2.34M" },
    { bg: "#ec489922", color: "#ec4899", label: "Nu", name: "Nu Colombia", sub: "Tarjeta", amount: "$890k" },
  ];
  return (
    <PhoneShell w={220} h={460}>
      <div className="mb-3.5">
        <div className="text-xs phone-dim font-mono uppercase tracking-widest mb-0.5">Cuentas</div>
        <div className="text-xl font-semibold phone-fg font-mono">$21.730.000</div>
        <div className="text-xs phone-pos mt-0.5">3 cuentas activas</div>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {accounts.map(a => (
          <div key={a.name} className="phone-card-bd rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono" style={{ background: a.bg, color: a.color }}>{a.label}</div>
                <div>
                  <div className="text-xs font-medium phone-fg">{a.name}</div>
                  <div className="text-xs phone-dim">{a.sub}</div>
                </div>
              </div>
              <span className="text-xs font-semibold phone-fg font-mono">{a.amount}</span>
            </div>
          </div>
        ))}
      </div>
      <TabBar active={0} />
    </PhoneShell>
  );
}

function PhoneSummary({ w = 252, h = 520 }: { w?: number; h?: number }) {
  const txns = [
    { icon: "\u{1F6D2}", name: "Mercado", sub: "Hoy", amount: "−$87k", color: "#d67c78" },
    { icon: "\u{1F4BC}", name: "Nómina", sub: "Ayer", amount: "+$5.8M", color: "#5cae87" },
    { icon: "\u{1F3E0}", name: "Arriendo", sub: "Jul 1", amount: "−$1.2M", color: "#d67c78" },
  ];
  return (
    <PhoneShell w={w} h={h}>
      <div className="mb-4">
        <div className="text-xs phone-dim font-mono uppercase tracking-widest mb-0.5">Resumen &middot; Jul 2026</div>
        <div className="text-2xl font-semibold phone-fg font-mono leading-tight">$82.340.000</div>
        <div className="flex items-center gap-1.5 mt-1">
          <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,1 9,9 1,9" fill="#5cae87" /></svg>
          <span className="text-xs phone-pos font-mono">+8.4% este a&ntilde;o</span>
        </div>
      </div>
      <div className="phone-card rounded-lg p-2.5 mb-3">
        <svg width="100%" height="44" viewBox="0 0 222 44" preserveAspectRatio="none">
          <defs><linearGradient id="pcg-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
          <path d="M0,38 C18,35 36,30 54,26 C72,22 90,29 108,23 C126,17 144,10 162,8 C180,6 198,9 222,4 L222,44 L0,44 Z" fill="url(#pcg-s)" />
          <path d="M0,38 C18,35 36,30 54,26 C72,22 90,29 108,23 C126,17 144,10 162,8 C180,6 198,9 222,4" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="phone-card rounded-lg p-2.5"><div className="text-xs phone-dim mb-0.5 font-mono uppercase">Ingresos</div><div className="text-sm font-semibold phone-pos font-mono">$8.45M</div></div>
        <div className="phone-card rounded-lg p-2.5"><div className="text-xs phone-dim mb-0.5 font-mono uppercase">Gastos</div><div className="text-sm font-semibold phone-neg font-mono">$4.12M</div></div>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {txns.map(t => (
          <div key={t.name} className="flex items-center justify-between phone-card rounded-lg py-2 px-2.5">
            <div className="flex items-center gap-2">
              <div className="size-6.5 rounded-lg flex items-center justify-center text-xs" style={{ background: "#1b1e25" }}>{t.icon}</div>
              <div><div className="text-xs font-medium phone-fg">{t.name}</div><div className="text-xs phone-dim">{t.sub}</div></div>
            </div>
            <span className="text-xs font-mono" style={{ color: t.color }}>{t.amount}</span>
          </div>
        ))}
      </div>
      <TabBar active={0} />
    </PhoneShell>
  );
}

function PhoneInvestments() {
  const assets = [
    { bg: "#f7931a1a", color: "#f7931a", label: "₿", name: "Bitcoin", amount: "$9.84M", pct: "+14.2%" },
    { bg: "#627eea1a", color: "#627eea", label: "Ξ", name: "Ethereum", amount: "$4.23M", pct: "+7.8%" },
    { bg: "#1b1e25", color: "#5cae87", label: "S&P", name: "S&P 500", amount: "$12.65M", pct: "+21.3%" },
    { bg: "#1b1e25", color: "#9ba1ab", label: "CDT", name: "CDT 12%", amount: "$20M", pct: "12% E.A." },
  ];
  return (
    <PhoneShell w={220} h={460}>
      <div className="mb-2.5">
        <div className="text-xs phone-dim font-mono uppercase tracking-widest mb-0.5">Inversiones</div>
        <div className="text-xl font-semibold phone-fg font-mono">$46.720.000</div>
        <div className="text-xs phone-pos mt-0.5">+16.4% total</div>
      </div>
      <div className="phone-card rounded-lg p-2.5 mb-2.5">
        <svg width="100%" height="36" viewBox="0 0 192 36" preserveAspectRatio="none">
          <path d="M0,30 L24,27 L48,24 L72,18 L96,20 L120,13 L144,10 L168,7 L192,4" fill="none" stroke="#5cae87" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {assets.map(a => (
          <div key={a.name} className="phone-card rounded-lg p-2.5" style={{ border: "1px solid #1b1e25" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-6.5 rounded-lg flex items-center justify-center text-xs font-bold font-mono" style={{ background: a.bg, color: a.color }}>{a.label}</div>
                <span className="text-xs font-medium phone-fg">{a.name}</span>
              </div>
              <div className="text-right"><div className="text-xs phone-fg font-mono">{a.amount}</div><div className="text-xs phone-pos">{a.pct}</div></div>
            </div>
          </div>
        ))}
      </div>
      <TabBar active={2} />
    </PhoneShell>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────

function Bullet({ color = "var(--indigo)", children }: { color?: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="size-4.5 rounded-full shrink-0 mt-0.5 flex items-center justify-center" style={{ background: color }}>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <span className="text-sm text-muted leading-normal">{children}</span>
    </div>
  );
}

// Pill button with trailing arrow circle — Halo style
function PillBtn({ children, href, dark = false, onClick }: { children: React.ReactNode; href?: string; dark?: boolean; onClick?: () => void }) {
  const cls = `inline-flex items-center gap-3 font-semibold pl-7 pr-2 py-2 rounded-full text-sm transition-opacity hover:opacity-85 no-underline cursor-pointer ${dark ? "bg-fg lp-pill-dark" : "bg-panel border border-line text-fg"}`;
  const icon = (
    <span className={`size-8 rounded-full flex items-center justify-center ${dark ? "lp-pill-icon" : "bg-fg"}`}>
      <ArrowRight className={`w-4 h-4 ${dark ? "lp-pill-arrow" : "text-bg"}`} />
    </span>
  );
  if (href) return <Link href={href} className={cls}>{children}{icon}</Link>;
  return <button className={cls} onClick={onClick}>{children}{icon}</button>;
}

// Tight section heading — Halo typography style
function Heading({ children, size = "lg", className = "" }: { children: React.ReactNode; size?: "xl" | "lg" | "md"; className?: string }) {
  const sz = size === "xl" ? "text-3xl md:text-5xl lg:text-6xl" : size === "lg" ? "text-2xl md:text-4xl lg:text-5xl" : "text-xl md:text-3xl lg:text-4xl";
  return (
    <h2 className={`font-serif font-light text-fg leading-tight ${sz} ${className}`} style={{ letterSpacing: "-0.03em" }}>
      {children}
    </h2>
  );
}

// ── Feature marquee ───────────────────────────────────────────────

const MARQUEE_ITEMS = [
  { text: "Patrimonio neto", style: { fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" } },
  { text: "Inversiones", style: { fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" as const } },
  { text: "Registro por voz", style: { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, fontSize: 15, fontStyle: "italic" } },
  { text: "Bot Telegram", style: { fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" as const } },
  { text: "Presupuestos", style: { fontFamily: "'Palatino Linotype', serif", fontWeight: 400, fontSize: 16, letterSpacing: "-0.01em" } },
  { text: "Metas de ahorro", style: { fontFamily: "Impact, 'Arial Narrow', sans-serif", fontWeight: 400, fontSize: 14, letterSpacing: "0.04em" } },
  { text: "Criptomonedas", style: { fontFamily: "Verdana, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "-0.03em" } },
  { text: "CDTs Colombia", style: { fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.02em" } },
  { text: "DIAN", style: { fontFamily: "Arial Black, sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: "0.06em" } },
  { text: "Multi-divisa", style: { fontFamily: "Verdana, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" as const } },
];

function FeatureMarquee() {
  return (
    <div className="overflow-hidden py-10 border-y border-line">
      <style>{`
        @keyframes fm { to { transform: translateX(-50%); } }
        .fm-track { display: flex; width: max-content; animation: fm 28s linear infinite; }
      `}</style>
      <div className="fm-track">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} className="mx-8 shrink-0 text-muted whitespace-nowrap" style={item.style}>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function LandingPage() {
  const [isLight, setIsLight] = useState(false);
  const [toast, setToast] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  useEffect(() => {
    setIsLight(document.documentElement.getAttribute("data-theme") === "light");

    const onScroll = () => {
      if (!navRef.current) return;
      const s = window.scrollY > 20;
      navRef.current.style.background = s ? "var(--nav-bg)" : "transparent";
      navRef.current.style.borderBottomColor = s ? "var(--line)" : "transparent";
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const ring = document.querySelector(".lp-c-ring") as HTMLElement | null;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      if (ring) ring.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
      if (!visible && ring) { ring.style.opacity = "1"; visible = true; }
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const onLeave = () => { if (ring) ring.style.opacity = "0"; visible = false; };
    const onEnter = () => { if (visible && ring) ring.style.opacity = "1"; };
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("fi-vis"); }),
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    document.querySelectorAll(".fi-fade").forEach(el => obs.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      obs.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    const val = next ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", val);
    document.cookie = `gfp-theme=${val}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <div className="landing-page bg-bg text-fg min-h-screen overflow-x-hidden">
      <div className="lp-c-ring" aria-hidden="true" />

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: 28, left: "50%", transform: `translateX(-50%) translateY(${toast ? 0 : 16}px)`,
        opacity: toast ? 1 : 0, transition: "opacity 0.25s, transform 0.25s",
        background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14,
        padding: "12px 20px", fontSize: 14, fontWeight: 500, color: "var(--fg)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 9999, pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
        🍎 iOS próximamente — estamos trabajando en ello
      </div>

      {/* ── NAV ── */}
      <nav ref={navRef} className="fi-nav">
        <div className="lp-container px-10 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-semibold text-fg tracking-tight no-underline" style={{ letterSpacing: "-0.03em" }}>Finance</Link>
          <div className="nav-links flex gap-8">
            <a href="#conoce" className="nav-link">Funciones</a>
            <a href="#descargar" className="nav-link">Descargar</a>
            <Link href="/help" className="nav-link">Ayuda</Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="bg-panel2 border border-line rounded-full size-9 flex items-center justify-center cursor-pointer text-muted">
              {!isLight
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              }
            </button>
            <PillBtn href="/login" dark>Entrar</PillBtn>
          </div>
        </div>
      </nav>

      {/* ── HERO (intacto) ── */}
      <section className="landing-section hero-section min-h-screen flex items-center pt-30 px-10 pb-20 relative overflow-hidden">
        <div className="hero-inner lp-container w-full flex items-center gap-20 relative z-10">
          <div className="hero-text flex-1 min-w-0">
            <div className="hero-badge inline-flex items-center gap-2 bg-panel2 border border-line rounded-full py-1.5 px-4 mb-8">
              <span className="size-1.5 bg-indigo rounded-full inline-block shrink-0" />
              <span className="text-xs font-semibold tracking-widest uppercase text-muted font-mono">Finanzas personales &middot; Colombia</span>
            </div>
            <h1 className="font-serif hero-title hero-title font-semibold leading-tight text-fg mb-6">
              Tu patrimonio,<br /><em>bajo control.</em>
            </h1>
            <p className="hero-text text-lg leading-relaxed text-muted max-w-md mb-10">
              Registra ingresos, gastos e inversiones en segundos. Conecta cuentas, define metas y visualiza tu riqueza en tiempo real.
            </p>
            <div className="hero-ctas flex items-center gap-3 flex-wrap">
              <Link href="/login" className="btn-fill">Comenzar gratis</Link>
              <a href="#descargar" className="btn-outline">Descargar app</a>
            </div>
            <p className="hero-platforms mt-7 text-sm text-dim font-mono">Web &middot; iOS &middot; Android &middot; Telegram</p>
          </div>
          <div className="phone-fan">
            <div className="fl0 absolute left-5 bottom-0 z-10 opacity-80"><PhoneAccounts /></div>
            <div className="fl1 absolute left-1/2 -translate-x-1/2 bottom-0 z-30"><PhoneSummary /></div>
            <div className="fl2 absolute right-5 bottom-0 z-20 opacity-80"><PhoneInvestments /></div>
          </div>
        </div>
      </section>

      {/* ── CONOCE FINANCE ── */}
      <section id="conoce" className="landing-section py-28 px-10 bg-bg">
        <div className="lp-container">
          {/* 2-col header */}
          <div className="fi-fade grid grid-cols-1 md:grid-cols-2 gap-12 mb-14 items-start">
            <div>
              <Heading size="lg" className="mb-8">Conoce Finance.</Heading>
              <PillBtn href="#funciones" dark>Explorar funciones</PillBtn>
            </div>
            <p className="text-base md:text-xl lg:text-2xl leading-relaxed text-muted" style={{ letterSpacing: "-0.01em" }}>
              Una plataforma de finanzas personales construida para la realidad colombiana — inversiones, gastos y metas en un solo lugar.
            </p>
          </div>

          {/* 4-col dark card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 — wide, gradient */}
            <div className="fi-fade lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #18192a 0%, #23253e 100%)" }}>
              <div className="p-7 min-h-80 flex flex-col justify-between">
                <p className="font-serif text-2xl font-medium text-white leading-snug" style={{ letterSpacing: "-0.02em" }}>
                  Tu patrimonio,<br />siempre visible.
                </p>
                <p className="text-white/55 text-base max-w-xs">
                  Patrimonio neto consolidado en tiempo real. Cuentas, inversiones y deudas en un vistazo.
                </p>
              </div>
            </div>
            {/* Card 2 — dark */}
            <div className="fi-fade d1 rounded-2xl p-7 min-h-80 flex flex-col justify-between" style={{ background: "#1c1e2d" }}>
              <p className="font-serif text-2xl font-medium text-white leading-snug" style={{ letterSpacing: "-0.02em" }}>
                Siempre<br />sincronizado.
              </p>
              <p className="text-white/55 text-base">
                Web, app m&oacute;vil o Telegram. Tus datos siempre al d&iacute;a desde cualquier dispositivo.
              </p>
            </div>
            {/* Card 3 — dark */}
            <div className="fi-fade d2 rounded-2xl p-7 min-h-80 flex flex-col justify-between" style={{ background: "#1c1e2d" }}>
              <p className="font-serif text-2xl font-medium text-white leading-snug" style={{ letterSpacing: "-0.02em" }}>
                Registro<br />autom&aacute;tico.
              </p>
              <p className="text-white/55 text-base">
                Habla o escribe en espa&ntilde;ol. Finance detecta tipo, monto y categor&iacute;a sin esfuerzo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE MARQUEE STRIP ── */}
      <div className="px-0">
        <FeatureMarquee />
      </div>

      {/* ── DASHBOARD OVERVIEW ── */}
      <section id="funciones" className="landing-section lp-panel-section lp-dash-section py-28 px-10 bg-panel relative overflow-hidden">
        <div className="lp-container relative">
          <div className="fi-fade mb-5">
            <p className="text-sm font-medium text-muted mb-3" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Panel principal</p>
            <Heading size="lg" className="mb-4">Todo en un vistazo.</Heading>
            <p className="text-base text-muted leading-relaxed max-w-md">El panel central muestra patrimonio, movimientos e inversiones sin navegar entre pantallas.</p>
          </div>

          <div className="fi-fade lp-dash-mock bg-bg border border-line rounded-2xl p-7 mt-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-mono text-xs text-dim uppercase tracking-wider mb-0.5">Resumen</div>
                <div className="text-lg font-semibold text-fg">Julio 2026</div>
              </div>
              <div className="flex gap-1.5">
                {["←", "→"].map(ch => <button key={ch} className="bg-panel border border-line rounded-lg py-1.5 px-3 text-xs text-muted cursor-pointer font-mono">{ch}</button>)}
              </div>
            </div>
            <div className="dash-kpis grid grid-cols-3 gap-3.5 mb-4">
              {[
                { label: "Ingresos", val: "$8.450.000", sub: "+12% vs junio", color: "var(--pos)" },
                { label: "Gastos", val: "$4.120.000", sub: "−3% vs junio", color: "var(--neg)" },
                { label: "Ahorro neto", val: "$4.330.000", sub: "Tasa: 51.2%", color: "var(--pos)", valColor: "var(--fg)" },
              ].map(k => (
                <div key={k.label} className="bg-panel border border-line rounded-xl p-4">
                  <div className="text-xs text-dim mb-2 font-mono uppercase tracking-wider">{k.label}</div>
                  <div className="text-xl font-semibold font-mono" style={{ color: k.valColor ?? k.color }}>{k.val}</div>
                  <div className="text-xs mt-1" style={{ color: k.label === "Ahorro neto" ? "var(--pos)" : "var(--dim)" }}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="dash-grid-patrimony grid gap-3.5 mb-3.5">
              <div className="bg-panel border border-line rounded-xl p-4 flex flex-col justify-between">
                <div className="text-xs text-dim font-mono uppercase tracking-wider mb-2">Patrimonio</div>
                <div>
                  <div className="text-2xl font-semibold text-fg font-mono leading-tight">$82.340.000</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,1 9,9 1,9" fill="var(--pos)" /></svg>
                    <span className="text-xs text-pos font-mono">+8.4% este a&ntilde;o</span>
                  </div>
                </div>
              </div>
              <div className="bg-panel border border-line rounded-xl p-4 overflow-hidden">
                <div className="text-xs text-dim font-mono uppercase tracking-wider mb-3">Evoluci&oacute;n &middot; 12 meses</div>
                <svg width="100%" height="72" viewBox="0 0 580 72" preserveAspectRatio="none">
                  <defs><linearGradient id="dcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                  <path d="M0,62 C40,58 80,52 120,46 C160,40 190,54 230,46 C270,38 300,28 340,22 C380,16 410,26 450,18 C490,10 530,8 580,4 L580,72 L0,72 Z" fill="url(#dcg)" />
                  <path d="M0,62 C40,58 80,52 120,46 C160,40 190,54 230,46 C270,38 300,28 340,22 C380,16 410,26 450,18 C490,10 530,8 580,4" fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="dash-grid-bottom grid grid-cols-2 gap-3.5">
              <div className="bg-panel border border-line rounded-xl p-4">
                <div className="text-xs text-dim font-mono uppercase tracking-wider mb-3.5">&Uacute;ltimas transacciones</div>
                <div className="flex flex-col gap-2.5">
                  {[
                    { icon: "\u{1F6D2}", name: "Mercado", sub: "Hoy · Alimentos", amount: "−$87.000", color: "var(--neg)" },
                    { icon: "\u{1F4BC}", name: "Nómina", sub: "Ayer · Ingresos", amount: "+$5.800.000", color: "var(--pos)" },
                    { icon: "\u{1F3E0}", name: "Arriendo", sub: "Jul 1 · Vivienda", amount: "−$1.200.000", color: "var(--neg)" },
                    { icon: "⚡", name: "Servicios", sub: "Jun 30 · Hogar", amount: "−$145.000", color: "var(--neg)" },
                  ].map(t => (
                    <div key={t.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 bg-panel2 rounded-lg flex items-center justify-center text-sm">{t.icon}</div>
                        <div><div className="text-sm font-medium text-fg">{t.name}</div><div className="text-xs text-dim">{t.sub}</div></div>
                      </div>
                      <span className="text-sm font-semibold font-mono" style={{ color: t.color }}>{t.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-panel border border-line rounded-xl p-4">
                <div className="text-xs text-dim font-mono uppercase tracking-wider mb-3.5">Portafolio</div>
                <div className="flex flex-col gap-2.5">
                  {[
                    { bg: "#f7931a18", color: "#f7931a", label: "₿", name: "Bitcoin", sub: "0.0342 BTC", val: "$9.840.000", pct: "+14.2%" },
                    { bg: "#627eea18", color: "#627eea", label: "Ξ", name: "Ethereum", sub: "1.28 ETH", val: "$4.230.000", pct: "+7.8%" },
                    { bg: "var(--panel2)", color: "var(--pos)", label: "S&P", name: "S&P 500", sub: "3 ETFs", val: "$12.650.000", pct: "+21.3%" },
                    { bg: "var(--panel2)", color: "var(--muted)", label: "CDT", name: "CDT Bancolombia", sub: "Vence sep 2026", val: "$20.000.000", pct: "12% E.A." },
                  ].map(a => (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono" style={{ background: a.bg, color: a.color }}>{a.label}</div>
                        <div><div className="text-sm font-medium text-fg">{a.name}</div><div className="text-xs text-dim">{a.sub}</div></div>
                      </div>
                      <div className="text-right"><div className="text-sm font-semibold text-fg font-mono">{a.val}</div><div className="text-xs text-pos">{a.pct}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS ── */}
      <section className="landing-section py-28 px-10 bg-bg">
        <div className="lp-container">
          <div className="fi-fade mb-14">
            <p className="text-sm font-medium text-muted mb-3" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Funciones</p>
            <Heading size="lg">Dise&ntilde;ado para c&oacute;mo<br />realmente manejas el dinero.</Heading>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>, title: "Registro por voz", desc: "Habla o escribe en español natural. Finance detecta tipo, monto y categoría automáticamente.", delay: "", dark: false },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5cae87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>, title: "Inversiones en tiempo real", desc: "Acciones, cripto y alto rendimiento consolidados. Precios actualizados y proyecciones incluidas.", delay: "d1", dark: true },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>, title: "Multi-canal", desc: "Web, app móvil, Telegram o CSV. Registra desde donde más te convenga.", delay: "d2", dark: true },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-b)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>, title: "Comercio integrado", desc: "Gestiona productos, clientes, ventas y fiado desde el mismo panel financiero.", delay: "d3", dark: false },
            ].map(card => (
              <div
                key={card.title}
                className={`fi-fade ${card.delay} rounded-2xl p-7 min-h-64 flex flex-col justify-between relative overflow-hidden ${card.dark ? "" : "feat-card"}`}
                style={card.dark ? { background: "#1c1e2d" } : undefined}
              >
                {card.dark && (
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
                )}
                <div className={`size-11 rounded-xl flex items-center justify-center mb-5 border relative z-10 ${card.dark ? "border-white/10 bg-white/5" : "bg-panel2 border-line"}`}>{card.icon}</div>
                <div className="relative z-10">
                  <h3 className={`font-serif text-xl font-medium mb-2.5 tracking-tight ${card.dark ? "text-white" : "text-fg"}`} style={{ letterSpacing: "-0.02em" }}>{card.title}</h3>
                  <p className={`text-sm leading-relaxed ${card.dark ? "text-white/55" : "text-muted"}`}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Wide card */}
          <div className="fi-fade rounded-2xl p-7 mt-4 flex items-center gap-7" style={{ background: "#1c1e2d", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />
            <div className="size-11 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 shrink-0 relative z-10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(220,80,80,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <div className="relative z-10">
              <h3 className="font-serif text-xl font-medium text-white mb-1.5" style={{ letterSpacing: "-0.02em" }}>Consignaciones DIAN</h3>
              <p className="text-sm leading-relaxed text-white/55 max-w-xl">Rastrea pagos de impuestos y fechas clave del calendario tributario colombiano. Sin sorpresas en declaraci&oacute;n de renta.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="landing-section lp-panel-section py-28 px-10 bg-panel">
        <div className="lp-container">
          <div className="fi-fade text-center mb-16">
            <Heading size="lg" className="mx-auto max-w-2xl">Construido para la realidad<br /><em>colombiana.</em></Heading>
          </div>
          <div className="stats-grid grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { val: "17+", label: "Categorías inteligentes preconfiguradas", color: "var(--fg)", delay: "" },
              { val: "3", label: "Canales de registro — Web, App, Telegram", color: "var(--fg)", delay: "d1" },
              { val: "COP", label: "Pensado exclusivamente para Colombia", color: "var(--indigo-b)", delay: "d2" },
              { val: "24/7", label: "Acceso desde cualquier dispositivo", color: "var(--fg)", delay: "" },
              { val: "<5s", label: "Para registrar por voz o texto natural", color: "var(--pos)", delay: "d1" },
              { val: "100%", label: "Tus datos son privados y solo tuyos", color: "var(--fg)", delay: "d2" },
            ].map(s => (
              <div key={s.val} className={`fi-fade ${s.delay} bg-panel border border-line rounded-2xl py-8 px-6`}>
                <div className="font-serif text-5xl font-light mb-3 leading-none" style={{ letterSpacing: "-0.04em", color: s.color }}>{s.val}</div>
                <div className="text-sm text-muted leading-normal">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT: VOICE ── */}
      <section className="landing-section py-28 px-10 bg-bg">
        <div className="lp-container">
          <div className="split-row flex items-center gap-20">
            <div className="fi-fade flex-1 min-w-0 max-w-lg">
              <p className="text-sm font-medium text-muted mb-4" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Registro inteligente</p>
              <Heading size="md" className="mb-5">Di lo que gastaste.<br /><em>Finance hace el resto.</em></Heading>
              <p className="text-base leading-relaxed text-muted mb-7">Habla o escribe en espa&ntilde;ol desde Telegram, la app o la web. El sistema detecta tipo, monto, categor&iacute;a y moneda autom&aacute;ticamente.</p>
              <div className="flex flex-col gap-3 mb-8">
                <Bullet>Detecci&oacute;n autom&aacute;tica de categor&iacute;as</Bullet>
                <Bullet>Soporte en pesos colombianos y USD</Bullet>
                <Bullet>Desde Telegram sin abrir ninguna app</Bullet>
              </div>
            </div>
            <div className="split-mock fi-fade flex-1 flex justify-center">
              <div className="bg-panel border border-line rounded-2xl p-5 w-full max-w-sm">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-line">
                  <div className="size-9 rounded-full flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg,#229ED9,#1a7fb5)" }}>{"✈"}</div>
                  <div><div className="text-sm font-semibold text-fg">Finance Bot</div><div className="text-xs text-pos">en l&iacute;nea</div></div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-end"><div className="bg-indigo text-white rounded-2xl rounded-br py-2.5 px-3.5 max-w-60 text-sm leading-normal">gast&eacute; 87 mil en el &eacute;xito hoy</div></div>
                  <div className="flex justify-start"><div className="bg-panel2 border border-line text-fg rounded-2xl rounded-bl py-3 px-3.5 max-w-72 text-sm leading-relaxed">
                    <div className="mb-1">{"✓"} Transacci&oacute;n registrada:</div>
                    <div className="font-mono text-xs text-muted flex flex-col gap-0.5"><span>{"→"} Gasto &middot; $87.000 COP</span><span>{"→"} Categor&iacute;a: Alimentos</span><span>{"→"} Comercio: &Eacute;xito</span></div>
                  </div></div>
                  <div className="flex justify-end"><div className="bg-indigo text-white rounded-2xl rounded-br py-2.5 px-3.5 max-w-60 text-sm leading-normal">tambi&eacute;n pagu&eacute; netflix 52900</div></div>
                  <div className="flex justify-start"><div className="bg-panel2 border border-line text-fg rounded-2xl rounded-bl py-3 px-3.5 max-w-72 text-sm leading-relaxed">
                    <div className="mb-1">{"✓"} Registrado:</div>
                    <div className="font-mono text-xs text-muted flex flex-col gap-0.5"><span>{"→"} Suscripci&oacute;n &middot; $52.900 COP</span><span>{"→"} Categor&iacute;a: Entretenimiento</span><span>{"→"} Pago recurrente detectado</span></div>
                  </div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPLIT: INVESTMENTS ── */}
      <section className="landing-section lp-panel-section py-28 px-10 bg-panel">
        <div className="lp-container">
          <div className="split-row flex items-center gap-20 flex-row-reverse">
            <div className="fi-fade flex-1 min-w-0 max-w-lg">
              <p className="text-sm font-medium mb-4" style={{ letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--pos)" }}>Portafolio</p>
              <Heading size="md" className="mb-5">Acciones, cripto y CDTs.<br /><em>En un solo lugar.</em></Heading>
              <p className="text-base leading-relaxed text-muted mb-7">Consolida acciones, ETFs, criptomonedas y alto rendimiento. Precios en tiempo real, rendimiento total y proyecciones hist&oacute;ricas.</p>
              <div className="flex flex-col gap-3">
                <Bullet color="var(--pos)">Cripto: Bitcoin, Ethereum y altcoins</Bullet>
                <Bullet color="var(--pos)">Acciones y ETFs en USD</Bullet>
                <Bullet color="var(--pos)">CDTs, fondos y alto rendimiento COP</Bullet>
              </div>
            </div>
            <div className="split-mock fi-fade flex-1 flex justify-center">
              <div className="bg-bg border border-line rounded-2xl p-6 w-full max-w-sm">
                <div className="mb-3">
                  <div className="text-xs text-dim font-mono uppercase tracking-wider mb-1">Portafolio total</div>
                  <div className="flex items-baseline gap-3"><span className="text-2xl font-semibold text-fg font-mono">$46.720.000</span><span className="text-sm text-pos">+16.4%</span></div>
                </div>
                <div className="bg-panel rounded-xl py-2.5 px-3.5 mb-3.5">
                  <svg width="100%" height="52" viewBox="0 0 340 52" preserveAspectRatio="none">
                    <defs><linearGradient id="ig-p" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5cae87" stopOpacity={0.3} /><stop offset="100%" stopColor="#5cae87" stopOpacity={0} /></linearGradient></defs>
                    <path d="M0,44 C20,42 40,38 80,32 C120,26 150,36 190,28 C230,20 260,14 300,10 L340,6 L340,52 L0,52 Z" fill="url(#ig-p)" />
                    <path d="M0,44 C20,42 40,38 80,32 C120,26 150,36 190,28 C230,20 260,14 300,10 L340,6" fill="none" stroke="#5cae87" strokeWidth={2.5} strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { bg: "#f7931a18", color: "#f7931a", label: "₿", name: "Bitcoin", val: "$9.840.000", pct: "+14.2%" },
                    { bg: "#627eea18", color: "#627eea", label: "Ξ", name: "Ethereum", val: "$4.230.000", pct: "+7.8%" },
                    { bg: "var(--panel2)", color: "var(--pos)", label: "S&P", name: "S&P 500", val: "$12.650.000", pct: "+21.3%" },
                    { bg: "var(--panel2)", color: "var(--muted)", label: "CDT", name: "CDT 12% E.A.", val: "$20.000.000", pct: "12.0%" },
                  ].map(a => (
                    <div key={a.name} className="flex items-center justify-between py-2.5 px-3 bg-panel rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono" style={{ background: a.bg, color: a.color }}>{a.label}</div>
                        <span className="text-sm font-medium text-fg">{a.name}</span>
                      </div>
                      <div className="text-right"><div className="text-sm text-fg font-mono">{a.val}</div><div className="text-xs text-pos">{a.pct}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPLIT: GOALS ── */}
      <section className="landing-section py-28 px-10 bg-bg">
        <div className="lp-container">
          <div className="split-row flex items-center gap-20">
            <div className="fi-fade flex-1 min-w-0 max-w-lg">
              <p className="text-sm font-medium text-muted mb-4" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Metas y presupuestos</p>
              <Heading size="md" className="mb-5">Define metas.<br /><em>Alc&aacute;nzalas con claridad.</em></Heading>
              <p className="text-base leading-relaxed text-muted mb-7">Presupuestos mensuales por categor&iacute;a, metas de ahorro con fecha objetivo y alertas cuando te acercas al l&iacute;mite.</p>
              <div className="flex flex-col gap-3">
                <Bullet>Presupuestos por categor&iacute;a con alertas</Bullet>
                <Bullet>Metas de ahorro con barra de progreso</Bullet>
                <Bullet>Pagos recurrentes y suscripciones</Bullet>
              </div>
            </div>
            <div className="split-mock fi-fade flex-1 flex justify-center">
              <div className="bg-panel border border-line rounded-2xl p-6 w-full max-w-sm">
                <div className="text-xs text-dim font-mono uppercase tracking-wider mb-4">Metas activas</div>
                <div className="flex flex-col gap-3.5">
                  {[
                    { name: "Viaje a Cartagena", pct: 68, current: "$2.040.000", total: "$3.000.000", date: "dic 2026", color: "var(--pos)" },
                    { name: "Fondo de emergencia", pct: 45, current: "$9.000.000", total: "$20.000.000", date: "dic 2027", color: "var(--indigo)" },
                    { name: "MacBook Pro", pct: 82, current: "$6.560.000", total: "$8.000.000", date: "sep 2026", color: "var(--muted)" },
                  ].map(g => (
                    <div key={g.name} className="bg-panel2 rounded-xl p-3.5">
                      <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-fg">{g.name}</span><span className="text-xs font-mono" style={{ color: g.color }}>{g.pct}%</span></div>
                      <div className="bg-line h-1.5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: g.color }} /></div>
                      <div className="flex justify-between mt-2"><span className="text-xs text-dim">{g.current} de {g.total}</span><span className="text-xs text-dim">{g.date}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD ── */}
      <section id="descargar" className="landing-section lp-panel-section py-28 px-10 bg-panel">
        <div className="lp-container">
          <div className="fi-fade grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
            <div>
              <p className="text-sm font-medium text-muted mb-4" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Descarga</p>
              <h2 className="font-serif font-light text-fg leading-tight mb-5 dl-title" style={{ letterSpacing: "-0.04em" }}>Ll&eacute;valo<br />contigo.</h2>
              <p className="text-lg leading-relaxed text-muted max-w-sm">Disponible para Android. iOS próximamente.</p>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row items-start gap-3.5 mb-6">
                <a href="/finance.apk" className="inline-flex items-center gap-3.5 bg-fg text-bg rounded-2xl py-4.5 px-7 font-semibold no-underline min-w-52">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.34L19.4 12.11a.38.38 0 00-.666-.365L16.85 15A11.5 11.5 0 0112 15.75c-1.66 0-3.23-.356-4.635-.987L5.48 11.51a.38.38 0 00-.666.365l1.86 3.22A11.5 11.5 0 000 23.25h24a11.5 11.5 0 00-6.477-7.91zM7.5 6.75a4.5 4.5 0 019 0v2.25a4.5 4.5 0 01-9 0V6.75z" /></svg>
                  <div className="text-left"><div className="text-xs font-normal opacity-65 mb-0.5">Descargar para</div><div>Android</div></div>
                </a>
                <button onClick={showToast} className="inline-flex items-center gap-3.5 bg-panel2 text-fg border border-line rounded-2xl py-4.5 px-7 font-semibold opacity-60 cursor-pointer min-w-52">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                  <div className="text-left"><div className="text-xs font-normal opacity-55 mb-0.5">Próximamente</div><div>iOS</div></div>
                </button>
              </div>
              <p className="text-xs text-dim font-mono">Versi&oacute;n 1.0 &middot; &Uacute;ltima actualizaci&oacute;n: julio 2026</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section className="landing-section py-16 px-10 bg-bg">
        <div className="lp-container">
          <div className="fi-fade mb-10 text-center">
            <p className="text-sm font-medium text-muted" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Privacidad y seguridad</p>
          </div>
          <div className="fi-fade grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
                title: "Tránsito cifrado",
                body: "Toda comunicación entre tu dispositivo y el servidor viaja por HTTPS/TLS. Nadie puede interceptarla.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>,
                title: "Base de datos cifrada",
                body: "La base de datos usa cifrado en disco (Neon TDE). Tus descripciones y notas están cifradas con AES-256 antes de guardarse.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: "Tus datos, solo tuyos",
                body: "No vendemos ni compartimos tu información con terceros. Cada cuenta está completamente aislada.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-panel border border-line rounded-2xl p-6 flex flex-col gap-3">
                <span className="text-muted">{icon}</span>
                <p className="font-semibold text-fg text-sm">{title}</p>
                <p className="text-sm text-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <p className="fi-fade text-center text-xs text-dim mt-8 max-w-lg mx-auto leading-relaxed">
            Como cualquier app de finanzas con servidor (Fintual, YNAB, Tyba), el administrador técnico podría en teoría acceder a montos y categorías. Nunca lo haremos. Si esto te preocupa, puedes exportar y borrar tus datos en cualquier momento desde Configuración.
          </p>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="landing-section lp-cta-section py-40 px-10 bg-bg text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative">
          <div className="fi-fade">
            <h2 className="font-serif font-light text-fg leading-none mb-8 cta-title" style={{ letterSpacing: "-0.05em" }}>
              Empieza<br /><em>hoy.</em>
            </h2>
            <p className="text-lg leading-relaxed text-muted max-w-sm mx-auto mb-10">Gratis. Sin tarjeta de cr&eacute;dito. Acceso inmediato.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <PillBtn href="/login" dark>Comenzar con Google</PillBtn>
              <PillBtn href="/login">Registro con email</PillBtn>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-9 px-10 border-t border-line bg-bg">
        <div className="lp-container flex items-center justify-between flex-wrap gap-4">
          <span className="font-serif text-sm font-medium text-dim" style={{ letterSpacing: "-0.02em" }}>Finance &middot; 2026</span>
          <div className="flex gap-6">
            <Link href="/help" className="text-sm text-dim">Ayuda</Link>
            <Link href="/login" className="text-sm text-dim">Entrar</Link>
            <a href="#descargar" className="text-sm text-dim">Descargar</a>
          </div>
        </div>
      </footer>

      <FloatingCalc />
    </div>
  );
}
