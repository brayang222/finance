"use client";

import React, { useState, useRef, useEffect } from "react";
import { IconCalc } from "./Icons";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

// Accepts both "9.25" and "9,25" as decimals; "1.000.000" and "1,000,000" as millions
function NUM(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  const commas = (t.match(/,/g) || []).length;
  const dots   = (t.match(/\./g) || []).length;
  let normalized: string;
  if (commas > 0) {
    // Colombian: dots = thousands, last comma = decimal
    normalized = t.replace(/\./g, "").replace(",", ".");
  } else if (dots > 1) {
    // Multiple dots → all thousands separators
    normalized = t.replace(/\./g, "");
  } else if (dots === 1) {
    const dec = t.split(".")[1];
    // Single dot with 3 digits = thousands separator (e.g. "1.000"), else decimal
    normalized = dec.length === 3 ? t.replace(".", "") : t;
  } else {
    normalized = t;
  }
  const v = parseFloat(normalized);
  return isNaN(v) ? 0 : v;
}

// Money input with Colombian formatting
function MoneyField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const raw = value.replace(/\./g, "").replace(/[^\d]/g, "");
  const display = raw ? parseInt(raw, 10).toLocaleString("es-CO") : "";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--dim)" }}>{label}</label>
      <div className="flex items-center border rounded-lg px-3 h-9 gap-1.5" style={{ borderColor: "var(--line)", background: "var(--panel2)" }}>
        <span className="text-sm" style={{ color: "var(--muted)" }}>$</span>
        <input
          inputMode="numeric"
          value={display}
          onChange={e => onChange(e.target.value.replace(/\./g, "").replace(/[^\d]/g, ""))}
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: "var(--fg)" }}
          placeholder="0"
        />
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, suffix, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--dim)" }}>{label}</label>
      <div className="flex items-center border rounded-lg px-3 h-9 gap-1.5" style={{ borderColor: "var(--line)", background: "var(--panel2)" }}>
        <input
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: "var(--fg)" }}
          placeholder={placeholder ?? "0"}
        />
        {suffix && <span className="text-sm" style={{ color: "var(--muted)" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Result({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3"
      style={highlight
        ? { background: "var(--accent)", color: "var(--accentFg)" }
        : { background: "var(--panel2)", color: "var(--fg)" }}>
      <div>
        <div className="text-xs mb-0.5" style={{ opacity: 0.7 }}>{label}</div>
        <div className="text-base font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
      </div>
      <button onClick={copy}
        className="text-xs rounded-lg px-2 py-1 cursor-pointer border"
        style={highlight
          ? { background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)", color: "var(--accentFg)" }
          : { background: "var(--panel)", borderColor: "var(--line)", color: "var(--muted)" }}>
        {copied ? "✓" : "Copiar"}
      </button>
    </div>
  );
}

// ── 1. Calculadora normal ─────────────────────────────────────────────────────
const KEY_MAP: Record<string, string> = {
  "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
  "+":"+","-":"−","*":"×","/":"÷",
  "Enter":"=","=":"=",
  "Backspace":"⌫","Escape":"C","Delete":"C",
  ".":","  ,",":","  ,"%":"%",
};

function CalcNormal() {
  const [display, setDisplay] = useState("0");
  const [expr, setExpr]       = useState("");
  const [justEval, setJustEval] = useState(false);
  const [copied, setCopied]   = useState(false);

  const handleBtn = (v: string) => {
    if (v === "C") { setDisplay("0"); setExpr(""); setJustEval(false); return; }
    if (v === "⌫") {
      setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0");
      if (justEval) { setExpr(""); setJustEval(false); }
      return;
    }
    if (v === "=") {
      try {
        const raw = (justEval ? display : expr + display).replace(/,/g, ".");
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${raw})`)();
        const str = Number(result.toFixed(10)).toString().replace(".", ",");
        setDisplay(str);
        setExpr("");
        setJustEval(true);
      } catch { setDisplay("Error"); setExpr(""); }
      return;
    }
    if (["+", "−", "×", "÷"].includes(v)) {
      const op = v === "×" ? "*" : v === "÷" ? "/" : v === "−" ? "-" : "+";
      setExpr((justEval ? display : expr + display) + op);
      setDisplay("0");
      setJustEval(false);
      return;
    }
    if (v === ",") {
      if (justEval) { setDisplay("0,"); setExpr(""); setJustEval(false); return; }
      if (!display.includes(",")) setDisplay(d => d + ",");
      return;
    }
    if (v === "%") {
      try {
        const val = parseFloat(display.replace(",", ".")) / 100;
        setDisplay(val.toString().replace(".", ","));
      } catch {}
      return;
    }
    if (justEval) { setDisplay(v); setExpr(""); setJustEval(false); return; }
    setDisplay(d => d === "0" ? v : d + v);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      const mapped = KEY_MAP[e.key];
      if (!mapped) return;
      e.preventDefault();
      handleBtn(mapped);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, expr, justEval]);

  const copy = () => {
    navigator.clipboard.writeText(display.replace(",", "."));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const btns = [
    ["C", "%", "⌫", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ",", "="],
  ];

  const btnStyle = (v: string): React.CSSProperties => {
    if (v === "=") return { background: "var(--accent)", color: "var(--accentFg)" };
    if (["+", "−", "×", "÷"].includes(v)) return { background: "var(--panel2)", color: "var(--accent)" };
    if (["C", "%", "⌫"].includes(v)) return { background: "var(--panel2)", color: "var(--muted)" };
    return { background: "var(--panel2)", color: "var(--fg)" };
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl p-4 text-right" style={{ background: "var(--panel2)" }}>
        <div className="text-xs h-4" style={{ color: "var(--dim)" }}>{expr}</div>
        <div className="text-3xl font-light truncate" style={{ color: "var(--fg)", fontFamily: "'IBM Plex Mono', monospace" }}>
          {display}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {btns.map((row, i) => (
          <div key={i} className="grid gap-2"
            style={{ gridTemplateColumns: row.length === 3 ? "2fr 1fr 1fr" : "repeat(4,1fr)" }}>
            {row.map(v => (
              <button key={v} onClick={() => handleBtn(v)}
                className="h-11 rounded-xl text-base font-medium cursor-pointer border-none outline-none active:opacity-60"
                style={btnStyle(v)}>
                {v}
              </button>
            ))}
          </div>
        ))}
      </div>
      <button onClick={copy}
        className="w-full h-9 rounded-xl border text-sm cursor-pointer"
        style={{ borderColor: "var(--line)", background: "var(--panel)", color: copied ? "var(--accent)" : "var(--muted)" }}>
        {copied ? "✓ Copiado" : "Copiar resultado"}
      </button>
    </div>
  );
}

// ── 2. Alto rendimiento ───────────────────────────────────────────────────────
function CalcHYS() {
  const [capital, setCapital] = useState("");
  const [tea, setTea]         = useState("");
  const [dias, setDias]       = useState("");

  const C = NUM(capital), T = NUM(tea), D = NUM(dias);
  const saldo   = C > 0 && T > 0 && D > 0 ? C * Math.pow(1 + T / 100, D / 365) : null;
  const interes = saldo !== null ? saldo - C : null;

  return (
    <div className="flex flex-col gap-3">
      <MoneyField label="Capital inicial" value={capital} onChange={setCapital} />
      <NumField label="Tasa efectiva anual (TEA %)" value={tea} onChange={setTea} suffix="%" placeholder="9,25" />
      <NumField label="Días" value={dias} onChange={setDias} placeholder="365" />
      {saldo !== null && (
        <div className="flex flex-col gap-2 mt-1">
          <Result label="Saldo final" value={fmt(saldo)} highlight />
          <Result label="Interés ganado" value={fmt(interes!)} />
          <Result label="Rentabilidad" value={`${((interes! / C) * 100).toFixed(3)}%`} />
        </div>
      )}
    </div>
  );
}

// ── 3. Acción ─────────────────────────────────────────────────────────────────
function CalcAccion() {
  const [entrada,  setEntrada]  = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [comision, setComision] = useState("0");

  const E = NUM(entrada), O = NUM(objetivo), Q = NUM(cantidad), C = NUM(comision);
  const calc = E > 0 && O > 0 && Q > 0 ? (() => {
    const inv      = E * Q;
    const valorObj = O * Q;
    const ganancia = valorObj - inv - C;
    const pct      = (ganancia / inv) * 100;
    return { inv, valorObj, ganancia, pct };
  })() : null;

  return (
    <div className="flex flex-col gap-3">
      <MoneyField label="Precio de entrada (COP)" value={entrada}  onChange={setEntrada} />
      <MoneyField label="Precio objetivo (COP)"   value={objetivo} onChange={setObjetivo} />
      <NumField   label="Cantidad de acciones"    value={cantidad} onChange={setCantidad} />
      <MoneyField label="Comisión estimada"       value={comision} onChange={setComision} />
      {calc && (
        <div className="flex flex-col gap-2 mt-1">
          <Result label="Inversión total"    value={fmt(calc.inv)} />
          <Result label="Valor al objetivo"  value={fmt(calc.valorObj)} />
          <Result label={`Ganancia potencial (${calc.pct >= 0 ? "+" : ""}${calc.pct.toFixed(2)}%)`}
            value={fmt(calc.ganancia)} highlight />
        </div>
      )}
    </div>
  );
}

// ── 4. Préstamo ───────────────────────────────────────────────────────────────
function CalcPrestamo() {
  const [capital, setCapital] = useState("");
  const [tasa,    setTasa]    = useState("");
  const [meses,   setMeses]   = useState("");

  const C = NUM(capital), T = NUM(tasa), M = NUM(meses);
  const calc = C > 0 && T > 0 && M > 0 ? (() => {
    const r         = T / 100 / 12;
    const cuota     = C * r / (1 - Math.pow(1 + r, -M));
    const total     = cuota * M;
    const intereses = total - C;
    return { cuota, total, intereses };
  })() : null;

  return (
    <div className="flex flex-col gap-3">
      <MoneyField label="Capital del préstamo"      value={capital} onChange={setCapital} />
      <NumField   label="Tasa de interés anual (%)" value={tasa}    onChange={setTasa}    suffix="%" />
      <NumField   label="Plazo (meses)"             value={meses}   onChange={setMeses}   placeholder="12" />
      {calc && (
        <div className="flex flex-col gap-2 mt-1">
          <Result label="Cuota mensual"   value={fmt(calc.cuota)}     highlight />
          <Result label="Total a pagar"   value={fmt(calc.total)} />
          <Result label="Total intereses" value={fmt(calc.intereses)} />
        </div>
      )}
    </div>
  );
}

// ── 5. TRM / Conversor ────────────────────────────────────────────────────────
function CalcTRM() {
  const [trm,    setTrm]    = useState("4200");
  const [usd,    setUsd]    = useState("");
  const [cop,    setCop]    = useState("");
  const [active, setActive] = useState<"usd" | "cop">("usd");

  const T = NUM(trm);
  const result = T > 0 ? (
    active === "usd" && usd
      ? { label: "Resultado en COP", value: fmt(NUM(usd) * T) }
      : active === "cop" && cop
      ? { label: "Resultado en USD", value: `USD ${(NUM(cop) / T).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
      : null
  ) : null;

  return (
    <div className="flex flex-col gap-3">
      <NumField   label="TRM (COP por 1 USD)" value={trm} onChange={setTrm} placeholder="4200" />
      <MoneyField label="Monto en USD"        value={usd} onChange={v => { setUsd(v); setActive("usd"); setCop(""); }} />
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
        <span className="text-xs" style={{ color: "var(--dim)" }}>ó</span>
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
      </div>
      <MoneyField label="Monto en COP" value={cop} onChange={v => { setCop(v); setActive("cop"); setUsd(""); }} />
      {result && <Result label={result.label} value={result.value} highlight />}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "normal",   label: "Normal",   component: CalcNormal },
  { id: "hys",      label: "HYS",      component: CalcHYS },
  { id: "accion",   label: "Acción",   component: CalcAccion },
  { id: "prestamo", label: "Préstamo", component: CalcPrestamo },
  { id: "trm",      label: "TRM",      component: CalcTRM },
] as const;

type TabId = typeof TABS[number]["id"];

export default function FloatingCalc() {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<TabId>("normal");
  const panelRef        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const ActiveCalc = TABS.find(t => t.id === tab)!.component;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div ref={panelRef}
          className="w-80 max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Calculadoras</span>
            <button onClick={() => setOpen(false)}
              className="text-xl leading-none cursor-pointer border-none bg-transparent"
              style={{ color: "var(--muted)" }}>×</button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--line)" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium cursor-pointer border-none"
                style={tab === t.id
                  ? { background: "var(--accent)", color: "var(--accentFg)" }
                  : { background: "transparent", color: "var(--muted)" }}>
                {t.label}
              </button>
            ))}
          </div>
          {/* Body */}
          <div className="p-4"><ActiveCalc /></div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setOpen(o => !o)} title="Calculadoras"
        className="w-12 h-12 rounded-full shadow-lg cursor-pointer border-none flex items-center justify-center active:scale-95 transition-transform"
        style={{ background: "var(--accent)", color: "var(--accentFg)" }}>
        <IconCalc size={22} />
      </button>
    </div>
  );
}
