"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { addTransfer } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import type { BankAccount, Cash } from "../../types";

interface Props {
  bankAccounts: BankAccount[];
  cash: Cash | null;
  hasHys?: boolean;
  fromAccountId?: string;
  onClose: () => void;
}

export default function ModalTransfer({ bankAccounts, cash, hasHys, fromAccountId, onClose }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(fromAccountId ?? "cash");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const accounts = [
    { id: "cash", name: "Efectivo" },
    ...bankAccounts.map(a => ({ id: a.id, name: a.name })),
    ...(hasHys ? [{ id: "hys", name: "Alto Rendimiento" }] : []),
  ];

  const accountName = (id: string) => accounts.find(a => a.id === id)?.name ?? id;

  const amountNum = parseInt(amount, 10) || 0;
  const valid = amountNum > 0 && !!from && !!to && from !== to;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    await addTransfer({
      fromAccountId: from, fromAccountName: accountName(from),
      toAccountId: to, toAccountName: accountName(to),
      amount: amountNum, note: note || undefined, date,
    });
    router.refresh();
    onClose();
  };

  return (
    <ModalShell title="Transferir entre cuentas" onClose={onClose} footer={
      <CancelSave onClose={onClose} onSave={save} canSave={valid} saving={saving} saveLabel="Transferir" />
    }>
      <div className="flex flex-col gap-4 p-5">
        <div>
          <label className={labelClass}>Origen</label>
          <select className={fieldClass} value={from} onChange={e => setFrom(e.target.value)}>
            <option value="">Seleccionar...</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Destino</label>
          <select className={fieldClass} value={to} onChange={e => setTo(e.target.value)}>
            <option value="">Seleccionar...</option>
            {accounts.filter(a => a.id !== from).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Monto</label>
          <MoneyInput value={amount} onChange={setAmount} />
        </div>
        <div>
          <label className={labelClass}>Nota (opcional)</label>
          <input className={fieldClass} value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: pago tarjeta" />
        </div>
        <div>
          <label className={labelClass}>Fecha</label>
          <input type="date" className={fieldClass} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
    </ModalShell>
  );
}
