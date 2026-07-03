"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Asset, Account, COP, PCT, today } from "../../data/mock";
import type { AllData, Stock, Crypto } from "../../types";
import { Bal } from "./utils";
import { usePrivacy } from "./PrivacyContext";
import { toAssets, toTransactions, toAccounts } from "./transforms";
import { deleteStock, deleteCrypto, refreshPrices, deleteBankAccount, deleteFinance } from "../../../lib/actions";
import ModalAccion from "./ModalAccion";
import ModalCripto from "./ModalCripto";
import ModalCuenta from "./ModalCuenta";
import ModalMovimiento from "./ModalMovimiento";
import { IconEdit, IconTrash } from "./Icons";

// ponytail: shared style objects replaced with className strings
const cardClass = "border border-line bg-panel rounded-[18px] p-5.5";

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
              const value = a.qty * a.price;
              const cost  = a.qty * a.avg;
              const pl    = value - cost;
              const plPct = cost > 0 ? pl / cost : 0;
              const pos   = pl >= 0;
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
      </div>

      <div className="shrink-0">
          <button onClick={handleRefresh} disabled={refreshing} className={refreshBtnClass}>
            {refreshing ? "Actualizando…" : "Actualizar precios"}
          </button>
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
        
      </div>
      <div className="shrink-0">
          <button onClick={handleRefresh} disabled={refreshing} className={refreshBtnClass}>
            {refreshing ? "Actualizando…" : "Actualizar precios"}
          </button>
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
              <table className="w-full border-collapse min-w-120">
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
  const transactions = toTransactions(initialData.finances);

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const oldestDate = transactions.length
    ? transactions.map(t => t.dateISO).sort()[0]
    : yearStart;
  const [from, setFrom]       = React.useState(yearStart);
  const [to, setTo]           = React.useState(today());
  const [filter, setFilter]   = React.useState<"todos" | "ingresos" | "egresos">("todos");
  const [search, setSearch]   = React.useState("");
  const [catFilter, setCatFilter] = React.useState("todas");
  const [pageSize, setPageSize]   = React.useState(20);
  const [page, setPage]           = React.useState(1);
  const [sort, setSort]           = React.useState<{ col: SortCol; dir: SortDir }>({ col: "fecha", dir: "desc" });
  const [editId, setEditId]       = React.useState<string | null>(null);

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
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium">Desde</span>
            {from !== oldestDate && (
              <button
                onClick={() => { setFrom(oldestDate); setPage(1); }}
                className="text-[10px] text-accent border-none bg-transparent cursor-pointer p-0 ml-2"
              >
                Desde el inicio
              </button>
            )}
          </div>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={inputCls} />
        </div>
        <label className="flex flex-col gap-1 text-[11px] tracking-[0.08em] uppercase text-dim font-medium">
          Hasta
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={inputCls} />
        </label>
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
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditId(t.financeId!)}
                          className="text-muted cursor-pointer bg-transparent border-none p-1 rounded hover:text-fg"
                          title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={async () => {
                            if (!t.financeId) return;
                            if (!window.confirm(`¿Eliminar "${t.desc}"?`)) return;
                            await deleteFinance(t.financeId);
                            router.refresh();
                          }}
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
                <tr><td colSpan={5} className={`${tdClass} text-dim text-center`}>Sin movimientos</td></tr>
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

      {/* Edit modal */}
      {editId && (() => {
        const f = initialData.finances.find(x => x.id === editId);
        if (!f) return null;
        const allAccounts = [
          ...initialData.bankAccounts,
          ...(initialData.hys ? [{ id: "hys", name: "Alto Rendimiento", type: "otro", balance: 0 }] : []),
        ];
        const existingCats = Array.from(new Set(initialData.finances.map(x => x.category))).sort();
        return (
          <ModalMovimiento
            editId={editId}
            editInitial={{ type: f.type, amount: f.amount, desc: f.desc ?? "", date: f.date, category: f.category, accountId: f.accountId }}
            bankAccounts={allAccounts}
            existingCats={existingCats}
            onClose={() => setEditId(null)}
          />
        );
      })()}
    </div>
  );
}

function AccountCard({
  name, subtitle, balance, privacy, tag, tagColor,
  onEdit, onDelete,
}: {
  name: string; subtitle?: string; balance: number; privacy: boolean;
  tag?: string; tagColor?: string; onEdit?: () => void; onDelete?: () => void;
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
        <Bal n={balance} privacy={privacy} />
      </div>
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
  const router = useRouter();
  const [editItem, setEditItem] = useState<typeof initialData.bankAccounts[0] | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Compute balances
  const holdings    = toAssets(initialData.stocks, initialData.prices);
  const cryptoAssets = toAssets(initialData.crypto, initialData.prices);
  const stockTotal  = holdings.reduce((s, a) => s + a.qty * a.price, 0);
  const cryptoTotal = cryptoAssets.reduce((s, a) => s + a.qty * a.price, 0);

  // HYS balance uses Date.now() — defer to client to avoid SSR/client mismatch
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  const hysBalance = (() => {
    if (!now) return 0;
    const hys = initialData.hys;
    if (!hys || hys.movements.length === 0) return 0;
    const last = hys.movements[hys.movements.length - 1];
    const days = (now - new Date(last.date).getTime()) / 86400000;
    return last.balance * Math.pow(1 + hys.rate / 100, days / 365);
  })();

  // Group bank accounts by type
  const bankAccounts   = initialData.bankAccounts.filter(a => a.type === "banco" || a.type === "otro" || !a.type);
  const bolsaAccounts  = initialData.bankAccounts.filter(a => a.type === "bolsa");
  const criptoAccounts = initialData.bankAccounts.filter(a => a.type === "cripto");

  // For bolsa/cripto accounts: compute live balance from linked assets
  const bolsaBalance = (id: string) => {
    const linked = holdings.filter(a => {
      const s = initialData.stocks.find(s => s.ticker === a.ticker);
      return s?.accountId === id;
    });
    if (linked.length > 0) return linked.reduce((s, a) => s + a.qty * a.price, 0);
    return initialData.bankAccounts.find(a => a.id === id)?.balance ?? 0;
  };

  const criptoBalance = (id: string) => {
    const linked = cryptoAssets.filter(a => {
      const c = initialData.crypto.find(c => c.ticker === a.ticker);
      return c?.accountId === id;
    });
    if (linked.length > 0) return linked.reduce((s, a) => s + a.qty * a.price, 0);
    return initialData.bankAccounts.find(a => a.id === id)?.balance ?? 0;
  };

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
  const total      = bankTotal + bolsaVal + criptoVal + hysBalance;

  const barParts = [
    { label: "Bolsa",            value: bolsaVal,    color: "var(--accent)" },
    { label: "Cripto",           value: criptoVal,   color: "#8a8f98" },
    { label: "Alto rendimiento", value: hysBalance,  color: "#f59e0b" },
    { label: "Bancos",           value: bankTotal,   color: "var(--dim)" },
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
          <Bal n={total} privacy={privacy} />
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
                  <span className="text-fg" style={monoStyle}>{privacy ? "••••" : COP(p.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Alto rendimiento */}
      {initialData.hys && (
        <Section title="Alto rendimiento">
          <div className={`${cardClass} cursor-pointer`} onClick={() => router.push("/savings")}>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <div className="text-[14px] font-medium">Alto Rendimiento</div>
                <div className="text-[11.5px] text-dim">TEA {initialData.hys.rate.toFixed(2)}% · Ver detalle →</div>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
                style={{ background: "#f59e0b22", color: "#f59e0b" }}>HYS</span>
            </div>
            <div className="text-[22px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
              <Bal n={hysBalance} privacy={privacy} />
            </div>
          </div>
        </Section>
      )}

      {/* Bolsa accounts */}
      {bolsaAccounts.length > 0 ? (
        <Section title="Inversiones / Bolsa">
          {bolsaAccounts.map((a) => (
            <AccountCard key={a.id} name={a.name} subtitle={a.bank} balance={bolsaBalance(a.id)}
              privacy={privacy} tag="Bolsa" tagColor="var(--accent)22"
              onEdit={() => setEditItem(a)} onDelete={() => handleDelete(a.id)} />
          ))}
        </Section>
      ) : stockTotal > 0 ? (
        <Section title="Inversiones / Bolsa">
          <AccountCard name="Portafolio en bolsa" subtitle="Sin broker asignado" balance={stockTotal}
            privacy={privacy} tag="Bolsa" tagColor="var(--accent)22" />
        </Section>
      ) : null}

      {/* Cripto accounts */}
      {criptoAccounts.length > 0 ? (
        <Section title="Cripto">
          {criptoAccounts.map((a) => (
            <AccountCard key={a.id} name={a.name} subtitle={a.bank} balance={criptoBalance(a.id)}
              privacy={privacy} tag="Cripto" tagColor="#8a8f9822"
              onEdit={() => setEditItem(a)} onDelete={() => handleDelete(a.id)} />
          ))}
        </Section>
      ) : cryptoTotal > 0 ? (
        <Section title="Cripto">
          <AccountCard name="Portafolio cripto" subtitle="Sin exchange asignado" balance={cryptoTotal}
            privacy={privacy} tag="Cripto" tagColor="#8a8f9822" />
        </Section>
      ) : null}

      {/* Bank accounts */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[11.5px] text-dim font-medium tracking-[0.04em] uppercase">Cuentas bancarias</div>
          <button onClick={() => setShowAdd(true)}
            className="border border-line bg-panel2 text-muted text-[12px] px-3 py-1.5 rounded-lg cursor-pointer">
            + Agregar cuenta
          </button>
        </div>
        {bankAccounts.length === 0 ? (
          <div className={`${cardClass} text-muted text-[13px]`}>
            No hay cuentas bancarias. Agrega una para empezar.
          </div>
        ) : (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {bankAccounts.map((a) => (
              <AccountCard key={a.id} name={a.name} subtitle={a.bank} balance={a.balance}
                privacy={privacy}
                onEdit={() => setEditItem(a)} onDelete={() => handleDelete(a.id)} />
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
    <div className="border border-line bg-panel rounded-2xl px-5 py-4.5">
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
