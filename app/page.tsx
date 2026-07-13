"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const FloatingCalc = dynamic(
  () => import("../src/components/patrimonio/FloatingCalc"),
  { ssr: false }
);

const globalCss = `
html{scroll-behavior:smooth;}
:root,:root[data-theme="dark"]{
  --indigo:#6366f1;
  --indigo-b:#818cf8;
  --nav-bg:rgba(14,15,19,0.88);
  --glow:rgba(99,102,241,0.12);
  --phone-shadow:0 40px 90px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.04);
}
[data-theme="light"]{
  --indigo:#5254d8;
  --indigo-b:#4344bb;
  --nav-bg:rgba(245,244,241,0.88);
  --glow:rgba(83,85,216,0.07);
  --phone-shadow:0 40px 80px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.07);
}
@keyframes fl0{0%,100%{transform:rotate(-8deg) translateY(0);}50%{transform:rotate(-8deg) translateY(-12px);}}
@keyframes fl1{0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(-16px);}}
@keyframes fl2{0%,100%{transform:rotate(8deg) translateY(0);}50%{transform:rotate(8deg) translateY(-12px);}}
.fl0{animation:fl0 7s ease-in-out infinite;}
.fl1{animation:fl1 7s ease-in-out infinite 1.2s;}
.fl2{animation:fl2 7s ease-in-out infinite 2.4s;}
.fi-fade{opacity:0;transform:translateY(24px);transition:opacity 0.65s ease,transform 0.65s ease;}
.fi-fade.fi-vis{opacity:1;transform:translateY(0);}
.fi-fade.fi-vis.d1{transition-delay:0.1s;}
.fi-fade.fi-vis.d2{transition-delay:0.2s;}
.fi-fade.fi-vis.d3{transition-delay:0.3s;}
.fi-nav{position:fixed;top:0;left:0;right:0;z-index:200;background:transparent;border-bottom:1px solid transparent;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:background 0.3s,border-color 0.3s;}
.landing-page a:not(.btn-fill):not(.btn-outline):not(.nav-link){color:var(--indigo);text-decoration:none;}
.landing-page a:not(.btn-fill):not(.btn-outline):not(.nav-link):hover{color:var(--indigo-b);}
.btn-fill{display:inline-flex;align-items:center;gap:8px;background:var(--indigo);color:#fff;border:none;padding:14px 28px;border-radius:100px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;transition:background 0.2s,transform 0.15s;}
.btn-fill:hover{background:var(--indigo-b);transform:translateY(-1px);color:#fff;}
.btn-outline{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--fg);border:1.5px solid var(--line);padding:14px 28px;border-radius:100px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;transition:border-color 0.2s,transform 0.15s,background 0.2s;}
.btn-outline:hover{border-color:var(--dim);background:var(--panel);transform:translateY(-1px);color:var(--fg);}
.nav-link{font-size:14px;font-weight:500;color:var(--muted);text-decoration:none;transition:color 0.2s;}
.nav-link:hover{color:var(--fg);}
.feat-card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:28px;transition:border-color 0.25s,transform 0.25s;cursor:default;}
.feat-card:hover{border-color:var(--dim);transform:translateY(-2px);}
@media(max-width:1200px){
  .hero-inner{flex-direction:column !important;gap:32px !important;align-items:center !important;text-align:center !important;}
  .hero-text p{margin-left:auto !important;margin-right:auto !important;}
  .hero-ctas{justify-content:center !important;}
  .hero-section{min-height:auto !important;padding-bottom:40px !important;}
  .phone-fan{transform:scale(0.82);transform-origin:top center;width:700px !important;height:560px !important;margin-bottom:-100px !important;}
  .nav-links{display:none !important;}
}
@media(max-width:900px){
  .landing-section{padding-left:24px !important;padding-right:24px !important;}
  .fi-nav>div{padding-left:16px !important;padding-right:16px !important;}
  .split-row{flex-direction:column !important;gap:48px !important;}
  .split-row[style*="row-reverse"]{flex-direction:column !important;}
  .split-mock{max-width:400px !important;margin:0 auto !important;}
  .feat-grid{grid-template-columns:1fr 1fr !important;}
  .stats-grid{grid-template-columns:repeat(2,1fr) !important;}
  .dl-btns{flex-direction:column !important;align-items:center !important;}
  .phone-fan{transform:scale(0.62);height:560px !important;margin-bottom:-210px !important;}
  .dash-grid-patrimony{grid-template-columns:1fr !important;}
  .dash-grid-bottom{grid-template-columns:1fr !important;}
}
@media(max-width:540px){
  .landing-section{padding-left:16px !important;padding-right:16px !important;padding-top:80px !important;padding-bottom:80px !important;}
  .hero-section{padding-top:72px !important;padding-bottom:24px !important;}
  .feat-grid{grid-template-columns:1fr !important;}
  .stats-grid{grid-template-columns:1fr 1fr !important;}
  .hero-text h1{font-size:36px !important;letter-spacing:-1px !important;}
  .hero-text>p{font-size:15px !important;margin-bottom:28px !important;}
  .hero-platforms{display:none !important;}
  .hero-inner{gap:24px !important;}
  .phone-fan{transform:scale(0.48);transform-origin:top center;height:560px !important;margin-bottom:-290px !important;}
  .dash-kpis{grid-template-columns:1fr !important;}
  .dash-grid-patrimony{grid-template-columns:1fr !important;}
  .dash-grid-bottom{grid-template-columns:1fr !important;}
  .btn-fill,.btn-outline{padding:12px 22px !important;font-size:14px !important;}
  .split-mock{max-width:100% !important;}
  .fi-nav>div{height:52px !important;}
}
`;

function Bullet({ color = "var(--indigo)", children }: { color?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 18, height: 18, background: color, borderRadius: "50%", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <span style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

function TabBar({ active }: { active: 0 | 1 | 2 | 3 }) {
  const strokes = [0, 1, 2, 3].map(i => i === active ? "#6366f1" : "#5f6672");
  return (
    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 0 4px", borderTop: "1px solid #1b1e25", marginTop: 8 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokes[0]} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokes[1]} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokes[2]} strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /></svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokes[3]} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0112 0v2" /></svg>
    </div>
  );
}

function PhoneShell({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  return (
    <div style={{ width: w, height: h, background: "#0d0d10", borderRadius: 38, border: "2px solid #2e2e34", boxShadow: "var(--phone-shadow)", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 108, height: 30, background: "#000", borderRadius: 17, zIndex: 10 }} />
      <div style={{ padding: "54px 15px 12px", height: "100%", display: "flex", flexDirection: "column" }}>
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
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "#5f6672", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Cuentas</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#eceef1", fontFamily: "'IBM Plex Mono',monospace" }}>$21.730.000</div>
        <div style={{ fontSize: 11, color: "#5cae87", marginTop: 2 }}>3 cuentas activas</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {accounts.map(a => (
          <div key={a.name} style={{ background: "#15171c", border: "1px solid #262a33", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 28, height: 28, background: a.bg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: a.color, fontFamily: "'IBM Plex Mono',monospace" }}>{a.label}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#eceef1" }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: "#5f6672" }}>{a.sub}</div>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#eceef1", fontFamily: "'IBM Plex Mono',monospace" }}>{a.amount}</span>
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
    { icon: "🛒", name: "Mercado", sub: "Hoy", amount: "−$87k", color: "#d67c78" },
    { icon: "💼", name: "Nómina", sub: "Ayer", amount: "+$5.8M", color: "#5cae87" },
    { icon: "🏠", name: "Arriendo", sub: "Jul 1", amount: "−$1.2M", color: "#d67c78" },
  ];
  return (
    <PhoneShell w={w} h={h}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#5f6672", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Resumen · Jul 2026</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: "#eceef1", fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.1 }}>$82.340.000</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
          <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,1 9,9 1,9" fill="#5cae87" /></svg>
          <span style={{ fontSize: 11, color: "#5cae87", fontFamily: "'IBM Plex Mono',monospace" }}>+8.4% este año</span>
        </div>
      </div>
      <div style={{ background: "#15171c", borderRadius: 10, padding: "8px 10px", marginBottom: 12 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: "#15171c", borderRadius: 9, padding: 10 }}>
          <div style={{ fontSize: 9, color: "#5f6672", marginBottom: 3, fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase" }}>Ingresos</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#5cae87", fontFamily: "'IBM Plex Mono',monospace" }}>$8.45M</div>
        </div>
        <div style={{ background: "#15171c", borderRadius: 9, padding: 10 }}>
          <div style={{ fontSize: 9, color: "#5f6672", marginBottom: 3, fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase" }}>Gastos</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#d67c78", fontFamily: "'IBM Plex Mono',monospace" }}>$4.12M</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        {txns.map(t => (
          <div key={t.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#15171c", borderRadius: 9, padding: "9px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, background: "#1b1e25", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{t.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#eceef1" }}>{t.name}</div>
                <div style={{ fontSize: 9, color: "#5f6672" }}>{t.sub}</div>
              </div>
            </div>
            <span style={{ fontSize: 11, color: t.color, fontFamily: "'IBM Plex Mono',monospace" }}>{t.amount}</span>
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
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#5f6672", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Inversiones</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#eceef1", fontFamily: "'IBM Plex Mono',monospace" }}>$46.720.000</div>
        <div style={{ fontSize: 11, color: "#5cae87", marginTop: 2 }}>+16.4% total</div>
      </div>
      <div style={{ background: "#15171c", borderRadius: 9, padding: "8px 10px", marginBottom: 10 }}>
        <svg width="100%" height="36" viewBox="0 0 192 36" preserveAspectRatio="none">
          <path d="M0,30 L24,27 L48,24 L72,18 L96,20 L120,13 L144,10 L168,7 L192,4" fill="none" stroke="#5cae87" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {assets.map(a => (
          <div key={a.name} style={{ background: "#15171c", border: "1px solid #1b1e25", borderRadius: 10, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, background: a.bg, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: a.color, fontFamily: "'IBM Plex Mono',monospace" }}>{a.label}</div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#eceef1" }}>{a.name}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#eceef1", fontFamily: "'IBM Plex Mono',monospace" }}>{a.amount}</div>
                <div style={{ fontSize: 10, color: "#5cae87" }}>{a.pct}</div>
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
  return <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color, marginBottom: 16, fontFamily: "'IBM Plex Mono',monospace" }}>{children}</div>;
}

function SectionTitle({ children, align = "left", maxW }: { children: React.ReactNode; align?: "left" | "center"; maxW?: number }) {
  return (
    <h2 style={{ fontFamily: "'Spectral',serif", fontSize: "clamp(34px,4vw,56px)", fontWeight: 300, letterSpacing: -1.5, color: "var(--fg)", lineHeight: 1.1, maxWidth: maxW, ...(align === "center" ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) } as React.CSSProperties}>
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

    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("fi-vis"); }),
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    document.querySelectorAll(".fi-fade").forEach(el => obs.observe(el));

    return () => { window.removeEventListener("scroll", onScroll); obs.disconnect(); };
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    const val = next ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", val);
    document.cookie = `gfp-theme=${val}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCss }} />

      <div className="landing-page" style={{ background: "var(--bg)", color: "var(--fg)", fontFamily: "'IBM Plex Sans',sans-serif", minHeight: "100vh", overflowX: "hidden" }}>

        {/* NAV */}
        <nav ref={navRef} className="fi-nav">
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ fontFamily: "'Spectral',serif", fontSize: 22, fontWeight: 600, color: "var(--fg)", letterSpacing: -0.3 }}>Finance</Link>
            <div className="nav-links" style={{ display: "flex", gap: 32 }}>
              <a href="#funciones" className="nav-link">Funciones</a>
              <a href="#descargar" className="nav-link">Descargar</a>
              <Link href="/help" className="nav-link">Ayuda</Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={toggleTheme} style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 100, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)" }}>
                {!isLight
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                }
              </button>
              <Link href="/login" className="btn-fill" style={{ padding: "10px 22px", fontSize: 14 }}>Entrar</Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="landing-section hero-section" style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px 40px 80px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "30%", right: "25%", width: 500, height: 500, background: "radial-gradient(circle,var(--glow) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div className="hero-inner" style={{ maxWidth: 1240, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 80, position: "relative", zIndex: 1 }}>
            <div className="hero-text" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 100, padding: "6px 16px", marginBottom: 32 }}>
                <span style={{ width: 6, height: 6, background: "var(--indigo)", borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "'IBM Plex Mono',monospace" }}>Finanzas personales · Colombia</span>
              </div>
              <h1 style={{ fontFamily: "'Spectral',serif", fontSize: "clamp(48px,5.5vw,88px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: -2.5, color: "var(--fg)", marginBottom: 24 } as React.CSSProperties}>
                Tu patrimonio,<br /><em style={{ fontStyle: "italic" }}>bajo control.</em>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.68, color: "var(--muted)", maxWidth: 440, marginBottom: 40 }}>
                Registra ingresos, gastos e inversiones en segundos. Conecta cuentas, define metas y visualiza tu riqueza en tiempo real.
              </p>
              <div className="hero-ctas" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Link href="/login" className="btn-fill">Comenzar gratis</Link>
                <a href="#descargar" className="btn-outline">Descargar app</a>
              </div>
              <p className="hero-platforms" style={{ marginTop: 28, fontSize: 13, color: "var(--dim)", fontFamily: "'IBM Plex Mono',monospace" }}>Web · iOS · Android · Telegram</p>
            </div>

            {/* Phone fan — desktop */}
            <div className="phone-fan" style={{ flexShrink: 0, position: "relative", width: 700, height: 560 }}>
              <div className="fl0" style={{ position: "absolute", left: 20, bottom: 0, zIndex: 1, opacity: 0.82 }}>
                <PhoneAccounts />
              </div>
              <div className="fl1" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, zIndex: 3 }}>
                <PhoneSummary />
              </div>
              <div className="fl2" style={{ position: "absolute", right: 20, bottom: 0, zIndex: 2, opacity: 0.82 }}>
                <PhoneInvestments />
              </div>
            </div>

          </div>
        </section>

        {/* DASHBOARD OVERVIEW */}
        <section id="funciones" className="landing-section" style={{ padding: "120px 40px", background: "var(--panel)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div className="fi-fade" style={{ textAlign: "center", marginBottom: 64 }}>
              <SectionLabel>Panel principal</SectionLabel>
              <SectionTitle align="center">Todo en un vistazo.</SectionTitle>
              <p style={{ fontSize: 17, color: "var(--muted)", marginTop: 16, maxWidth: 460, margin: "16px auto 0", lineHeight: 1.65 }}>El panel central muestra patrimonio, movimientos e inversiones sin navegar entre pantallas.</p>
            </div>

            <div className="fi-fade" style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 20, padding: 28, maxWidth: 920, margin: "0 auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Resumen</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)" }}>Julio 2026</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["←", "→"].map(ch => <button key={ch} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "var(--muted)", cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>{ch}</button>)}
                </div>
              </div>
              {/* KPIs */}
              <div className="dash-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
                {[
                  { label: "Ingresos", val: "$8.450.000", sub: "+12% vs junio", color: "var(--pos)" },
                  { label: "Gastos", val: "$4.120.000", sub: "−3% vs junio", color: "var(--neg)" },
                  { label: "Ahorro neto", val: "$4.330.000", sub: "Tasa: 51.2%", color: "var(--pos)", valColor: "var(--fg)" },
                ].map(k => (
                  <div key={k.label} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: k.valColor ?? k.color, fontFamily: "'IBM Plex Mono',monospace" }}>{k.val}</div>
                    <div style={{ fontSize: 11, color: k.label === "Ahorro neto" ? "var(--pos)" : "var(--dim)", marginTop: 4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>
              {/* Patrimony + Chart */}
              <div className="dash-grid-patrimony" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Patrimonio</div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 600, color: "var(--fg)", fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.15 }}>$82.340.000</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,1 9,9 1,9" fill="var(--pos)" /></svg>
                      <span style={{ fontSize: 12, color: "var(--pos)", fontFamily: "'IBM Plex Mono',monospace" }}>+8.4% este año</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, overflow: "hidden" }}>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Evolución · 12 meses</div>
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
              <div className="dash-grid-bottom" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Últimas transacciones</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { icon: "🛒", name: "Mercado", sub: "Hoy · Alimentos", amount: "−$87.000", color: "var(--neg)" },
                      { icon: "💼", name: "Nómina", sub: "Ayer · Ingresos", amount: "+$5.800.000", color: "var(--pos)" },
                      { icon: "🏠", name: "Arriendo", sub: "Jul 1 · Vivienda", amount: "−$1.200.000", color: "var(--neg)" },
                      { icon: "⚡", name: "Servicios", sub: "Jun 30 · Hogar", amount: "−$145.000", color: "var(--neg)" },
                    ].map(t => (
                      <div key={t.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, background: "var(--panel2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{t.icon}</div>
                          <div><div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{t.name}</div><div style={{ fontSize: 11, color: "var(--dim)" }}>{t.sub}</div></div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: t.color, fontFamily: "'IBM Plex Mono',monospace" }}>{t.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Portafolio</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { bg: "#f7931a18", color: "#f7931a", label: "₿", name: "Bitcoin", sub: "0.0342 BTC", val: "$9.840.000", pct: "+14.2%" },
                      { bg: "#627eea18", color: "#627eea", label: "Ξ", name: "Ethereum", sub: "1.28 ETH", val: "$4.230.000", pct: "+7.8%" },
                      { bg: "var(--panel2)", color: "var(--pos)", label: "S&P", name: "S&P 500", sub: "3 ETFs", val: "$12.650.000", pct: "+21.3%" },
                      { bg: "var(--panel2)", color: "var(--muted)", label: "CDT", name: "CDT Bancolombia", sub: "Vence sep 2026", val: "$20.000.000", pct: "12% E.A." },
                    ].map(a => (
                      <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, background: a.bg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: a.color, fontFamily: "'IBM Plex Mono',monospace" }}>{a.label}</div>
                          <div><div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{a.name}</div><div style={{ fontSize: 11, color: "var(--dim)" }}>{a.sub}</div></div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", fontFamily: "'IBM Plex Mono',monospace" }}>{a.val}</div>
                          <div style={{ fontSize: 11, color: "var(--pos)" }}>{a.pct}</div>
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
        <section className="landing-section" style={{ padding: "120px 40px", background: "var(--bg)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div className="fi-fade" style={{ marginBottom: 64 }}>
              <SectionLabel>Funciones</SectionLabel>
              <SectionTitle maxW={600}>Diseñado para cómo realmente manejas el dinero.</SectionTitle>
            </div>
            <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {[
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>, title: "Registro por voz", desc: "Habla o escribe en español natural. Finance detecta tipo, monto y categoría automáticamente.", delay: "" },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>, title: "Inversiones en tiempo real", desc: "Acciones, cripto y alto rendimiento consolidados. Precios actualizados y proyecciones incluidas.", delay: "d1" },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>, title: "Multi-canal", desc: "Web, app móvil, Telegram o CSV. Registra desde donde más te convenga.", delay: "d2" },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-b)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>, title: "Comercio integrado", desc: "Gestiona productos, clientes, ventas y fiado desde el mismo panel financiero.", delay: "d3" },
              ].map(card => (
                <div key={card.title} className={`feat-card fi-fade ${card.delay}`}>
                  <div style={{ width: 44, height: 44, background: "var(--panel2)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: "1px solid var(--line)" }}>{card.icon}</div>
                  <h3 style={{ fontFamily: "'Spectral',serif", fontSize: 20, fontWeight: 500, color: "var(--fg)", marginBottom: 10, letterSpacing: -0.2 }}>{card.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--muted)" }}>{card.desc}</p>
                </div>
              ))}
            </div>
            <div className="fi-fade" style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: "28px 32px", marginTop: 16, display: "flex", alignItems: "center", gap: 28 }}>
              <div style={{ width: 44, height: 44, background: "var(--panel2)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--neg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              </div>
              <div>
                <h3 style={{ fontFamily: "'Spectral',serif", fontSize: 20, fontWeight: 500, color: "var(--fg)", marginBottom: 6, letterSpacing: -0.2 }}>Consignaciones DIAN</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--muted)", maxWidth: 640 }}>Rastrea pagos de impuestos y fechas clave del calendario tributario colombiano. Sin sorpresas en declaración de renta.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="landing-section" style={{ padding: "120px 40px", background: "var(--panel)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div className="fi-fade" style={{ textAlign: "center", marginBottom: 64 }}>
              <SectionTitle align="center">Construido para la realidad<br /><em>colombiana.</em></SectionTitle>
            </div>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {[
                { val: "17+", label: "Categorías inteligentes preconfiguradas", color: "var(--fg)", delay: "" },
                { val: "3", label: "Canales de registro — Web, App, Telegram", color: "var(--fg)", delay: "d1" },
                { val: "COP", label: "Pensado exclusivamente para Colombia", color: "var(--indigo-b)", delay: "d2" },
                { val: "24/7", label: "Acceso desde cualquier dispositivo", color: "var(--fg)", delay: "" },
                { val: "<5s", label: "Para registrar por voz o texto natural", color: "var(--pos)", delay: "d1" },
                { val: "100%", label: "Tus datos son privados y solo tuyos", color: "var(--fg)", delay: "d2" },
              ].map(s => (
                <div key={s.val} className={`fi-fade ${s.delay}`} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: "28px 24px" }}>
                  <div style={{ fontFamily: "'Spectral',serif", fontSize: 54, fontWeight: 300, color: s.color, letterSpacing: -2, marginBottom: 8, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SPLIT: VOICE */}
        <section className="landing-section" style={{ padding: "120px 40px", background: "var(--bg)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div className="split-row" style={{ display: "flex", alignItems: "center", gap: 80 }}>
              <div className="fi-fade" style={{ flex: 1, minWidth: 0, maxWidth: 480 }}>
                <SectionLabel>Registro inteligente</SectionLabel>
                <h2 style={{ fontFamily: "'Spectral',serif", fontSize: "clamp(30px,3.5vw,46px)", fontWeight: 300, letterSpacing: -1, color: "var(--fg)", lineHeight: 1.15, marginBottom: 20 } as React.CSSProperties}>
                  Di lo que gastaste.<br /><em>Finance hace el resto.</em>
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.68, color: "var(--muted)", marginBottom: 28 }}>Habla o escribe en español desde Telegram, la app o la web. El sistema detecta tipo, monto, categoría y moneda automáticamente.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Bullet>Detección automática de categorías</Bullet>
                  <Bullet>Soporte en pesos colombianos y USD</Bullet>
                  <Bullet>Desde Telegram sin abrir ninguna app</Bullet>
                </div>
              </div>
              <div className="split-mock fi-fade" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 20, padding: 20, width: 360, maxWidth: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#229ED9,#1a7fb5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✈</div>
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Finance Bot</div><div style={{ fontSize: 11, color: "var(--pos)" }}>en línea</div></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}><div style={{ background: "var(--indigo)", color: "#fff", borderRadius: "16px 16px 4px 16px", padding: "10px 14px", maxWidth: 230, fontSize: 13, lineHeight: 1.5 }}>gasté 87 mil en el éxito hoy</div></div>
                    <div style={{ display: "flex", justifyContent: "flex-start" }}><div style={{ background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--fg)", borderRadius: "16px 16px 16px 4px", padding: "12px 14px", maxWidth: 280, fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 5 }}>✓ Transacción registrada:</div>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span>→ Gasto · $87.000 COP</span><span>→ Categoría: Alimentos</span><span>→ Comercio: Éxito</span>
                      </div>
                    </div></div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}><div style={{ background: "var(--indigo)", color: "#fff", borderRadius: "16px 16px 4px 16px", padding: "10px 14px", maxWidth: 230, fontSize: 13, lineHeight: 1.5 }}>también pagué netflix 52900</div></div>
                    <div style={{ display: "flex", justifyContent: "flex-start" }}><div style={{ background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--fg)", borderRadius: "16px 16px 16px 4px", padding: "12px 14px", maxWidth: 280, fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 5 }}>✓ Registrado:</div>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span>→ Suscripción · $52.900 COP</span><span>→ Categoría: Entretenimiento</span><span>→ Pago recurrente detectado</span>
                      </div>
                    </div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SPLIT: INVESTMENTS */}
        <section className="landing-section" style={{ padding: "120px 40px", background: "var(--panel)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div className="split-row" style={{ display: "flex", alignItems: "center", gap: 80, flexDirection: "row-reverse" }}>
              <div className="fi-fade" style={{ flex: 1, minWidth: 0, maxWidth: 480 }}>
                <SectionLabel color="var(--pos)">Portafolio</SectionLabel>
                <h2 style={{ fontFamily: "'Spectral',serif", fontSize: "clamp(30px,3.5vw,46px)", fontWeight: 300, letterSpacing: -1, color: "var(--fg)", lineHeight: 1.15, marginBottom: 20 } as React.CSSProperties}>
                  Acciones, cripto y CDTs.<br /><em>En un solo lugar.</em>
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.68, color: "var(--muted)", marginBottom: 28 }}>Consolida acciones, ETFs, criptomonedas y alto rendimiento. Precios en tiempo real, rendimiento total y proyecciones históricas.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Bullet color="var(--pos)">Cripto: Bitcoin, Ethereum y altcoins</Bullet>
                  <Bullet color="var(--pos)">Acciones y ETFs en USD</Bullet>
                  <Bullet color="var(--pos)">CDTs, fondos y alto rendimiento COP</Bullet>
                </div>
              </div>
              <div className="split-mock fi-fade" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 20, padding: 24, width: 380, maxWidth: "100%" }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Portafolio total</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span style={{ fontSize: 28, fontWeight: 600, color: "var(--fg)", fontFamily: "'IBM Plex Mono',monospace" }}>$46.720.000</span>
                      <span style={{ fontSize: 14, color: "var(--pos)" }}>+16.4%</span>
                    </div>
                  </div>
                  <div style={{ background: "var(--panel)", borderRadius: 11, padding: "10px 14px", marginBottom: 14 }}>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { bg: "#f7931a18", color: "#f7931a", label: "₿", name: "Bitcoin", val: "$9.840.000", pct: "+14.2%" },
                      { bg: "#627eea18", color: "#627eea", label: "Ξ", name: "Ethereum", val: "$4.230.000", pct: "+7.8%" },
                      { bg: "var(--panel2)", color: "var(--pos)", label: "S&P", name: "S&P 500", val: "$12.650.000", pct: "+21.3%" },
                      { bg: "var(--panel2)", color: "var(--muted)", label: "CDT", name: "CDT 12% E.A.", val: "$20.000.000", pct: "12.0%" },
                    ].map(a => (
                      <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--panel)", borderRadius: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 28, height: 28, background: a.bg, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: a.color, fontFamily: "'IBM Plex Mono',monospace" }}>{a.label}</div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{a.name}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, color: "var(--fg)", fontFamily: "'IBM Plex Mono',monospace" }}>{a.val}</div>
                          <div style={{ fontSize: 11, color: "var(--pos)" }}>{a.pct}</div>
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
        <section className="landing-section" style={{ padding: "120px 40px", background: "var(--bg)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div className="split-row" style={{ display: "flex", alignItems: "center", gap: 80 }}>
              <div className="fi-fade" style={{ flex: 1, minWidth: 0, maxWidth: 480 }}>
                <SectionLabel>Metas y presupuestos</SectionLabel>
                <h2 style={{ fontFamily: "'Spectral',serif", fontSize: "clamp(30px,3.5vw,46px)", fontWeight: 300, letterSpacing: -1, color: "var(--fg)", lineHeight: 1.15, marginBottom: 20 } as React.CSSProperties}>
                  Define metas.<br /><em>Alcánzalas con claridad.</em>
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.68, color: "var(--muted)", marginBottom: 28 }}>Presupuestos mensuales por categoría, metas de ahorro con fecha objetivo y alertas cuando te acercas al límite.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Bullet>Presupuestos por categoría con alertas</Bullet>
                  <Bullet>Metas de ahorro con barra de progreso</Bullet>
                  <Bullet>Pagos recurrentes y suscripciones</Bullet>
                </div>
              </div>
              <div className="split-mock fi-fade" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 20, padding: 24, width: 360, maxWidth: "100%" }}>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Metas activas</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                      { name: "Viaje a Cartagena", pct: 68, current: "$2.040.000", total: "$3.000.000", date: "dic 2026", color: "var(--pos)" },
                      { name: "Fondo de emergencia", pct: 45, current: "$9.000.000", total: "$20.000.000", date: "dic 2027", color: "var(--indigo)" },
                      { name: "MacBook Pro", pct: 82, current: "$6.560.000", total: "$8.000.000", date: "sep 2026", color: "var(--muted)" },
                    ].map(g => (
                      <div key={g.name} style={{ background: "var(--panel2)", borderRadius: 12, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>{g.name}</span>
                          <span style={{ fontSize: 12, color: g.color, fontFamily: "'IBM Plex Mono',monospace" }}>{g.pct}%</span>
                        </div>
                        <div style={{ background: "var(--line)", height: 5, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${g.pct}%`, height: "100%", background: g.color, borderRadius: 3 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                          <span style={{ fontSize: 11, color: "var(--dim)" }}>{g.current} de {g.total}</span>
                          <span style={{ fontSize: 11, color: "var(--dim)" }}>{g.date}</span>
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
        <section id="descargar" className="landing-section" style={{ padding: "120px 40px", background: "var(--panel)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", textAlign: "center" }}>
            <div className="fi-fade">
              <SectionLabel>Descarga</SectionLabel>
              <h2 style={{ fontFamily: "'Spectral',serif", fontSize: "clamp(42px,6vw,80px)", fontWeight: 300, letterSpacing: -2.5, color: "var(--fg)", lineHeight: 1.05, marginBottom: 20 } as React.CSSProperties}>Llévalo contigo.</h2>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: "var(--muted)", maxWidth: 420, margin: "0 auto 48px" }}>Disponible para iOS y Android. Sin app store, instalación directa.</p>
              <div className="dl-btns" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
                <a href="/finance.apk" style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "var(--fg)", color: "var(--bg)", borderRadius: 16, padding: "18px 28px", fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 15, fontWeight: 600, textDecoration: "none", minWidth: 210 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.34L19.4 12.11a.38.38 0 00-.666-.365L16.85 15A11.5 11.5 0 0112 15.75c-1.66 0-3.23-.356-4.635-.987L5.48 11.51a.38.38 0 00-.666.365l1.86 3.22A11.5 11.5 0 000 23.25h24a11.5 11.5 0 00-6.477-7.91zM7.5 6.75a4.5 4.5 0 019 0v2.25a4.5 4.5 0 01-9 0V6.75z" /></svg>
                  <div style={{ textAlign: "left" }}><div style={{ fontSize: 11, fontWeight: 400, opacity: 0.65, marginBottom: 2 }}>Descargar para</div><div>Android</div></div>
                </a>
                <a href="/finance.ipa" style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "var(--panel2)", color: "var(--fg)", border: "1.5px solid var(--line)", borderRadius: 16, padding: "18px 28px", fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 15, fontWeight: 600, textDecoration: "none", minWidth: 210 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                  <div style={{ textAlign: "left" }}><div style={{ fontSize: 11, fontWeight: 400, opacity: 0.55, marginBottom: 2 }}>Descargar para</div><div>iOS</div></div>
                </a>
              </div>
              <p style={{ fontSize: 12, color: "var(--dim)", fontFamily: "'IBM Plex Mono',monospace" }}>Versión 1.0 · Última actualización: julio 2026</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="landing-section" style={{ padding: "140px 40px", background: "var(--bg)", textAlign: "center" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className="fi-fade">
              <h2 style={{ fontFamily: "'Spectral',serif", fontSize: "clamp(56px,8vw,104px)", fontWeight: 300, letterSpacing: -4, color: "var(--fg)", lineHeight: 0.96, marginBottom: 32 } as React.CSSProperties}>
                Empieza<br /><em>hoy.</em>
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: "var(--muted)", maxWidth: 360, margin: "0 auto 40px" }}>Gratis. Sin tarjeta de crédito. Acceso inmediato.</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <Link href="/login" className="btn-fill" style={{ fontSize: 17, padding: "18px 36px" }}>Comenzar con Google</Link>
                <Link href="/login" className="btn-outline" style={{ fontSize: 17, padding: "18px 36px" }}>Registro con email</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: "36px 40px", borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontFamily: "'Spectral',serif", fontSize: 15, fontWeight: 500, color: "var(--dim)" }}>Finance · 2026</span>
            <div style={{ display: "flex", gap: 24 }}>
              <Link href="/help" style={{ fontSize: 13, color: "var(--dim)" }}>Ayuda</Link>
              <Link href="/login" style={{ fontSize: 13, color: "var(--dim)" }}>Entrar</Link>
              <a href="#descargar" style={{ fontSize: 13, color: "var(--dim)" }}>Descargar</a>
            </div>
          </div>
        </footer>

        <FloatingCalc />
      </div>
    </>
  );
}
