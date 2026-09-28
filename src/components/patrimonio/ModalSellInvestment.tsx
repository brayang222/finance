"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { today, COP } from "../../data/mock";
import type { Asset } from "../../data/mock";
import { sellStock, sellCrypto } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { BankAccount } from "../../types";

// Quantities (shares or crypto units) are never thousands-grouped in practice —
// accept "." or "," as the decimal point either way, so a fractional crypto
// qty like 0.00801213 isn't misread as a much larger number.
const numQty = (s: string) => Number(s.replace(",", ".")) || 0;

interface Props {
  asset: Asset;
  kind: "stock" | "crypto";
  bankAccounts: BankAccount[];
  hasHys?: boolean;
  onClose: () => void;
}

export default function ModalSellInvestment({ asset, kind, bankAccounts, hasHys, onClose }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [sellQtyStr, setSellQtyStr] = useState(String(asset.qty));
  const sellQtyRaw = numQty(sellQtyStr);
  const sellQty = Math.min(Math.max(sellQtyRaw, 0), asset.qty);
  // asset.totalCost already blends every buy lot (price + commission) into a
  // single weighted-average cost basis — see transforms.ts toAssets().
  const unitCost = asset.qty > 0 ? asset.totalCost / asset.qty : 0;
  const cost = unitCost * sellQty;

  const [sellPrice, setSellPrice] = useState(String(Math.round(asset.price * sellQty)));
  const [priceEdited, setPriceEdited] = useState(false);
  const [commission, setCommission] = useState("0");
  const [toAccount, setToAccount] = useState("");
  const [date, setDate] = useState(today());
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [useSplit, setUseSplit] = useState(false);
  const [toAccount2, setToAccount2] = useState("");
  const [amount2, setAmount2] = useState("");

  // Keep the suggested total in sync with the quantity until the user types
  // their own sale price.
  useEffect(() => {
    if (priceEdited) return;
    setSellPrice(String(Math.round(asset.price * sellQty)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellQty]);

  const accounts = [
    { id: "cash", name: "Efectivo" },
    ...bankAccounts.map(a => ({ id: a.id, name: a.name })),
    ...(hasHys ? [{ id: "hys", name: "Alto Rendimiento" }] : []),
  ];

  // Quick-select a fraction of the position — MAX (100%) is the recommended
  // action for closing out a position entirely. Whole-unit assets (stocks)
  // round to the nearest unit; fractional assets (crypto) keep precision.
  const setQtyFraction = (frac: number) => {
    const raw = frac >= 1 ? asset.qty : asset.qty * frac;
    const rounded = Number.isInteger(asset.qty) ? Math.round(raw) : Number(raw.toFixed(8));
    setSellQtyStr(String(rounded));
    setPriceEdited(false);
  };

  const accountName = (id: string) => accounts.find(a => a.id === id)?.name ?? id;
  const sellNum = parseInt(sellPrice, 10) || 0;
  const commissionNum = parseInt(commission, 10) || 0;
  const gain = (sellNum - commissionNum) - cost;
  const remaining = asset.qty - sellQty;
  const valid = sellNum > 0 && sellQtyRaw > 0 && sellQtyRaw <= asset.qty + 1e-9 && !!toAccount;

  const amount2Num = useSplit ? parseInt(amount2, 10) || 0 : undefined;
  const toAccount2Name = useSplit && toAccount2 ? accountName(toAccount2) : undefined;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const trimmedDetail = detail.trim() || undefined;
      const splitArgs: [string | undefined, string | undefined, number | undefined] =
        useSplit && toAccount2 ? [toAccount2, toAccount2Name, amount2Num] : [undefined, undefined, undefined];
      if (kind === "stock") {
        await sellStock(asset.ticker, sellQty, sellNum, toAccount, accountName(toAccount), date, commissionNum, trimmedDetail, ...splitArgs);
      } else {
        await sellCrypto(asset.ticker, sellQty, sellNum, toAccount, accountName(toAccount), date, commissionNum, trimmedDetail, ...splitArgs);
      }
      if (remaining <= 1e-9) {
        // Selling the whole position leaves nothing for the detail page to
        // show — send the user back to the list instead of "Activo no encontrado".
        router.push(kind === "crypto" ? "/crypto" : "/investments");
      } else {
        router.refresh();
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al registrar la venta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Vender ${asset.ticker}`} onClose={onClose} footer={
      <CancelSave onClose={onClose} onSave={save} canSave={valid} saving={saving} saveLabel="Vender" />
    }>
      <div className="flex flex-col gap-4 p-5">
        <div className="text-[13px] text-muted">
          Tienes {asset.qty} uds · costo {COP(asset.totalCost)} · precio actual {COP(asset.price)}/ud
        </div>

        <div>
          <label className={labelClass}>Cantidad a vender</label>
          <input
            inputMode="decimal"
            value={sellQtyStr}
            onChange={(e) => setSellQtyStr(e.target.value)}
            className={fieldClass}
          />
          <div className="flex gap-2 mt-2">
            {[0.25, 0.5, 0.75].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setQtyFraction(p)}
                className="flex-1 h-8 rounded-lg border border-line bg-panel2 text-muted text-[12px] cursor-pointer hover:border-accent hover:text-fg"
              >
                {Math.round(p * 100)}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => setQtyFraction(1)}
              title="Venta recomendada: toda la posición disponible"
              className="flex-1 h-8 rounded-lg border border-accent bg-accent text-accentFg text-[12px] font-medium cursor-pointer"
            >
              MAX
            </button>
          </div>
          <div className="text-[12px] text-dim mt-1">
            {remaining > 1e-9 ? `Quedan ${remaining} uds después de esta venta` : "Vendes toda la posición"}
          </div>
        </div>

        <div>
          <label className={labelClass}>Precio de venta total (COP)</label>
          <MoneyInput value={sellPrice} onChange={(v) => { setSellPrice(v); setPriceEdited(true); }} />
        </div>

        <div>
          <label className={labelClass}>Comisión de venta (COP)</label>
          <MoneyInput value={commission} onChange={setCommission} />
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

        {accounts.length > 1 && (
          !useSplit ? (
            <button
              type="button"
              onClick={() => setUseSplit(true)}
              className="text-[12px] text-accent bg-transparent border-none cursor-pointer px-0 self-start"
            >
              + Repartir el dinero entre dos cuentas
            </button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-dim">Segunda cuenta destino</span>
                <button
                  type="button"
                  onClick={() => { setUseSplit(false); setToAccount2(""); setAmount2(""); }}
                  className="text-[12px] text-dim hover:text-neg bg-transparent border-none cursor-pointer"
                >
                  Quitar
                </button>
              </div>
              <select className={fieldClass} value={toAccount2} onChange={e => setToAccount2(e.target.value)}>
                <option value="">Seleccionar cuenta...</option>
                {accounts.filter(a => a.id !== toAccount).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div>
                <label className={labelClass}>Monto que entra a esta cuenta (COP)</label>
                <MoneyInput value={amount2} onChange={setAmount2} />
              </div>
              <div className="text-[12px] text-dim">
                Resto a {accountName(toAccount) || "la primera cuenta"}:{" "}
                <span className="text-muted">{COP(Math.max(0, sellNum - commissionNum - (amount2Num ?? 0)))}</span>
              </div>
            </div>
          )
        )}

        <div>
          <label className={labelClass}>Fecha</label>
          <input type="date" className={fieldClass} value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Detalle de la venta (opcional)</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="¿Por qué vendiste? p. ej. tomar ganancia, necesitaba el efectivo..."
            rows={2}
            className={`${fieldClass} h-auto py-2.5 resize-none`}
          />
        </div>
      </div>
    </ModalShell>
  );
}
