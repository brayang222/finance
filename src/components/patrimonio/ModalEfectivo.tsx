"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCash } from "../../../lib/actions";
import ModalShell, { CancelSave, fieldClass, labelClass } from "./ModalShell";

export default function ModalEfectivo({ current, onClose }: { current: number; onClose: () => void }) {
  const router = useRouter();
  const [amount, setAmount] = useState(current ? current.toLocaleString("es-CO") : "");
  const [saving, setSaving] = useState(false);

  const monto = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canSave = monto >= 0 && amount.length > 0;

  const save = async () => {
    setSaving(true);
    try {
      await saveCash({ banco: monto });
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Actualizar efectivo"
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Saldo total</label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dim"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            $
          </span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              setAmount(digits ? Number(digits).toLocaleString("es-CO") : "");
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
