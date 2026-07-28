"use client";

import { useState } from "react";
import { fmtCOP } from "../valores";

const field =
  "w-full rounded-xl border px-4 py-3 text-[15px] bg-transparent";

export default function CalcInteres() {
  const [aporte, setAporte] = useState("");
  const [tasa, setTasa] = useState("10");
  const [años, setAños] = useState("10");

  const a = Number(aporte.replace(/\D/g, "")) || 0;
  const ea = (Number(tasa.replace(/[^\d.]/g, "")) || 0) / 100;
  const y = Math.max(0, Math.min(60, Number(años.replace(/\D/g, "")) || 0));
  const n = y * 12;
  const i = Math.pow(1 + ea, 1 / 12) - 1;
  const futuro = a > 0 && i > 0 && n > 0 ? (a * (Math.pow(1 + i, n) - 1)) / i : a * n;
  const aportado = a * n;

  return (
    <div className="rounded-2xl border p-6 flex flex-col gap-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
      <div>
        <label htmlFor="aporte" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Aporte mensual</label>
        <input id="aporte" type="text" inputMode="numeric" placeholder="Ej: 200.000"
          className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
          value={aporte ? Number(aporte.replace(/\D/g, "")).toLocaleString("es-CO") : ""}
          onChange={(e) => setAporte(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tasa" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Rentabilidad anual (E.A. %)</label>
          <input id="tasa" type="text" inputMode="decimal" className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
            value={tasa} onChange={(e) => setTasa(e.target.value)} />
        </div>
        <div>
          <label htmlFor="anios" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Años</label>
          <input id="anios" type="text" inputMode="numeric" className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
            value={años} onChange={(e) => setAños(e.target.value)} />
        </div>
      </div>
      {a > 0 && y > 0 && (
        <div aria-live="polite" className="rounded-xl p-5 flex flex-col gap-2" style={{ background: "var(--panel2)" }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Tendrías en {y} años</div>
          <div className="text-4xl font-semibold tabular-nums" style={{ color: "var(--fg)" }}>{fmtCOP(futuro)}</div>
          <div className="flex items-baseline justify-between text-[14px] mt-1">
            <span style={{ color: "var(--muted)" }}>Tú aportaste</span>
            <span className="tabular-nums" style={{ color: "var(--fg)" }}>{fmtCOP(aportado)}</span>
          </div>
          <div className="flex items-baseline justify-between text-[14px]">
            <span style={{ color: "var(--muted)" }}>Rendimientos generados</span>
            <span className="tabular-nums font-medium" style={{ color: "var(--pos)" }}>{fmtCOP(futuro - aportado)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
