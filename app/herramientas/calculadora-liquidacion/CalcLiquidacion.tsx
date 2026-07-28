"use client";

import { useState } from "react";
import { SMMLV, AUX_TRANSPORTE, fmtCOP } from "../valores";

const field =
  "w-full rounded-xl border px-4 py-3 text-[15px] bg-transparent";

// Convención laboral colombiana: año de 360 días, meses de 30. Conteo inclusivo.
function dias360(a: Date, b: Date) {
  return (
    (b.getFullYear() - a.getFullYear()) * 360 +
    (b.getMonth() - a.getMonth()) * 30 +
    Math.min(b.getDate(), 30) - Math.min(a.getDate(), 30) + 1
  );
}

export default function CalcLiquidacion() {
  const [salario, setSalario] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const s = Number(salario.replace(/\D/g, "")) || 0;
  const di = inicio ? new Date(inicio + "T12:00:00") : null;
  const df = fin ? new Date(fin + "T12:00:00") : null;
  const ok = s > 0 && di && df && df >= di;

  let rows: { label: string; value: number; note: string }[] = [];
  let total = 0;
  if (ok) {
    const aux = s <= 2 * SMMLV ? AUX_TRANSPORTE : 0;
    const base = s + aux;
    const totalDias = dias360(di!, df!);

    const inicioAño = new Date(df!.getFullYear(), 0, 1, 12);
    const dCes = dias360(di! > inicioAño ? di! : inicioAño, df!);
    const cesantias = (base * dCes) / 360;
    const intereses = cesantias * 0.12 * (dCes / 360);

    const inicioSem = new Date(df!.getFullYear(), df!.getMonth() < 6 ? 0 : 6, 1, 12);
    const dPrima = dias360(di! > inicioSem ? di! : inicioSem, df!);
    const prima = (base * dPrima) / 360;

    const vacaciones = (s * totalDias) / 720;

    rows = [
      { label: "Cesantías (año en curso)", value: cesantias, note: `${dCes} días` },
      { label: "Intereses de cesantías (12%)", value: intereses, note: `${dCes} días` },
      { label: "Prima proporcional (semestre)", value: prima, note: `${dPrima} días` },
      { label: "Vacaciones no disfrutadas", value: vacaciones, note: `${totalDias} días trabajados` },
    ];
    total = rows.reduce((sum, r) => sum + r.value, 0);
  }

  return (
    <div className="rounded-2xl border p-6 flex flex-col gap-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
      <div>
        <label htmlFor="salario" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Salario mensual</label>
        <input
          id="salario"
          type="text" inputMode="numeric" placeholder={`Ej: ${SMMLV.toLocaleString("es-CO")}`}
          className={field} style={{ borderColor: "var(--line)", color: "var(--fg)" }}
          value={salario ? Number(salario.replace(/\D/g, "")).toLocaleString("es-CO") : ""}
          onChange={(e) => setSalario(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="inicio" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Fecha de ingreso</label>
          <input id="inicio" type="date" className={field} style={{ borderColor: "var(--line)", color: "var(--fg)", colorScheme: "inherit" }}
            value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div>
          <label htmlFor="fin" className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Último día trabajado</label>
          <input id="fin" type="date" className={field} style={{ borderColor: "var(--line)", color: "var(--fg)", colorScheme: "inherit" }}
            value={fin} onChange={(e) => setFin(e.target.value)} />
        </div>
      </div>
      {ok && (
        <div aria-live="polite" className="rounded-xl p-5 flex flex-col gap-2.5" style={{ background: "var(--panel2)" }}>
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3 text-[14px]">
              <span style={{ color: "var(--muted)" }}>{r.label} <span className="text-xs" style={{ color: "var(--dim)" }}>· {r.note}</span></span>
              <span className="tabular-nums font-medium" style={{ color: "var(--fg)" }}>{fmtCOP(r.value)}</span>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-t pt-3 mt-1" style={{ borderColor: "var(--line)" }}>
            <span className="font-medium" style={{ color: "var(--fg)" }}>Total estimado</span>
            <span className="text-3xl font-semibold tabular-nums" style={{ color: "var(--fg)" }}>{fmtCOP(total)}</span>
          </div>
        </div>
      )}
      <p className="text-xs leading-relaxed m-0" style={{ color: "var(--muted)" }}>
        Estimación con salario fijo, sin vacaciones tomadas ni indemnización por despido. Las cesantías y prima
        de periodos anteriores ya consignadas no se incluyen. No reemplaza el cálculo oficial de tu empleador.
      </p>
    </div>
  );
}
