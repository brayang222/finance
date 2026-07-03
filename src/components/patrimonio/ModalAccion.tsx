"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { addStock, updateStock } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import type { Stock, BankAccount } from "../../types";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

export default function ModalAccion({ onClose, editItem, bankAccounts = [] }: { onClose: () => void; editItem?: Stock; bankAccounts?: BankAccount[] }) {
  const router = useRouter();
  const [ticker, setTicker] = useState(editItem?.ticker ?? "");
  const [qty, setQty] = useState(editItem ? String(editItem.qty) : "");
  const [priceCOP, setPriceCOP] = useState(editItem ? String(editItem.priceCOP) : "");
  const [dateISO, setDateISO] = useState(editItem?.date ?? today());
  const [commission, setCommission] = useState(editItem ? String(editItem.commission) : "0");
  const [accountId, setAccountId] = useState(editItem?.accountId ?? "");
  const [saving, setSaving] = useState(false);

  const canSave = ticker.trim().length > 0 && num(qty) > 0 && num(priceCOP) > 0;

  const save = async () => {
    setSaving(true);
    try {
      const price = num(priceCOP);
      const acct = bankAccounts.find(b => b.id === accountId);
      const data = {
        ticker: ticker.trim().toUpperCase(),
        qty: num(qty),
        price,
        currency: "COP",
        trm: 1,
        priceCOP: price,
        commission: num(commission),
        date: dateISO,
        accountId: acct?.id,
        accountName: acct?.name,
      };
      if (editItem) {
        await updateStock(editItem.id, data);
      } else {
        await addStock(data);
      }
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={editItem ? "Editar operación" : "Registrar acción"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Ticker</label>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="ECOPETROL"
          className={fieldClass}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Cantidad</label>
          <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" className={fieldClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Precio COP</label>
          <MoneyInput value={priceCOP} onChange={setPriceCOP} prefix="$" />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Comisión COP</label>
          <MoneyInput value={commission} onChange={setCommission} prefix="$" />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Fecha</label>
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
        </div>
      )}
    </ModalShell>
  );
}
