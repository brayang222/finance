"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const FloatingCalc = dynamic(
  () => import("../src/components/patrimonio/FloatingCalc"),
  { ssr: false }
);

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
      <div className="flex flex-col h-full pt-14 px-4 pb-3">
        {children}
      </div>
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
          <defs>
            <linearGradient id="pcg-s" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M0,38 C18,35 36,30 54,26 C72,22 90,29 108,23 C126,17 144,10 162,8 C180,6 198,9 222,4 L222,44 L0,44 Z" fill="url(#pcg-s)" />
          <path d="M0,38 C18,35 36,30 54,26 C72,22 90,29 108,23 C126,17 144,10 162,8 C180,6 198,9 222,4" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="phone-card rounded-lg p-2.5">
          <div className="text-xs phone-dim mb-0.5 font-mono uppercase">Ingresos</div>
          <div className="text-sm font-semibold phone-pos font-mono">$8.45M</div>
        </div>
        <div className="phone-card rounded-lg p-2.5">
          <div className="text-xs phone-dim mb-0.5 font-mono uppercase">Gastos</div>
          <div className="text-sm font-semibold phone-neg font-mono">$4.12M</div>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {txns.map(t => (
          <div key={t.name} className="flex items-center justify-between phone-card rounded-lg py-2 px-2.5">
            <div className="flex items-center gap-2">
              <div className="size-6.5 rounded-lg flex items-center justify-center text-xs" style={{ background: "#1b1e25" }}>{t.icon}</div>
              <div>
                <div className="text-xs font-medium phone-fg">{t.name}</div>
                <div className="text-xs phone-dim">{t.sub}</div>
              </div>
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
              <div className="text-right">
                <div className="text-xs phone-fg font-mono">{a.amount}</div>
                <div className="text-xs phone-pos">{a.pct}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <TabBar active={2} />
    </PhoneShell>
  );
}

function SectionLabel({ children, color = "var(--indigo)" }: { children: React.ReactNode; color?: string }) {
  return <div className="text-xs font-semibold tracking-widest uppercase mb-4 font-mono" style={{ color }}>{children}</div>;
}

function SectionTitle({ children, align = "left", maxW }: { children: React.ReactNode; align?: "left" | "center"; maxW?: number }) {
  return (
    <h2
      className={`font-serif section-title font-light text-fg leading-tight ${align === "center" ? "text-center mx-auto" : ""}`}
      style={maxW ? { maxWidth: maxW } : undefined}
    >
      {children}
    </h2>
  );
}

export default function LandingPage() {
  const [isLight, setIsLight] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsLight(document.documentElement.getAttribute("data-theme") === "light");

    const onScroll = () => {
      if (!navRef.current) return;
      const s = window.scrollY > 20;
      navRef.current.style.background = s ? "var(--nav-bg)" : "transparent";
      navRef.current.style.borderBottomColor = s ? "var(--line)" : "transparent";
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--cx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--cy", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("fi-vis"); }),
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    document.querySelectorAll(".fi-fade").forEach(el => obs.observe(el));

    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMove); obs.disconnect(); };
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
      <div className="lp-cursor-glow" aria-hidden="true" />

      {/* NAV */}
      <nav ref={navRef} className="fi-nav">
        <div className="lp-container px-10 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-semibold text-fg tracking-tight no-underline">Finance</Link>
          <div className="nav-links flex gap-8">
            <a href="#funciones" className="nav-link">Funciones</a>
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
            <Link href="/login" className="btn-fill py-2.5 px-6 text-sm">Entrar</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-section hero-section min-h-screen flex items-center pt-30 px-10 pb-20 relative overflow-hidden">
        <div className="lp-glow-hero-1" />
        <div className="lp-glow-hero-2" />

        <div className="hero-inner lp-container w-full flex items-center gap-20 relative z-10">
          <div className="hero-text flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-panel2 border border-line rounded-full py-1.5 px-4 mb-8">
              <span className="size-1.5 bg-indigo rounded-full inline-block shrink-0" />
              <span className="text-xs font-semibold tracking-widest uppercase text-muted font-mono">Finanzas personales &middot; Colombia</span>
            </div>
            <h1 className="font-serif hero-title font-light leading-tight text-fg mb-6">
              Tu patrimonio,<br /><em>bajo control.</em>
            </h1>
            <p className="text-lg leading-relaxed text-muted max-w-md mb-10">
              Registra ingresos, gastos e inversiones en segundos. Conecta cuentas, define metas y visualiza tu riqueza en tiempo real.
            </p>
            <div className="hero-ctas flex items-center gap-3 flex-wrap">
              <Link href="/login" className="btn-fill">Comenzar gratis</Link>
              <a href="#descargar" className="btn-outline">Descargar app</a>
            </div>
            <p className="hero-platforms mt-7 text-sm text-dim font-mono">Web &middot; iOS &middot; Android &middot; Telegram</p>
          </div>

          <div className="phone-fan">
            <div className="fl0 absolute left-5 bottom-0 z-10 opacity-80">
              <PhoneAccounts />
            </div>
            <div className="fl1 absolute left-1/2 -translate-x-1/2 bottom-0 z-30">
              <PhoneSummary />
            </div>
            <div className="fl2 absolute right-5 bottom-0 z-20 opacity-80">
              <PhoneInvestments />
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD OVERVIEW */}
      <section id="funciones" className="landing-section lp-panel-section py-30 px-10 bg-panel relative overflow-hidden">
        <div className="lp-glow-dash" />
        <div className="lp-container relative">
          <div className="fi-fade text-center mb-16">
            <SectionLabel>Panel principal</SectionLabel>
            <SectionTitle align="center">Todo en un vistazo.</SectionTitle>
            <p className="text-base text-muted mt-4 mx-auto leading-relaxed max-w-md">El panel central muestra patrimonio, movimientos e inversiones sin navegar entre pantallas.</p>
          </div>

          <div className="fi-fade lp-dash-mock bg-bg border border-line rounded-2xl p-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-mono text-xs text-dim uppercase tracking-wider mb-0.5">Resumen</div>
                <div className="text-lg font-semibold text-fg">Julio 2026</div>
              </div>
              <div className="flex gap-1.5">
                {["←", "→"].map(ch => <button key={ch} className="bg-panel border border-line rounded-lg py-1.5 px-3 text-xs text-muted cursor-pointer font-mono">{ch}</button>)}
              </div>
            </div>
            {/* KPIs */}
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
            {/* Patrimony + Chart */}
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
                  <defs>
                    <linearGradient id="dcg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <path d="M0,62 C40,58 80,52 120,46 C160,40 190,54 230,46 C270,38 300,28 340,22 C380,16 410,26 450,18 C490,10 530,8 580,4 L580,72 L0,72 Z" fill="url(#dcg)" />
                  <path d="M0,62 C40,58 80,52 120,46 C160,40 190,54 230,46 C270,38 300,28 340,22 C380,16 410,26 450,18 C490,10 530,8 580,4" fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" />
                  <path d="M580,4 L640,2" fill="none" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4,3" strokeLinecap="round" opacity={0.45} />
                </svg>
              </div>
            </div>
            {/* Transactions + Portfolio */}
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
                        <div>
                          <div className="text-sm font-medium text-fg">{t.name}</div>
                          <div className="text-xs text-dim">{t.sub}</div>
                        </div>
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
                        <div>
                          <div className="text-sm font-medium text-fg">{a.name}</div>
                          <div className="text-xs text-dim">{a.sub}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-fg font-mono">{a.val}</div>
                        <div className="text-xs text-pos">{a.pct}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="landing-section py-30 px-10 bg-bg">
        <div className="lp-container">
          <div className="fi-fade mb-16">
            <SectionLabel>Funciones</SectionLabel>
            <SectionTitle maxW={600}>Dise&ntilde;ado para c&oacute;mo realmente manejas el dinero.</SectionTitle>
          </div>
          <div className="feat-grid grid grid-cols-4 gap-4">
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>, title: "Registro por voz", desc: "Habla o escribe en español natural. Finance detecta tipo, monto y categoría automáticamente.", delay: "" },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>, title: "Inversiones en tiempo real", desc: "Acciones, cripto y alto rendimiento consolidados. Precios actualizados y proyecciones incluidas.", delay: "d1" },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>, title: "Multi-canal", desc: "Web, app móvil, Telegram o CSV. Registra desde donde más te convenga.", delay: "d2" },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-b)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>, title: "Comercio integrado", desc: "Gestiona productos, clientes, ventas y fiado desde el mismo panel financiero.", delay: "d3" },
            ].map(card => (
              <div key={card.title} className={`feat-card fi-fade ${card.delay}`}>
                <div className="size-11 bg-panel2 rounded-xl flex items-center justify-center mb-5 border border-line">{card.icon}</div>
                <h3 className="font-serif text-xl font-medium text-fg mb-2.5 tracking-tight">{card.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{card.desc}</p>
              </div>
            ))}
          </div>
          <div className="fi-fade bg-panel border border-line rounded-2xl py-7 px-8 mt-4 flex items-center gap-7">
            <div className="size-11 bg-panel2 rounded-xl flex items-center justify-center border border-line shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--neg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium text-fg mb-1.5 tracking-tight">Consignaciones DIAN</h3>
              <p className="text-sm leading-relaxed text-muted max-w-xl">Rastrea pagos de impuestos y fechas clave del calendario tributario colombiano. Sin sorpresas en declaración de renta.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="landing-section lp-panel-section py-30 px-10 bg-panel">
        <div className="lp-container">
          <div className="fi-fade text-center mb-16">
            <SectionTitle align="center">Construido para la realidad<br /><em>colombiana.</em></SectionTitle>
          </div>
          <div className="stats-grid grid grid-cols-3 gap-3.5">
            {[
              { val: "17+", label: "Categorías inteligentes preconfiguradas", color: "var(--fg)", delay: "" },
              { val: "3", label: "Canales de registro — Web, App, Telegram", color: "var(--fg)", delay: "d1" },
              { val: "COP", label: "Pensado exclusivamente para Colombia", color: "var(--indigo-b)", delay: "d2" },
              { val: "24/7", label: "Acceso desde cualquier dispositivo", color: "var(--fg)", delay: "" },
              { val: "<5s", label: "Para registrar por voz o texto natural", color: "var(--pos)", delay: "d1" },
              { val: "100%", label: "Tus datos son privados y solo tuyos", color: "var(--fg)", delay: "d2" },
            ].map(s => (
              <div key={s.val} className={`fi-fade lp-stat-card bg-panel border border-line rounded-2xl py-7 px-6 ${s.delay}`}>
                <div className="font-serif text-5xl font-light tracking-tighter mb-2 leading-none" style={{ color: s.color }}>{s.val}</div>
                <div className="text-sm text-muted leading-normal">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT: VOICE */}
      <section className="landing-section py-30 px-10 bg-bg">
        <div className="lp-container">
          <div className="split-row flex items-center gap-20">
            <div className="fi-fade flex-1 min-w-0 max-w-lg">
              <SectionLabel>Registro inteligente</SectionLabel>
              <h2 className="font-serif subsection-title font-light text-fg leading-tight mb-5">
                Di lo que gastaste.<br /><em>Finance hace el resto.</em>
              </h2>
              <p className="text-base leading-relaxed text-muted mb-7">Habla o escribe en espa&ntilde;ol desde Telegram, la app o la web. El sistema detecta tipo, monto, categor&iacute;a y moneda autom&aacute;ticamente.</p>
              <div className="flex flex-col gap-3">
                <Bullet>Detecci&oacute;n autom&aacute;tica de categor&iacute;as</Bullet>
                <Bullet>Soporte en pesos colombianos y USD</Bullet>
                <Bullet>Desde Telegram sin abrir ninguna app</Bullet>
              </div>
            </div>
            <div className="split-mock fi-fade flex-1 flex justify-center">
              <div className="bg-panel border border-line rounded-2xl p-5 w-full max-w-sm">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-line">
                  <div className="size-9 rounded-full flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg,#229ED9,#1a7fb5)" }}>{"✈"}</div>
                  <div>
                    <div className="text-sm font-semibold text-fg">Finance Bot</div>
                    <div className="text-xs text-pos">en l&iacute;nea</div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-end"><div className="bg-indigo text-white rounded-2xl rounded-br py-2.5 px-3.5 max-w-60 text-sm leading-normal">gast&eacute; 87 mil en el &eacute;xito hoy</div></div>
                  <div className="flex justify-start"><div className="bg-panel2 border border-line text-fg rounded-2xl rounded-bl py-3 px-3.5 max-w-72 text-sm leading-relaxed">
                    <div className="mb-1">{"✓"} Transacci&oacute;n registrada:</div>
                    <div className="font-mono text-xs text-muted flex flex-col gap-0.5">
                      <span>{"→"} Gasto &middot; $87.000 COP</span><span>{"→"} Categor&iacute;a: Alimentos</span><span>{"→"} Comercio: &Eacute;xito</span>
                    </div>
                  </div></div>
                  <div className="flex justify-end"><div className="bg-indigo text-white rounded-2xl rounded-br py-2.5 px-3.5 max-w-60 text-sm leading-normal">tambi&eacute;n pagu&eacute; netflix 52900</div></div>
                  <div className="flex justify-start"><div className="bg-panel2 border border-line text-fg rounded-2xl rounded-bl py-3 px-3.5 max-w-72 text-sm leading-relaxed">
                    <div className="mb-1">{"✓"} Registrado:</div>
                    <div className="font-mono text-xs text-muted flex flex-col gap-0.5">
                      <span>{"→"} Suscripci&oacute;n &middot; $52.900 COP</span><span>{"→"} Categor&iacute;a: Entretenimiento</span><span>{"→"} Pago recurrente detectado</span>
                    </div>
                  </div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPLIT: INVESTMENTS */}
      <section className="landing-section lp-panel-section py-30 px-10 bg-panel">
        <div className="lp-container">
          <div className="split-row flex items-center gap-20 flex-row-reverse">
            <div className="fi-fade flex-1 min-w-0 max-w-lg">
              <SectionLabel color="var(--pos)">Portafolio</SectionLabel>
              <h2 className="font-serif subsection-title font-light text-fg leading-tight mb-5">
                Acciones, cripto y CDTs.<br /><em>En un solo lugar.</em>
              </h2>
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
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-semibold text-fg font-mono">$46.720.000</span>
                    <span className="text-sm text-pos">+16.4%</span>
                  </div>
                </div>
                <div className="bg-panel rounded-xl py-2.5 px-3.5 mb-3.5">
                  <svg width="100%" height="52" viewBox="0 0 340 52" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ig-p" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5cae87" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#5cae87" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                      <div className="text-right">
                        <div className="text-sm text-fg font-mono">{a.val}</div>
                        <div className="text-xs text-pos">{a.pct}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPLIT: GOALS */}
      <section className="landing-section py-30 px-10 bg-bg">
        <div className="lp-container">
          <div className="split-row flex items-center gap-20">
            <div className="fi-fade flex-1 min-w-0 max-w-lg">
              <SectionLabel>Metas y presupuestos</SectionLabel>
              <h2 className="font-serif subsection-title font-light text-fg leading-tight mb-5">
                Define metas.<br /><em>Alc&aacute;nzalas con claridad.</em>
              </h2>
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
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-fg">{g.name}</span>
                        <span className="text-xs font-mono" style={{ color: g.color }}>{g.pct}%</span>
                      </div>
                      <div className="bg-line h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: g.color }} />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-dim">{g.current} de {g.total}</span>
                        <span className="text-xs text-dim">{g.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section id="descargar" className="landing-section lp-panel-section py-30 px-10 bg-panel">
        <div className="lp-container text-center">
          <div className="fi-fade">
            <SectionLabel>Descarga</SectionLabel>
            <h2 className="font-serif dl-title font-light text-fg leading-tight mb-5">Ll&eacute;valo contigo.</h2>
            <p className="text-lg leading-relaxed text-muted max-w-md mx-auto mb-12">Disponible para iOS y Android. Sin app store, instalaci&oacute;n directa.</p>
            <div className="dl-btns flex items-center justify-center gap-3.5 flex-wrap mb-7">
              <a href="/finance.apk" className="inline-flex items-center gap-3.5 bg-fg text-bg rounded-2xl py-4.5 px-7 font-semibold no-underline min-w-52">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.34L19.4 12.11a.38.38 0 00-.666-.365L16.85 15A11.5 11.5 0 0112 15.75c-1.66 0-3.23-.356-4.635-.987L5.48 11.51a.38.38 0 00-.666.365l1.86 3.22A11.5 11.5 0 000 23.25h24a11.5 11.5 0 00-6.477-7.91zM7.5 6.75a4.5 4.5 0 019 0v2.25a4.5 4.5 0 01-9 0V6.75z" /></svg>
                <div className="text-left">
                  <div className="text-xs font-normal opacity-65 mb-0.5">Descargar para</div>
                  <div>Android</div>
                </div>
              </a>
              <a href="/finance.ipa" className="inline-flex items-center gap-3.5 bg-panel2 text-fg border border-line rounded-2xl py-4.5 px-7 font-semibold no-underline min-w-52">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                <div className="text-left">
                  <div className="text-xs font-normal opacity-55 mb-0.5">Descargar para</div>
                  <div>iOS</div>
                </div>
              </a>
            </div>
            <p className="text-xs text-dim font-mono">Versi&oacute;n 1.0 &middot; &Uacute;ltima actualizaci&oacute;n: julio 2026</p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="landing-section py-36 px-10 bg-bg text-center relative overflow-hidden">
        <div className="lp-glow-cta" />
        <div className="max-w-3xl mx-auto relative">
          <div className="fi-fade">
            <h2 className="font-serif cta-title font-light text-fg leading-none mb-8">
              Empieza<br /><em>hoy.</em>
            </h2>
            <p className="text-lg leading-relaxed text-muted max-w-sm mx-auto mb-10">Gratis. Sin tarjeta de cr&eacute;dito. Acceso inmediato.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/login" className="btn-fill text-base py-4.5 px-9">Comenzar con Google</Link>
              <Link href="/login" className="btn-outline text-base py-4.5 px-9">Registro con email</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-9 px-10 border-t border-line bg-bg">
        <div className="lp-container flex items-center justify-between flex-wrap gap-4">
          <span className="font-serif text-sm font-medium text-dim">Finance &middot; 2026</span>
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
