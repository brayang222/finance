"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Debt } from "../../types";
import { addDebt, updateDebt } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";

const DEBT_TYPES: { value: Debt["type"]; label: string }[] = [
  { value: "hipoteca",  label: "Hipoteca" },
  { value: "credito",   label: "Crédito de consumo" },
  { value: "tarjeta",   label: "Tarjeta de crédito" },
  { value: "otro",      label: "Otro" },
];

export default function ModalDeuda({
  editItem,
  onClose,
}: {
  editItem?: Debt;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name,            setName]           = useState(editItem?.name ?? "");
  const [type,            setType]           = useState<Debt["type"]>(editItem?.type ?? "otro");
  const [balance,         setBalance]        = useState(editItem ? String(Math.round(editItem.balance)) : "");
  const [original,        setOriginal]       = useState(editItem?.originalAmount ? String(Math.round(editItem.originalAmount)) : "");
  const [rate,            setRate]           = useState(editItem ? String(editItem.rate) : "");
  const [currency,        setCurrency]       = useState(editItem?.currency ?? "COP");
  const [startDate,       setStartDate]      = useState(editItem?.startDate ?? "");
  const [endDate,         setEndDate]        = useState(editItem?.endDate ?? "");
  const [monthlyPayment,  setMonthlyPayment] = useState(editItem?.monthlyPayment ? String(Math.round(editItem.monthlyPayment)) : "");
  const [notes,           setNotes]          = useState(editItem?.notes ?? "");
  const [saving,          setSaving]         = useState(false);

  const balanceN = Number(balance.replace(/[^\d]/g, "")) || 0;
  const canSave  = name.trim().length > 0 && balanceN > 0;

  const save = async () => {
    setSaving(true);
    try {
      const item = {
        name:           name.trim(),
        type,
        balance:        balanceN,
        originalAmount: Number(original.replace(/[^\d]/g, "")) || undefined,
        rate:           parseFloat(rate) || 0,
        currency,
        startDate:      startDate || undefined,
        endDate:        endDate || undefined,
        monthlyPayment: Number(monthlyPayment.replace(/[^\d]/g, "")) || undefined,
        notes:          notes.trim() || undefined,
      };
      if (editItem) await updateDebt(editItem.id, item);
      else          await addDebt(item);
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={editItem ? "Editar deuda" : "Registrar deuda"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Nombre / descripción</label>
        <input className={fieldClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Hipoteca Bancolombia" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tipo</label>
          <select className={fieldClass} value={type} onChange={e => setType(e.target.value as Debt["type"])}>
            {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Moneda</label>
          <select className={fieldClass} value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Saldo pendiente</label>
          <MoneyInput value={balance} onChange={setBalance} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Monto original</label>
          <MoneyInput value={original} onChange={setOriginal} placeholder="Opcional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tasa EA %</label>
          <input
            type="number" step="0.01" min="0"
            className={fieldClass}
            value={rate}
            onChange={e => setRate(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelClass}>Cuota mensual</label>
          <MoneyInput value={monthlyPayment} onChange={setMonthlyPayment} placeholder="Opcional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Fecha inicio</label>
          <input type="date" className={fieldClass} value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Fecha fin / vencimiento</label>
          <input type="date" className={fieldClass} value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notas</label>
        <input className={fieldClass} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
      </div>
    </ModalShell>
  );
}
