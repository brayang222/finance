"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COP } from "../../data/mock";
import { today } from "../../data/mock";
import { hysDeposit, hysWithdraw, hysChangeRate, hysEditMovement } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { HysMovement } from "../../types";

type Props =
  | { mode: "deposit" | "withdraw"; hysId: string; currentBalance?: number; onClose: () => void; editItem?: undefined; bankAccounts?: { id: string; name: string }[]; currency?: string; trm?: number | null }
  | { mode: "rate"; hysId: string; currentRate: number; onClose: () => void; editItem?: undefined; bankAccounts?: { id: string; name: string }[] }
  | { mode: "edit"; hysId?: string; editItem: HysMovement; onClose: () => void; bankAccounts?: { id: string; name: string }[] };

function fmtInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CO");
}

function parseInput(formatted: string): number {
  return Number(formatted.replace(/\D/g, "")) || 0;
}

export default function ModalHysMovement(props: Props) {
  const { mode, onClose } = props;
  const bankAccounts = props.bankAccounts ?? [];
  const currentBalance = (props.mode === "withdraw" && props.currentBalance) ? props.currentBalance : Infinity;
  const isUsd = (props.mode === "deposit" || props.mode === "withdraw") && props.currency === "USD";
  const trmHint = (props.mode === "deposit" || props.mode === "withdraw") ? props.trm : undefined;
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState(props.mode === "edit" ? String(Math.round(props.editItem.amount)) : "");
  const [note, setNote] = useState(props.mode === "edit" ? (props.editItem.note ?? "") : "");
  const [date, setDate] = useState(props.mode === "edit" ? props.editItem.date : today());
  const [rate, setRate] = useState(
    props.mode === "rate" ? String(props.currentRate) : ""
  );
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id ?? "cash");
  const [saving, setSaving] = useState(false);

  // Campos ligados para cuentas en USD: cambia uno, el otro se recalcula con
  // la TRM de esta operación (no la del mercado — la real a la que compraste/vendiste).
  const [primary, setPrimary] = useState<"cop" | "usd">("cop");
  const [copRaw, setCopRaw] = useState("");
  const [usdRaw, setUsdRaw] = useState("");
  const [customTrm, setCustomTrm] = useState(trmHint ? trmHint.toFixed(2) : "");
  const activeTrm = parseFloat(customTrm) || 0;

  useEffect(() => {
    if (!isUsd) return;
    if (primary === "cop") {
      const cop = parseInput(copRaw);
      setUsdRaw(activeTrm > 0 && cop > 0 ? (cop / activeTrm).toFixed(2) : "");
    } else {
      const usd = parseFloat(usdRaw.replace(",", ".")) || 0;
      setCopRaw(activeTrm > 0 && usd > 0 ? Math.round(usd * activeTrm).toLocaleString("es-CO") : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copRaw, usdRaw, activeTrm, primary, isUsd]);

  const amountVal = Number(amount.replace(/\./g, "")) || 0;
  const rateVal = parseFloat(rate) || 0;
  const copAmount = parseInput(copRaw);
  const usdAmount = parseFloat(usdRaw.replace(",", ".")) || 0;

  const nativeAmount = isUsd ? usdAmount : amountVal;
  const overBalance = mode === "withdraw" && nativeAmount > currentBalance;
  const canSave =
    mode === "rate" ? rateVal > 0
    : mode === "edit" ? amountVal > 0
    : isUsd ? (usdAmount > 0 && copAmount > 0 && activeTrm > 0 && !overBalance)
    : amountVal > 0 && !overBalance;

  const titles: Record<string, string> = {
    deposit: "Depositar",
    withdraw: "Retirar",
    rate: "Cambiar tasa",
    edit: "Editar movimiento",
  };

  const save = async () => {
    setSaving(true);
    try {
      if (mode === "deposit") await hysDeposit(props.hysId, nativeAmount, note || undefined, accountId, isUsd ? copAmount : undefined);
      else if (mode === "withdraw") await hysWithdraw(props.hysId, nativeAmount, note || undefined, accountId, isUsd ? copAmount : undefined);
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
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar");
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
          {isUsd ? (
            <>
              <div>
                <label className={labelClass}>Tasa de cambio de esta operación (COP por USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={fieldClass}
                  value={customTrm}
                  onChange={e => setCustomTrm(e.target.value)}
                  placeholder="Ej: 4200"
                />
                {trmHint && Math.abs(activeTrm - trmHint) > 1 && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--color-dim, #71717a)" }}>
                    TRM actual del mercado: {COP(trmHint)} — usa la tasa a la que realmente {mode === "deposit" ? "compraste" : "vendiste"} si es distinta.
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Monto en pesos</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={fieldClass}
                  value={copRaw}
                  onChange={e => { setPrimary("cop"); setCopRaw(fmtInput(e.target.value)); }}
                  placeholder="$ 0"
                />
              </div>
              <div>
                <label className={labelClass}>Monto en dólares</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={fieldClass}
                  value={usdRaw}
                  onChange={e => { setPrimary("usd"); setUsdRaw(e.target.value.replace(/[^\d.,]/g, "")); }}
                  placeholder="USD 0.00"
                />
              </div>
              {overBalance && (
                <p className="text-[11.5px] mt-1" style={{ color: "var(--color-neg, #f87171)" }}>
                  Saldo insuficiente — disponible: USD {currentBalance.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </>
          ) : (
            <div>
              <label className={labelClass}>Monto</label>
              <MoneyInput value={amount} onChange={setAmount} prefix="$" />
              {overBalance && (
                <p className="text-[11.5px] mt-1" style={{ color: "var(--color-neg, #f87171)" }}>
                  Saldo insuficiente — disponible: ${Math.round(currentBalance).toLocaleString("es-CO")}
                </p>
              )}
            </div>
          )}
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
          {(mode === "deposit" || mode === "withdraw") && (
            <div>
              <label className={labelClass}>
                {mode === "deposit" ? "Origen del dinero" : "Destino del dinero"}
              </label>
              <select className={fieldClass} value={accountId} onChange={e => setAccountId(e.target.value)}>
                {bankAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
                {!bankAccounts.some(a => a.name.toLowerCase().includes("efectivo")) && (
                  <option value="cash">Efectivo</option>
                )}
              </select>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}
