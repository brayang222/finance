"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today, COP } from "../../data/mock";
import { addStock, updateStock } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { Stock, BankAccount } from "../../types";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

const EXCHANGE_MAP: Record<string, string> = {
  NMS: "NASDAQ", NGM: "NASDAQ", NCM: "NASDAQ",
  NYQ: "NYSE", NYE: "NYSE",
  BVC: "BVC", BOG: "BVC",
  AMEX: "AMEX", PCX: "AMEX",
};
const normalizeExchange = (raw: string) => EXCHANGE_MAP[raw.toUpperCase()] ?? raw.toUpperCase();

type LookupData = {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  marketState?: string;
  price?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
};

const fmtNum = (v?: number, digits = 2) =>
  typeof v === "number" ? v.toLocaleString("es-CO", { maximumFractionDigits: digits }) : "—";

export default function ModalAccion({ onClose, editItem, bankAccounts = [], prefillTicker }: { onClose: () => void; editItem?: Stock; bankAccounts?: BankAccount[]; prefillTicker?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [ticker, setTicker] = useState(editItem?.ticker ?? prefillTicker ?? "");
  const [qty, setQty] = useState(editItem ? String(editItem.qty) : "");
  const [priceCOP, setPriceCOP] = useState(editItem ? String(editItem.priceCOP) : "");
  const [dateISO, setDateISO] = useState(editItem?.date ?? today());
  const [commission, setCommission] = useState(editItem ? String(editItem.commission) : "0");
  const [accountId, setAccountId] = useState(editItem?.accountId ?? "");
  const [useSplit, setUseSplit] = useState(!!editItem?.accountId2);
  const [accountId2, setAccountId2] = useState(editItem?.accountId2 ?? "");
  const [amount2, setAmount2] = useState(editItem?.amount2 ? String(Math.round(editItem.amount2)) : "");
  const [exchange, setExchange] = useState(editItem?.exchange ?? "");
  const [currency, setCurrency] = useState(editItem?.currency ?? "COP");
  const [priceUSD, setPriceUSD] = useState(editItem && editItem.currency === "USD" ? String(editItem.price) : "");
  const [trm, setTrm] = useState(editItem?.trm && editItem.trm > 1 ? String(editItem.trm) : "");
  const [saving, setSaving] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookup, setLookup] = useState<LookupData | null>(null);
  const [lookupError, setLookupError] = useState("");

  const isUSD = currency === "USD";
  const canSave = ticker.trim().length > 0 && num(qty) > 0 &&
    (isUSD ? num(priceUSD) > 0 && num(trm) > 0 : num(priceCOP) > 0);

  const runLookup = async () => {
    if (!ticker.trim()) return;
    setLooking(true);
    setLookupError("");
    setLookup(null);
    try {
      const res = await fetch(`/api/stocks/lookup?ticker=${encodeURIComponent(ticker.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setLookupError(json?.error ?? "No se pudo verificar el ticker");
        return;
      }
      setLookup(json);
      // Auto-fill exchange + currency from lookup
      if (json.exchange && !exchange) setExchange(normalizeExchange(json.exchange));
      if (json.currency) setCurrency(json.currency === "USD" ? "USD" : "COP");
    } catch {
      setLookupError("No se pudo conectar con la fuente de datos");
    } finally {
      setLooking(false);
    }
  };

  const useLookupPrice = () => {
    if (!lookup?.price) return;
    if (lookup.currency === "USD") {
      setPriceUSD(String(lookup.price));
      const trmVal = num(trm);
      if (trmVal > 0) setPriceCOP(String(Math.round(lookup.price * trmVal)));
    } else {
      setPriceCOP(String(Math.round(lookup.price)));
    }
  };

  // When TRM changes, recalculate COP price for USD stocks
  const handleTrmChange = (val: string) => {
    setTrm(val);
    if (currency === "USD" && num(priceUSD) > 0 && num(val) > 0) {
      setPriceCOP(String(Math.round(num(priceUSD) * num(val))));
    }
  };

  // When USD price changes, recalculate COP
  const handlePriceUSDChange = (val: string) => {
    setPriceUSD(val);
    if (currency === "USD" && num(trm) > 0) {
      setPriceCOP(String(Math.round(num(val) * num(trm))));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const acct = bankAccounts.find(b => b.id === accountId);
      const acct2 = useSplit ? bankAccounts.find(b => b.id === accountId2) : undefined;
      const isUSD = currency === "USD";
      const usdPrice = num(priceUSD);
      const copPrice = num(priceCOP);
      const trmVal = isUSD && num(trm) > 0 ? num(trm) : 1;
      const data = {
        ticker: ticker.trim().toUpperCase(),
        qty: num(qty),
        price: isUSD ? usdPrice : copPrice,
        currency,
        trm: trmVal,
        priceCOP: isUSD ? Math.round(usdPrice * trmVal) : copPrice,
        commission: num(commission),
        date: dateISO,
        exchange: exchange.trim() || undefined,
        accountId: acct?.id,
        accountName: acct?.name,
        accountId2: acct2?.id,
        accountName2: acct2?.name,
        amount2: acct2 ? num(amount2) : undefined,
      };
      if (editItem) {
        await updateStock(editItem.id, data);
      } else {
        await addStock(data);
      }
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar la acción");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={editItem ? "Editar operación" : "Registrar acción"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Ticker</label>
        <div className="flex gap-2">
          <input
            value={ticker}
            onChange={(e) => { setTicker(e.target.value.toUpperCase()); setLookup(null); setLookupError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runLookup(); } }}
            placeholder="ECOPETROL"
            className={fieldClass}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
          <button
            type="button"
            onClick={runLookup}
            disabled={!ticker.trim() || looking}
            className="shrink-0 px-3 rounded-lg border border-line text-[13px] text-muted hover:bg-hover disabled:opacity-50"
          >
            {looking ? "Buscando…" : "Verificar"}
          </button>
        </div>

        {lookupError && (
          <div className="mt-2 text-[13px] text-red-500">{lookupError}</div>
        )}

        {lookup && (
          <div className="mt-2 rounded-lg border border-line p-3 text-[13px] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted font-medium">{lookup.name}</div>
                <div className="text-dim">
                  {lookup.symbol}
                  {lookup.exchange ? ` · ${lookup.exchange}` : ""}
                  {lookup.currency ? ` · ${lookup.currency}` : ""}
                </div>
              </div>
              {typeof lookup.price === "number" && (
                <button
                  type="button"
                  onClick={useLookupPrice}
                  className="shrink-0 px-2 py-1 rounded-md border border-line text-dim hover:bg-hover"
                >
                  Usar precio
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-dim">
              <div>Precio actual: <span className="text-muted">{fmtNum(lookup.price)}</span></div>
              <div>Cierre anterior: <span className="text-muted">{fmtNum(lookup.previousClose)}</span></div>
              <div>Variación: <span className="text-muted">{fmtNum(lookup.change)} ({fmtNum(lookup.changePercent)}%)</span></div>
              <div>Volumen: <span className="text-muted">{fmtNum(lookup.volume, 0)}</span></div>
              <div>Rango día: <span className="text-muted">{fmtNum(lookup.dayLow)} – {fmtNum(lookup.dayHigh)}</span></div>
              <div>Rango 52 sem.: <span className="text-muted">{fmtNum(lookup.fiftyTwoWeekLow)} – {fmtNum(lookup.fiftyTwoWeekHigh)}</span></div>
              <div>Media 50d: <span className="text-muted">{fmtNum(lookup.fiftyDayAverage)}</span></div>
              <div>Media 200d: <span className="text-muted">{fmtNum(lookup.twoHundredDayAverage)}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Exchange + Currency */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Bolsa</label>
          <select value={exchange} onChange={e => setExchange(e.target.value)} className={fieldClass}>
            <option value="">— Sin especificar —</option>
            <option value="BVC">BVC (Colombia)</option>
            <option value="NYSE">NYSE</option>
            <option value="NASDAQ">NASDAQ</option>
            <option value="AMEX">AMEX</option>
          </select>
        </div>
        <div className="flex-1">
          <label className={labelClass}>Moneda</label>
          <select value={currency} onChange={e => { setCurrency(e.target.value); if (e.target.value === "COP") { setPriceUSD(""); setTrm(""); } }} className={fieldClass}>
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Cantidad</label>
          <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" className={fieldClass} />
        </div>
        {isUSD ? (
          <div className="flex-1">
            <label className={labelClass}>Precio USD</label>
            <input inputMode="decimal" value={priceUSD} onChange={e => handlePriceUSDChange(e.target.value)} placeholder="0.00" className={fieldClass} />
          </div>
        ) : (
          <div className="flex-1">
            <label className={labelClass}>Precio por acción (COP)</label>
            <MoneyInput value={priceCOP} onChange={setPriceCOP} prefix="$" />
          </div>
        )}
      </div>

      {isUSD && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelClass}>TRM (COP/USD)</label>
            <MoneyInput value={trm} onChange={handleTrmChange} prefix="$" />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Precio COP (calculado)</label>
            <MoneyInput value={priceCOP} onChange={setPriceCOP} prefix="$" />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Comisión {currency === "USD" ? "COP" : "COP"}</label>
          <MoneyInput value={commission} onChange={setCommission} prefix="$" />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Fecha</label>
          <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className={fieldClass} />
        </div>
      </div>

      {num(qty) > 0 && (isUSD ? num(priceUSD) > 0 && num(trm) > 0 : num(priceCOP) > 0) && (
        <div className="text-[13px] text-dim">
          Total a pagar:{" "}
          <span className="text-muted font-medium">{COP(num(qty) * num(priceCOP) + num(commission))}</span>
          {isUSD && num(trm) > 0 && (
            <span className="ml-1 text-dim">
              ({num(qty)} × {num(priceUSD).toFixed(2)} USD @ TRM {COP(num(trm))})
            </span>
          )}
          {!isUSD && (
            <span className="ml-1 text-dim">({num(qty)} × {COP(num(priceCOP))} + comisión {COP(num(commission))})</span>
          )}
        </div>
      )}

      {bankAccounts.length > 0 && (
        <div>
          <label className={labelClass}>Cuenta (opcional)</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={fieldClass}>
            <option value="">— Sin cuenta —</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {bankAccounts.length > 1 && (
        <div>
          {!useSplit ? (
            <button
              type="button"
              onClick={() => setUseSplit(true)}
              className="text-[12px] text-accent bg-transparent border-none cursor-pointer px-0"
            >
              + Usar dos cuentas para pagar (ej. saldo del bróker + transferencia)
            </button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-dim">Segunda cuenta</span>
                <button
                  type="button"
                  onClick={() => { setUseSplit(false); setAccountId2(""); setAmount2(""); }}
                  className="text-[12px] text-dim hover:text-neg bg-transparent border-none cursor-pointer"
                >
                  Quitar
                </button>
              </div>
              <select value={accountId2} onChange={(e) => setAccountId2(e.target.value)} className={fieldClass}>
                <option value="">Seleccionar cuenta...</option>
                {bankAccounts.filter(b => b.id !== accountId).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div>
                <label className={labelClass}>Monto pagado desde esta cuenta (COP)</label>
                <MoneyInput value={amount2} onChange={setAmount2} prefix="$" />
              </div>
              {num(qty) > 0 && num(priceCOP) > 0 && (
                <div className="text-[12px] text-dim">
                  Resto desde {bankAccounts.find(b => b.id === accountId)?.name ?? "la primera cuenta"}:{" "}
                  <span className="text-muted">{COP(Math.max(0, num(qty) * num(priceCOP) + num(commission) - num(amount2)))}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
