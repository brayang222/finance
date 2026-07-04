"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const FloatingCalc = dynamic(
  () => import("../src/components/patrimonio/FloatingCalc"),
  { ssr: false }
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const COP = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");

// ── Chart data ───────────────────────────────────────────────────────────────
const MONTHS = ["Ago","Sep","Oct","Nov","Dic","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago"];
const VALUES  = [28.5,31.2,33.8,35.1,38.4,41.2,44.8,48.3,51.9,55.7,59.8,64.1,68.7];
const SPLIT   = 6; // last historical point index (Feb)
const MIN_V = 28.5, MAX_V = 68.7, RANGE = MAX_V - MIN_V;
const PW = 760, PH = 110, PX = 10, PY = 8;
const pts = VALUES.map((v, i) => ({
  x: PX + (i / (VALUES.length - 1)) * PW,
  y: PY + PH - ((v - MIN_V) / RANGE) * PH,
}));
const histPath = "M " + pts.slice(0, SPLIT+1).map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
const projPath = "M " + pts.slice(SPLIT).map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
const histArea = histPath + ` L ${pts[SPLIT].x.toFixed(1)} ${PY+PH} L ${PX} ${PY+PH} Z`;
const projArea = projPath + ` L ${pts[pts.length-1].x.toFixed(1)} ${PY+PH} L ${pts[SPLIT].x.toFixed(1)} ${PY+PH} Z`;

// ── Demo data ────────────────────────────────────────────────────────────────
const TXNS = [
  { pos: true,  desc: "Nómina",        cat: "Ingreso · Salario",  amt: 4_500_000 },
  { pos: false, desc: "Arriendo",       cat: "Vivienda",            amt: 1_200_000 },
  { pos: false, desc: "Supermercado",   cat: "Alimentación",        amt:   320_000 },
  { pos: true,  desc: "Freelance",      cat: "Ingreso · Servicios", amt: 1_800_000 },
  { pos: false, desc: "Spotify",        cat: "Entretenimiento",     amt:    32_000 },
];

// ── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

// ── Micro-components ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase mb-2.5 m-0" style={{ color: "var(--indigo)", letterSpacing: "0.12em" }}>
      {children}
    </p>
  );
}

function SectionHeadline({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-light m-0 mb-3.5 leading-tight"
      style={{ fontFamily: "Spectral, serif", fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.025em" }}
    >
      {children}
    </h2>
  );
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-light m-0 leading-relaxed" style={{ color: "var(--muted)", maxWidth: 340 }}>
      {children}
    </p>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm" style={{ color: "var(--muted)" }}>
      <svg className="mt-0.5 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      {children}
    </div>
  );
}

function MockCard({ title, badge, children }: { title: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid var(--line)" }}>
        <span style={{ fontFamily: "Spectral, serif", fontSize: 13, color: "var(--muted)" }}>{title}</span>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// Split layout — rev swaps visual order on desktop
function Split({ a, b, rev = false }: { a: React.ReactNode; b: React.ReactNode; rev?: boolean }) {
  return (
    <div className="grid items-center gap-14" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {rev ? <>{b}{a}</> : <>{a}{b}</>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const patrimony = useCountUp(44_800_000);
  const projected  = useCountUp(68_700_000, 1800);

  useEffect(() => {
    const el = document.documentElement;
    setIsLight(el.getAttribute("data-theme") === "light");
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    if (next) document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        "--indigo":       "#6366f1",
        "--indigo-bright":"#818cf8",
        "--indigo-dim":   "rgba(99,102,241,0.15)",
        background: "var(--bg)",
        color: "var(--fg)",
      } as React.CSSProperties}
    >

      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
          background: scrolled ? (isLight ? "rgba(245,244,241,0.88)" : "rgba(14,15,19,0.85)") : "transparent",
          backdropFilter: scrolled ? "blur(18px) saturate(1.4)" : "none",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between" style={{ height: 56 }}>
          <Link href="/" className="no-underline" style={{ fontFamily: "Spectral, serif", fontSize: 18, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--fg)" }}>
            Finance
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/help" className="text-sm no-underline transition-colors hover:opacity-70" style={{ color: "var(--muted)" }}>
              Ayuda
            </Link>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{ border: "1px solid var(--line)", background: "transparent", color: "var(--muted)" }}
              title="Cambiar tema"
            >
              {isLight ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <Link
              href="/login"
              className="text-sm font-medium no-underline flex items-center px-4 py-1.5 rounded-md transition-opacity hover:opacity-85"
              style={{ background: "var(--fg)", color: "var(--bg)" }}
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="flex flex-col justify-center px-6 py-20" style={{ minHeight: "calc(100vh - 56px)" }}>
        <div className="max-w-4xl mx-auto w-full">
          <p className="text-xs font-semibold uppercase mb-5 m-0" style={{ color: "var(--indigo)", letterSpacing: "0.1em" }}>
            Finanzas personales · Colombia
          </p>
          <h1
            className="font-light m-0 mb-5 leading-none"
            style={{ fontFamily: "Spectral, serif", fontSize: "clamp(50px, 7.5vw, 84px)", letterSpacing: "-0.03em", lineHeight: 1.04 }}
          >
            Tu patrimonio,<br />
            <em style={{ fontStyle: "italic" }}>bajo control.</em>
          </h1>
          <p className="font-light m-0 mb-8 leading-relaxed" style={{ color: "var(--muted)", fontSize: 15, maxWidth: 460 }}>
            Registra por voz, conecta tus inversiones y proyecta tu futuro financiero — todo en un solo lugar, en español, pensado para Colombia.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium no-underline px-5 py-3 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: "var(--indigo)", color: "#fff" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Comenzar gratis
          </Link>
          {/* Stats strip */}
          <div className="flex mt-14 rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            {[
              { label: "Registro en segundos", val: "Voz · Texto · CSV" },
              { label: "Proyecciones reales",   val: "Desde tu historial" },
              { label: "Multi-canal",            val: "Web · Telegram · App" },
            ].map(({ label, val }, i) => (
              <div
                key={label}
                className="flex-1 py-4 px-5 text-center"
                style={{ borderRight: i < 2 ? "1px solid var(--line)" : "none" }}
              >
                <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
                <div className="text-xs font-semibold mt-1 uppercase" style={{ color: "var(--indigo-bright)", letterSpacing: "0.04em" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEMO ── */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontFamily: "Spectral, serif", fontSize: 13, color: "var(--muted)" }}>Resumen · Julio 2026</span>
              <div className="hidden sm:flex gap-5">
                {[
                  { label: "Ingresos",    val: "$6.300.000",  pos: true },
                  { label: "Egresos",     val: "$1.552.000",  pos: false },
                  { label: "Ahorro neto", val: "$4.748.000",  pos: true },
                ].map(({ label, val, pos }) => (
                  <span key={label} className="text-xs" style={{ color: "var(--muted)" }}>
                    {label} <span style={{ color: pos ? "var(--pos)" : "var(--neg)", fontWeight: 500 }}>{val}</span>
                  </span>
                ))}
              </div>
            </div>
            {/* Body */}
            <div className="p-5">
              {/* KPI grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                {[
                  { name: "Patrimonio neto",    val: COP(patrimony), sub: null,           pos: true },
                  { name: "Proyección 6 meses", val: COP(projected), sub: "+53% estimado", pos: true },
                ].map(({ name, val, sub }) => (
                  <div key={name} className="rounded-xl p-3.5" style={{ background: "var(--panel2)", border: "1px solid var(--line)" }}>
                    <div className="uppercase mb-1.5" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em" }}>{name}</div>
                    <div className="font-light leading-none" style={{ fontFamily: "Spectral, serif", fontSize: 21, color: "var(--pos)" }}>{val}</div>
                    {sub && <div className="mt-1" style={{ fontSize: 10, color: "var(--pos)" }}>{sub}</div>}
                  </div>
                ))}
              </div>
              {/* Investment strip */}
              <div className="flex mb-3.5 rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                {[
                  { name: "Acciones",          val: "$12.400.000", pct: "↑2.3%" },
                  { name: "Cripto",             val: "$3.100.000",  pct: "↑5.1%" },
                  { name: "Alto rendimiento",  val: "$8.200.000",  pct: "+0.6% mes" },
                ].map(({ name, val, pct }, i) => (
                  <div key={name} className="flex-1 py-2.5 px-3" style={{ borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
                    <div className="mb-0.5" style={{ fontSize: 9, color: "var(--muted)" }}>{name}</div>
                    <div className="text-sm font-medium">
                      {val} <span style={{ fontSize: 10, color: "var(--pos)" }}>{pct}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Chart */}
              <div className="mb-3.5" style={{ height: 130 }}>
                <svg viewBox={`0 0 780 ${PH + PY + 20}`} className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--indigo)" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="var(--indigo)" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--indigo)" stopOpacity="0.08"/>
                      <stop offset="100%" stopColor="var(--indigo)" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {pts.map((p, i) => i % 2 === 0 && (
                    <text key={i} x={p.x} y={PY + PH + 16} textAnchor="middle" fontSize="9" fill="var(--dim)">{MONTHS[i]}</text>
                  ))}
                  <path d={histArea} fill="url(#hg)"/>
                  <path d={projArea} fill="url(#pg)"/>
                  <path d={histPath} fill="none" stroke="var(--indigo)" strokeWidth="1.75" strokeLinecap="round"/>
                  <path d={projPath} fill="none" stroke="var(--indigo-bright)" strokeWidth="1.75" strokeDasharray="5 4" strokeLinecap="round"/>
                  <line x1={pts[SPLIT].x} y1={PY} x2={pts[SPLIT].x} y2={PY + PH} stroke="var(--dim)" strokeWidth="1" strokeDasharray="3 3"/>
                  <text x={pts[SPLIT].x + 4} y={PY + 12} fontSize="9" fill="var(--muted)">Hoy</text>
                </svg>
              </div>
              {/* Transactions */}
              <div>
                {TXNS.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < TXNS.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">{tx.desc}</span>
                      <span className="inline-block px-1.5 py-0.5 rounded" style={{ fontSize: 9, color: "var(--muted)", background: "var(--panel2)", border: "1px solid var(--line)" }}>{tx.cat}</span>
                    </div>
                    <span className="font-medium" style={{ fontFamily: "Spectral, serif", fontSize: 13, color: tx.pos ? "var(--pos)" : "var(--neg)" }}>
                      {tx.pos ? "+" : "−"}{COP(tx.amt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VOICE ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto">
          <Split
            a={
              <div>
                <SectionLabel>Registro</SectionLabel>
                <SectionHeadline>Di lo que gastaste.<br /><em>La app lo entiende.</em></SectionHeadline>
                <SectionSub>Habla o escribe en español natural. Finance detecta tipo, monto, descripción y categoría automáticamente — incluyendo números en palabras como "quinientos mil" o "un millón".</SectionSub>
                <div className="flex flex-col gap-2.5 mt-6">
                  {[
                    { inp: '"35.000 almuerzo"',              res: <><strong style={{ color: "var(--indigo-bright)" }}>$35.000</strong> · Alimentación</> },
                    { inp: '"ingreso de un millón salario"', res: <>Ingreso · <strong style={{ color: "var(--indigo-bright)" }}>$1.000.000</strong> · Salario</> },
                    { inp: '"quinientos mil arriendo"',      res: <><strong style={{ color: "var(--indigo-bright)" }}>$500.000</strong> · Vivienda</> },
                  ].map(({ inp, res }) => (
                    <div key={inp} className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-md" style={{ fontFamily: "monospace", background: "var(--panel2)", border: "1px solid var(--line)", whiteSpace: "nowrap" }}>{inp}</span>
                      <span style={{ color: "var(--dim)", fontSize: 11 }}>→</span>
                      <span className="text-sm" style={{ color: "var(--muted)" }}>{res}</span>
                    </div>
                  ))}
                </div>
              </div>
            }
            b={
              <MockCard title="Nuevo movimiento">
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl mb-3" style={{ border: "1px solid var(--line)", background: "var(--panel2)" }}>
                  <span className="flex-1 text-sm" style={{ color: "var(--dim)" }}>Dicta o escribe...</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="1.75" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </div>
                <div className="flex gap-2 mb-3">
                  {[
                    { lbl: "Tipo",      val: "Egreso",       c: "var(--neg)" },
                    { lbl: "Monto",     val: "$35.000",      c: "var(--fg)" },
                    { lbl: "Categoría", val: "Alimentación", c: "var(--indigo-bright)" },
                  ].map(({ lbl, val, c }) => (
                    <div key={lbl} className="flex-1 rounded-xl p-2.5" style={{ background: "var(--panel2)", border: "1px solid var(--line)" }}>
                      <div className="uppercase mb-1" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.07em" }}>{lbl}</div>
                      <div className="text-xs font-medium" style={{ color: c }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer" style={{ background: "var(--indigo)", color: "#fff", border: "none" }}>Guardar</button>
                  <button className="px-3.5 py-2.5 rounded-lg text-sm cursor-pointer" style={{ background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--muted)" }}>Editar</button>
                </div>
              </MockCard>
            }
          />
        </div>
      </section>

      {/* ── CUENTAS ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto">
          <Split
            rev
            a={
              <div>
                <SectionLabel>Cuentas</SectionLabel>
                <SectionHeadline>Todos tus bancos<br /><em>en una vista.</em></SectionHeadline>
                <SectionSub>Organiza por banco y tipo — corriente, ahorro, efectivo, cartera, bolsa o cripto. El KPI de efectivo disponible excluye inversiones para que siempre sepas con qué cuentas realmente.</SectionSub>
                <div className="flex flex-col gap-2 mt-6">
                  {[
                    { c: "var(--indigo)",  label: "Cuenta corriente · Ahorros · Efectivo" },
                    { c: "var(--dim)",     label: "Cartera · Bolsa · Cripto (excluidos del efectivo)" },
                  ].map(({ c, label }) => (
                    <div key={label} className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }}/>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            }
            b={
              <MockCard title="Cuentas" badge={<span style={{ fontSize: 10, color: "var(--muted)" }}>5 cuentas</span>}>
                <div>
                  {[
                    { icon: "Bc", name: "Bancolombia",  type: "Cuenta de ahorros",   amt: "$8.400.000",  inv: false },
                    { icon: "Nq", name: "Nequi",         type: "Billetera digital",   amt: "$1.200.000",  inv: false },
                    { icon: "Ef", name: "Efectivo",      type: "Billetera física",    amt: "$350.000",    inv: false },
                    { icon: "Et", name: "ETF Local",     type: "Cartera de inversión",amt: "$12.400.000", inv: true  },
                    { icon: "₿",  name: "Binance",       type: "Cripto",              amt: "$3.100.000",  inv: true  },
                  ].map((acc, i, arr) => (
                    <div key={acc.name} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs" style={{ border: "1px solid var(--line)", background: "var(--panel2)", color: "var(--muted)", fontFamily: "Spectral, serif" }}>{acc.icon}</div>
                        <div>
                          <div className="text-sm">{acc.name}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{acc.type}</div>
                        </div>
                      </div>
                      <div className="text-sm" style={{ fontFamily: "Spectral, serif", color: acc.inv ? "var(--muted)" : "var(--fg)" }}>{acc.amt}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3.5 px-3.5 py-3 rounded-xl" style={{ background: "var(--indigo-dim)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <span style={{ fontSize: 11, color: "var(--indigo-bright)" }}>Efectivo disponible</span>
                  <span style={{ fontFamily: "Spectral, serif", fontSize: 15, fontWeight: 500, color: "var(--indigo-bright)" }}>$9.950.000</span>
                </div>
              </MockCard>
            }
          />
        </div>
      </section>

      {/* ── INVERSIONES ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto">
          <Split
            a={
              <div>
                <SectionLabel>Inversiones</SectionLabel>
                <SectionHeadline>Acciones, cripto<br /><em>y más, en tiempo real.</em></SectionHeadline>
                <SectionSub>Conecta tus portafolios y ve el valor actualizado de cada posición. Finance consolida acciones, criptomonedas y fondos de alto rendimiento en un patrimonio neto unificado.</SectionSub>
                <div className="flex flex-col gap-2.5 mt-6">
                  <Bullet>Precios actualizados automáticamente</Bullet>
                  <Bullet>Proyección de rendimiento a 6 y 12 meses</Bullet>
                  <Bullet>Incluye dividendos y ganancias/pérdidas no realizadas</Bullet>
                </div>
              </div>
            }
            b={
              <MockCard
                title="Portafolio"
                badge={<span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "rgba(74,222,128,0.1)", color: "var(--pos)" }}>↑ +3.8% hoy</span>}
              >
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th className="text-left pb-2" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--line)" }}>Activo</th>
                      <th className="text-center pb-2" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--line)" }}>Cambio</th>
                      <th className="text-right pb-2" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--line)" }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Ecopetrol",      ticker: "ECO · BVC",    chg: "↑2.3%", up: true,  val: "$4.800.000" },
                      { name: "S&P 500 ETF",    ticker: "SPY · NYSE",   chg: "↑0.9%", up: true,  val: "$7.600.000" },
                      { name: "Bitcoin",         ticker: "BTC · Binance",chg: "↑5.1%", up: true,  val: "$2.400.000" },
                      { name: "Ethereum",        ticker: "ETH · Binance",chg: "↓1.2%", up: false, val: "$700.000"   },
                      { name: "Fdo. Alto Rdto.", ticker: "Bancolombia",  chg: "+0.6%", up: true,  val: "$8.200.000" },
                    ].map((row, i, arr) => (
                      <tr key={row.name}>
                        <td className="py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                          <div className="text-sm">{row.name}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{row.ticker}</div>
                        </td>
                        <td className="text-center py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{
                            background: row.up ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                            color: row.up ? "var(--pos)" : "var(--neg)",
                          }}>{row.chg}</span>
                        </td>
                        <td className="text-right py-2.5" style={{ fontFamily: "Spectral, serif", fontSize: 13, borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>{row.val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Total inversiones</span>
                  <span style={{ fontFamily: "Spectral, serif", fontSize: 16, fontWeight: 500, color: "var(--pos)" }}>$23.700.000</span>
                </div>
              </MockCard>
            }
          />
        </div>
      </section>

      {/* ── RECURRENTES ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto">
          <Split
            rev
            a={
              <div>
                <SectionLabel>Recurrentes</SectionLabel>
                <SectionHeadline>Nómina, arriendo<br /><em>y suscripciones.</em></SectionHeadline>
                <SectionSub>Registra ingresos y gastos que se repiten cada mes. Finance te alerta antes de que venza cada uno para que nunca te tome por sorpresa.</SectionSub>
                <div className="flex flex-col gap-2.5 mt-6">
                  <Bullet>Alerta 3 días antes del vencimiento</Bullet>
                  <Bullet>Proyección automática de flujo mensual</Bullet>
                </div>
              </div>
            }
            b={
              <MockCard
                title="Recurrentes · Julio"
                badge={<span style={{ fontSize: 10, color: "var(--neg)" }}>1 vence pronto</span>}
              >
                {[
                  { name: "Nómina",   meta: "Ingreso · 1 del mes",        badge: "Cobrado",        alertBadge: false, pos: true,  amt: "+$4.500.000" },
                  { name: "Arriendo", meta: "Vivienda · 5 del mes",        badge: "Vence en 2 días",alertBadge: true,  pos: false, amt: "−$1.200.000" },
                  { name: "Netflix",  meta: "Entretenimiento · 15 del mes", badge: "Pendiente",      alertBadge: false, pos: false, amt: "−$45.000"    },
                  { name: "Spotify",  meta: "Entretenimiento · 15 del mes", badge: "Pendiente",      alertBadge: false, pos: false, amt: "−$32.000"    },
                  { name: "Gimnasio", meta: "Salud · 20 del mes",           badge: "Pendiente",      alertBadge: false, pos: false, amt: "−$90.000"    },
                ].map((r, i, arr) => (
                  <div key={r.name} className="flex items-center justify-between gap-2.5 py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <div className="flex-1">
                      <div className="text-sm">{r.name}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{r.meta}</div>
                    </div>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded shrink-0"
                      style={r.alertBadge
                        ? { background: "rgba(248,113,113,0.12)", color: "var(--neg)" }
                        : { background: "var(--panel2)", color: "var(--muted)", border: "1px solid var(--line)" }
                      }
                    >{r.badge}</span>
                    <div className="text-sm shrink-0" style={{ fontFamily: "Spectral, serif", color: r.pos ? "var(--pos)" : "var(--fg)", textAlign: "right", whiteSpace: "nowrap" }}>{r.amt}</div>
                  </div>
                ))}
              </MockCard>
            }
          />
        </div>
      </section>

      {/* ── METAS ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto">
          <Split
            a={
              <div>
                <SectionLabel>Metas</SectionLabel>
                <SectionHeadline>Ahorra con<br /><em>propósito y fecha.</em></SectionHeadline>
                <SectionSub>Define cuánto quieres ahorrar y para cuándo. Finance muestra tu progreso en tiempo real y ajusta la proyección según tus movimientos del mes.</SectionSub>
                <div className="flex flex-col gap-2.5 mt-6">
                  <Bullet>Progreso automático desde tus registros</Bullet>
                  <Bullet>Alerta si no llegarás a tu meta a tiempo</Bullet>
                </div>
              </div>
            }
            b={
              <MockCard title="Metas de ahorro" badge={<span style={{ fontSize: 10, color: "var(--muted)" }}>3 activas</span>}>
                <div className="flex flex-col gap-3.5">
                  {[
                    { name: "Viaje a Europa",      date: "Meta: Sep 2026", pct: 40,  current: "$3.200.000 ahorrados", target: "meta $8.000.000",  done: false },
                    { name: "Fondo de emergencia", date: "Meta: Dic 2026", pct: 74,  current: "$11.200.000 ahorrados",target: "meta $15.000.000", done: false },
                    { name: "Portátil nuevo",       date: "Completado",    pct: 100, current: "$4.500.000 — listo",   target: "meta $4.500.000",  done: true  },
                  ].map(({ name, date, pct, current, target, done }) => (
                    <div key={name} className="rounded-xl p-3.5" style={{ background: "var(--panel2)", border: "1px solid var(--line)" }}>
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <div className="text-sm font-medium">{name}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{date}</div>
                        </div>
                        <div style={{ fontFamily: "Spectral, serif", fontSize: 18, fontWeight: 300, color: done ? "var(--pos)" : "var(--indigo-bright)" }}>{pct}%</div>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 4, background: "var(--line)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: done ? "var(--pos)" : "var(--indigo)" }}/>
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span style={{ fontSize: 11, color: done ? "var(--pos)" : "var(--indigo-bright)", fontWeight: 500 }}>{current}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{target}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </MockCard>
            }
          />
        </div>
      </section>

      {/* ── PRESUPUESTOS ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto">
          <Split
            rev
            a={
              <div>
                <SectionLabel>Presupuestos</SectionLabel>
                <SectionHeadline>Límites que<br /><em>avisan antes de romperse.</em></SectionHeadline>
                <SectionSub>Define un techo total o por categoría. Cada vez que registras un movimiento, Finance verifica en tiempo real si estás cerca del límite.</SectionSub>
                <div className="flex flex-col gap-2.5 mt-6">
                  <Bullet>Alerta al superar el 85% del presupuesto</Bullet>
                  <Bullet>Resumen de excesos al cierre del mes</Bullet>
                </div>
              </div>
            }
            b={
              <MockCard
                title="Presupuesto · Julio 2026"
                badge={<span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>1 advertencia</span>}
              >
                <div className="flex justify-between items-center mb-3">
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Total gastado este mes</span>
                  <span style={{ fontFamily: "Spectral, serif", fontSize: 14 }}>$1.552.000 <span style={{ color: "var(--muted)", fontSize: 10 }}>/ $2.500.000</span></span>
                </div>
                <div className="rounded-full overflow-hidden mb-4" style={{ height: 4, background: "var(--line)" }}>
                  <div className="h-full rounded-full" style={{ width: "62%", background: "var(--indigo)" }}/>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { cat: "Alimentación",   spent: "$450.000",  total: "$600.000",  pct: 75,  status: "safe" },
                    { cat: "Transporte",      spent: "$180.000",  total: "$300.000",  pct: 60,  status: "safe" },
                    { cat: "Entretenimiento",spent: "$270.000",  total: "$280.000",  pct: 96,  status: "warn" },
                    { cat: "Salud",           spent: "$90.000",   total: "$400.000",  pct: 22,  status: "safe" },
                  ].map(({ cat, spent, total, pct, status }) => (
                    <div key={cat}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm">{cat}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}><strong style={{ color: "var(--fg)", fontWeight: 500 }}>{spent}</strong> / {total}</span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 5, background: "var(--line)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: status === "warn" ? "#f59e0b" : "var(--indigo)" }}/>
                      </div>
                      {status === "warn" && <div className="mt-1" style={{ fontSize: 9, color: "#f59e0b", fontWeight: 500 }}>⚠ Casi en el límite — te quedan $10.000</div>}
                    </div>
                  ))}
                </div>
              </MockCard>
            }
          />
        </div>
      </section>

      {/* ── MULTI-CANAL ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto">
          <SectionLabel><span className="block text-center">Multi-canal</span></SectionLabel>
          <SectionHeadline><span className="block text-center" style={{ maxWidth: 500, margin: "0 auto" }}>Registra desde donde<br /><em>más te convenga.</em></span></SectionHeadline>
          <p className="text-sm font-light text-center mx-auto mb-12 m-0 leading-relaxed" style={{ color: "var(--muted)", maxWidth: 420 }}>
            Web, Telegram o importando tu extracto CSV del banco. Finance adapta el canal al momento, no al revés.
          </p>
          <div className="grid grid-cols-2 gap-5">
            {/* Telegram mock */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
              <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: "1px solid var(--line)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--indigo)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <div className="text-sm font-medium">Finance Bot</div>
                  <div style={{ fontSize: 10, color: "var(--pos)" }}>en línea</div>
                </div>
              </div>
              <div className="p-3.5 flex flex-col gap-2">
                {[
                  { user: true,  text: "35000 almuerzo" },
                  { user: false, text: <>Listo. <strong style={{ color: "var(--pos)", fontWeight: 600 }}>$35.000</strong> registrado como <strong style={{ color: "var(--indigo-bright)", fontWeight: 500 }}>Alimentación</strong>. ¿Todo bien?</> },
                  { user: true,  text: "ingreso un millón salario" },
                  { user: false, text: <>Ingreso de <strong style={{ color: "var(--pos)", fontWeight: 600 }}>$1.000.000</strong> guardado bajo <strong style={{ color: "var(--indigo-bright)", fontWeight: 500 }}>Salario</strong>. Tu ahorro del mes va en $4.748.000.</> },
                ].map((msg, i) => (
                  <div key={i} className={`max-w-xs ${msg.user ? "self-end" : "self-start"}`}>
                    <div
                      className="px-3 py-2 rounded-xl text-sm leading-snug"
                      style={msg.user
                        ? { background: "var(--indigo)", color: "#fff", borderBottomRightRadius: 3 }
                        : { background: "var(--panel2)", border: "1px solid var(--line)", borderBottomLeftRadius: 3 }
                      }
                    >{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* CSV mock */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
              <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Importar extracto CSV</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "var(--indigo-dim)", color: "var(--indigo-bright)", letterSpacing: "0.04em" }}>Bancolombia · Nequi</span>
              </div>
              <div className="p-3.5 border-b" style={{ borderColor: "var(--line)" }}>
                <div className="rounded-lg p-3 text-center" style={{ border: "1px dashed var(--line)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" style={{ display: "block", margin: "0 auto 6px" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Arrastra tu extracto aquí</span>
                </div>
              </div>
              <div className="px-4 pt-2.5 pb-0" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Detección automática de columnas</div>
              <div className="px-4 pb-2">
                {[
                  { raw: "04/07/2026,SUPERMERCADO EXITO,-320000",  amount: "$320.000",   cat: "Alimentación" },
                  { raw: "03/07/2026,NOMINA EMPRESA S.A,4500000",  amount: "$4.500.000", cat: "Salario" },
                  { raw: "02/07/2026,PSE*NETFLIX,-45000",           amount: "$45.000",   cat: "Entretenimiento" },
                ].map((row, i, arr) => (
                  <div key={i} className="flex items-center gap-2.5 py-2" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <span className="flex-1 truncate" style={{ fontFamily: "monospace", fontSize: 10, color: "var(--muted)" }}>{row.raw}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ borderColor: "rgba(99,102,241,0.3)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--indigo-bright)" }}>{row.amount}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--muted)" }}>{row.cat}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3.5">
                <button className="w-full py-2.5 rounded-lg text-sm font-medium cursor-pointer" style={{ background: "var(--indigo)", color: "#fff", border: "none" }}>
                  Importar 3 movimientos
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase text-center mb-8 m-0" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>
            Diseñado para el día a día
          </p>
          <div className="grid grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
            {[
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
                title: "Modo privacidad",
                desc:  "Oculta todos los montos con un clic. Ideal para compartir pantalla en reuniones.",
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
                title: "Tema oscuro y claro",
                desc:  "Cambia entre temas con un clic. Finance respeta tu preferencia del sistema operativo.",
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="12" y2="18"/></svg>,
                title: "Calculadora flotante",
                desc:  "Accesible desde cualquier pantalla. Calcula sin perder el contexto donde estás.",
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                title: "Categorización inteligente",
                desc:  "17 categorías con mapeo semántico. Aprende de tus hábitos para sugerir mejor con el tiempo.",
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                title: "En pesos colombianos",
                desc:  "Todo en COP, formateado como $44.800.000. Sin conversiones, sin confusión.",
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><path d="M3 17v.01M3 21v.01M7 17v.01M7 21v.01M10 17v.01"/></svg>,
                title: "Atajos de teclado",
                desc:  "Navega, registra y consulta sin tocar el mouse. Productividad de escritorio real.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-2.5 p-6" style={{ background: "var(--bg)" }}>
                <span style={{ color: "var(--muted)" }}>{icon}</span>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-sm font-light leading-snug" style={{ color: "var(--muted)" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="text-center px-6 py-24" style={{ borderTop: "1px solid var(--line)", background: "var(--panel)" }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="font-light m-0 mb-3 leading-none"
            style={{ fontFamily: "Spectral, serif", fontSize: "clamp(38px, 6vw, 64px)", letterSpacing: "-0.03em" }}
          >
            Empieza hoy.
          </h2>
          <p className="text-sm font-light m-0 mb-7" style={{ color: "var(--muted)" }}>
            Sin tarjeta de crédito. Sin configuración complicada.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 text-sm font-medium no-underline px-5 py-3 rounded-lg transition-opacity hover:opacity-85"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Crear cuenta con Google
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative flex items-center justify-center px-6 py-5" style={{ borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 12, color: "var(--dim)" }}>Finance · 2026</span>
        <div className="absolute right-6 flex gap-5">
          <Link href="/help" className="no-underline transition-colors hover:opacity-70" style={{ fontSize: 12, color: "var(--dim)" }}>Ayuda</Link>
          <Link href="/login" className="no-underline transition-colors hover:opacity-70" style={{ fontSize: 12, color: "var(--dim)" }}>Entrar</Link>
        </div>
      </footer>

      <FloatingCalc />
    </div>
  );
}
