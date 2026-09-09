"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { createBien, updateBien } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { Bien } from "../../types";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

export default function ModalBien({ onClose, editItem }: { onClose: () => void; editItem?: Bien }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(editItem?.name ?? "");
  const [value, setValue] = useState(editItem ? String(Math.round(editItem.value)) : "");
  const [dateISO, setDateISO] = useState(editItem?.date ?? today());
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && num(value) > 0;

  const save = async () => {
    setSaving(true);
    try {
      const item = { name: name.trim(), value: num(value), date: dateISO };
      if (editItem) {
        await updateBien(editItem.id, item);
      } else {
        await createBien(item);
      }
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar el bien");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={editItem ? "Editar bien" : "Agregar bien"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Moto Yamaha, Apartamento, Portátil"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>Valor estimado (COP)</label>
        <MoneyInput value={value} onChange={setValue} prefix="$" />
      </div>

      <div>
        <label className={labelClass}>Fecha de adquisición</label>
        <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className={fieldClass} />
      </div>
    </ModalShell>
  );
}
