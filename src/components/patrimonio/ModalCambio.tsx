"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { addTransfer } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { BankAccount } from "../../types";

interface Props {
  bankAccounts: BankAccount[];
  trm?: number | null;
  onClose: () => void;
}

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

export default function ModalCambio({ bankAccounts, trm: trmInit, onClose }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amountCOP, setAmountCOP] = useState("");
  const [amountUSD, setAmountUSD] = useState("");
  const [trmVal, setTrmVal] = useState(trmInit ? String(Math.round(trmInit)) : "");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const accounts = bankAccounts.map(a => ({ id: a.id, name: a.name }));
  const accountName = (id: string) => accounts.find(a => a.id === id)?.name ?? id;

  const handleTrmChange = (val: string) => {
    setTrmVal(val);
    if (num(amountCOP) > 0 && num(val) > 0) {
      setAmountUSD((num(amountCOP) / num(val)).toFixed(2));
    }
  };

  const handleCOPChange = (val: string) => {
    setAmountCOP(val);
    if (num(trmVal) > 0 && num(val) > 0) {
      setAmountUSD((num(val) / num(trmVal)).toFixed(2));
    }
  };

  const handleUSDChange = (val: string) => {
    setAmountUSD(val);
    if (num(trmVal) > 0 && num(val) > 0) {
      setAmountCOP(String(Math.round(num(val) * num(trmVal))));
    }
  };

  const copNum = num(amountCOP);
  const usdNum = num(amountUSD);
  const trmNum = num(trmVal);
  const valid = copNum > 0 && usdNum > 0 && trmNum > 0 && !!fromId && !!toId && fromId !== toId;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await addTransfer({
        fromAccountId: fromId,
        fromAccountName: accountName(fromId),
        toAccountId: toId,
        toAccountName: accountName(toId),
        amount: copNum,
        note: `Cambio de divisa: ${usdNum.toFixed(2)} USD @ TRM ${Math.round(trmNum).toLocaleString("es-CO")}`,
        date,
      });
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al registrar el cambio de divisa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Cambio de moneda"
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={valid} saving={saving} saveLabel="Registrar" />}
    >
      <div className="flex flex-col gap-4 p-5">
        <p className="text-[13px] text-dim">
          Registra la conversión de COP a USD. El monto COP se debita de la cuenta origen y queda anotado en la cuenta destino con el equivalente en USD como nota.
        </p>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelClass}>Cuenta origen (COP)</label>
            <select className={fieldClass} value={fromId} onChange={e => setFromId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Cuenta destino (USD)</label>
            <select className={fieldClass} value={toId} onChange={e => setToId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {accounts.filter(a => a.id !== fromId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelClass}>Monto pagado (COP)</label>
            <MoneyInput value={amountCOP} onChange={handleCOPChange} prefix="$" />
          </div>
          <div className="flex-1">
            <label className={labelClass}>TRM (COP/USD)</label>
            <MoneyInput value={trmVal} onChange={handleTrmChange} prefix="$" />
          </div>
        </div>

        <div>
          <label className={labelClass}>USD recibidos</label>
          <input
            inputMode="decimal"
            value={amountUSD}
            onChange={e => handleUSDChange(e.target.value)}
            placeholder="0.00"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Fecha</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={fieldClass} />
        </div>

        {copNum > 0 && usdNum > 0 && trmNum > 0 && (
          <div className="rounded-lg bg-panel2 border border-line p-3 text-[13px] space-y-1">
            <div className="text-dim">Resumen del cambio:</div>
            <div className="text-muted font-medium">
              ${copNum.toLocaleString("es-CO")} COP → {usdNum.toFixed(2)} USD
            </div>
            <div className="text-dim">
              TRM efectiva: ${Math.round(copNum / usdNum).toLocaleString("es-CO")} COP/USD
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
