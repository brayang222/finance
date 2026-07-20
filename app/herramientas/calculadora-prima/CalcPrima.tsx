"use client";

import { useState } from "react";
import { SMMLV, AUX_TRANSPORTE, fmtCOP } from "../valores";

const field =
  "w-full rounded-xl border px-4 py-3 text-[15px] outline-none bg-transparent";

export default function CalcPrima() {
  const [salario, setSalario] = useState("");
  const [dias, setDias] = useState("180");

  const s = Number(salario.replace(/\D/g, "")) || 0;
  const d = Math.max(0, Math.min(180, Number(dias.replace(/\D/g, "")) || 0));
  const aux = s > 0 && s <= 2 * SMMLV ? AUX_TRANSPORTE : 0;
  const base = s + aux;
  const prima = (base * d) / 360;

  return (
    <div className="rounded-2xl border p-6 flex flex-col gap-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
      <div>
        <label className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Salario mensual</label>
        <input
          type="text" inputMode="numeric" placeholder={`Ej: ${SMMLV.toLocaleString("es-CO")}`}
          className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
          value={salario ? Number(salario.replace(/\D/g, "")).toLocaleString("es-CO") : ""}
          onChange={(e) => setSalario(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Días trabajados en el semestre (máx. 180)</label>
        <input
          type="text" inputMode="numeric"
          className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
          value={dias} onChange={(e) => setDias(e.target.value)}
        />
      </div>
      {s > 0 && d > 0 && (
        <div className="rounded-xl p-5 flex flex-col gap-1.5" style={{ background: "var(--panel2)" }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Tu prima estimada</div>
          <div className="text-4xl font-semibold tabular-nums" style={{ color: "var(--fg)" }}>{fmtCOP(prima)}</div>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            Base: {fmtCOP(s)}{aux > 0 ? ` + ${fmtCOP(aux)} de auxilio de transporte` : " (sin auxilio de transporte: salario mayor a 2 SMMLV)"} × {d} días ÷ 360
          </div>
        </div>
      )}
    </div>
  );
}
