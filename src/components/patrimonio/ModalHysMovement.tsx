"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { hysDeposit, hysWithdraw, hysChangeRate, hysEditMovement } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import type { HysMovement } from "../../types";

type Props =
  | { mode: "deposit" | "withdraw"; hysId: string; onClose: () => void; editItem?: undefined }
  | { mode: "rate"; hysId: string; currentRate: number; onClose: () => void; editItem?: undefined }
  | { mode: "edit"; hysId?: string; editItem: HysMovement; onClose: () => void };

export default function ModalHysMovement(props: Props) {
  const { mode, onClose } = props;
  const router = useRouter();
  const [amount, setAmount] = useState(props.mode === "edit" ? String(Math.round(props.editItem.amount)) : "");
  const [note, setNote] = useState(props.mode === "edit" ? (props.editItem.note ?? "") : "");
  const [date, setDate] = useState(props.mode === "edit" ? props.editItem.date : today());
  const [rate, setRate] = useState(
    props.mode === "rate" ? String(props.currentRate) : ""
  );
  const [saving, setSaving] = useState(false);

  const amountVal = Number(amount.replace(/\./g, "")) || 0;
  const rateVal = parseFloat(rate) || 0;

  const canSave =
    mode === "rate" ? rateVal > 0
    : mode === "edit" ? amountVal > 0
    : amountVal > 0;

  const titles: Record<string, string> = {
    deposit: "Depositar",
    withdraw: "Retirar",
    rate: "Cambiar tasa",
    edit: "Editar movimiento",
  };

  const save = async () => {
    setSaving(true);
    try {
      if (mode === "deposit") await hysDeposit(props.hysId, amountVal, note || undefined);
      else if (mode === "withdraw") await hysWithdraw(props.hysId, amountVal, note || undefined);
      else if (mode === "rate") await hysChangeRate(props.hysId, rateVal);
      else if (mode === "edit") {
        const patch: { amount?: number; note?: string; date?: string } = {};
        if (amountVal !== props.editItem.amount) patch.amount = amountVal;
        if (note !== (props.editItem.note ?? "")) patch.note = note || undefined;
        if (date !== props.editItem.date) patch.date = date;
        if (Object.keys(patch).length > 0) await hysEditMovement(props.editItem.id, patch);
      }
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={titles[mode]} onClose={onClose} footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}>
      {mode === "rate" ? (
        <div>
          <label className={labelClass}>Nueva tasa efectiva anual (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={fieldClass}
            value={rate}
            onChange={e => setRate(e.target.value)}
            placeholder="Ej: 14.00"
            autoFocus
          />
        </div>
      ) : (
        <>
          <div>
            <label className={labelClass}>Monto</label>
            <MoneyInput value={amount} onChange={setAmount} prefix="$" />
          </div>
          {mode === "edit" && (
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                className={fieldClass}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Nota (opcional)</label>
            <input
              type="text"
              className={fieldClass}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Descripción..."
            />
          </div>
        </>
      )}
    </ModalShell>
  );
}
