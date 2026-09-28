"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today, COP } from "../../data/mock";
import { addDividend } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { BankAccount, Dividend } from "../../types";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

// Prefilling from an existing dividend ("re-registrar") lets you quickly log
// the next recurring payment (same stock, same account) without retyping
// everything — just the amount and date usually change.
export default function ModalDividend({
  onClose, ticker, prefill, bankAccounts = [],
}: {
  onClose: () => void;
  ticker: string;
  prefill?: Dividend;
  bankAccounts?: BankAccount[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState(prefill ? String(Math.round(prefill.amount)) : "");
  const [dateISO, setDateISO] = useState(today());
  const [accountId, setAccountId] = useState(prefill?.accountId ?? "");
  const [showDetail, setShowDetail] = useState(!!(prefill?.shares || prefill?.grossAmount));
  const [shares, setShares] = useState(prefill?.shares ? String(prefill.shares) : "");
  const [perShare, setPerShare] = useState(prefill?.perShare ? String(prefill.perShare) : "");
  const [grossAmount, setGrossAmount] = useState(prefill?.grossAmount ? String(Math.round(prefill.grossAmount)) : "");
  const [adminCost, setAdminCost] = useState(prefill?.adminCost ? String(Math.round(prefill.adminCost)) : "");
  const [tax, setTax] = useState(prefill?.tax ? String(Math.round(prefill.tax)) : "");
  const [note, setNote] = useState(prefill?.note ?? "");
  const [saving, setSaving] = useState(false);

  const canSave = num(amount) > 0 && !!dateISO;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const acct = bankAccounts.find(b => b.id === accountId);
      await addDividend({
        ticker, date: dateISO, amount: num(amount),
        shares: showDetail && shares ? num(shares) : undefined,
        perShare: showDetail && perShare ? num(perShare) : undefined,
        grossAmount: showDetail && grossAmount ? num(grossAmount) : undefined,
        adminCost: showDetail && adminCost ? num(adminCost) : undefined,
        tax: showDetail && tax ? num(tax) : undefined,
        accountId: acct?.id,
        accountName: acct?.name,
        note: note.trim() || undefined,
      });
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al registrar el dividendo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Dividendo de ${ticker}`}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} saveLabel="Registrar" />}
    >
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Monto total recibido (COP)</label>
          <MoneyInput value={amount} onChange={setAmount} prefix="$" />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Fecha de pago</label>
          <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className={fieldClass} />
        </div>
      </div>

      {bankAccounts.length > 0 && (
        <div>
          <label className={labelClass}>Cuenta (opcional)</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={fieldClass}>
            <option value="">— Sin cuenta —</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="text-[11px] text-dim mt-1">
            Si eliges una cuenta, el dividendo se suma a su saldo y cuenta como ingreso.
          </div>
        </div>
      )}

      {!showDetail ? (
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="text-[12px] text-accent bg-transparent border-none cursor-pointer px-0 self-start"
        >
          + Agregar desglose (acciones, retención, costos)
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-dim">Desglose (opcional)</span>
            <button
              type="button"
              onClick={() => setShowDetail(false)}
              className="text-[12px] text-dim hover:text-neg bg-transparent border-none cursor-pointer"
            >
              Ocultar
            </button>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>Número de acciones</label>
              <input inputMode="decimal" value={shares} onChange={(e) => setShares(e.target.value)} className={fieldClass} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Dividendo por acción</label>
              <MoneyInput value={perShare} onChange={setPerShare} prefix="$" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Pago antes de retención (bruto)</label>
            <MoneyInput value={grossAmount} onChange={setGrossAmount} prefix="$" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>Costos de administración</label>
              <MoneyInput value={adminCost} onChange={setAdminCost} prefix="$" />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Impuestos / retención</label>
              <MoneyInput value={tax} onChange={setTax} prefix="$" />
            </div>
          </div>
          {num(grossAmount) > 0 && (
            <div className="text-[12px] text-dim">
              Bruto {COP(num(grossAmount))} − costos {COP(num(adminCost))} − impuestos {COP(num(tax))} ={" "}
              <span className="text-muted font-medium">{COP(num(grossAmount) - num(adminCost) - num(tax))}</span>
              {" "}(compara con el monto total de arriba)
            </div>
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>Nota (opcional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} placeholder="p. ej. dividendo trimestral" />
      </div>
    </ModalShell>
  );
}
