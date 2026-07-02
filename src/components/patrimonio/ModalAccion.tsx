"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { addStock } from "../../../lib/actions";
import ModalShell, { CancelSave, fieldClass, labelClass } from "./ModalShell";

const num = (s: string) => Number(s.replace(",", ".")) || 0;

export default function ModalAccion({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [ticker, setTicker] = useState("");
  const [qty, setQty] = useState("");
  const [priceCOP, setPriceCOP] = useState("");
  const [dateISO, setDateISO] = useState(today());
  const [commission, setCommission] = useState("0");
  const [saving, setSaving] = useState(false);

  const canSave = ticker.trim().length > 0 && num(qty) > 0 && num(priceCOP) > 0;

  const save = async () => {
    setSaving(true);
    try {
      const price = num(priceCOP);
      await addStock({
        ticker: ticker.trim().toUpperCase(),
        qty: num(qty),
        price,
        currency: "COP",
        trm: 1,
        priceCOP: price,
        commission: num(commission),
        date: dateISO,
      });
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Registrar acción"
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
          <input inputMode="decimal" value={priceCOP} onChange={(e) => setPriceCOP(e.target.value)} placeholder="0" className={fieldClass} />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Comisión COP</label>
          <input inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} className={fieldClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Fecha</label>
          <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className={fieldClass} />
        </div>
      </div>
    </ModalShell>
  );
}
