"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { today, COP } from "../../data/mock";
import { sellStock, sellCrypto } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { BankAccount, Stock, Crypto } from "../../types";

// Quantities (shares or crypto units) are never thousands-grouped in practice —
// accept "." or "," as the decimal point either way, so a fractional crypto
// qty like 0.00801213 isn't misread as a much larger number.
const numQty = (s: string) => Number(s.replace(",", ".")) || 0;

interface Props {
  item: Stock | Crypto;
  kind: "stock" | "crypto";
  bankAccounts: BankAccount[];
  hasHys?: boolean;
  currentPrice?: number;
  onClose: () => void;
}

export default function ModalSellInvestment({ item, kind, bankAccounts, hasHys, currentPrice, onClose }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [sellQtyStr, setSellQtyStr] = useState(String(item.qty));
  const sellQtyRaw = numQty(sellQtyStr);
  const sellQty = Math.min(Math.max(sellQtyRaw, 0), item.qty);
  const unitCost = item.priceCOP + (item.qty > 0 ? item.commission / item.qty : 0);
  const cost = unitCost * sellQty;

  const [sellPrice, setSellPrice] = useState(String(Math.round(currentPrice ? currentPrice * sellQty : cost)));
  const [priceEdited, setPriceEdited] = useState(false);
  const [toAccount, setToAccount] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  // Keep the suggested total in sync with the quantity until the user types
  // their own sale price.
  useEffect(() => {
    if (priceEdited) return;
    setSellPrice(String(Math.round(currentPrice ? currentPrice * sellQty : cost)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellQty]);

  const accounts = [
    { id: "cash", name: "Efectivo" },
    ...bankAccounts.map(a => ({ id: a.id, name: a.name })),
    ...(hasHys ? [{ id: "hys", name: "Alto Rendimiento" }] : []),
  ];

  const accountName = (id: string) => accounts.find(a => a.id === id)?.name ?? id;
  const sellNum = parseInt(sellPrice, 10) || 0;
  const gain = sellNum - cost;
  const remaining = item.qty - sellQty;
  const valid = sellNum > 0 && sellQtyRaw > 0 && sellQtyRaw <= item.qty + 1e-9 && !!toAccount;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      if (kind === "stock") {
        await sellStock(item.id, sellQty, sellNum, toAccount, accountName(toAccount), date);
      } else {
        await sellCrypto(item.id, sellQty, sellNum, toAccount, accountName(toAccount), date);
      }
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al registrar la venta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Vender ${item.ticker}`} onClose={onClose} footer={
      <CancelSave onClose={onClose} onSave={save} canSave={valid} saving={saving} saveLabel="Vender" />
    }>
      <div className="flex flex-col gap-4 p-5">
        <div className="text-[13px] text-muted">
          Tienes {item.qty} uds · costo {COP(item.priceCOP * item.qty + item.commission)}
          {currentPrice ? ` · precio actual ${COP(currentPrice)}/ud` : ""}
        </div>

        <div>
          <label className={labelClass}>Cantidad a vender</label>
          <input
            inputMode="decimal"
            value={sellQtyStr}
            onChange={(e) => setSellQtyStr(e.target.value)}
            className={fieldClass}
          />
          <div className="text-[12px] text-dim mt-1">
            {remaining > 1e-9 ? `Quedan ${remaining} uds después de esta venta` : "Vendes toda la posición"}
          </div>
        </div>

        <div>
          <label className={labelClass}>Precio de venta total (COP)</label>
          <MoneyInput value={sellPrice} onChange={(v) => { setSellPrice(v); setPriceEdited(true); }} />
        </div>

        <div className="text-[13px]">
          <span className="text-muted">Ganancia: </span>
          <span className={gain >= 0 ? "text-pos font-medium" : "text-neg font-medium"}>
            {gain >= 0 ? "+" : ""}{COP(gain)}
          </span>
        </div>

        <div>
          <label className={labelClass}>Dinero entra a</label>
          <select className={fieldClass} value={toAccount} onChange={e => setToAccount(e.target.value)}>
            <option value="">Seleccionar cuenta...</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Fecha</label>
          <input type="date" className={fieldClass} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
    </ModalShell>
  );
}
