"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { AllData, Debt } from "../../types";
import { deleteDebt } from "../../../lib/actions";
import ModalDeuda from "./ModalDeuda";
import { usePrivacy } from "./PrivacyContext";

const COP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const TYPE_LABELS: Record<Debt["type"], string> = {
  hipoteca: "Hipoteca",
  credito:  "Crédito",
  tarjeta:  "Tarjeta",
  otro:     "Otro",
};

const TYPE_COLORS: Record<Debt["type"], string> = {
  hipoteca: "var(--accent)",
  credito:  "#f59e0b",
  tarjeta:  "#ef4444",
  otro:     "var(--dim)",
};

export default function ViewDeudas({ initialData }: { initialData: AllData }) {
  const router = useRouter();
  const privacy = usePrivacy();
  const debts = initialData.debts ?? [];
  const trm   = initialData.config?.trm ?? null;

  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState<Debt | undefined>();

  const toCOP = (d: Debt) =>
    d.currency === "USD" && trm ? d.balance * trm : d.balance;

  const totalCOP = debts.reduce((s, d) => s + toCOP(d), 0);

  const byType = Object.entries(
    debts.reduce<Record<string, number>>((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + toCOP(d);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const openAdd  = () => { setEditItem(undefined); setShowModal(true); };
  const openEdit = (d: Debt) => { setEditItem(d); setShowModal(true); };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta deuda?")) return;
    await deleteDebt(id);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-1">Total pasivos</div>
          <div className="text-[32px] font-medium tabular-nums" style={{ fontFamily: "Spectral, serif" }}>
            {privacy ? "••••••" : COP(totalCOP)}
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accentFg border-none cursor-pointer text-[13px] font-medium"
        >
          + Registrar deuda
        </button>
      </div>

      {/* Type breakdown */}
      {byType.length > 0 && (
        <div className="border border-line bg-panel rounded-[18px] p-5">
          <div className="text-[13px] font-medium mb-3">Por tipo</div>
          <div className="flex flex-col gap-2.5">
            {byType.map(([type, amt]) => {
              const pct = totalCOP > 0 ? amt / totalCOP : 0;
              return (
                <div key={type}>
                  <div className="flex justify-between text-[12.5px] mb-1">
                    <span className="text-muted">{TYPE_LABELS[type as Debt["type"]] ?? type}</span>
                    <span className="tabular-nums">{privacy ? "••••" : COP(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct * 100}%`, background: TYPE_COLORS[type as Debt["type"]] ?? "var(--accent)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Debt list */}
      {debts.length === 0 ? (
        <div className="border border-line bg-panel rounded-[18px] p-10 flex flex-col items-center gap-3 text-center">
          <div className="text-[13px] text-muted">No tienes deudas registradas.</div>
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-panel2 border border-line text-[13px] cursor-pointer"
          >
            + Agregar primera deuda
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {debts.map(d => {
            const copVal = toCOP(d);
            const paidPct = d.originalAmount && d.originalAmount > 0
              ? Math.min(1, 1 - d.balance / d.originalAmount)
              : null;
            return (
              <div key={d.id} className="border border-line bg-panel rounded-[18px] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] px-2 py-[2px] rounded-full font-medium"
                        style={{ background: TYPE_COLORS[d.type] + "22", color: TYPE_COLORS[d.type] }}
                      >
                        {TYPE_LABELS[d.type]}
                      </span>
                      <span className="text-[12px] text-dim">{d.currency}</span>
                    </div>
                    <div className="text-[15px] font-medium">{d.name}</div>
                    {d.notes && <div className="text-[12px] text-dim mt-0.5">{d.notes}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] font-medium tabular-nums" style={{ fontFamily: "Spectral, serif" }}>
                      {privacy ? "••••" : COP(copVal)}
                    </div>
                    {d.monthlyPayment && (
                      <div className="text-[12px] text-dim tabular-nums">
                        cuota: {privacy ? "••••" : COP(d.currency === "USD" && trm ? d.monthlyPayment * trm : d.monthlyPayment)}/mes
                      </div>
                    )}
                  </div>
                </div>

                {/* Amortization progress */}
                {paidPct !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11.5px] text-dim mb-1">
                      <span>Pagado</span>
                      <span>{(paidPct * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${paidPct * 100}%`, background: "var(--pos)" }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-line">
                  {d.rate > 0 && (
                    <span className="text-[12px] text-dim">Tasa: {d.rate}% EA</span>
                  )}
                  {d.endDate && (
                    <span className="text-[12px] text-dim">
                      Vence: {new Date(d.endDate + "T00:00:00").toLocaleDateString("es-CO", { year: "numeric", month: "short" })}
                    </span>
                  )}
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => openEdit(d)}
                      className="text-[12px] text-muted border border-line rounded-lg px-3 py-1.5 bg-transparent cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-[12px] text-neg border border-neg/30 rounded-lg px-3 py-1.5 bg-transparent cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ModalDeuda editItem={editItem} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
