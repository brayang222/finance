"use client";

import { useState } from "react";
import { fmtCOP } from "../valores";

const field =
  "w-full rounded-xl border px-4 py-3 text-[15px] bg-transparent";

// Simula mes a mes hasta saldar (o hasta 600 meses).
// Devuelve null si la cuota no alcanza a cubrir los intereses.
function simular(saldo: number, ea: number, cuota: number) {
  const i = Math.pow(1 + ea, 1 / 12) - 1;
  if (cuota <= saldo * i) return null;
  let s = saldo, meses = 0, intereses = 0;
  while (s > 0 && meses < 600) {
    const int = s * i;
    intereses += int;
    s = s + int - cuota;
    meses++;
  }
  return { meses, intereses };
}

function fmtMeses(m: number) {
  const a = Math.floor(m / 12), r = m % 12;
  const partes = [
    a > 0 ? `${a} año${a > 1 ? "s" : ""}` : "",
    r > 0 ? `${r} mes${r > 1 ? "es" : ""}` : "",
  ].filter(Boolean);
  return partes.join(" y ") || "0 meses";
}

export default function CalcDeuda() {
  const [saldo, setSaldo] = useState("");
  const [tasa, setTasa] = useState("25");
  const [cuota, setCuota] = useState("");
  const [extra, setExtra] = useState("");

  const P = Number(saldo.replace(/\D/g, "")) || 0;
  const ea = (Number(tasa.replace(/[^\d.]/g, "")) || 0) / 100;
  const C = Number(cuota.replace(/\D/g, "")) || 0;
  const E = Number(extra.replace(/\D/g, "")) || 0;

  const base = P > 0 && C > 0 ? simular(P, ea, C) : undefined;
  const conExtra = base && E > 0 ? simular(P, ea, C + E) : undefined;

  const num = (v: string, set: (s: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value);

  return (
    <div className="rounded-2xl border p-6 flex flex-col gap-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="saldo" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Saldo de la deuda</label>
          <input id="saldo" type="text" inputMode="numeric" placeholder="Ej: 5.000.000"
            className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
            value={saldo ? P.toLocaleString("es-CO") : ""} onChange={num(saldo, setSaldo)} />
        </div>
        <div>
          <label htmlFor="tasa" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Tasa (E.A. %)</label>
          <input id="tasa" type="text" inputMode="decimal"
            className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
            value={tasa} onChange={num(tasa, setTasa)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cuota" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Cuota mensual actual</label>
          <input id="cuota" type="text" inputMode="numeric" placeholder="Ej: 250.000"
            className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
            value={cuota ? C.toLocaleString("es-CO") : ""} onChange={num(cuota, setCuota)} />
        </div>
        <div>
          <label htmlFor="extra" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Abono extra mensual</label>
          <input id="extra" type="text" inputMode="numeric" placeholder="Ej: 100.000"
            className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
            value={extra ? E.toLocaleString("es-CO") : ""} onChange={num(extra, setExtra)} />
        </div>
      </div>

      {P > 0 && C > 0 && base === null && (
        <div aria-live="polite" className="rounded-xl p-5 text-[14px]" style={{ background: "var(--panel2)", color: "var(--neg)" }}>
          Con esa cuota nunca sales de la deuda: no cubre ni los intereses del mes.
          Sube la cuota o negocia la tasa (compra de cartera).
        </div>
      )}

      {base && (
        <div aria-live="polite" className="rounded-xl p-5 flex flex-col gap-2" style={{ background: "var(--panel2)" }}>
          <div className="flex items-baseline justify-between text-[14px]">
            <span style={{ color: "var(--muted)" }}>Pagando {fmtCOP(C)}/mes</span>
            <span className="tabular-nums font-medium" style={{ color: "var(--fg)" }}>
              {fmtMeses(base.meses)} · {fmtCOP(base.intereses)} en intereses
            </span>
          </div>
          {conExtra && (
            <>
              <div className="flex items-baseline justify-between text-[14px]">
                <span style={{ color: "var(--muted)" }}>Pagando {fmtCOP(C + E)}/mes</span>
                <span className="tabular-nums font-medium" style={{ color: "var(--fg)" }}>
                  {fmtMeses(conExtra.meses)} · {fmtCOP(conExtra.intereses)} en intereses
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t pt-3 mt-1" style={{ borderColor: "var(--line)" }}>
                <span className="font-medium" style={{ color: "var(--fg)" }}>Con el abono extra te ahorras</span>
                <span className="text-xl font-semibold tabular-nums" style={{ color: "var(--pos)" }}>
                  {fmtCOP(base.intereses - conExtra.intereses)} y {base.meses - conExtra.meses} meses
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
