"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COP, today } from "../../data/mock";
import type { AllData } from "../../types";
import { usePrivacy } from "./PrivacyContext";
import { closeCash } from "../../../lib/actions";

const cardBase = "border border-line bg-panel rounded-2xl p-5";
const microLabel = "text-[11px] tracking-[0.08em] uppercase text-dim font-medium";

function fmtInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CO");
}

export default function ViewCaja({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const { sales, finances, cash, cashCloses, bankAccounts } = initialData;
  const todayStr = today();
  const [countedRaw, setCountedRaw] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const day = useMemo(() => {
    const byMethod: Record<string, number> = {};
    let ventas = 0;
    for (const s of sales) {
      if (s.date !== todayStr) continue;
      ventas += s.total;
      const key = s.payMethod === "cash" ? "Efectivo"
        : s.payMethod === "fiado" ? "Fiado"
        : bankAccounts.find(a => a.id === s.payMethod)?.name ?? "Cuenta";
      byMethod[key] = (byMethod[key] ?? 0) + s.total;
    }
    // Ventas manuales (sin POS) e ingresos/gastos del día
    let otrosIngresos = 0, gastos = 0;
    for (const f of finances) {
      if (f.date !== todayStr) continue;
      if (f.type === "egreso") gastos += f.amount;
      else if (!f.saleId) otrosIngresos += f.amount;
    }
    return { byMethod, ventas, otrosIngresos, gastos };
  }, [sales, finances, todayStr, bankAccounts]);

  const expected = cash?.banco ?? 0;
  const counted = Number(countedRaw.replace(/\D/g, "")) || 0;
  const diff = counted - expected;
  const alreadyClosed = cashCloses.find(c => c.date === todayStr);
  const fmt = (n: number) => (privacy ? "•••" : COP(n));

  const doClose = async () => {
    setSaving(true);
    try {
      await closeCash(counted, note.trim() || undefined);
      setCountedRaw("");
      setNote("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Resumen del día */}
      <div className={cardBase}>
        <div className={microLabel + " mb-3"}>Hoy · {todayStr}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-[11px] text-dim mb-0.5">Ventas</div>
            <div className="text-[18px] font-medium tabular-nums text-pos">{fmt(day.ventas)}</div>
          </div>
          <div>
            <div className="text-[11px] text-dim mb-0.5">Otros ingresos</div>
            <div className="text-[18px] font-medium tabular-nums">{fmt(day.otrosIngresos)}</div>
          </div>
          <div>
            <div className="text-[11px] text-dim mb-0.5">Gastos</div>
            <div className="text-[18px] font-medium tabular-nums text-neg">{fmt(day.gastos)}</div>
          </div>
          <div>
            <div className="text-[11px] text-dim mb-0.5">Balance del día</div>
            <div className={`text-[18px] font-medium tabular-nums ${day.ventas + day.otrosIngresos - day.gastos >= 0 ? "text-pos" : "text-neg"}`}>
              {fmt(day.ventas + day.otrosIngresos - day.gastos)}
            </div>
          </div>
        </div>
        {Object.keys(day.byMethod).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
            {Object.entries(day.byMethod).map(([method, amount]) => (
              <span key={method} className="px-3 py-1.5 rounded-lg border border-line text-[12.5px]">
                {method}: <span className="font-medium tabular-nums">{fmt(amount)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Arqueo */}
      <div className={cardBase}>
        <div className={microLabel + " mb-3"}>Arqueo de efectivo</div>
        {alreadyClosed && (
          <div className="text-[12.5px] text-muted mb-3 px-3 py-2 rounded-lg bg-panel2 border border-line">
            Ya cerraste caja hoy ({alreadyClosed.diff === 0 ? "cuadró exacta" : alreadyClosed.diff > 0 ? `sobrante de ${COP(alreadyClosed.diff)}` : `faltante de ${COP(-alreadyClosed.diff)}`}).
            Si vuelves a cerrar, se actualiza.
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div>
            <div className="text-[11px] text-dim mb-1">Efectivo esperado (según la app)</div>
            <div className="text-[22px] font-medium tabular-nums">{fmt(expected)}</div>
          </div>
          <div>
            <label className="text-[11px] text-dim mb-1 block">Efectivo contado (físico)</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full h-[42px] px-3 rounded-xl border border-line bg-panel2 text-fg text-[15px] outline-none tabular-nums"
              value={countedRaw}
              onChange={e => setCountedRaw(fmtInput(e.target.value))}
              placeholder="$ 0"
            />
          </div>
          <div>
            <div className="text-[11px] text-dim mb-1">Diferencia</div>
            <div className={`text-[22px] font-medium tabular-nums ${diff === 0 ? "" : diff > 0 ? "text-pos" : "text-neg"}`}>
              {countedRaw ? `${diff > 0 ? "+" : ""}${COP(diff)}` : "—"}
            </div>
            {countedRaw && diff !== 0 && (
              <div className="text-[11px] text-dim">{diff > 0 ? "sobrante" : "faltante"}</div>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-4 flex-wrap items-center">
          <input
            type="text"
            className="flex-1 min-w-[200px] h-[38px] px-3 rounded-xl border border-line bg-panel2 text-fg text-[13px] outline-none"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Nota (opcional)"
          />
          <button
            onClick={doClose}
            disabled={!countedRaw || saving}
            className="h-[38px] px-5 rounded-xl border-none bg-accent text-accentFg text-[13px] font-medium cursor-pointer disabled:opacity-40"
          >
            {saving ? "Cerrando…" : "Cerrar caja"}
          </button>
        </div>
        <div className="text-[11.5px] text-dim mt-2">
          Al cerrar, el efectivo de la app se ajusta al conteo físico.
        </div>
      </div>

      {/* Historial */}
      {cashCloses.length > 0 && (
        <div className={cardBase}>
          <div className={microLabel + " mb-3"}>Historial de cierres</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="text-left text-dim text-[11px] border-b border-line">
                  <th className="pb-2 font-medium pr-4">Fecha</th>
                  <th className="pb-2 font-medium pr-4 text-right">Ventas</th>
                  <th className="pb-2 font-medium pr-4 text-right">Esperado</th>
                  <th className="pb-2 font-medium pr-4 text-right">Contado</th>
                  <th className="pb-2 font-medium pr-4 text-right">Diferencia</th>
                  <th className="pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {cashCloses.map(c => (
                  <tr key={c.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap text-muted">{c.date}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{fmt(c.summary?.ventas ?? 0)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muted">{fmt(c.expectedCash)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{fmt(c.countedCash)}</td>
                    <td className={`py-2 pr-4 text-right tabular-nums ${c.diff === 0 ? "text-muted" : c.diff > 0 ? "text-pos" : "text-neg"}`}>
                      {c.diff === 0 ? "cuadró" : `${c.diff > 0 ? "+" : ""}${privacy ? "•••" : COP(c.diff)}`}
                    </td>
                    <td className="py-2 text-dim max-w-[160px] truncate">{c.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
