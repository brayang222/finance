"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Asset, Account, COP, PCT, today } from "../../data/mock";
import type { AllData, Stock, Crypto } from "../../types";
import { Bal } from "./utils";
import { usePrivacy } from "./PrivacyContext";
import { toAssets, toTransactions, toAccounts } from "./transforms";
import { deleteStock, deleteCrypto, refreshPrices, deleteBankAccount } from "../../../lib/actions";
import ModalAccion from "./ModalAccion";
import ModalCripto from "./ModalCripto";
import ModalCuenta from "./ModalCuenta";

// ponytail: shared style objects replaced with className strings
const cardClass = "border border-line bg-panel rounded-[18px] p-[22px]";

const thClass =
  "text-[11.5px] tracking-[0.04em] uppercase text-dim font-medium text-left pb-[10px]";

const tdClass = "py-3 border-t border-line text-[13.5px]";

const monoStyle = { fontFamily: "'IBM Plex Mono', monospace" };

const refreshBtnClass = "border border-line bg-panel2 text-muted text-[12px] px-3 py-1.5 rounded-lg cursor-pointer";

function AssetTable({
  assets,
  privacy,
  onSelect,
}: {
  assets: Asset[];
  privacy: boolean;
  onSelect: (t: string) => void;
}) {
  if (assets.length === 0) {
    return (
      <div className={`${cardClass} text-muted text-[13px]`}>
        No hay posiciones registradas.
      </div>
    );
  }
  return (
    <div className={cardClass}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[560px]">
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
              const value = a.qty * a.price;
              const cost  = a.qty * a.avg;
              const pl    = value - cost;
              const plPct = cost > 0 ? pl / cost : 0;
              const pos   = pl >= 0;
              return (
                <tr key={a.ticker} onClick={() => onSelect(a.ticker)} className="cursor-pointer">
                  <td className={tdClass}>
                    <div className="flex items-center gap-[10px]">
                      <span
                        className="w-[30px] h-[30px] rounded-lg bg-panel2 border border-line flex items-center justify-center text-[11px] text-muted"
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
                    {privacy ? "••••" : COP(a.price)}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums text-muted`} style={monoStyle}>
                    {privacy ? "••••" : COP(a.avg)}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                    <Bal n={value} privacy={privacy} />
                  </td>
                  <td className={`${tdClass} text-right tabular-nums ${pos ? "text-pos" : "text-neg"}`} style={monoStyle}>
                    <div>{PCT(plPct)}</div>
                    <div className="text-[12px] opacity-80">
                      {privacy ? "••••" : `${pos ? "+" : "−"}${COP(Math.abs(pl))}`}
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

export function ViewInversiones({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const assets = toAssets(initialData.stocks, initialData.prices);
  const onSelect = (t: string) => router.push(`/detail/${t}`);
  const totalValue = assets.reduce((s, a) => s + a.qty * a.price, 0);
  const totalCost  = assets.reduce((s, a) => s + a.qty * a.avg, 0);
  const totalPL    = totalValue - totalCost;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const tickers = [...new Set(initialData.stocks.map(s => s.ticker.toUpperCase()))];
      await refreshPrices(tickers, []);
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
          <SummaryCard label="Valor del portafolio" value={<Bal n={totalValue} privacy={privacy} />} />
          <SummaryCard label="Costo invertido" value={<Bal n={totalCost} privacy={privacy} />} />
          <SummaryCard
            label="Rendimiento P/G"
            value={
              <span className={totalPL >= 0 ? "text-pos" : "text-neg"}>
                <Bal n={Math.abs(totalPL)} privacy={privacy} />
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
        <div className="ml-3 shrink-0">
          <button onClick={handleRefresh} disabled={refreshing} className={refreshBtnClass}>
            {refreshing ? "Actualizando…" : "Actualizar precios"}
          </button>
        </div>
      </div>
      <AssetTable assets={assets} privacy={privacy} onSelect={onSelect} />
    </div>
  );
}

export function ViewCripto({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const assets = toAssets(initialData.crypto, initialData.prices);
  const onSelect = (t: string) => router.push(`/detail/${t}`);
  const totalValue = assets.reduce((s, a) => s + a.qty * a.price, 0);
  const totalCost  = assets.reduce((s, a) => s + a.qty * a.avg, 0);
  const totalPL    = totalValue - totalCost;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const tickers = [...new Set(initialData.crypto.map(c => c.ticker.toUpperCase()))];
      await refreshPrices([], tickers);
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
          <SummaryCard label="Valor en cripto" value={<Bal n={totalValue} privacy={privacy} />} />
          <SummaryCard label="Costo invertido" value={<Bal n={totalCost} privacy={privacy} />} />
          <SummaryCard
            label="Rendimiento P/G"
            value={
              <span className={totalPL >= 0 ? "text-pos" : "text-neg"}>
                <Bal n={Math.abs(totalPL)} privacy={privacy} />
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
        <div className="ml-3 shrink-0">
          <button onClick={handleRefresh} disabled={refreshing} className={refreshBtnClass}>
            {refreshing ? "Actualizando…" : "Actualizar precios"}
          </button>
        </div>
      </div>
      <AssetTable assets={assets} privacy={privacy} onSelect={onSelect} />
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
  const pl = asset ? asset.qty * asset.price - asset.qty * asset.avg : 0;
  const plPct = asset && asset.avg > 0 ? pl / (asset.qty * asset.avg) : 0;

  const rawTrades = isCrypto
    ? initialData.crypto.filter(t => t.ticker.toUpperCase() === selected)
    : initialData.stocks.filter(t => t.ticker.toUpperCase() === selected);

  const [editItem, setEditItem] = useState<Stock | Crypto | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta operación?")) return;
    if (isCrypto) await deleteCrypto(id);
    else await deleteStock(id);
    router.refresh();
  };

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
            <div className="flex items-center gap-[14px]">
              <span
                className="w-[42px] h-[42px] rounded-[11px] bg-panel2 border border-line flex items-center justify-center text-[14px] text-muted"
                style={monoStyle}
              >
                {asset.mono}
              </span>
              <div>
                <div className="text-[15px] font-medium" style={monoStyle}>{asset.ticker}</div>
                <div className="text-muted text-[13px]">{asset.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
                {privacy ? "••••••" : COP(asset.price)}
              </div>
              <div className={`text-[13px] ${asset.dayPct >= 0 ? "text-pos" : "text-neg"}`}>
                {PCT(asset.dayPct)} hoy
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <SummaryCard label="Cantidad"       value={<>{asset.qty % 1 === 0 ? asset.qty.toLocaleString("es-CO") : asset.qty.toFixed(4)}</>} />
            <SummaryCard label="Precio actual"  value={<Bal n={asset.price} privacy={privacy} />} />
            <SummaryCard label="Costo promedio" value={<Bal n={asset.avg} privacy={privacy} />} />
            <SummaryCard label="Valor mercado"  value={<Bal n={asset.qty * asset.price} privacy={privacy} />} />
            <SummaryCard
              label="P/G no realizada"
              value={
                <span className={pl >= 0 ? "text-pos" : "text-neg"}>
                  <Bal n={Math.abs(pl)} privacy={privacy} />
                </span>
              }
              sub={<span className={pl >= 0 ? "text-pos" : "text-neg"}>{PCT(plPct)}</span>}
            />
          </div>

          {/* Trade history */}
          <div className={cardClass}>
            <div className="text-[13px] font-medium mb-3.5">Historial de operaciones</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[480px]">
                <thead>
                  <tr>
                    <th className={thClass}>Fecha</th>
                    <th className={`${thClass} text-right`}>Cantidad</th>
                    <th className={`${thClass} text-right`}>Precio COP</th>
                    <th className={`${thClass} text-right`}>Comisión</th>
                    <th className={thClass}></th>
                  </tr>
                </thead>
                <tbody>
                  {rawTrades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`${tdClass} text-dim text-center`}>Sin operaciones</td>
                    </tr>
                  ) : rawTrades.map((t) => (
                    <tr key={t.id}>
                      <td className={`${tdClass} text-muted whitespace-nowrap`} style={monoStyle}>{t.date}</td>
                      <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                        {t.qty % 1 === 0 ? t.qty.toLocaleString("es-CO") : t.qty.toFixed(8)}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                        {privacy ? "••••" : COP(t.priceCOP)}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums text-muted`} style={monoStyle}>
                        {privacy ? "••" : COP(t.commission)}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditItem(t)}
                            className="text-[12px] text-muted cursor-pointer bg-transparent border-none px-1.5 py-0.5 rounded hover:text-fg"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-[12px] text-muted cursor-pointer bg-transparent border-none px-1.5 py-0.5 rounded hover:text-neg"
                            title="Eliminar"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
    </div>
  );
}

type SortCol = "fecha" | "categoria" | "cuenta" | "monto";
type SortDir = "asc" | "desc";

export function ViewTransacciones({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const transactions = toTransactions(initialData.finances);

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const [from, setFrom] = React.useState(yearStart);
  const [to, setTo]     = React.useState(today());
  const [filter, setFilter] = React.useState<"todos" | "ingresos" | "egresos">("todos");
  const [sort, setSort]     = React.useState<{ col: SortCol; dir: SortDir }>({ col: "fecha", dir: "desc" });

  // Date-range + type filter. KPIs reflect the date-filtered set.
  const dateFiltered = transactions.filter((t) => t.dateISO >= from && t.dateISO <= to);
  const typeFiltered = dateFiltered.filter((t) =>
    filter === "todos" ? true : filter === "ingresos" ? t.type === "ingreso" : t.type === "egreso"
  );
  const totalIncome  = dateFiltered.filter((t) => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
  const totalExpense = dateFiltered.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const toggleSort = (col: SortCol) =>
    setSort((prev) => ({ col, dir: prev.col === col && prev.dir === "asc" ? "desc" : "asc" }));

  const sorted = [...typeFiltered].sort((a, b) => {
    let cmp = 0;
    if (sort.col === "fecha")     cmp = a.dateISO.localeCompare(b.dateISO);
    if (sort.col === "categoria") cmp = a.category.localeCompare(b.category);
    if (sort.col === "cuenta")    cmp = a.account.localeCompare(b.account);
    if (sort.col === "monto")     cmp = a.amount - b.amount;
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const SortBtn = ({ col, label, right }: { col: SortCol; label: string; right?: boolean }) => (
    <th
      className={`${thClass} cursor-pointer select-none${right ? " text-right" : ""}`}
      onClick={() => toggleSort(col)}
    >
      {label}{" "}
      <span className="text-dim">
        {sort.col === col ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </th>
  );

  const inputCls = "h-[34px] px-2 rounded-lg border border-line bg-panel2 text-fg text-[12.5px] outline-none";

  return (
    <div className="flex flex-col gap-3.5">
      {/* Date range filter */}
      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1 text-[11px] tracking-[0.08em] uppercase text-dim font-medium">
          Desde
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] tracking-[0.08em] uppercase text-dim font-medium">
          Hasta
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </label>
      </div>

      {/* KPIs — totals of the date-filtered selection */}
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
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-[10px]">
          <div className="text-[14px] font-medium">Movimientos</div>
          <div className="flex gap-2 flex-wrap">
            {(["todos", "ingresos", "egresos"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={[
                "border-none cursor-pointer px-3 py-[5px] rounded-lg text-[12px] font-medium",
                filter === f ? "bg-accent text-accentFg" : "bg-panel2 text-muted",
              ].join(" ")}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[480px]">
            <thead>
              <tr>
                <SortBtn col="fecha"     label="Fecha" />
                <th className={thClass}>Descripción</th>
                <SortBtn col="categoria" label="Categoría" />
                <SortBtn col="monto"     label="Monto" right />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const pos = t.type === "ingreso";
                return (
                  <tr key={t.id}>
                    <td className={`${tdClass} text-muted whitespace-nowrap`} style={monoStyle}>{t.dateISO}</td>
                    <td className={`${tdClass} font-medium`}>{t.desc}</td>
                    <td className={`${tdClass} text-muted`}>{t.category}</td>
                    <td className={`${tdClass} text-right tabular-nums ${pos ? "text-pos" : "text-neg"}`} style={monoStyle}>
                      {privacy ? "••••••" : `${pos ? "+" : "−"}${COP(t.amount)}`}
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={4} className={`${tdClass} text-dim text-center`}>Sin movimientos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ViewCuentas({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const holdings = toAssets(initialData.stocks, initialData.prices);
  const cryptoAssets = toAssets(initialData.crypto, initialData.prices);
  const bankTotal  = initialData.bankAccounts.reduce((s, a) => s + a.balance, 0);
  const stockTotal = holdings.reduce((s, a) => s + a.qty * a.price, 0);
  const cryptoTotal = cryptoAssets.reduce((s, a) => s + a.qty * a.price, 0);
  const total      = bankTotal + stockTotal + cryptoTotal;
  const [editItem, setEditItem] = useState<typeof initialData.bankAccounts[0] | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const barParts = [
    { label: "Bolsa",   value: stockTotal,  color: "var(--accent)" },
    { label: "Cripto",  value: cryptoTotal, color: "#8a8f98" },
    { label: "Bancos",  value: bankTotal,   color: "var(--dim)" },
  ].filter((p) => p.value > 0);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta cuenta?")) return;
    await deleteBankAccount(id);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Hero */}
      <div className={cardClass}>
        <div className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-1.5">
          Patrimonio total
        </div>
        <div className="text-[38px] font-medium tracking-[-0.02em] mb-4" style={{ fontFamily: "Spectral, serif" }}>
          <Bal n={total} privacy={privacy} />
        </div>

        {total > 0 && (
          <>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
              {barParts.map((p) => (
                <div key={p.label} className="min-w-[2px]" style={{ flex: p.value / total, background: p.color }} />
              ))}
            </div>
            <div className="flex gap-5 flex-wrap">
              {barParts.map((p) => (
                <div key={p.label} className="flex items-center gap-1.5 text-[12px]">
                  <span className="w-2 h-2 rounded-[2px]" style={{ background: p.color }} />
                  <span className="text-muted">{p.label}</span>
                  <span className="text-fg" style={monoStyle}>
                    {privacy ? "••••" : COP(p.value)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bank account cards */}
      <div>
        <div className="flex items-center justify-between mb-[10px]">
          <div className="text-[11.5px] text-dim font-medium tracking-[0.04em] uppercase">
            Cuentas bancarias
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="border border-line bg-panel2 text-muted text-[12px] px-3 py-1.5 rounded-lg cursor-pointer"
          >
            + Agregar cuenta
          </button>
        </div>
        {initialData.bankAccounts.length === 0 ? (
          <div className={`${cardClass} text-muted text-[13px]`}>
            No hay cuentas registradas. Agrega una cuenta bancaria para comenzar.
          </div>
        ) : (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {initialData.bankAccounts.map((a) => (
              <div key={a.id} className={cardClass}>
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <div className="text-[14px] font-medium">{a.name}</div>
                    {a.bank && <div className="text-[11.5px] text-dim">{a.bank}</div>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditItem(a)}
                      className="text-[12px] text-muted cursor-pointer bg-transparent border-none px-1.5 py-0.5 rounded hover:text-fg"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-[12px] text-muted cursor-pointer bg-transparent border-none px-1.5 py-0.5 rounded hover:text-neg"
                      title="Eliminar"
                    >
                      🗑
                    </button>
                  </div>
                </div>
                <div className="text-[22px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
                  <Bal n={a.balance} privacy={privacy} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <ModalCuenta onClose={() => setShowAdd(false)} />}
      {editItem && <ModalCuenta editItem={editItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}

export function ViewHistorico({ initialData }: { initialData: AllData }) {
  const logs = initialData.activityLogs;

  const typeLabel: Record<string, string> = {
    ingreso: "Ingreso", egreso: "Egreso",
    stock_buy: "Compra acción", stock_edit: "Edición acción", stock_delete: "Eliminación acción",
    crypto_buy: "Compra cripto", crypto_edit: "Edición cripto", crypto_delete: "Eliminación cripto",
    account_create: "Cuenta creada", account_edit: "Cuenta editada", account_delete: "Cuenta eliminada",
  };

  const typeColor: Record<string, string> = {
    ingreso: "var(--pos)", egreso: "var(--neg)",
    stock_buy: "var(--accent)", stock_edit: "var(--muted)", stock_delete: "var(--neg)",
    crypto_buy: "var(--accent)", crypto_edit: "var(--muted)", crypto_delete: "var(--neg)",
    account_create: "var(--pos)", account_edit: "var(--muted)", account_delete: "var(--neg)",
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="border border-line bg-panel rounded-[18px] p-[22px]">
        <div className="text-[14px] font-medium mb-3.5">Actividad reciente</div>
        {logs.length === 0 ? (
          <div className="text-muted text-[13px]">Sin actividad registrada.</div>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {logs.map((log) => {
              const d = new Date(log.createdAt);
              const dateStr = d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
              const timeStr = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={log.id} className="flex items-center gap-3.5 py-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: typeColor[log.type] ?? "var(--dim)" }}
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
                      <div className="text-[13px] tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {COP(log.amount)}
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
    <div className="border border-line bg-panel rounded-2xl px-5 py-[18px]">
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
