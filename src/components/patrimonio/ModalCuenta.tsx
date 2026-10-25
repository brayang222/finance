"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBankAccount, updateBankAccount, addTransfer } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { BankAccount } from "../../types";

const TYPES = [
  { value: "banco",   label: "Banco / Efectivo" },
  { value: "bolsa",  label: "Bolsa / Broker" },
  { value: "cripto", label: "Exchange de cripto" },
  { value: "otro",   label: "Otro" },
];

export default function ModalCuenta({
  onClose,
  editItem,
  bankAccounts = [],
}: {
  onClose: () => void;
  editItem?: BankAccount;
  bankAccounts?: BankAccount[];
}) {
  const router = useRouter();
  const toast  = useToast();
  const [name, setName]     = useState(editItem?.name ?? "");
  const [bank, setBank]     = useState(editItem?.bank ?? "");
  const [type, setType]     = useState(editItem?.type ?? "banco");
  const [balance, setBalance] = useState(editItem ? String(Math.round(editItem.balance)) : "");
  const [fromId, setFromId] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0;
  const isBroker = type === "bolsa" || type === "cripto";
  const bal = Number(balance.replace(/\./g, "").replace(",", ".")) || 0;
  // Offer transfer source only when creating a new broker with an initial balance
  const showFromAccount = !editItem && isBroker && bal > 0;
  const sourceAccounts = bankAccounts.filter(a => a.type !== "bolsa" && a.type !== "cripto");
  const fromAccount = sourceAccounts.find(a => a.id === fromId);

  const save = async () => {
    setSaving(true);
    try {
      const item = { name: name.trim(), bank: bank.trim() || undefined, type, balance: bal };
      if (editItem) {
        await updateBankAccount(editItem.id, item);
      } else if (showFromAccount && fromAccount) {
        // Create broker with balance=0, then transfer funds from source account
        const newId = await createBankAccount({ ...item, balance: 0 });
        await addTransfer({
          fromAccountId: fromAccount.id,
          fromAccountName: fromAccount.name,
          toAccountId: newId,
          toAccountName: item.name,
          amount: bal,
          note: `Depósito inicial ${item.name}`,
        });
      } else {
        await createBankAccount(item);
      }
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar la cuenta");
    } finally {
      setSaving(false);
    }
  };

  const balanceLabel = isBroker
    ? "Dinero disponible (sin invertir, COP)"
    : "Saldo actual (COP)";

  return (
    <ModalShell
      title={editItem ? "Editar cuenta" : "Agregar cuenta"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Tipo de cuenta</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>
          {TYPES.map(t => (
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
        <label className={labelClass}>
          {type === "bolsa" ? "Broker" : type === "cripto" ? "Exchange" : "Banco"} (opcional)
        </label>
        <input
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          placeholder={type === "bolsa" ? "Ej. Trii" : type === "cripto" ? "Ej. Binance" : "Ej. Bancolombia"}
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>{balanceLabel}</label>
        <MoneyInput value={balance} onChange={setBalance} prefix="$" />
      </div>

      {showFromAccount && (
        <div>
          <label className={labelClass}>Cuenta de origen del depósito inicial (opcional)</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={fieldClass}>
            <option value="">— No registrar transferencia —</option>
            {sourceAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {fromAccount && (
            <p className="text-xs text-[var(--muted)] mt-1">
              Se registrará una transferencia de <strong>{fromAccount.name}</strong> → <strong>{name || "broker"}</strong>.
            </p>
          )}
        </div>
      )}
    </ModalShell>
  );
}
