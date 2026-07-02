"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { CATS_IN, CATS_OUT } from "../../data/constants";
import { addFinance } from "../../../lib/actions";
import ModalShell, { CancelSave, fieldClass, labelClass } from "./ModalShell";

type TxType = "ingreso" | "egreso";

export default function ModalMovimiento({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<TxType>("egreso");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const cats = type === "ingreso" ? CATS_IN : CATS_OUT;
  const [category, setCategory] = useState(cats[0]);
  const [dateISO, setDateISO] = useState(today());
  const [saving, setSaving] = useState(false);

  const monto = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canSave = monto > 0 && desc.trim().length > 0;

  const switchType = (t: TxType) => {
    setType(t);
    setCategory((t === "ingreso" ? CATS_IN : CATS_OUT)[0]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await addFinance({ type, amount: monto, desc: desc.trim(), category, date: dateISO });
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Registrar movimiento"
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      {/* Type toggle */}
      <div className="flex bg-panel2 rounded-xl p-[3px]">
        {(["ingreso", "egreso"] as TxType[]).map((t) => (
          <button
            key={t}
            onClick={() => switchType(t)}
            className={[
              "flex-1 h-[34px] rounded-[9px] border-none cursor-pointer text-[13px] font-medium capitalize",
              type === t ? "bg-accent text-accentFg" : "bg-transparent text-muted",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className={labelClass}>Monto</label>
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

      <div>
        <label className={labelClass}>Descripción</label>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Ej. Salario, Mercado…"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>Categoría</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Fecha</label>
        <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className={fieldClass} />
      </div>
    </ModalShell>
  );
}
