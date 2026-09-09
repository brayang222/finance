"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loseBien } from "../../../lib/actions";
import ModalShell, { CancelSave, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import { COP } from "../../data/mock";
import type { Bien } from "../../types";

const REASONS = [
  { value: "venta", label: "Venta" },
  { value: "robo", label: "Robo o hurto" },
  { value: "dano", label: "Daño o pérdida" },
  { value: "otro", label: "Otro" },
];

export default function ModalLoseBien({ item, onClose }: { item: Bien; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [reason, setReason] = useState(REASONS[0].value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await loseBien(item.id, reason);
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al dar de baja el bien");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Dar de baja bien"
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave saving={saving} saveLabel="Dar de baja" />}
    >
      <div className="text-[13px] text-muted">
        Vas a quitar <strong>{item.name}</strong> ({COP(item.value)}) de tu patrimonio. Esto no genera ningún movimiento de dinero, solo se resta del patrimonio total.
      </div>

      <div>
        <label className={labelClass}>Motivo</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass}>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
    </ModalShell>
  );
}
