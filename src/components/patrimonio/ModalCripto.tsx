"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { addCrypto, updateCrypto } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { Crypto, BankAccount } from "../../types";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
// Crypto quantities are fractional, never thousands-grouped (nobody types
// "1.234.567" BTC) — accept "." or "," as the decimal point either way,
// instead of num()'s money convention that would strip a "." as a thousands
// separator and silently mangle a value like 0.00801213.
const numQty = (s: string) => Number(s.replace(",", ".")) || 0;

export default function ModalCripto({ onClose, editItem, bankAccounts = [] }: { onClose: () => void; editItem?: Crypto; bankAccounts?: BankAccount[] }) {
  const router = useRouter();
  const toast = useToast();
  const [ticker, setTicker] = useState(editItem?.ticker ?? "");
  const [qty, setQty] = useState(editItem ? String(editItem.qty) : "");
  // MoneyInput is integer-only (it strips both "." and ",") — round to whole
  // COP, same convention already used for bank account balances.
  const [priceCOP, setPriceCOP] = useState(editItem ? String(Math.round(editItem.priceCOP)) : "");
  const [dateISO, setDateISO] = useState(editItem?.date ?? today());
  const [accountId, setAccountId] = useState(editItem?.accountId ?? "");
  const [saving, setSaving] = useState(false);

  const canSave = ticker.trim().length > 0 && numQty(qty) > 0 && num(priceCOP) > 0;

  const save = async () => {
    setSaving(true);
    try {
      const price = num(priceCOP);
      const acct = bankAccounts.find(b => b.id === accountId);
      const data = {
        ticker: ticker.trim().toUpperCase(),
        qty: numQty(qty),
        price,
        currency: "COP",
        trm: 1,
        priceCOP: price,
        commission: 0,
        date: dateISO,
        accountId: acct?.id,
        accountName: acct?.name,
      };
      if (editItem) {
        await updateCrypto(editItem.id, data);
      } else {
        await addCrypto(data);
      }
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar la cripto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={editItem ? "Editar operación" : "Registrar cripto"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Ticker</label>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="BTC"
          className={fieldClass}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Cantidad</label>
          <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0.00000000" className={fieldClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Precio COP</label>
          <MoneyInput value={priceCOP} onChange={setPriceCOP} prefix="$" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Fecha</label>
        <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className={fieldClass} />
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
        </div>
      )}
    </ModalShell>
  );
}
