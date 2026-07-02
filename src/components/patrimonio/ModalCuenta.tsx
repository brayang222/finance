"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBankAccount, updateBankAccount } from "../../../lib/actions";
import ModalShell, { CancelSave, fieldClass, labelClass } from "./ModalShell";
import type { BankAccount } from "../../types";

export default function ModalCuenta({ onClose, editItem }: { onClose: () => void; editItem?: BankAccount }) {
  const router = useRouter();
  const [name, setName] = useState(editItem?.name ?? "");
  const [bank, setBank] = useState(editItem?.bank ?? "");
  const [balance, setBalance] = useState(editItem ? String(editItem.balance) : "");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && Number(balance.replace(/[^\d]/g, "")) >= 0;

  const save = async () => {
    setSaving(true);
    try {
      const bal = Number(balance.replace(/[^\d]/g, "")) || 0;
      const item = { name: name.trim(), bank: bank.trim() || undefined, balance: bal };
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

  return (
    <ModalShell
      title={editItem ? "Editar cuenta" : "Agregar cuenta"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Nombre de la cuenta</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Bancolombia Ahorros"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>Banco (opcional)</label>
        <input
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          placeholder="Ej. Bancolombia"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>Saldo actual (COP)</label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dim"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            $
          </span>
          <input
            inputMode="numeric"
            value={balance}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              setBalance(digits ? Number(digits).toLocaleString("es-CO") : "");
            }}
            placeholder="0"
            className={`${fieldClass} pl-[26px] tabular-nums`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
        </div>
      </div>
    </ModalShell>
  );
}
