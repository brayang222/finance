"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBankAccount, updateBankAccount } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import type { BankAccount } from "../../types";

const TYPES = [
  { value: "banco",    label: "Banco / Efectivo" },
  { value: "bolsa",   label: "Bolsa / Broker" },
  { value: "cripto",  label: "Exchange de cripto" },
  { value: "otro",    label: "Otro" },
];

export default function ModalCuenta({ onClose, editItem }: { onClose: () => void; editItem?: BankAccount }) {
  const router = useRouter();
  const [name, setName]       = useState(editItem?.name ?? "");
  const [bank, setBank]       = useState(editItem?.bank ?? "");
  const [type, setType]       = useState(editItem?.type ?? "banco");
  const [balance, setBalance] = useState(editItem ? String(Math.round(editItem.balance)) : "");
  const [saving, setSaving]   = useState(false);

  const canSave = name.trim().length > 0;

  const save = async () => {
    setSaving(true);
    try {
      const bal = Number(balance.replace(/\./g, "").replace(",", ".")) || 0;
      const item = { name: name.trim(), bank: bank.trim() || undefined, type, balance: bal };
      if (editItem) {
        await updateBankAccount(editItem.id, item);
      } else {
        await createBankAccount(item);
      }
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const showBalance = type === "banco" || type === "otro";

  return (
    <ModalShell
      title={editItem ? "Editar cuenta" : "Agregar cuenta"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Tipo de cuenta</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Nombre de la cuenta</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === "bolsa" ? "Ej. Trii" : type === "cripto" ? "Ej. Binance" : "Ej. Bancolombia Ahorros"}
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>{type === "bolsa" ? "Broker" : type === "cripto" ? "Exchange" : "Banco"} (opcional)</label>
        <input
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          placeholder={type === "bolsa" ? "Ej. Trii" : type === "cripto" ? "Ej. Binance" : "Ej. Bancolombia"}
          className={fieldClass}
        />
      </div>

      {showBalance && (
        <div>
          <label className={labelClass}>Saldo actual (COP)</label>
          <MoneyInput value={balance} onChange={setBalance} prefix="$" />
        </div>
      )}
    </ModalShell>
  );
}
