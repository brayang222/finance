"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Asset, Account, COP, USD, PCT, today } from "../../data/mock";
import type { AllData, Stock, Crypto, Bien, Transfer, Dividend as DividendT } from "../../types";
import { Bal, Segmented } from "./utils";
import { usePrivacy } from "./PrivacyContext";
import { useCurrency } from "./CurrencyContext";
import { toAssets, toTransactions, toAccounts } from "./transforms";
import { deleteStock, deleteCrypto, refreshPrices, refreshTrm, deleteBankAccount, deleteFinance, hysDeleteAccount, deleteTransfer, deleteDividend, updateOpenOrderStatus, deleteOpenOrder, fillOpenOrder, addOpenOrder } from "../../../lib/actions";
import type { OpenOrder } from "../../types";
import ModalTransfer from "./ModalTransfer";
import ModalSellInvestment from "./ModalSellInvestment";
import { useToast } from "./Toast";
import ModalAccion from "./ModalAccion";
import ModalCripto from "./ModalCripto";
import ModalDividend from "./ModalDividend";
import ModalCuenta from "./ModalCuenta";
import ModalBien from "./ModalBien";
import ModalLoseBien from "./ModalLoseBien";
import ModalMovimiento from "./ModalMovimiento";
import ModalShell from "./ModalShell";
import ModalCambio from "./ModalCambio";
import { IconEdit, IconTrash } from "./Icons";
import AssetTechnical from "./AssetTechnical";

// ponytail: shared style objects replaced with className strings
const cardClass = "border border-line bg-panel rounded-[18px] p-5.5";

const thClass =
  "text-[11.5px] tracking-[0.04em] uppercase text-dim font-medium text-left pb-[10px]";

const tdClass = "py-3 border-t border-line text-[13.5px]";

const monoStyle = { fontFamily: "'IBM Plex Mono', monospace" };

const refreshBtnClass = "border border-line bg-panel2 text-muted text-[12px] px-3 py-1.5 rounded-lg cursor-pointer";

function OpenOrdersTable({
  orders, kind, onRefresh, prices, trm, currency = "USD", pricesFresh = false, prefillTicker = "", knownTickers = [],
}: {
  orders: OpenOrder[];
  kind: "cripto" | "stock";
  onRefresh: () => void;
  prices?: Record<string, number>;
  trm?: number | null;
  currency?: "COP" | "USD";
  pricesFresh?: boolean;
  prefillTicker?: string;
  knownTickers?: string[];
}) {
  const toast = useToast();
  const router = useRouter();
  const filtered = orders.filter(o => o.kind === kind);
  const [loading, setLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fTicker, setFTicker] = useState(prefillTicker);
  const [fSide, setFSide] = useState<"buy" | "sell">("buy");
  const [fQty, setFQty] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fBroker, setFBroker] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => { setFTicker(prefillTicker); setFSide("buy"); setFQty(""); setFPrice(""); setFBroker(""); setShowForm(false); };
  const parseNum = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
  const parseQty = (s: string) => Number(s.replace(",", ".")) || 0;

  const handleSave = async () => {
    const qty = parseQty(fQty);
    const limitPrice = parseNum(fPrice);
    if (!fTicker.trim() || qty <= 0 || limitPrice <= 0) {
      toast.error("Ticker, cantidad y precio límite son requeridos");
      return;
    }
    setSaving(true);
    try {
      const totalUSD = kind === "cripto" ? qty * limitPrice : undefined;
      await addOpenOrder({
        ticker: fTicker.trim().toUpperCase(),
        kind, side: fSide,
        orderType: "limit",
        qty, limitPrice,
        totalUSD,
        currency: kind === "cripto" ? "USD" : "COP",
        date: today(),
        broker: fBroker.trim() || undefined,
      });
      router.refresh();
      resetForm();
      toast.success("Orden registrada");
    } catch {
      toast.error("Error al guardar la orden");
    } finally {
      setSaving(false);
    }
  };

  // Auto-execute limit orders only after a manual price refresh (never on stale cached prices)
  useEffect(() => {
    if (!pricesFresh || !prices || !trm) return;
    const open = filtered.filter(o => o.status === "open" && o.limitPrice != null);
    if (open.length === 0) return;
    (async () => {
      let changed = false;
      for (const o of open) {
        const mktUSD = (prices[o.ticker.toUpperCase()] ?? 0) / trm;
        const hit = o.side === "buy" ? mktUSD <= o.limitPrice! : mktUSD >= o.limitPrice!;
        if (hit) {
          await fillOpenOrder(o.id, trm);
          toast.success(`Orden ${o.ticker} ejecutada automáticamente — posición añadida`);
          changed = true;
        }
      }
      if (changed) router.refresh();
    })();
  }, [pricesFresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const inCOP = currency === "COP" && !!trm;
  const fmtAmt = (usdVal: number) => inCOP ? COP(usdVal * trm!) : USD(usdVal);

  const statusBadge = (s: string) => {
    const cls = s === "open" ? "bg-accent/20 text-accent" : s === "filled" ? "bg-pos/20 text-pos" : "bg-neg/20 text-neg";
    const label = s === "open" ? "Abierta" : s === "filled" ? "Ejecutada" : "Cancelada";
    return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
  };

  const handleStatus = async (id: string, status: "filled" | "cancelled") => {
    if (status === "filled" && !trm) {
      toast.error("Se necesita la TRM para ejecutar la orden — actualiza los precios primero");
      return;
    }
    setLoading(id);
    try {
      if (status === "filled") {
        await fillOpenOrder(id, trm!);
        toast.success("Orden ejecutada — posición añadida al portafolio");
      } else {
        await updateOpenOrderStatus(id, status);
        toast.success("Orden cancelada");
      }
      router.refresh();
    } catch { toast.error("Error al actualizar la orden"); }
    finally { setLoading(null); }
  };

  const handleDelete = async (id: string) => {
    setLoading(id);
    try {
      await deleteOpenOrder(id);
      router.refresh();
    } catch { toast.error("Error al eliminar la orden"); }
    finally { setLoading(null); }
  };

  const oth = "text-[11.5px] tracking-[0.04em] uppercase text-dim font-medium text-left pb-[10px] pr-5";
  const otd = "py-3 border-t border-line text-[13.5px] pr-5 whitespace-nowrap";
  const amtLabel = inCOP ? "Total COP" : "Total USD";
  const priceLbl = "Precio límite";

  const ifield = "w-full bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-[13px] text-fg outline-none focus:border-accent";

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11.5px] tracking-[0.04em] uppercase text-dim font-medium">Órdenes abiertas</div>
        <button
          onClick={() => { setShowForm(v => !v); }}
          className="text-[12px] px-2.5 py-1 rounded-lg border border-line text-muted hover:bg-hover cursor-pointer"
        >
          {showForm ? "Cancelar" : "+ Nueva orden"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 rounded-xl bg-panel2 border border-line flex flex-col gap-2.5">
          <div className="flex gap-2 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-24">
              <label className="text-[11px] text-dim uppercase tracking-wide">Ticker</label>
              <input value={fTicker} onChange={e => setFTicker(e.target.value.toUpperCase())}
                placeholder={kind === "cripto" ? "BTC" : "ECOPETROL"} className={ifield} style={{ fontFamily: "'IBM Plex Mono', monospace" }} />
              {knownTickers.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-0.5">
                  {knownTickers.map(t => (
                    <button key={t} onClick={() => setFTicker(t)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${fTicker === t ? "border-accent/60 bg-accent/10 text-accent" : "border-line text-dim hover:border-accent/40 hover:text-fg"}`}
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-dim uppercase tracking-wide">Lado</label>
              <div className="flex gap-1">
                {(["buy", "sell"] as const).map(s => (
                  <button key={s} onClick={() => setFSide(s)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] border cursor-pointer ${fSide === s ? (s === "buy" ? "border-pos/60 bg-pos/10 text-pos" : "border-neg/60 bg-neg/10 text-neg") : "border-line text-muted hover:bg-hover"}`}>
                    {s === "buy" ? "Compra" : "Venta"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-24">
              <label className="text-[11px] text-dim uppercase tracking-wide">Cantidad</label>
              <input value={fQty} onChange={e => setFQty(e.target.value)} placeholder="0.05"
                inputMode="decimal" className={ifield} style={{ fontFamily: "'IBM Plex Mono', monospace" }} />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className="text-[11px] text-dim uppercase tracking-wide">
                Precio límite {kind === "cripto" ? "(USD)" : "(COP)"}
              </label>
              <input value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="60000"
                inputMode="decimal" className={ifield} style={{ fontFamily: "'IBM Plex Mono', monospace" }} />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-28">
              <label className="text-[11px] text-dim uppercase tracking-wide">Broker (opcional)</label>
              <input value={fBroker} onChange={e => setFBroker(e.target.value)} placeholder="Bitso, Binance…" className={ifield} />
            </div>
          </div>
          {parseQty(fQty) > 0 && parseNum(fPrice) > 0 && (
            <div className="text-[12px] text-dim">
              Total: {kind === "cripto" ? `${USD(parseQty(fQty) * parseNum(fPrice))}` : `${COP(parseQty(fQty) * parseNum(fPrice))}`}
              {kind === "cripto" && trm ? ` ≈ ${COP(parseQty(fQty) * parseNum(fPrice) * trm)}` : ""}
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-fg text-bg text-[13px] font-medium cursor-pointer disabled:opacity-50 hover:opacity-90">
              {saving ? "Guardando…" : "Registrar orden"}
            </button>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <table className="w-full">
          <thead>
            <tr>
              <th className={oth}>Ticker</th>
              <th className={oth}>Lado</th>
              <th className={`${oth} text-right`}>Qty</th>
              <th className={`${oth} text-right`}>{priceLbl}</th>
              <th className={`${oth} text-right`}>{amtLabel}</th>
              <th className={oth}>Fecha</th>
              <th className={oth}>Estado</th>
              <th className={oth}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td className={otd}><span className="font-semibold text-primary">{o.ticker}</span></td>
                <td className={otd}><span className={o.side === "buy" ? "text-pos" : "text-neg"}>{o.side === "buy" ? "Compra" : "Venta"}</span></td>
                <td className={`${otd} text-right`} style={monoStyle}>{o.qty}</td>
                <td className={`${otd} text-right`} style={monoStyle}>{o.limitPrice != null ? fmtAmt(o.limitPrice) : "—"}</td>
                <td className={`${otd} text-right`} style={monoStyle}>{o.totalUSD != null ? fmtAmt(o.totalUSD) : "—"}</td>
                <td className={`${otd} text-dim`}>{o.date}</td>
                <td className={otd}>{statusBadge(o.status)}</td>
                <td className={`${otd} text-right`}>
                  <div className="flex items-center justify-end gap-1">
                    {o.status === "open" && (
                      <>
                        <button disabled={loading === o.id} onClick={() => handleStatus(o.id, "filled")}
                          className="text-[11px] px-2 py-0.5 rounded border border-pos/40 text-pos hover:bg-pos/10 cursor-pointer">
                          Ejecutar
                        </button>
                        <button disabled={loading === o.id} onClick={() => handleStatus(o.id, "cancelled")}
                          className="text-[11px] px-2 py-0.5 rounded border border-line text-muted hover:bg-panel2 cursor-pointer">
                          Cancelar
                        </button>
                      </>
                    )}
                    <button disabled={loading === o.id} onClick={() => handleDelete(o.id)}
                      className="text-neg hover:opacity-70 cursor-pointer p-1">
                      <IconTrash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function EmptyPortfolio({ kind, onAdd }: { kind: "inversiones" | "cripto"; onAdd?: () => void }) {
  const isStock = kind === "inversiones";
  return (
    <div className={`${cardClass} py-12 flex flex-col items-center text-center`}>
      <div className="text-4xl mb-3">{isStock ? "📈" : "₿"}</div>
      <div className="text-[15px] font-medium mb-1">Sin posiciones registradas</div>
      <div className="text-[13px] text-muted max-w-xs mb-5">
        {isStock
          ? "Registrá tu primera compra de acciones (BVC, ETF) para ver tu portafolio aquí."
          : "Registrá tu primera compra de cripto para ver tu portafolio aquí."}
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="h-9 px-5 bg-accent text-accentFg rounded-[10px] text-[13px] font-medium border-none cursor-pointer"
        >
          {isStock ? "+ Agregar inversión" : "+ Agregar cripto"}
        </button>
      )}
    </div>
  );
}

function AssetTable({
  assets,
  privacy,
  onSelect,
  onAdd,
  currency = "COP",
  trm,
  kind = "inversiones",
}: {
  assets: Asset[];
  privacy: boolean;
  onSelect: (t: string) => void;
  onAdd?: () => void;
  currency?: "COP" | "USD";
  trm?: number | null;
  kind?: "inversiones" | "cripto";
}) {
  const inUSD = currency === "USD" && !!trm;
  const fmt = (copValue: number) => (inUSD ? USD(copValue / trm!) : COP(copValue));

  if (assets.length === 0) {
    return <EmptyPortfolio kind={kind} onAdd={onAdd} />;
  }
  return (
    <div className={cardClass}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-140">
          <thead>
            <tr>
              <th className={thClass}>Activo</th>
              <th className={`${thClass} text-right`}>Cantidad</th>
              <th className={`${thClass} text-right`}>Precio Mkt</th>
              <th className={`${thClass} text-right`}>PPA</th>
              <th className={`${thClass} text-right`}>Valor</th>
              <th className={`${thClass} text-right`}>P/G</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => {
              // USD-native assets (all lots filled via limit orders): avgUSD/totalCostUSD
              // hold the real historical USD cost, enabling TRM-stripped P/G in USD mode.
              const isUSDAsset = a.avgUSD != null && a.totalCostUSD != null && !!trm;
              const mktPriceUSD = inUSD ? a.price / (trm ?? 1) : 0;
              const value    = a.qty * a.price;
              const valueUSD = a.qty * (a.price / (trm ?? 1));
              const cost     = a.totalCost;
              const costUSD  = a.totalCostUSD ?? (trm ? cost / trm : 0);
              // COP mode: always compare in COP (value vs historical COP cost) so that
              // individual row P/G sums correctly to the header total.
              // USD mode: USD assets compare in USD (strips TRM effects); others use COP/trm.
              const pl     = inUSD ? (valueUSD - costUSD) : (value - cost);
              const plBase = inUSD ? costUSD : cost;
              const plPct  = plBase > 0 ? pl / plBase : 0;
              const pos    = pl >= 0;
              // PPA: COP mode → historical COP average (what was actually paid).
              // USD mode → actual USD purchase price for USD assets, else COP avg / trm.
              const ppaDisplay = (isUSDAsset && inUSD)
                ? USD(a.avgUSD!)
                : (privacy ? "••••" : fmt(a.avg));
              return (
                <tr key={a.ticker} onClick={() => onSelect(a.ticker)} className="cursor-pointer">
                  <td className={tdClass}>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7.5 h-7.5 rounded-lg bg-panel2 border border-line flex items-center justify-center text-[11px] text-muted"
                        style={monoStyle}
                      >
                        {a.mono}
                      </span>
                      <div>
                        <div className="text-[13px]" style={monoStyle}>{a.ticker}</div>
                        <div className="text-[11.5px] text-dim">{a.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                    {a.qty % 1 === 0 ? a.qty.toLocaleString("es-CO") : a.qty.toFixed(4)}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                    {privacy ? "••••" : inUSD ? USD(mktPriceUSD) : COP(a.price)}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums text-muted`} style={monoStyle}>
                    {privacy ? "••••" : ppaDisplay}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                    {inUSD ? (privacy ? "••••" : USD(valueUSD)) : <Bal n={value} privacy={privacy} />}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums ${pos ? "text-pos" : "text-neg"}`} style={monoStyle}>
                    <div>{PCT(plPct)}</div>
                    <div className="text-[12px] opacity-80">
                      {privacy ? "••••" : `${pos ? "+" : "−"}${inUSD ? USD(Math.abs(pl)) : fmt(Math.abs(pl))}`}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesHistoryTable({
  transfers,
  prefix,
  privacy,
  currency = "COP",
  trm,
}: {
  transfers: Transfer[];
  prefix: "stock:" | "crypto:";
  privacy: boolean;
  currency?: "COP" | "USD";
  trm?: number | null;
}) {
  const inUSD = currency === "USD" && !!trm;
  const fmt = (cop: number) => inUSD ? USD(cop / trm!) : COP(cop);
  const sales = transfers.filter(t => t.fromAccountId.startsWith(prefix));

  if (sales.length === 0) {
    return (
      <div className={`${cardClass} text-muted text-[13px]`}>
        Aún no has registrado ninguna venta.
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-160">
          <thead>
            <tr>
              <th className={thClass}>Fecha</th>
              <th className={`${thClass} pl-6`}>Activo</th>
              <th className={`${thClass} pl-6 text-right`}>Cantidad</th>
              <th className={`${thClass} pl-6 text-right`}>Precio total</th>
              <th className={`${thClass} pl-6 text-right`}>Comisión</th>
              <th className={`${thClass} pl-6 text-right`}>P/G</th>
              <th className={`${thClass} pl-6`}>Cuenta</th>
              <th className={`${thClass} pl-6`}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((t) => {
              const ticker = t.fromAccountId.slice(prefix.length);
              const commission = t.commission ?? 0;
              const gross = t.amount + commission;
              const pl = t.amount - (t.costBasis ?? 0);
              const pos = pl >= 0;
              return (
                <tr key={t.id}>
                  <td className={`${tdClass} text-muted whitespace-nowrap`} style={monoStyle}>{t.date}</td>
                  <td className={`${tdClass} pl-6`} style={monoStyle}>{ticker}</td>
                  <td className={`${tdClass} pl-6 text-right tabular-nums`} style={monoStyle}>
                    {t.qty == null ? "—" : t.qty % 1 === 0 ? t.qty.toLocaleString("es-CO") : t.qty.toFixed(8)}
                  </td>
                  <td className={`${tdClass} pl-6 text-right tabular-nums`} style={monoStyle}>
                    {privacy ? "••••" : fmt(gross)}
                  </td>
                  <td className={`${tdClass} pl-6 text-right tabular-nums text-muted`} style={monoStyle}>
                    {privacy ? "••" : fmt(commission)}
                  </td>
                  <td className={`${tdClass} pl-6 text-right tabular-nums ${pos ? "text-pos" : "text-neg"}`} style={monoStyle}>
                    {privacy ? "••••" : `${pos ? "+" : ""}${fmt(pl)}`}
                  </td>
                  <td className={`${tdClass} pl-6 text-muted`}>{t.toAccountName ?? "—"}</td>
                  <td className={`${tdClass} pl-6 text-muted text-[12.5px] max-w-40 truncate`} title={t.detail ?? undefined}>
                    {t.detail ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RebalanceoView({ assets, privacy, currency = "COP", trm }: { assets: Asset[]; privacy: boolean; currency?: "COP" | "USD"; trm?: number | null }) {
  const inUSD = currency === "USD" && !!trm;
  const fmt = (cop: number) => inUSD ? USD(cop / trm!) : COP(cop);
  const [targets, setTargets] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("gfp-rebalance") ?? "{}"); } catch { return {}; }
  });
  const savedRef = useRef(targets);

  const saveTarget = (ticker: string, val: string) => {
    const next = { ...savedRef.current, [ticker]: val };
    savedRef.current = next;
    setTargets(next);
    try { localStorage.setItem("gfp-rebalance", JSON.stringify(next)); } catch {}
  };

  const totalValue = assets.reduce((s, a) => s + a.qty * a.price, 0);
  const totalTargetPct = assets.reduce((s, a) => s + (parseFloat(targets[a.ticker] ?? "0") || 0), 0);
  const unallocated = Math.max(0, 100 - totalTargetPct);

  const rows = useMemo(() => assets.map((a) => {
    const currentPct = totalValue > 0 ? (a.qty * a.price) / totalValue * 100 : 0;
    const targetPct = parseFloat(targets[a.ticker] ?? "0") || 0;
    const diffPct = targetPct - currentPct;
    const targetValue = totalValue * targetPct / 100;
    const currentValue = a.qty * a.price;
    const diffValue = targetValue - currentValue;
    const action: "buy" | "sell" | "hold" = Math.abs(diffValue) < totalValue * 0.005
      ? "hold"
      : diffValue > 0 ? "buy" : "sell";
    return { ...a, currentPct, targetPct, diffPct, diffValue, action };
  }), [assets, targets, totalValue]);

  if (assets.length === 0) return null;

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13.5px] font-medium">Asignación objetivo</div>
        <div className={`text-[12px] ${Math.abs(totalTargetPct - 100) < 0.5 ? "text-pos" : "text-muted"}`}>
          {totalTargetPct.toFixed(1)}% asignado · {unallocated.toFixed(1)}% libre
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-120">
          <thead>
            <tr>
              <th className={thClass}>Activo</th>
              <th className={`${thClass} text-right`}>Actual</th>
              <th className={`${thClass} text-right`}>Objetivo %</th>
              <th className={`${thClass} text-right`}>Diferencia</th>
              <th className={`${thClass} text-right`}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker}>
                <td className={tdClass}>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-panel2 border border-line flex items-center justify-center text-[11px] text-muted" style={monoStyle}>
                      {row.mono}
                    </span>
                    <span className="text-[13px]" style={monoStyle}>{row.ticker}</span>
                  </div>
                </td>
                <td className={`${tdClass} text-right text-muted`} style={monoStyle}>
                  <div>{row.currentPct.toFixed(1)}%</div>
                  <div className="text-[11.5px]">{privacy ? "••••" : fmt(row.qty * row.price)}</div>
                </td>
                <td className={`${tdClass} text-right`}>
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={targets[row.ticker] ?? ""}
                      onChange={(e) => saveTarget(row.ticker, e.target.value)}
                      placeholder="0"
                      className="w-16 text-right text-[13px] border border-line rounded-lg px-2 py-1 bg-panel2 text-fg outline-none focus:border-accent tabular-nums"
                      style={monoStyle}
                    />
                    <span className="text-muted text-[13px]">%</span>
                  </div>
                </td>
                <td className={`${tdClass} text-right tabular-nums ${row.diffPct > 0 ? "text-pos" : row.diffPct < 0 ? "text-neg" : "text-muted"}`} style={monoStyle}>
                  {row.targetPct > 0 ? (
                    <>
                      <div>{row.diffPct >= 0 ? "+" : ""}{row.diffPct.toFixed(1)}%</div>
                      <div className="text-[11.5px]">
                        {privacy ? "••••" : `${row.diffValue >= 0 ? "+" : ""}${fmt(row.diffValue)}`}
                      </div>
                    </>
                  ) : <span className="text-dim">—</span>}
                </td>
                <td className={`${tdClass} text-right`}>
                  {row.targetPct > 0 && row.action !== "hold" ? (
                    <span className={`text-[11.5px] px-2 py-0.5 rounded-full font-medium ${row.action === "buy" ? "bg-pos/20 text-pos" : "bg-neg/20 text-neg"}`}>
                      {row.action === "buy" ? "Comprar" : "Vender"}
                    </span>
                  ) : row.targetPct > 0 ? (
                    <span className="text-[11.5px] px-2 py-0.5 rounded-full font-medium bg-accent/15 text-accent">OK</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalTargetPct > 100.5 && (
        <div className="mt-3 text-[12px] text-neg">⚠ Los porcentajes suman {totalTargetPct.toFixed(1)}% — superan el 100%.</div>
      )}
      <div className="mt-3 text-[12px] text-dim">
        Los objetivos se guardan en este navegador. La diferencia se calcula sobre el valor total actual del portafolio.
      </div>
    </div>
  );
}

export function ViewInversiones({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const currency = useCurrency();
  const router = useRouter();
  const trm = initialData.config?.trm ?? null;
  const inUSD = currency === "USD" && !!trm;
  const fmt = (cop: number) => inUSD ? USD(cop / trm!) : COP(cop);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"Actuales" | "Histórico" | "Rebalanceo">("Actuales");
  const [showCambio, setShowCambio] = useState(false);

  // Exchange filter
  const exchanges = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of initialData.stocks) {
      set.add(s.exchange ?? (s.currency === "USD" ? "NYSE/NASDAQ" : "BVC"));
    }
    return Array.from(set).sort();
  }, [initialData.stocks]);
  const [exchangeFilter, setExchangeFilter] = useState<string>("Todas");

  const filteredStocks = React.useMemo(() => {
    if (exchangeFilter === "Todas") return initialData.stocks;
    return initialData.stocks.filter(s => {
      const ex = s.exchange ?? (s.currency === "USD" ? "NYSE/NASDAQ" : "BVC");
      return ex === exchangeFilter;
    });
  }, [initialData.stocks, exchangeFilter]);

  const assets = toAssets(filteredStocks, initialData.prices);
  const onSelect = (t: string) => router.push(`/detail/${t}`);
  const totalValue = assets.reduce((s, a) => s + a.qty * a.price, 0);
  const totalCost  = assets.reduce((s, a) => s + a.totalCost, 0);
  const totalPL    = totalValue - totalCost;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const copTickers = [...new Set(initialData.stocks.filter(s => s.currency !== "USD").map(s => s.ticker.toUpperCase()))];
      const usdTickers = [...new Set(initialData.stocks.filter(s => s.currency === "USD").map(s => s.ticker.toUpperCase()))];
      await refreshPrices(copTickers, [], usdTickers);
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { handleRefresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">

        <div className="grid gap-3.5 flex-1" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <SummaryCard label="Valor del portafolio" value={privacy ? "••••••" : fmt(totalValue)} />
          <SummaryCard label="Costo invertido" value={privacy ? "••••••" : fmt(totalCost)} />
          <SummaryCard
            label="Rendimiento P/G"
            value={
              <span className={totalPL >= 0 ? "text-pos" : "text-neg"}>
                {privacy ? "••••••" : `${totalPL >= 0 ? "+" : "−"}${fmt(Math.abs(totalPL))}`}
              </span>
            }
            sub={
              totalCost > 0 ? (
                <span className={totalPL >= 0 ? "text-pos" : "text-neg"}>
                  {PCT(totalPL / totalCost)}
                </span>
              ) : undefined
            }
          />
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleRefresh} disabled={refreshing} className={refreshBtnClass}>
              {refreshing ? "Actualizando…" : "Actualizar precios"}
            </button>
            {exchanges.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {(["Todas", ...exchanges] as string[]).map(ex => (
                  <button
                    key={ex}
                    onClick={() => setExchangeFilter(ex)}
                    className={[
                      "border cursor-pointer px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors",
                      exchangeFilter === ex
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line bg-panel2 text-muted hover:bg-hover",
                    ].join(" ")}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Segmented options={["Actuales", "Histórico", "Rebalanceo"]} value={tab} onChange={(v) => setTab(v as "Actuales" | "Histórico" | "Rebalanceo")} />
        </div>
      {inUSD && <div className="text-[12px] text-dim -mt-1">TRM: {COP(trm!)}</div>}
      {tab === "Actuales" ? (
        <AssetTable assets={assets} privacy={privacy} onSelect={onSelect} kind="inversiones" currency={currency} trm={trm} />
      ) : tab === "Histórico" ? (
        <SalesHistoryTable transfers={initialData.transfers} prefix="stock:" privacy={privacy} currency={currency} trm={trm} />
      ) : (
        <RebalanceoView assets={assets} privacy={privacy} currency={currency} trm={trm} />
      )}
      <OpenOrdersTable orders={initialData.openOrders} kind="stock" onRefresh={handleRefresh} prices={initialData.prices} trm={trm} currency={currency} knownTickers={assets.map(a => a.ticker)} />

      {/* Cambio de moneda shortcut */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCambio(true)}
          className="text-[12px] text-muted border border-line bg-panel2 px-3 py-1.5 rounded-lg hover:bg-hover cursor-pointer"
        >
          Registrar cambio de moneda (COP → USD)
        </button>
      </div>

      {showCambio && (
        <ModalCambio
          bankAccounts={initialData.bankAccounts}
          trm={trm}
          onClose={() => setShowCambio(false)}
        />
      )}
    </div>
  );
}

export function ViewCripto({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const toast = useToast();
  const assets = toAssets(initialData.crypto, initialData.prices);
  const onSelect = (t: string) => router.push(`/detail/${t}`);
  const currency = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const [trm, setTrm] = useState<number | null>(initialData.config?.trm ?? null);
  const [tab, setTab] = useState<"Actuales" | "Histórico">("Actuales");
  const [pricesFresh, setPricesFresh] = useState(false);
  const inUSD = currency === "USD" && !!trm;
  const fmt = (copValue: number) => (inUSD ? USD(copValue / trm!) : COP(copValue));

  // USD-native totals: use avgUSD/totalCostUSD when available to avoid TRM-drift
  const totalValueUSD = inUSD ? assets.reduce((s, a) => s + a.qty * a.price / trm!, 0) : 0;
  const totalCostUSD  = inUSD ? assets.reduce((s, a) => s + (a.totalCostUSD ?? a.totalCost / trm!), 0) : 0;
  const totalPLUSD    = totalValueUSD - totalCostUSD;
  // COP totals for COP mode
  const totalValue = assets.reduce((s, a) => s + a.qty * a.price, 0);
  const totalCost  = assets.reduce((s, a) => s + a.totalCost, 0);
  const totalPL    = totalValue - totalCost;

  const handleRefresh = async () => {
    setRefreshing(true);
    setPricesFresh(false);
    try {
      const tickers = [...new Set(initialData.crypto.map(c => c.ticker.toUpperCase()))];
      // Refresh prices and TRM simultaneously
      const [, freshTrm] = await Promise.all([
        refreshPrices([], tickers),
        refreshTrm().catch(() => null),
      ]);
      if (freshTrm) setTrm(freshTrm);
      router.refresh();
      setPricesFresh(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { handleRefresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="grid gap-3.5 flex-1" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <SummaryCard label="Valor en cripto" value={inUSD ? (privacy ? "••••" : USD(totalValueUSD)) : <Bal n={totalValue} privacy={privacy} />} />
          <SummaryCard label="Costo invertido" value={inUSD ? (privacy ? "••••" : USD(totalCostUSD)) : <Bal n={totalCost} privacy={privacy} />} />
          <SummaryCard
            label="Rendimiento P/G"
            value={
              <span className={(inUSD ? totalPLUSD : totalPL) >= 0 ? "text-pos" : "text-neg"}>
                {inUSD ? (privacy ? "••••" : USD(Math.abs(totalPLUSD))) : <Bal n={Math.abs(totalPL)} privacy={privacy} />}
              </span>
            }
            sub={
              (inUSD ? totalCostUSD : totalCost) > 0 ? (
                <span className={(inUSD ? totalPLUSD : totalPL) >= 0 ? "text-pos" : "text-neg"}>
                  {PCT((inUSD ? totalPLUSD : totalPL) / (inUSD ? totalCostUSD : totalCost))}
                </span>
              ) : undefined
            }
          />
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <button onClick={handleRefresh} disabled={refreshing} className={refreshBtnClass}>
              {refreshing ? "Actualizando…" : "Actualizar precios"}
            </button>
            {tab === "Actuales" && inUSD && <span className="text-dim text-[12px]">TRM: {COP(trm!)}</span>}
          </div>
          <Segmented options={["Actuales", "Histórico"]} value={tab} onChange={(v) => setTab(v as "Actuales" | "Histórico")} />
      </div>
      {tab === "Actuales" ? (
        <AssetTable assets={assets} privacy={privacy} onSelect={onSelect} currency={currency} trm={trm} />
      ) : (
        <SalesHistoryTable transfers={initialData.transfers} prefix="crypto:" privacy={privacy} currency={currency} trm={trm} />
      )}
      <OpenOrdersTable orders={initialData.openOrders} kind="cripto" onRefresh={handleRefresh} prices={initialData.prices} trm={trm} currency={currency} pricesFresh={pricesFresh} knownTickers={assets.map(a => a.ticker)} />
    </div>
  );
}

export function ViewDetalle({ initialData, ticker }: { initialData: AllData; ticker: string }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const holdings = toAssets(initialData.stocks, initialData.prices);
  const cryptoAssets = toAssets(initialData.crypto, initialData.prices);
  const selected = ticker.toUpperCase();
  const isCrypto = cryptoAssets.some((a) => a.ticker === selected);
  const selFrom: "inversiones" | "cripto" = isCrypto ? "cripto" : "inversiones";
  const onBack = () => router.push(isCrypto ? "/crypto" : "/investments");
  const asset = [...holdings, ...cryptoAssets].find((a) => a.ticker === selected);

  const rawTrades = useMemo(
    () => isCrypto
      ? initialData.crypto.filter(t => t.ticker.toUpperCase() === selected)
      : initialData.stocks.filter(t => t.ticker.toUpperCase() === selected),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCrypto, initialData.crypto, initialData.stocks, selected]
  );

  const currency = useCurrency();
  const [editItem, setEditItem] = useState<Stock | Crypto | null>(null);
  const [sellItem, setSellItem] = useState<Asset | null>(null);
  const [buyMore, setBuyMore] = useState(false);
  const [trm, setTrm] = useState<number | null>(initialData.config?.trm ?? null);
  const [tab, setTab] = useState<"Resumen" | "Técnico">("Resumen");
  const [dividendModal, setDividendModal] = useState<{ prefill?: DividendT } | null>(null);
  const toast = useToast();

  // Optimistic local state: remove lot immediately, revert on server error
  const [localTrades, setLocalTrades] = useState(rawTrades);
  const [localDividends, setLocalDividends] = useState(
    initialData.dividends.filter(d => d.ticker.toUpperCase() === selected)
  );

  // Sync local state when initial data changes (e.g. after router.refresh())
  useEffect(() => { setLocalTrades(rawTrades); }, [rawTrades]);
  useEffect(() => {
    setLocalDividends(initialData.dividends.filter(d => d.ticker.toUpperCase() === selected));
  }, [initialData.dividends, selected]);

  const firstPurchaseDate = localTrades.length > 0
    ? localTrades.reduce((min, t) => (t.date < min ? t.date : min), localTrades[0].date)
    : undefined;
  const totalDividends = localDividends.reduce((s, d) => s + d.amount, 0);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta operación?")) return;
    const prev = localTrades;
    setLocalTrades(t => t.filter(r => r.id !== id));
    try {
      if (isCrypto) await deleteCrypto(id);
      else await deleteStock(id);
      router.refresh();
    } catch {
      setLocalTrades(prev);
      toast.error("Error al eliminar la operación");
    }
  };

  const handleDeleteDividend = async (id: string) => {
    if (!window.confirm("¿Eliminar este dividendo?")) return;
    const prev = localDividends;
    setLocalDividends(d => d.filter(r => r.id !== id));
    try {
      await deleteDividend(id);
      router.refresh();
    } catch {
      setLocalDividends(prev);
      toast.error("Error al eliminar el dividendo");
    }
  };

  useEffect(() => {
    if (!isCrypto) return;
    refreshTrm().then(setTrm).catch(() => {});
  }, [isCrypto]);

  const inUSD = currency === "USD" && !!trm;
  const fmtLot = (cop: number) => inUSD ? USD(cop / trm!) : COP(cop);

  // Split the COP return into "asset move (USD)" vs "FX move (TRM)" — only
  // meaningful for crypto, whose lots carry the real historical TRM at purchase.
  const cryptoTrades = localTrades as Crypto[];
  // USD-native cost: use same detection logic as transforms.ts — only include lots
  // where a real USD price exists (price !== priceCOP OR trm > 100).
  // Lots entered manually (price = priceCOP, trm = 1) are COP-native with no USD data.
  const allLotsHaveUSD = isCrypto && cryptoTrades.length > 0 && cryptoTrades.every(t => {
    return t.price !== t.priceCOP || t.trm > 100;
  });
  const costUSD = isCrypto ? cryptoTrades.reduce((s, t) => {
    const hasRealUSD = t.price !== t.priceCOP;
    const realTRM = t.trm > 100 ? t.trm : null;
    const usdPrice = hasRealUSD ? t.price : (realTRM ? t.priceCOP / realTRM : null);
    return usdPrice != null ? s + t.qty * usdPrice : s;
  }, 0) : 0;
  const costCOP = isCrypto ? cryptoTrades.reduce((s, t) => s + t.qty * t.priceCOP, 0) : 0;
  const avgTrm = isCrypto && allLotsHaveUSD && costUSD > 0 ? costCOP / costUSD : null;
  const avgPriceUSD = isCrypto && asset && allLotsHaveUSD && costUSD > 0 ? costUSD / asset.qty : null;
  const priceNowUSD = isCrypto && trm && asset ? asset.price / trm : null;
  const hasFxBreakdown = isCrypto && allLotsHaveUSD && !!avgTrm && !!avgPriceUSD && !!priceNowUSD && !!trm;
  const assetReturn = hasFxBreakdown ? priceNowUSD! / avgPriceUSD! - 1 : null;
  const fxReturn = hasFxBreakdown ? trm! / avgTrm! - 1 : null;

  // P/G: COP mode always uses historical COP cost for consistency.
  // USD mode uses real USD cost only when all lots have USD price data.
  const valueUSDDet = asset && trm ? asset.qty * (asset.price / trm) : 0;
  const plUSD = allLotsHaveUSD && costUSD > 0 ? valueUSDDet - costUSD
              : asset && trm ? (asset.qty * asset.price - asset.totalCost) / trm : 0;
  const pl = inUSD ? plUSD * trm! : (asset ? asset.qty * asset.price - asset.totalCost : 0);
  const plBase = inUSD ? (allLotsHaveUSD && costUSD > 0 ? costUSD : (asset ? asset.totalCost / trm! : 1))
               : (asset?.totalCost ?? 1);
  const plPct = plBase > 0 ? pl / (inUSD ? plBase * trm! : plBase) : 0;

  return (
    <div>
      <button
        onClick={onBack}
        className="bg-transparent border-none text-muted cursor-pointer text-[13px] mb-3.5"
      >
        ← Volver a {selFrom === "inversiones" ? "Inversiones" : "Cripto"}
      </button>
      {asset ? (
        <div className="flex flex-col gap-3.5">
          {/* Header */}
          <div className={`${cardClass} flex items-center justify-between flex-wrap gap-4`}>
            <div className="flex items-center gap-3.5">
              <span
                className="w-10.5 h-10.5 rounded-[11px] bg-panel2 border border-line flex items-center justify-center text-[14px] text-muted"
                style={monoStyle}
              >
                {asset.mono}
              </span>
              <div>
                <div className="text-[15px] font-medium" style={monoStyle}>{asset.ticker}</div>
                <div className="text-muted text-[13px]">{asset.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBuyMore(true)}
                className="border border-line bg-panel2 text-fg text-[12px] px-3 py-1.5 rounded-lg cursor-pointer hover:border-accent"
              >
                Comprar
              </button>
              {localTrades.length > 0 && (
                <button
                  onClick={() => setSellItem(asset)}
                  className="border border-line bg-panel2 text-fg text-[12px] px-3 py-1.5 rounded-lg cursor-pointer hover:border-accent"
                >
                  Vender
                </button>
              )}
            <div className="text-right">
              <div className="text-[28px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
                {privacy ? "••••••" : (inUSD ? USD(asset.price / trm!) : COP(asset.price))}
              </div>
              <div className={`text-[13px] ${asset.dayPct >= 0 ? "text-pos" : "text-neg"}`}>
                {PCT(asset.dayPct)} hoy
              </div>
              {inUSD && <div className="text-[11px] text-dim">TRM: {COP(trm!)}</div>}
            </div>
            </div>
          </div>

          {/* Tabs */}
          <Segmented options={["Resumen", "Técnico"]} value={tab} onChange={(v) => setTab(v as any)} />

          {tab === "Resumen" && (
            <>
              {/* Stats grid */}
              <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                <SummaryCard label="Cantidad" value={<>{asset.qty % 1 === 0 ? asset.qty.toLocaleString("es-CO") : asset.qty.toFixed(4)}</>} />
                <SummaryCard label="Precio actual"
                  value={privacy ? "••••" : (inUSD ? USD(asset.price / trm!) : <Bal n={asset.price} privacy={privacy} />)} />
                <SummaryCard label="Costo promedio"
                  value={privacy ? "••••" : (inUSD
                    ? USD(asset.avgUSD ?? asset.avg / trm!)
                    : <Bal n={asset.avg} privacy={privacy} />)} />
                <SummaryCard label="Total invertido"
                  value={privacy ? "••••" : (inUSD
                    ? USD(asset.totalCostUSD ?? asset.totalCost / trm!)
                    : <Bal n={asset.totalCost} privacy={privacy} />)} />
                <SummaryCard label="Valor mercado"
                  value={privacy ? "••••" : (inUSD
                    ? USD(asset.qty * asset.price / trm!)
                    : <Bal n={asset.qty * asset.price} privacy={privacy} />)} />
                <SummaryCard
                  label="P/G no realizada"
                  value={
                    <span className={(inUSD ? plUSD : pl) >= 0 ? "text-pos" : "text-neg"}>
                      {privacy ? "••••" : (inUSD ? USD(Math.abs(plUSD)) : <Bal n={Math.abs(pl)} privacy={privacy} />)}
                    </span>
                  }
                  sub={<span className={plPct >= 0 ? "text-pos" : "text-neg"}>{PCT(plPct)}</span>}
                />
              </div>

              {hasFxBreakdown && (
                <div className={cardClass}>
                  <div className="text-[13px] font-medium mb-2">Desglose del rendimiento (USD)</div>
                  <div className="text-[12px] text-dim mb-3.5">
                    Tu P/G en pesos mezcla el movimiento de {asset.ticker} en dólares y el movimiento del tipo de cambio (TRM) desde tus compras.
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted">Por movimiento de {asset.ticker} (USD)</span>
                      <span className={`text-[13px] font-medium ${assetReturn! >= 0 ? "text-pos" : "text-neg"}`}>{PCT(assetReturn!)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted">Por tipo de cambio (TRM)</span>
                      <span className={`text-[13px] font-medium ${fxReturn! >= 0 ? "text-pos" : "text-neg"}`}>{PCT(fxReturn!)}</span>
                    </div>
                  </div>
                  <div className="text-[11.5px] text-dim mt-3 pt-3 border-t border-line">
                    TRM promedio de compra: {COP(avgTrm!)} · TRM actual: {COP(trm!)}
                  </div>
                </div>
              )}

              {/* Trade history */}
              <div className={cardClass}>
                <div className="text-[13px] font-medium mb-3.5">Historial de operaciones</div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-120">
                    <thead>
                      <tr>
                        <th className={thClass}>Fecha</th>
                        <th className={`${thClass} text-right`}>Cantidad</th>
                        <th className={`${thClass} text-right`}>Precio {inUSD ? "USD" : "COP"}</th>
                        <th className={`${thClass} text-right`}>Comisión</th>
                        <th className={thClass}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {localTrades.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`${tdClass} text-dim text-center`}>Sin operaciones</td>
                        </tr>
                      ) : localTrades.map((t) => (
                        <tr key={t.id}>
                          <td className={`${tdClass} text-muted whitespace-nowrap`} style={monoStyle}>{t.date}</td>
                          <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                            {t.qty % 1 === 0 ? t.qty.toLocaleString("es-CO") : t.qty.toFixed(8)}
                          </td>
                          <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                            {privacy ? "••••" : (() => {
                              if (!inUSD) return COP(t.priceCOP);
                              if (isCrypto && t.price !== t.priceCOP) return USD(t.price);
                              const lotTrm = (t as Crypto).trm > 0 ? (t as Crypto).trm : trm!;
                              return USD(t.priceCOP / lotTrm);
                            })()}
                          </td>
                          <td className={`${tdClass} text-right tabular-nums text-muted`} style={monoStyle}>
                            {privacy ? "••" : fmtLot(t.commission ?? 0)}
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setEditItem(t)} className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-fg" title="Editar">
                                <IconEdit />
                              </button>
                              <button onClick={() => handleDelete(t.id)} className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-neg" title="Eliminar">
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dividends */}
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="text-[13px] font-medium">
                    Dividendos{localDividends.length > 0 && <span className="text-dim font-normal"> · {fmtLot(totalDividends)} recibidos</span>}
                  </div>
                  <button
                    onClick={() => setDividendModal({})}
                    className="border border-line bg-panel2 text-fg text-[12px] px-3 py-1.5 rounded-lg cursor-pointer hover:border-accent"
                  >
                    + Registrar dividendo
                  </button>
                </div>
                {localDividends.length === 0 ? (
                  <div className={`${tdClass} text-dim text-center border-t-0`}>Sin dividendos registrados</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-100">
                      <thead>
                        <tr>
                          <th className={thClass}>Fecha</th>
                          <th className={`${thClass} text-right`}>Monto</th>
                          <th className={thClass}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {localDividends.map((d) => (
                          <tr key={d.id}>
                            <td className={`${tdClass} text-muted whitespace-nowrap`} style={monoStyle}>
                              {d.date}{d.note ? <span className="text-dim"> · {d.note}</span> : ""}
                            </td>
                            <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                              {privacy ? "••••" : fmtLot(d.amount)}
                            </td>
                            <td className={`${tdClass} text-right`}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setDividendModal({ prefill: d })}
                                  className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-fg text-[11px]"
                                  title="Re-registrar (duplicar como nuevo pago)"
                                >
                                  Repetir
                                </button>
                                <button onClick={() => handleDeleteDividend(d.id)} className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-neg" title="Eliminar">
                                  <IconTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "Técnico" && (
            <div className={cardClass}>
              <AssetTechnical
                ticker={asset.ticker}
                kind={isCrypto ? "crypto" : "stock"}
                purchaseDate={firstPurchaseDate}
                emaConfig={initialData.config?.chartEmaConfig}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={`${cardClass} text-muted`}>Activo no encontrado.</div>
      )}

      {editItem && isCrypto && (
        <ModalCripto editItem={editItem as Crypto} onClose={() => setEditItem(null)} />
      )}
      {editItem && !isCrypto && (
        <ModalAccion editItem={editItem as Stock} onClose={() => setEditItem(null)} />
      )}
      {buyMore && !isCrypto && (
        <ModalAccion prefillTicker={selected} bankAccounts={initialData.bankAccounts} onClose={() => setBuyMore(false)} />
      )}
      {buyMore && isCrypto && (
        <ModalCripto prefillTicker={selected} bankAccounts={initialData.bankAccounts} onClose={() => setBuyMore(false)} />
      )}
      {sellItem && (
        <ModalSellInvestment
          asset={sellItem}
          kind={isCrypto ? "crypto" : "stock"}
          bankAccounts={initialData.bankAccounts}
          hasHys={!!initialData.hys}
          onClose={() => setSellItem(null)}
        />
      )}
      {dividendModal && (
        <ModalDividend
          ticker={selected}
          prefill={dividendModal.prefill}
          bankAccounts={initialData.bankAccounts}
          onClose={() => setDividendModal(null)}
        />
      )}

      <OpenOrdersTable
        orders={initialData.openOrders}
        kind={isCrypto ? "cripto" : "stock"}
        onRefresh={() => router.refresh()}
        prices={initialData.prices}
        trm={trm}
        currency={currency}
        prefillTicker={selected}
        knownTickers={[selected]}
      />
    </div>
  );
}

type SortCol = "fecha" | "categoria" | "cuenta" | "monto";
type SortDir = "asc" | "desc";

function exportXlsx(rows: ReturnType<typeof toTransactions>, from: string, to: string) {
  import("xlsx").then(({ utils, writeFile }) => {
    const totalIn  = rows.filter(t => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
    const totalOut = rows.filter(t => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
    const data = [
      ...rows.map(t => ({
        Fecha: t.dateISO,
        Tipo: t.type,
        Descripción: t.desc,
        Categoría: t.category,
        Cuenta: t.account || "",
        Monto: t.type === "ingreso" ? t.amount : -t.amount,
      })),
      {},
      { Fecha: "", Tipo: "", Descripción: "Total ingresos",  Categoría: "", Cuenta: "", Monto: totalIn },
      { Fecha: "", Tipo: "", Descripción: "Total egresos",   Categoría: "", Cuenta: "", Monto: -totalOut },
      { Fecha: "", Tipo: "", Descripción: "Balance neto",    Categoría: "", Cuenta: "", Monto: totalIn - totalOut },
    ];
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Transacciones");
    writeFile(wb, `transacciones_${from}_${to}.xlsx`);
  });
}

export function ViewTransacciones({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const toast = useToast();
  const transactions = toTransactions(initialData.finances);

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const oldestDate = transactions.length
    ? transactions.map(t => t.dateISO).sort()[0]
    : yearStart;
  // Deep-link from the command palette: /transactions?q=...
  const initialQ = useSearchParams().get("q") ?? "";
  const latestDate = transactions.length
    ? transactions.map(t => t.dateISO).sort().at(-1)!
    : today();
  const [from, setFrom]       = React.useState(initialQ ? oldestDate : yearStart);
  const [to, setTo]           = React.useState(latestDate > today() ? latestDate : today());
  const [filter, setFilter]   = React.useState<"todos" | "ingresos" | "egresos">("todos");
  const [search, setSearch]   = React.useState(initialQ);
  const [catFilter, setCatFilter] = React.useState("todas");
  const [pageSize, setPageSize]   = React.useState(20);
  const [page, setPage]           = React.useState(1);
  const [sort, setSort]           = React.useState<{ col: SortCol; dir: SortDir }>({ col: "fecha", dir: "desc" });
  const [editId, setEditId]       = React.useState<string | null>(null);
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = React.useState<ReturnType<typeof toTransactions>[number] | null>(null);

  const handleDelete = (t: ReturnType<typeof toTransactions>[number]) => {
    if (!t.financeId) return;
    const fid = t.financeId;
    setDeletedIds(prev => new Set([...prev, fid]));
    const tid = setTimeout(async () => {
      try {
        await deleteFinance(fid);
        router.refresh();
      } catch {
        setDeletedIds(prev => { const s = new Set(prev); s.delete(fid); return s; });
        toast.error("No se pudo eliminar. Intenta de nuevo.");
      }
    }, 4500);
    toast.success(`"${t.desc}" eliminado`, {
      label: "Deshacer",
      fn: () => {
        clearTimeout(tid);
        setDeletedIds(prev => { const s = new Set(prev); s.delete(fid); return s; });
      },
    });
  };

  // KPIs: date-filtered only
  const dateFiltered = transactions.filter((t) => t.dateISO >= from && t.dateISO <= to);
  const totalIncome  = dateFiltered.filter((t) => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
  const totalExpense = dateFiltered.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // All categories from the date-filtered set
  const allCats = React.useMemo(() =>
    ["todas", ...Array.from(new Set(dateFiltered.map(t => t.category))).sort()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to, transactions.length]
  );

  // Full filter pipeline
  const q = search.trim().toLowerCase();
  const filtered = dateFiltered.filter((t) => {
    if (t.financeId && deletedIds.has(t.financeId)) return false;
    if (filter === "ingresos" && t.type !== "ingreso") return false;
    if (filter === "egresos"  && t.type !== "egreso")  return false;
    if (catFilter !== "todas" && t.category !== catFilter) return false;
    if (q) {
      const amtStr = String(t.amount);
      return t.desc.toLowerCase().includes(q) ||
             t.category.toLowerCase().includes(q) ||
             amtStr.includes(q);
    }
    return true;
  });

  const toggleSort = (col: SortCol) => {
    setPage(1);
    setSort((prev) => ({ col, dir: prev.col === col && prev.dir === "asc" ? "desc" : "asc" }));
  };

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort.col === "fecha")     cmp = a.dateISO.localeCompare(b.dateISO);
    if (sort.col === "categoria") cmp = a.category.localeCompare(b.category);
    if (sort.col === "cuenta")    cmp = a.account.localeCompare(b.account);
    if (sort.col === "monto")     cmp = a.amount - b.amount;
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paged      = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const SortBtn = ({ col, label, right }: { col: SortCol; label: string; right?: boolean }) => (
    <th className={`${thClass} cursor-pointer select-none${right ? " text-right" : ""}`} onClick={() => toggleSort(col)}>
      {label} <span className="text-dim">{sort.col === col ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );

  const inputCls = "h-[34px] px-2 rounded-lg border border-line bg-panel2 text-fg text-[12.5px] outline-none";

  return (
    <div className="flex flex-col gap-3.5">
      {/* Filters row */}
      <div className="flex items-end gap-3 flex-wrap">
        {/* Dates always stay side-by-side as a unit */}
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium">Desde</span>
              {from !== oldestDate && (
                <button
                  onClick={() => { setFrom(oldestDate); setPage(1); }}
                  className="text-[10px] text-accent border-none bg-transparent cursor-pointer p-0 ml-2"
                >
                  Inicio
                </button>
              )}
            </div>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={inputCls} />
          </div>
          <label className="flex flex-col gap-1 text-[11px] tracking-[0.08em] uppercase text-dim font-medium">
            Hasta
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={inputCls} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-[11px] tracking-[0.08em] uppercase text-dim font-medium flex-1 min-w-40">
          Buscar
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Descripción, categoría o monto…"
            className={`${inputCls} w-full`}
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] tracking-[0.08em] uppercase text-dim font-medium">
          Categoría
          <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className={inputCls}>
            {allCats.map(c => <option key={c} value={c}>{c === "todas" ? "Todas" : c}</option>)}
          </select>
        </label>
      </div>

      {/* KPIs */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <SummaryCard
          label="Ingresos · total"
          value={<span className="text-pos"><Bal n={totalIncome} privacy={privacy} /></span>}
          sub={<span className="text-dim">{dateFiltered.filter(t => t.type === "ingreso").length} movimientos</span>}
        />
        <SummaryCard
          label="Egresos · total"
          value={<span className="text-neg"><Bal n={totalExpense} privacy={privacy} /></span>}
          sub={<span className="text-dim">{dateFiltered.filter(t => t.type === "egreso").length} movimientos</span>}
        />
        <SummaryCard
          label="Balance neto"
          value={<span className={totalBalance >= 0 ? "text-pos" : "text-neg"}><Bal n={Math.abs(totalBalance)} privacy={privacy} /></span>}
          sub={<span className="text-dim">{totalBalance >= 0 ? "Superávit" : "Déficit"}</span>}
        />
      </div>

      <div className={cardClass}>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2.5">
          <div className="flex items-center gap-3">
            <div className="text-[14px] font-medium">Movimientos</div>
            <span className="text-[12px] text-dim">{sorted.length} resultado{sorted.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {(["todos", "ingresos", "egresos"] as const).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }} className={[
                "border-none cursor-pointer px-3 py-1.25 rounded-lg text-[12px] font-medium",
                filter === f ? "bg-accent text-accentFg" : "bg-panel2 text-muted",
              ].join(" ")}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <button
              onClick={() => exportXlsx(sorted, from, to)}
              className="border border-line bg-panel2 text-muted text-[12px] px-3 py-1.25 rounded-lg cursor-pointer"
            >
              ↓ Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-120">
            <thead>
              <tr>
                <SortBtn col="fecha"     label="Fecha" />
                <th className={thClass}>Descripción</th>
                <SortBtn col="categoria" label="Categoría" />
                <SortBtn col="monto"     label="Monto" right />
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => {
                const pos = t.type === "ingreso";
                return (
                  <tr key={t.id} className="group">
                    <td className={`${tdClass} text-muted whitespace-nowrap`} style={monoStyle}>{t.dateISO}</td>
                    <td className={`${tdClass} font-medium`}>{t.desc}</td>
                    <td className={`${tdClass} text-muted`}>{t.category}</td>
                    <td className={`${tdClass} text-right tabular-nums ${pos ? "text-pos" : "text-neg"}`} style={monoStyle}>
                      {privacy ? "••••••" : `${pos ? "+" : "−"}${COP(t.amount)}`}
                    </td>
                    <td className={`${tdClass} text-right whitespace-nowrap`}>
                      <div className="flex items-center justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditId(t.financeId!)}
                          className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-fg"
                          title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => setPendingDelete(t)}
                          className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-neg"
                          title="Eliminar"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="text-[26px] mb-2">🧾</div>
                    <div className="text-[13.5px] font-medium mb-1">
                      {q || catFilter !== "todas" || filter !== "todos"
                        ? "Nada coincide con estos filtros"
                        : "Sin movimientos en este rango"}
                    </div>
                    <div className="text-[12.5px] text-dim">
                      {q || catFilter !== "todas" || filter !== "todos"
                        ? "Prueba ampliar el rango de fechas o limpiar la búsqueda."
                        : "Registra tu primer movimiento con el botón «Registrar» arriba."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <span>Filas:</span>
            {[20, 50, 100].map(n => (
              <button key={n} onClick={() => { setPageSize(n); setPage(1); }} className={[
                "border-none cursor-pointer px-2.5 py-1 rounded-md text-[12px]",
                pageSize === n ? "bg-accent text-accentFg" : "bg-panel2 text-muted",
              ].join(" ")}>{n}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              className="border border-line bg-panel2 text-muted text-[12px] w-7 h-7 rounded-md cursor-pointer disabled:opacity-40">‹</button>
            <span className="text-[12px] text-muted px-1">{safePage} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="border border-line bg-panel2 text-muted text-[12px] w-7 h-7 rounded-md cursor-pointer disabled:opacity-40">›</button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <ModalShell
          title="Eliminar movimiento"
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 h-10.5 rounded-xl border border-line bg-panel text-fg cursor-pointer text-[13.5px] font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => { handleDelete(pendingDelete); setPendingDelete(null); }}
                className="flex-1 h-10.5 rounded-xl border-none text-[13.5px] font-medium cursor-pointer"
                style={{ background: "var(--neg)", color: "#fff" }}
              >
                Eliminar
              </button>
            </>
          }
        >
          <p className="text-[14px] m-0" style={{ color: "var(--muted)" }}>
            ¿Eliminar <strong style={{ color: "var(--fg)" }}>&ldquo;{pendingDelete.desc}&rdquo;</strong>?
            Esta acción se puede deshacer durante 4 segundos después de confirmar.
          </p>
        </ModalShell>
      )}

      {/* Edit modal */}
      {editId && (() => {
        const f = initialData.finances.find(x => x.id === editId);
        if (!f) return null;
        const allAccounts = [
          ...initialData.bankAccounts,
          ...(initialData.hysAccounts ?? []).map(a => ({ id: a.id, name: a.name, type: "otro" as const, balance: 0 })),
        ];
        return (
          <ModalMovimiento
            editId={editId}
            editInitial={{ type: f.type, amount: f.amount, desc: f.desc ?? "", date: f.date, category: f.category, accountId: f.accountId }}
            bankAccounts={allAccounts}
            categories={initialData.categories}
            finances={initialData.finances}
            budgets={initialData.budgets}
            budgetConfigs={initialData.budgetConfigs}
            onClose={() => setEditId(null)}
          />
        );
      })()}
    </div>
  );
}

function AccountCard({
  name, subtitle, balance, privacy, tag, tagColor,
  onEdit, onDelete, breakdown, fmt,
}: {
  name: string; subtitle?: string; balance: number; privacy: boolean;
  tag?: string; tagColor?: string; onEdit?: () => void; onDelete?: () => void;
  fmt?: (n: number) => string;
  // For broker/exchange accounts: split the total into "cash sitting there"
  // vs. "market value of positions linked to it" — a Bolsa/Cripto account
  // isn't one number, it's disponible + invertido.
  breakdown?: { label: string; value: number }[];
}) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[14px] font-medium">{name}</div>
          {subtitle && <div className="text-[11.5px] text-dim">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1.5">
          {tag && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
              style={{ background: tagColor ?? "var(--panel2)", color: "var(--dim)" }}>
              {tag}
            </span>
          )}
          {onEdit && (
            <button onClick={onEdit} className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-fg" title="Editar"><IconEdit /></button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-neg" title="Eliminar"><IconTrash /></button>
          )}
        </div>
      </div>
      <div className="text-[22px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
        {fmt ? (privacy ? "••••••" : fmt(balance)) : <Bal n={balance} privacy={privacy} />}
      </div>
      {breakdown && breakdown.length > 0 && (
        <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-line">
          {breakdown.map((b) => (
            <div key={b.label} className="text-[12px]">
              <span className="text-dim">{b.label}: </span>
              <span className="text-muted" style={monoStyle}>
                {fmt ? (privacy ? "••••" : fmt(b.value)) : <Bal n={b.value} privacy={privacy} />}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] text-dim font-medium tracking-[0.04em] uppercase mb-2.5">{title}</div>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {children}
      </div>
    </div>
  );
}

export function ViewCuentas({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const currency = useCurrency();
  const router = useRouter();
  const [editItem, setEditItem] = useState<typeof initialData.bankAccounts[0] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState<string | null>(null);

  // Compute balances
  const holdings    = toAssets(initialData.stocks, initialData.prices);
  const cryptoAssets = toAssets(initialData.crypto, initialData.prices);
  const stockTotal  = holdings.reduce((s, a) => s + a.qty * a.price, 0);
  const cryptoTotal = cryptoAssets.reduce((s, a) => s + a.qty * a.price, 0);

  // HYS balances — defer Date.now() to client to avoid SSR/client mismatch
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  const hysAccounts = initialData.hysAccounts ?? [];
  const trm = initialData.config?.trm ?? null;
  const inUSD = currency === "USD" && !!trm;
  const fmt = (cop: number) => inUSD ? USD(cop / trm!) : COP(cop);
  const hysBalances = hysAccounts.map(a => {
    if (!now || !a.movements.length) return 0;
    const sorted = [...a.movements].sort((x, y) => x.date.localeCompare(y.date));
    const last = sorted[sorted.length - 1];
    const days = (now - new Date(last.date).getTime()) / 86400000;
    const bal = last.balance * Math.pow(1 + a.rate / 100, days / 365);
    return a.currency === "USD" && trm ? bal * trm : bal;
  });
  const hysBalance = hysBalances.reduce((s, b) => s + b, 0);

  // Group bank accounts by type
  const bankAccounts   = initialData.bankAccounts.filter(a => a.type === "banco" || a.type === "otro" || !a.type);
  const bolsaAccounts  = initialData.bankAccounts.filter(a => a.type === "bolsa");
  const criptoAccounts = initialData.bankAccounts.filter(a => a.type === "cripto");

  // A Bolsa/Cripto account isn't a single number — it's cash sitting
  // uninvested in the broker ("disponible", the account's own balance field)
  // PLUS the market value of whatever stocks/crypto are linked to it
  // ("invertido"). Both matter and neither should hide the other.
  const bolsaInvested = (id: string) => {
    const linked = holdings.filter(a => {
      const s = initialData.stocks.find(s => s.ticker === a.ticker);
      return s?.accountId === id || s?.accountId2 === id;
    });
    return linked.reduce((s, a) => s + a.qty * a.price, 0);
  };
  const bolsaAvailable = (id: string) => initialData.bankAccounts.find(a => a.id === id)?.balance ?? 0;
  const bolsaBalance = (id: string) => bolsaAvailable(id) + bolsaInvested(id);

  const criptoInvested = (id: string) => {
    const linked = cryptoAssets.filter(a => {
      const c = initialData.crypto.find(c => c.ticker === a.ticker);
      return c?.accountId === id || c?.accountId2 === id;
    });
    return linked.reduce((s, a) => s + a.qty * a.price, 0);
  };
  const criptoAvailable = (id: string) => initialData.bankAccounts.find(a => a.id === id)?.balance ?? 0;
  const criptoBalance = (id: string) => criptoAvailable(id) + criptoInvested(id);

  // If no bolsa/cripto accounts exist, show totals as unlinked summary
  const unlinkedStockTotal  = bolsaAccounts.length === 0 ? stockTotal : 0;
  const unlinkedCryptoTotal = criptoAccounts.length === 0 ? cryptoTotal : 0;

  const bankTotal  = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const bolsaVal   = bolsaAccounts.length > 0
    ? bolsaAccounts.reduce((s, a) => s + bolsaBalance(a.id), 0)
    : unlinkedStockTotal;
  const criptoVal  = criptoAccounts.length > 0
    ? criptoAccounts.reduce((s, a) => s + criptoBalance(a.id), 0)
    : unlinkedCryptoTotal;
  const bienesTotal = initialData.bienes.reduce((s, b) => s + b.value, 0);
  const total      = bankTotal + bolsaVal + criptoVal + hysBalance + bienesTotal;

  const barParts = [
    { label: "Bolsa",            value: bolsaVal,    color: "var(--accent)" },
    { label: "Cripto",           value: criptoVal,   color: "#8a8f98" },
    { label: "Alto rendimiento", value: hysBalance,  color: "#f59e0b" },
    { label: "Bancos",           value: bankTotal,   color: "var(--dim)" },
    { label: "Bienes",           value: bienesTotal, color: "#10b981" },
  ].filter((p) => p.value > 0);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta cuenta?")) return;
    await deleteBankAccount(id);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className={cardClass}>
        <div className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-1.5">
          Patrimonio total
        </div>
        <div className="text-[38px] font-medium tracking-[-0.02em] mb-4" style={{ fontFamily: "Spectral, serif" }}>
          {privacy ? "••••••" : fmt(total)}
        </div>
        {total > 0 && (
          <>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
              {barParts.map((p) => (
                <div key={p.label} className="min-w-0.5" style={{ flex: p.value / total, background: p.color }} />
              ))}
            </div>
            <div className="flex gap-5 flex-wrap">
              {barParts.map((p) => (
                <div key={p.label} className="flex items-center gap-1.5 text-[12px]">
                  <span className="w-2 h-2 rounded-xs" style={{ background: p.color }} />
                  <span className="text-muted">{p.label}</span>
                  <span className="text-fg" style={monoStyle}>{privacy ? "••••" : fmt(p.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Alto rendimiento */}
      {hysAccounts.length > 0 && (
        <Section title="Alto rendimiento">
          {hysAccounts.map((a, i) => {
            const bal = hysBalances[i];
            return (
              <div key={a.id} className={`${cardClass} cursor-pointer`} onClick={() => router.push("/savings")}>
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <div className="text-[14px] font-medium">
                      {a.parentId ? `${hysAccounts.find(p => p.id === a.parentId)?.name ?? ""} · ${a.name}` : a.name}
                    </div>
                    <div className="text-[11.5px] text-dim">
                      TEA {a.rate.toFixed(2)}% · {a.currency} · Ver detalle →
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
                      style={{ background: "#f59e0b22", color: "#f59e0b" }}>HYS</span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const kids = hysAccounts.filter(p => p.parentId === a.id).length;
                        if (!window.confirm(`¿Cerrar la cuenta "${a.name}"? Se eliminarán todos los movimientos${kids ? ` y sus ${kids} bolsillo(s)` : ""}.`)) return;
                        await hysDeleteAccount(a.id);
                        router.refresh();
                      }}
                      className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-neg"
                      title="Cerrar cuenta"
                    ><IconTrash /></button>
                  </div>
                </div>
                <div className="text-[22px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
                  {privacy ? "••••••" : fmt(bal)}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {/* Bolsa accounts */}
      {bolsaAccounts.length > 0 ? (
        <Section title="Inversiones / Bolsa">
          {bolsaAccounts.map((a) => (
            <AccountCard key={a.id} name={a.name} subtitle={a.bank} balance={bolsaBalance(a.id)}
              privacy={privacy} tag="Bolsa" tagColor="var(--accent)22" fmt={inUSD ? fmt : undefined}
              breakdown={[
                { label: "Disponible", value: bolsaAvailable(a.id) },
                { label: "Invertido", value: bolsaInvested(a.id) },
              ]}
              onEdit={() => setEditItem(a)} onDelete={() => handleDelete(a.id)} />
          ))}
        </Section>
      ) : stockTotal > 0 ? (
        <Section title="Inversiones / Bolsa">
          <AccountCard name="Portafolio en bolsa" subtitle="Sin broker asignado" balance={stockTotal}
            privacy={privacy} tag="Bolsa" tagColor="var(--accent)22" fmt={inUSD ? fmt : undefined} />
        </Section>
      ) : null}

      {/* Cripto accounts */}
      {criptoAccounts.length > 0 ? (
        <Section title="Cripto">
          {criptoAccounts.map((a) => (
            <AccountCard key={a.id} name={a.name} subtitle={a.bank} balance={criptoBalance(a.id)}
              privacy={privacy} tag="Cripto" tagColor="#8a8f9822" fmt={inUSD ? fmt : undefined}
              breakdown={[
                { label: "Disponible", value: criptoAvailable(a.id) },
                { label: "Invertido", value: criptoInvested(a.id) },
              ]}
              onEdit={() => setEditItem(a)} onDelete={() => handleDelete(a.id)} />
          ))}
        </Section>
      ) : cryptoTotal > 0 ? (
        <Section title="Cripto">
          <AccountCard name="Portafolio cripto" subtitle="Sin exchange asignado" balance={cryptoTotal}
            privacy={privacy} tag="Cripto" tagColor="#8a8f9822" fmt={inUSD ? fmt : undefined} />
        </Section>
      ) : null}

      {/* Bienes (patrimonio no monetario) */}
      {initialData.bienes.length > 0 && (
        <Section title="Bienes">
          {initialData.bienes.map((b) => (
            <div key={b.id} className={`${cardClass} cursor-pointer`} onClick={() => router.push("/bienes")}>
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <div className="text-[14px] font-medium">{b.name}</div>
                  <div className="text-[11.5px] text-dim">Desde {b.date} · Ver detalle →</div>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm" style={{ background: "#10b98122", color: "#10b981" }}>Bien</span>
              </div>
              <div className="text-[22px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
                {privacy ? "••••••" : fmt(b.value)}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Bank accounts */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[11.5px] text-dim font-medium tracking-[0.04em] uppercase">Cuentas bancarias</div>
          <div className="flex gap-2">
            <button onClick={() => setShowTransfer("cash")}
              className="border border-line bg-panel2 text-muted text-[12px] px-3 py-1.5 rounded-lg cursor-pointer">
              ⇄ Transferir
            </button>
            <button onClick={() => setShowAdd(true)}
              className="border border-line bg-panel2 text-muted text-[12px] px-3 py-1.5 rounded-lg cursor-pointer">
              + Agregar cuenta
            </button>
          </div>
        </div>
        {bankAccounts.length === 0 ? (
          <div className={`${cardClass} text-muted text-[13px]`}>
            No hay cuentas bancarias. Agrega una para empezar.
          </div>
        ) : (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {bankAccounts.map((a) => (
              <AccountCard key={a.id} name={a.name} subtitle={a.bank} balance={a.balance}
                privacy={privacy} fmt={inUSD ? fmt : undefined}
                onEdit={() => setEditItem(a)} onDelete={() => handleDelete(a.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Transferencias recientes */}
      {initialData.transfers.length > 0 && (
        <div>
          <div className="text-[11.5px] text-dim font-medium tracking-[0.04em] uppercase mb-2.5">Transferencias recientes</div>
          <div className={cardClass}>
            {initialData.transfers.slice(0, 15).map((t, idx) => (
              <div key={t.id} className={`flex items-center justify-between text-[13px] py-2.5 ${idx > 0 ? "border-t border-line" : ""}`}>
                <div className="min-w-0">
                  <div className="truncate">{t.fromAccountName ?? t.fromAccountId} → {t.toAccountName ?? t.toAccountId}</div>
                  <div className="text-[11px] text-dim">{t.date}{t.note ? ` · ${t.note}` : ""}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="tabular-nums text-muted" style={monoStyle}>{privacy ? "••••" : fmt(t.amount)}</span>
                  <button
                    onClick={async () => {
                      if (!window.confirm("¿Eliminar transferencia? Se revierten los saldos.")) return;
                      await deleteTransfer(t.id);
                      router.refresh();
                    }}
                    className="text-[11px] text-dim border-none bg-transparent cursor-pointer hover:text-neg p-0"
                    title="Eliminar"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && <ModalCuenta onClose={() => setShowAdd(false)} bankAccounts={initialData.bankAccounts} />}
      {editItem && <ModalCuenta editItem={editItem} onClose={() => setEditItem(null)} bankAccounts={initialData.bankAccounts} />}
      {showTransfer !== null && (
        <ModalTransfer
          bankAccounts={initialData.bankAccounts}
          cash={initialData.cash}
          hasHys={!!initialData.hys}
          fromAccountId={showTransfer || undefined}
          onClose={() => setShowTransfer(null)}
        />
      )}
    </div>
  );
}

export function ViewBienes({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const currency = useCurrency();
  const trm = initialData.config?.trm ?? null;
  const inUSD = currency === "USD" && !!trm;
  const fmt = (cop: number) => inUSD ? USD(cop / trm!) : COP(cop);
  const [editItem, setEditItem] = useState<Bien | null>(null);
  const [loseItem, setLoseItem] = useState<Bien | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const bienes = initialData.bienes;
  const total = bienes.reduce((s, b) => s + b.value, 0);

  return (
    <div className="flex flex-col gap-3.5">
      <div className={cardClass}>
        <div className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-1.5">
          Valor total en bienes
        </div>
        <div className="text-[32px] font-medium tracking-[-0.02em]" style={{ fontFamily: "Spectral, serif" }}>
          {privacy ? "••••••" : fmt(total)}
        </div>
        <div className="text-[12.5px] text-muted mt-1.5">
          Vehículos, inmuebles y otros bienes que forman parte de tu patrimonio pero no son dinero.
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[11.5px] text-dim font-medium tracking-[0.04em] uppercase">Tus bienes</div>
        <button onClick={() => setShowAdd(true)} className="border border-line bg-panel2 text-muted text-[12px] px-3 py-1.5 rounded-lg cursor-pointer">
          + Agregar bien
        </button>
      </div>

      {bienes.length === 0 ? (
        <div className={`${cardClass} text-muted text-[13px]`}>
          No hay bienes registrados. Agrega uno para incluirlo en tu patrimonio.
        </div>
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {bienes.map((b) => (
            <AccountCard
              key={b.id}
              name={b.name}
              subtitle={`Desde ${b.date}`}
              balance={b.value}
              privacy={privacy}
              fmt={inUSD ? fmt : undefined}
              onEdit={() => setEditItem(b)}
              onDelete={() => setLoseItem(b)}
            />
          ))}
        </div>
      )}

      {showAdd && <ModalBien onClose={() => setShowAdd(false)} />}
      {editItem && <ModalBien editItem={editItem} onClose={() => setEditItem(null)} />}
      {loseItem && <ModalLoseBien item={loseItem} onClose={() => setLoseItem(null)} />}
    </div>
  );
}

export function ViewHistorico({ initialData }: { initialData: AllData }) {
  const logs = initialData.activityLogs;

  const typeLabel: Record<string, string> = {
    ingreso: "Ingreso", egreso: "Egreso",
    stock_buy: "Compra acción", stock_edit: "Edición acción", stock_delete: "Eliminación acción", stock_sell: "Venta acción · ganancia realizada",
    crypto_buy: "Compra cripto", crypto_edit: "Edición cripto", crypto_delete: "Eliminación cripto", crypto_sell: "Venta cripto · ganancia realizada",
    account_create: "Cuenta creada", account_edit: "Cuenta editada", account_delete: "Cuenta eliminada",
    bien_create: "Bien agregado", bien_edit: "Bien editado", bien_lost: "Bien dado de baja",
  };

  const typeColor: Record<string, string> = {
    ingreso: "var(--pos)", egreso: "var(--neg)",
    stock_buy: "var(--accent)", stock_edit: "var(--muted)", stock_delete: "var(--neg)",
    crypto_buy: "var(--accent)", crypto_edit: "var(--muted)", crypto_delete: "var(--neg)",
    account_create: "var(--pos)", account_edit: "var(--muted)", account_delete: "var(--neg)",
    bien_create: "var(--pos)", bien_edit: "var(--muted)", bien_lost: "var(--neg)",
  };

  // Realized P/G sales are colored by sign (gain/loss), not by a fixed per-type color
  const isRealizedSale = (type: string) => type === "stock_sell" || type === "crypto_sell";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="border border-line bg-panel rounded-[18px] p-5.5">
        <div className="text-[14px] font-medium mb-3.5">Actividad reciente</div>
        {logs.length === 0 ? (
          <div className="text-muted text-[13px]">Sin actividad registrada.</div>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {logs.map((log) => {
              const d = new Date(log.createdAt);
              const dateStr = d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
              const timeStr = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
              const realizedSale = isRealizedSale(log.type);
              const gain = realizedSale && log.amount != null ? log.amount >= 0 : null;
              const dotColor = realizedSale
                ? (gain ? "var(--pos)" : "var(--neg)")
                : (typeColor[log.type] ?? "var(--dim)");
              return (
                <div key={log.id} className="flex items-center gap-3.5 py-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: dotColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]">{log.description}</div>
                    <div className="text-[11.5px] text-dim">
                      {typeLabel[log.type] ?? log.type}
                      {log.accountName && ` · ${log.accountName}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {log.amount != null && (
                      <div
                        className={`text-[13px] tabular-nums ${realizedSale ? (gain ? "text-pos" : "text-neg") : ""}`}
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {realizedSale && gain ? "+" : ""}{COP(log.amount)}
                      </div>
                    )}
                    <div className="text-[11px] text-dim">{dateStr} {timeStr}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────
function SummaryCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="animate-card border border-line bg-panel rounded-2xl px-5 py-4.5">
      <div className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-2.5">
        {label}
      </div>
      <div className="text-[24px] font-medium tabular-nums" style={{ fontFamily: "Spectral, serif" }}>
        {value}
      </div>
      {sub && <div className="text-[12.5px] mt-1.5">{sub}</div>}
    </div>
  );
}
