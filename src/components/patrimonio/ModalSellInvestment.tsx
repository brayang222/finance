"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today, COP } from "../../data/mock";
import { sellStock, sellCrypto } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import type { BankAccount, Stock, Crypto } from "../../types";

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
  const cost = item.priceCOP * item.qty + item.commission;
  const suggested = currentPrice ? currentPrice * item.qty : cost;

  const [sellPrice, setSellPrice] = useState(String(Math.round(suggested)));
  const [toAccount, setToAccount] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const accounts = [
    { id: "cash", name: "Efectivo" },
    ...bankAccounts.map(a => ({ id: a.id, name: a.name })),
    ...(hasHys ? [{ id: "hys", name: "Alto Rendimiento" }] : []),
  ];

  const accountName = (id: string) => accounts.find(a => a.id === id)?.name ?? id;
  const sellNum = parseInt(sellPrice, 10) || 0;
  const gain = sellNum - cost;
  const valid = sellNum > 0 && !!toAccount;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    if (kind === "stock") {
      await sellStock(item.id, sellNum, toAccount, accountName(toAccount), date);
    } else {
      await sellCrypto(item.id, sellNum, toAccount, accountName(toAccount), date);
    }
    router.refresh();
    onClose();
  };

  return (
    <ModalShell title={`Vender ${item.ticker}`} onClose={onClose} footer={
      <CancelSave onClose={onClose} onSave={save} canSave={valid} saving={saving} saveLabel="Vender" />
    }>
      <div className="flex flex-col gap-4 p-5">
        <div className="text-[13px] text-muted">
          {item.qty} uds · costo {COP(cost)}
          {currentPrice ? ` · precio actual ${COP(currentPrice)}/ud` : ""}
        </div>

        <div>
          <label className={labelClass}>Precio de venta total (COP)</label>
          <MoneyInput value={sellPrice} onChange={setSellPrice} />
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
