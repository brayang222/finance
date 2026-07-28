"use client";

import { useState } from "react";

// Calendario DIAN 2026 (año gravable 2025) — pares de últimos 2 dígitos → fecha límite.
// Índice = Math.ceil(dígitos/2) con 00 tratado como 100 (par 99-00, el último).
const FECHAS: string[] = [
  "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-18", "2026-08-19",
  "2026-08-20", "2026-08-21", "2026-08-24", "2026-08-25", "2026-08-26",
  "2026-08-27", "2026-08-28", "2026-08-31", "2026-09-01", "2026-09-02",
  "2026-09-03", "2026-09-04", "2026-09-07", "2026-09-08", "2026-09-09",
  "2026-09-10", "2026-09-11", "2026-09-14", "2026-09-15", "2026-09-16",
  "2026-09-17", "2026-09-18", "2026-09-21", "2026-09-22", "2026-09-23",
  "2026-09-24", "2026-09-25", "2026-09-28", "2026-10-01", "2026-10-02",
  "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09",
  "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-19",
  "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26",
];

export default function CalcFecha() {
  const [digitos, setDigitos] = useState("");

  const clean = digitos.replace(/\D/g, "").slice(0, 2);
  const n = clean.length === 2 ? (clean === "00" ? 100 : Number(clean)) : 0;
  const fecha = n >= 1 && n <= 100 ? FECHAS[Math.ceil(n / 2) - 1] : null;
  const fechaObj = fecha ? new Date(fecha + "T12:00:00") : null;
  const dias = fechaObj
    ? Math.ceil((fechaObj.getTime() - Date.now()) / 86_400_000)
    : 0;
  const fmt = fechaObj?.toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="rounded-2xl border p-6 flex flex-col gap-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
      <div>
        <label htmlFor="digitos" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Últimos 2 dígitos de tu cédula (sin dígito de verificación)
        </label>
        <input
          id="digitos"
          type="text" inputMode="numeric" maxLength={2} placeholder="Ej: 47"
          className="w-full rounded-xl border px-4 py-3 text-[15px] bg-transparent tabular-nums"
          style={{ borderColor: "var(--line)", color: "var(--fg)" }}
          value={clean}
          onChange={(e) => setDigitos(e.target.value)}
        />
      </div>
      {fecha && (
        <div aria-live="polite" className="rounded-xl p-5 flex flex-col gap-1.5" style={{ background: "var(--panel2)" }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Tu fecha límite es el</div>
          <div className="text-2xl md:text-3xl font-semibold capitalize" style={{ color: "var(--fg)" }}>{fmt}</div>
          <div className="text-[13.5px] mt-1" style={{ color: dias < 15 && dias >= 0 ? "var(--neg)" : "var(--muted)" }}>
            {dias > 0
              ? `Faltan ${dias} días. Presentar antes no tiene ningún costo — no lo dejes para el final.`
              : dias === 0
                ? "¡Es hoy! Presenta tu declaración antes de medianoche."
                : `Esta fecha ya pasó. Si estabas obligado y no declaraste, hazlo cuanto antes: la sanción por extemporaneidad crece cada mes.`}
          </div>
        </div>
      )}
    </div>
  );
}
