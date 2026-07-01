"use client";

import { useState, useCallback, useEffect } from "react";
import { signOut } from "next-auth/react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { COLORS } from "../data/constants";
import { COP, PCT, uid, today, uniqueTickers } from "../utils/formatters";
import * as XLSX from "xlsx";
import { fetchPricesFromAPI, fetchTRM } from "../utils/api";
import {
  saveStocks as dbSaveStocks,
  saveCrypto as dbSaveCrypto,
  saveFinances as dbSaveFinances,
  saveHys as dbSaveHys,
  savePrices as dbSavePrices,
  saveTargets as dbSaveTargets,
  saveCash as dbSaveCash,
  saveConfig as dbSaveConfig,
} from "../../lib/actions";
import {
  computeStockMetrics,
  computeCryptoMetrics,
  computeHysBalance,
  computeHysProjection,
  computeMonthlyFinances,
  computeExpenseByCategory
} from "../utils/calculations";
import { Tab, Card, Input, Select, Btn, Section, Modal } from "./UI/UIComponents";
import type { AllData } from "../types";
import { Table } from "./UI/Table";
import { PriceInput } from "./UI/PriceInput";
import { StockForm } from "./Forms/StockForm";
import { FinForm } from "./Forms/FinForm";
import { HysForm } from "./Forms/HysForm";
import { PriceEditor } from "./Forms/PriceEditor";

interface FinanceAppProps {
  initialData: AllData
  user: { id?: string; name?: string | null; email?: string | null; image?: string | null }
}

export default function FinanceApp({ initialData, user }: FinanceAppProps) {
  const d = initialData;

  // ── THEME ──
  const [theme, setTheme] = useState<"dark" | "light">(d.config?.theme ?? "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === "dark" ? "light" : "dark"));
  }, []);

  const saveThemePref = useCallback((t: "dark" | "light") => {
    setTheme(t);
    dbSaveConfig(t).catch(console.error);
  }, []);

  // ── STATE ──
  const [tab, setTab] = useState("dashboard");
  const [perfilTab, setPerfilTab] = useState<"info" | "config">("info");
  const [stocks, setStocks] = useState(d.stocks ?? []);
  const [crypto, setCrypto] = useState(d.crypto ?? []);
  const [finances, setFinances] = useState(d.finances ?? []);
  const [hys, setHys] = useState(d.hys ?? { rate: 9.25, movements: [] });
  const [prices, setPrices] = useState(d.prices ?? {});
  const [targets, setTargets] = useState(d.targets ?? {});
  const [cash, setCash] = useState(d.cash ?? { banco: 0 });
  const [fetching, setFetching] = useState(false);
  const [trm, setTrm] = useState<number | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [finFilter, setFinFilter] = useState({ dateFrom: "", dateTo: "", type: "", category: "", search: "" });
  const [editingFin, setEditingFin] = useState<any>(null);

  // ── SAVE CALLBACKS ──
  const saveStocks   = useCallback(v => { setStocks(v);   dbSaveStocks(v).catch(console.error); }, []);
  const saveCrypto   = useCallback(v => { setCrypto(v);   dbSaveCrypto(v).catch(console.error); }, []);
  const saveFinances = useCallback(v => { setFinances(v); dbSaveFinances(v).catch(console.error); }, []);
  const saveHys      = useCallback(v => { setHys(v);      dbSaveHys(v).catch(console.error); }, []);
  const savePrices   = useCallback(v => { setPrices(v);   dbSavePrices(v).catch(console.error); }, []);
  const saveTargets  = useCallback(v => { setTargets(v);  dbSaveTargets(v).catch(console.error); }, []);
  const saveCash     = useCallback(v => { setCash(v);     dbSaveCash(v).catch(console.error); }, []);

  // ── FETCH PRICES ──
  const fetchAllPrices = useCallback(async () => {
    setFetching(true);
    try {
      const [np, nt] = await Promise.all([
        fetchPricesFromAPI(uniqueTickers(stocks), uniqueTickers(crypto)),
        fetchTRM()
      ]);
      const t = nt || trm || 4200;
      setTrm(t);
      const merged = { ...prices };
      for (const [k, v] of Object.entries(np as Record<string, number>)) {
        merged[k] = k.startsWith("C_") && v < 1000000 ? Math.round(v * t) : v;
      }
      savePrices(merged);
      setLastFetch(new Date().toLocaleTimeString("es-CO"));
    } catch (e) { console.error(e); }
    setFetching(false);
  }, [stocks, crypto, prices, trm, savePrices]);

  // ── METRICS ──
  const stockMetrics  = computeStockMetrics(stocks, prices, targets);
  const cryptoMetrics = computeCryptoMetrics(crypto, prices);
  const totalStocks   = stockMetrics.reduce((s, m) => s + m.marketVal, 0);
  const totalCrypto   = cryptoMetrics.reduce((s, m) => s + m.marketVal, 0);
  const totalComm     = [...stockMetrics, ...cryptoMetrics].reduce((s, m) => s + m.totalComm, 0);

  // ── HYS ──
  const hysState   = computeHysBalance(hys);
  const hysBalance = hysState.balance;
  const hysPj      = computeHysProjection(hysBalance, hysState.dailyRate) as any[];
  const hysFinal   = hysPj.length ? hysPj[11].fin : hysBalance;

  // ── FINANCES ──
  const totalIn  = finances.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amount, 0);
  const totalOut = finances.filter(f => f.type === "egreso").reduce((s, f) => s + f.amount, 0);

  const filteredFin = finances.filter(f => {
    if (finFilter.dateFrom && f.date < finFilter.dateFrom) return false;
    if (finFilter.dateTo   && f.date > finFilter.dateTo)   return false;
    if (finFilter.type     && f.type !== finFilter.type)    return false;
    if (finFilter.category && f.category !== finFilter.category) return false;
    if (finFilter.search && !((f.desc || "") + (f.category || "")).toLowerCase().includes(finFilter.search.toLowerCase())) return false;
    return true;
  });

  const filteredIn  = filteredFin.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amount, 0);
  const filteredOut = filteredFin.filter(f => f.type === "egreso").reduce((s, f) => s + f.amount, 0);
  const hasFilter   = !!(finFilter.dateFrom || finFilter.dateTo || finFilter.type || finFilter.category || finFilter.search);
  const allCategories = [...new Set(finances.map(f => f.category))].sort();

  const handleFinanceSubmit = (entry: any) => {
    const nextFinances = editingFin
      ? finances.map(f => (f.id === editingFin.id ? { ...f, ...entry } : f))
      : [...finances, entry];
    saveFinances(nextFinances);
    setEditingFin(null);
  };

  const dineroReal    = (cash.banco || 0) + hysBalance;
  const totalPortafolio = totalStocks + totalCrypto;
  const distClase = [{ name: "Acciones", value: totalStocks }, { name: "Cripto", value: totalCrypto }].filter(d => d.value > 0);
  const distActivo = [
    ...stockMetrics.filter(m => m.marketVal > 0).map(m => ({ name: m.ticker, value: m.marketVal })),
    ...cryptoMetrics.filter(m => m.marketVal > 0).map(m => ({ name: m.ticker, value: m.marketVal }))
  ];

  // ── EXPORT EXCEL ──
  const exportExcel = useCallback((rows: typeof finances, filename: string) => {
    const data = rows.map(f => ({
      Fecha: f.date,
      Tipo: f.type === "ingreso" ? "Ingreso" : "Egreso",
      Categoría: f.category,
      Descripción: f.desc ?? "",
      Monto: f.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finanzas");
    XLSX.writeFile(wb, filename);
  }, [finances]);

  const TICK = { fill: "var(--muted)", fontSize: 9 };

  // ── DASHBOARD ──
  const Dashboard = () => (
    <div>
      <div className="flex justify-between items-center mb-2.5 flex-wrap gap-1.5">
        <Btn onClick={fetchAllPrices} color={fetching ? "" : "#2D9CDB"} small disabled={fetching}>
          {fetching ? "Actualizando..." : "Actualizar precios"}
        </Btn>
        <div className="flex gap-2 items-center">
          {trm      && <span className="text-[10px] text-muted">TRM: ${Math.round(trm).toLocaleString("es-CO")}</span>}
          {lastFetch && <span className="text-[10px] text-dim">Última: {lastFetch}</span>}
        </div>
      </div>

      <Section title="Dinero Real Disponible">
        <div className="flex gap-2.5 flex-wrap mb-2.5">
          <Card title="BANCO" value={COP(cash.banco || 0)} />
          <Card title="ALTO RENDIMIENTO" value={COP(hysBalance)} sub={hysState.daysSince > 0 ? `+${hysState.daysSince}d compuestos` : ""} />
          <Card title="TOTAL REAL" value={COP(dineroReal)} />
        </div>
        <div className="flex gap-1.5 items-center mb-1.5">
          <span className="text-[11px] text-muted">Saldo banco:</span>
          <PriceInput value={cash.banco || 0} placeholder="Saldo banco" width={130} onChange={n => saveCash({ ...cash, banco: n })} />
        </div>
      </Section>

      <Section title="Portafolio (Acciones + Cripto)">
        <div className="flex gap-2.5 flex-wrap mb-2.5">
          <Card title="ACCIONES"         value={COP(totalStocks)} />
          <Card title="CRIPTO"           value={COP(totalCrypto)} />
          <Card title="TOTAL INVERSIONES" value={COP(totalPortafolio)} />
          <Card title="COMISIONES"       value={COP(totalComm)} />
        </div>
      </Section>

      <div className="flex gap-3.5 flex-wrap">
        {distClase.length > 0 && (
          <Section title="Distribución inversiones">
            <ResponsiveContainer width={250} height={180}>
              <PieChart>
                <Pie data={distClase} cx="50%" cy="50%" innerRadius={40} outerRadius={72} dataKey="value"
                  label={({ name, percent = 0 }: { name?: string; percent?: number }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {distClase.map((_, i) => <Cell key={i} fill={["#7B4FB5", "#F39C12"][i]} />)}
                </Pie>
                <Tooltip formatter={v => COP(v)} />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        )}
        {distActivo.length > 0 && (
          <Section title="Peso por activo">
            <ResponsiveContainer width={250} height={180}>
              <PieChart>
                <Pie data={distActivo} cx="50%" cy="50%" innerRadius={40} outerRadius={72} dataKey="value"
                  label={({ name, percent = 0 }: { name?: string; percent?: number }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {distActivo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => COP(v)} />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        )}
        {computeMonthlyFinances(finances).length > 0 && (
          <Section title="Ingresos vs Egresos">
            <ResponsiveContainer width={320} height={180}>
              <BarChart data={computeMonthlyFinances(finances)}>
                <XAxis dataKey="month" tick={TICK} />
                <YAxis tick={TICK} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                <Tooltip formatter={v => COP(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="ingresos" fill="#27AE60" name="Ingresos" radius={[3,3,0,0]} />
                <Bar dataKey="egresos"  fill="#E94560" name="Egresos"  radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
      </div>
      <div className="flex gap-3.5 flex-wrap">
        {computeExpenseByCategory(finances).length > 0 && (
          <Section title="Gastos por categoría">
            <ResponsiveContainer width={300} height={180}>
              <BarChart data={computeExpenseByCategory(finances).slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={TICK} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                <YAxis type="category" dataKey="name" tick={TICK} width={80} />
                <Tooltip formatter={v => COP(v)} />
                <Bar dataKey="value" fill="#E94560" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
        {hysPj.length > 0 && hysBalance > 0 && (
          <Section title={`Proyección Alto Rend. → ${COP(hysFinal)}`}>
            <ResponsiveContainer width={300} height={180}>
              <LineChart data={hysPj}>
                <XAxis dataKey="mes" tick={TICK} />
                <YAxis tick={TICK} tickFormatter={v => "$" + (v / 1e6).toFixed(1) + "M"} domain={["dataMin-20000", "dataMax+20000"]} />
                <Tooltip formatter={v => COP(v)} />
                <Line type="monotone" dataKey="fin" stroke="#16A085" strokeWidth={2} dot={{ r: 2 }} name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        )}
      </div>
    </div>
  );

  // ── PORTAFOLIO ──
  const Portafolio = () => (
    <div>
      <Section title="Registrar operación">
        <StockForm onAdd={tx => saveStocks([...stocks, tx])} saveCash={saveCash} cash={cash} />
      </Section>
      {stockMetrics.length > 0 && (
        <>
          <Section title="Precios actuales y objetivos">
            <div className="flex gap-1.5 items-center mb-1.5">
              <Btn onClick={fetchAllPrices} color={fetching ? "" : "#2D9CDB"} small disabled={fetching}>
                {fetching ? "⏳" : "🔄 Actualizar"}
              </Btn>
            </div>
            <PriceEditor metrics={stockMetrics} prices={prices} setPrices={savePrices} save={() => {}} />
            <div className="flex gap-1.5 flex-wrap mb-1.5">
              {stockMetrics.map(m => (
                <div key={m.ticker} className="flex gap-1 items-center">
                  <span className="text-muted text-[10px]">Obj {m.ticker}</span>
                  <PriceInput value={targets[m.ticker] || ""} placeholder="Objetivo" color="#F39C12" onChange={n => saveTargets({ ...targets, [m.ticker]: n })} />
                </div>
              ))}
            </div>
          </Section>
          <Section title="PPA y métricas">
            <Table
              cols={[
                { key: "ticker",   label: "Acción",   sortKey: r => r.ticker },
                { label: "Cant.",  render: r => r.holding.toFixed(0), sortKey: r => r.holding,   align: "right" },
                { label: "PPA",    render: r => COP(r.ppa),           sortKey: r => r.ppa,        align: "right" },
                { label: "Valor",  render: r => COP(r.marketVal),     sortKey: r => r.marketVal,  align: "right" },
                { label: "G/P",    render: r => COP(r.gain),          sortKey: r => r.gain,       align: "right", color: r => r.gain >= 0 ? "#27AE60" : "#E94560" },
                { label: "%",      render: r => r.current ? PCT(r.ret) : "—", sortKey: r => r.ret, align: "right", color: r => r.ret >= 0 ? "#27AE60" : "#E94560" },
                { label: "Obj.",   render: r => r.target ? COP(r.targetGain) : "—", sortKey: r => r.targetGain, align: "right" },
                { label: "Obj%",   render: r => r.target ? PCT(r.targetRet) : "—",  sortKey: r => r.targetRet,  align: "right" },
                { label: "Com.",   render: r => COP(r.totalComm), sortKey: r => r.totalComm, align: "right" }
              ]}
              rows={stockMetrics}
            />
          </Section>
        </>
      )}
      <Section title="Historial">
        <Table
          cols={[
            { key: "date",   label: "Fecha",  sortKey: r => r.date },
            { key: "ticker", label: "Acción", sortKey: r => r.ticker },
            { label: "Qty",    render: r => r.qty,          sortKey: r => r.qty,        align: "right" },
            { label: "Precio", render: r => COP(r.priceCOP), sortKey: r => r.priceCOP,  align: "right", color: r => r.priceCOP > 0 ? "#27AE60" : "#E94560" },
            { label: "Fuente", render: r => r.source || "—", sortKey: r => r.source },
            { label: "Com.",   render: r => COP(r.commission), sortKey: r => r.commission, align: "right" }
          ]}
          rows={stocks}
          onDelete={id => saveStocks(stocks.filter(s => s.id !== id))}
        />
      </Section>
    </div>
  );

  // ── CRIPTO ──
  const CriptoTab = () => (
    <div>
      <Section title="Registrar operación">
        <StockForm onAdd={tx => saveCrypto([...crypto, tx])} saveCash={saveCash} cash={cash} type="crypto" />
      </Section>
      {cryptoMetrics.length > 0 && (
        <>
          <Section title="Precios actuales">
            <div className="flex gap-1.5 items-center mb-1.5">
              <Btn onClick={fetchAllPrices} color={fetching ? "" : "#2D9CDB"} small disabled={fetching}>
                {fetching ? "⏳" : "🔄 Actualizar"}
              </Btn>
              {trm && <span className="text-[10px] text-muted">TRM: ${Math.round(trm).toLocaleString("es-CO")}</span>}
            </div>
            <PriceEditor metrics={cryptoMetrics} prefix="C_" prices={prices} setPrices={savePrices} save={() => {}} />
          </Section>
          <Section title="Métricas">
            <Table
              cols={[
                { key: "ticker", label: "Cripto",   sortKey: r => r.ticker },
                { label: "Cartera", render: r => r.holding.toFixed(8), sortKey: r => r.holding,  align: "right" },
                { label: "PPA",     render: r => COP(r.ppa),           sortKey: r => r.ppa,       align: "right" },
                { label: "Valor",   render: r => COP(r.marketVal),     sortKey: r => r.marketVal, align: "right" },
                { label: "G/P",     render: r => COP(r.gain),          sortKey: r => r.gain,      align: "right", color: r => r.gain >= 0 ? "#27AE60" : "#E94560" },
                { label: "%",       render: r => r.current ? PCT(r.ret) : "—", sortKey: r => r.ret, align: "right", color: r => r.ret >= 0 ? "#27AE60" : "#E94560" },
                { label: "Com.",    render: r => COP(r.totalComm), sortKey: r => r.totalComm, align: "right" }
              ]}
              rows={cryptoMetrics}
            />
          </Section>
        </>
      )}
      <Section title="Historial">
        <Table
          cols={[
            { key: "date",   label: "Fecha" },
            { key: "ticker", label: "Cripto" },
            { label: "Qty",  render: r => r.qty.toFixed(8), align: "right" },
            { label: "COP",  render: r => COP(r.priceCOP),  align: "right", color: r => r.priceCOP > 0 ? "#27AE60" : "#E94560" },
            { label: "Com.", render: r => COP(r.commission), align: "right" }
          ]}
          rows={crypto}
          onDelete={id => saveCrypto(crypto.filter(c => c.id !== id))}
        />
      </Section>
    </div>
  );

  // ── FINANZAS ──
  const Finanzas = () => (
    <div>
      <Section title="Registrar ingreso o gasto">
        <FinForm key="new" saveFinances={saveFinances} finances={finances} editingItem={null} onSave={handleFinanceSubmit} />
      </Section>
      <Modal open={!!editingFin} onClose={() => setEditingFin(null)} title={`Editar movimiento`}>
        <FinForm key={editingFin?.id || "edit"} editingItem={editingFin} onSave={handleFinanceSubmit} onCancel={() => setEditingFin(null)} />
      </Modal>
      <div className="flex gap-2.5 flex-wrap mb-3.5">
        <Card title="INGRESOS" value={COP(filteredIn)} sub={hasFilter ? `de ${COP(totalIn)} total` : ""} />
        <Card title="EGRESOS"  value={COP(filteredOut)} sub={hasFilter ? `de ${COP(totalOut)} total` : ""} />
        <Card title="BALANCE"  value={COP(filteredIn - filteredOut)} sub={hasFilter ? `${filteredFin.length} de ${finances.length} registros` : "(no es tu dinero real)"} />
      </div>
      <Section title="Filtros">
        <div className="flex gap-1.5 flex-wrap items-end mb-2">
          <Input label="Desde"     type="date" value={finFilter.dateFrom}  onChange={e => setFinFilter({ ...finFilter, dateFrom: e.target.value })}  className="w-[120px]" />
          <Input label="Hasta"     type="date" value={finFilter.dateTo}    onChange={e => setFinFilter({ ...finFilter, dateTo: e.target.value })}    className="w-[120px]" />
          <Select label="Tipo"     options={["", "ingreso", "egreso"]}     value={finFilter.type}     onChange={e => setFinFilter({ ...finFilter, type: e.target.value })} />
          <Select label="Categoría" options={["", ...allCategories]}       value={finFilter.category} onChange={e => setFinFilter({ ...finFilter, category: e.target.value })} />
          <Input label="Buscar"    value={finFilter.search} onChange={e => setFinFilter({ ...finFilter, search: e.target.value })} placeholder="texto..." />
          <Btn onClick={() => setFinFilter({ dateFrom: "", dateTo: "", type: "", category: "", search: "" })} small>Limpiar</Btn>
          <Btn onClick={() => exportExcel(filteredFin, `finanzas-filtrado-${new Date().toISOString().slice(0,10)}.xlsx`)} small color="#27AE60">⬇ Excel filtrado</Btn>
          <Btn onClick={() => exportExcel(finances,    `finanzas-todo-${new Date().toISOString().slice(0,10)}.xlsx`)}    small color="#2D9CDB">⬇ Excel todo</Btn>
        </div>
        {hasFilter && (
          <div className="text-[11px] text-muted mb-1.5">
            Filtrado: {filteredFin.length} de {finances.length} | Ingresos: {COP(filteredIn)} | Egresos: {COP(filteredOut)} | Balance: {COP(filteredIn - filteredOut)}
          </div>
        )}
      </Section>
      <div className="flex gap-3.5 flex-wrap">
        {computeMonthlyFinances(filteredFin).length > 0 && (
          <Section title="Mensual">
            <ResponsiveContainer width={380} height={200}>
              <BarChart data={computeMonthlyFinances(filteredFin)}>
                <XAxis dataKey="month" tick={TICK} />
                <YAxis tick={TICK} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                <Tooltip formatter={v => COP(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="ingresos" fill="#27AE60" name="Ingresos" radius={[3,3,0,0]} />
                <Bar dataKey="egresos"  fill="#E94560" name="Egresos"  radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
        {computeExpenseByCategory(filteredFin).length > 0 && (
          <Section title="Por categoría">
            <ResponsiveContainer width={300} height={200}>
              <BarChart data={computeExpenseByCategory(filteredFin).slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={TICK} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                <YAxis type="category" dataKey="name" tick={TICK} width={80} />
                <Tooltip formatter={v => COP(v)} />
                <Bar dataKey="value" fill="#E94560" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
      </div>
      <Section title={`Historial (${filteredFin.length} registros)`}>
        <Table
          cols={[
            { key: "date",     label: "Fecha",      sortKey: r => r.date },
            { label: "Tipo",   render: r => r.type === "ingreso" ? "↑ Ingreso" : "↓ Egreso", sortKey: r => r.type, color: r => r.type === "ingreso" ? "#27AE60" : "#E94560" },
            { key: "category", label: "Categoría",  sortKey: r => r.category },
            { label: "Monto",  render: r => COP(r.amount), sortKey: r => r.amount, align: "right" },
            { key: "desc",     label: "Descripción", noSort: true },
            {
              label: "", noSort: true,
              render: r => (
                <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingFin(r); }}
                  className="bg-transparent border-none text-muted cursor-pointer text-[12px]">✎</button>
              )
            }
          ]}
          rows={filteredFin}
          onDelete={id => saveFinances(finances.filter(f => f.id !== id))}
        />
      </Section>
    </div>
  );

  // ── ALTO RENDIMIENTO ──
  const AltoRend = () => (
    <div>
      <div className="flex gap-1.5 items-end mb-3.5">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] text-muted">Tasa EA (%)</label>
          <PriceInput value={hys.rate} placeholder="9.25" color="#16A085" width={70} onChange={n => saveHys({ ...hys, rate: n })} />
        </div>
        <div className="text-[11px] text-muted pb-1.5">
          Diaria: {(hysState.dailyRate * 100).toFixed(5)}%
        </div>
      </div>
      <Section title="Registrar movimiento">
        <HysForm saveHys={saveHys} hys={hys} saveCash={saveCash} cash={cash} />
        <div className="text-[10px] text-dim -mt-1.5">
          APERTURA=saldo inicial · INGRESO=metes (debita banco) · RETIRO=sacas (acredita banco) · SALDO=anota saldo real. Tasa vigente ({hys.rate}%) se guarda en cada movimiento.
        </div>
      </Section>
      <div className="flex gap-2.5 flex-wrap mb-3.5">
        <Card title="SALDO ACTUAL"         value={COP(hysBalance)}  sub={hysState.daysSince > 0 ? `+${hysState.daysSince}d compuestos` : ""} />
        <Card title="PROYECTADO 1 AÑO"     value={COP(hysFinal)}    sub={`+${COP(hysFinal - hysBalance)}`} />
        <Card title="GANADO DESDE APERTURA" value={COP(hysBalance - (hys.movements.find(m => m.type === "APERTURA")?.amount || 0))} />
      </div>
      <Section title="Movimientos">
        <Table
          cols={[
            { key: "date", label: "Fecha" },
            { key: "type", label: "Tipo" },
            { label: "Monto",  render: r => COP(r.amount), align: "right", color: r => r.type === "RETIRO" ? "#E94560" : "#27AE60" },
            { label: "Saldo",  render: r => r.balance != null ? COP(r.balance) : "—", align: "right" },
            { label: "Tasa",   render: r => r.rate ? r.rate + "%" : "—", align: "right", color: () => "#2D9CDB" },
            { key: "note", label: "Nota" }
          ]}
          rows={hys.movements}
          onDelete={id => saveHys({ ...hys, movements: hys.movements.filter(m => m.id !== id) })}
        />
      </Section>
      {hysPj.length > 0 && hysBalance > 0 && (
        <Section title="Proyección 12 meses">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hysPj}>
              <XAxis dataKey="mes" tick={TICK} />
              <YAxis tick={TICK} tickFormatter={v => "$" + (v / 1e6).toFixed(1) + "M"} />
              <Tooltip formatter={v => COP(v)} />
              <Line type="monotone" dataKey="fin" stroke="#16A085" strokeWidth={2} dot={{ r: 2 }} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
          <Table
            cols={[
              { label: "Mes",     render: r => r.mes,            align: "center" },
              { label: "Inicio",  render: r => COP(r.inicio),    align: "right" },
              { label: "Interés", render: r => COP(r.interes),   align: "right", color: () => "#27AE60" },
              { label: "Final",   render: r => COP(r.fin),       align: "right" }
            ]}
            rows={hysPj}
          />
        </Section>
      )}
    </div>
  );

  // ── PERFIL ──
  const PerfilSection = () => (
    <div>
      <div className="flex gap-0 mb-5 border-b border-border">
        <Tab active={perfilTab === "info"}   label="Mi Perfil"      onClick={() => setPerfilTab("info")} />
        <Tab active={perfilTab === "config"} label="Configuración"  onClick={() => setPerfilTab("config")} />
      </div>

      {perfilTab === "info" && (
        <div className="max-w-sm">
          <Section title="Información de cuenta">
            <div className="flex flex-col gap-3.5">
              {user?.image && (
                <img src={user.image} alt="avatar" className="w-14 h-14 rounded-full border border-border" />
              )}
              <div>
                <div className="text-[11px] text-muted mb-0.5 uppercase tracking-[0.06em]">Nombre</div>
                <div className="text-sm text-text">{user?.name || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted mb-0.5 uppercase tracking-[0.06em]">Correo</div>
                <div className="text-sm text-text">{user?.email || "—"}</div>
              </div>
            </div>
          </Section>
        </div>
      )}

      {perfilTab === "config" && (
        <div className="max-w-sm">
          <Section title="Apariencia">
            <p className="text-[12px] text-muted mb-3">
              Tema preferido — se guarda en tu perfil y aplica al iniciar sesión.
            </p>
            <div className="flex gap-2.5">
              {(["dark", "light"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => saveThemePref(t)}
                  className={`px-5 py-2.5 rounded-lg border cursor-pointer text-[13px] flex items-center gap-2 transition-colors
                    ${theme === t
                      ? "border-text bg-btn text-text font-medium"
                      : "border-border bg-transparent text-muted font-normal"
                    }`}
                >
                  {t === "dark" ? "🌙 Oscuro" : "☀ Claro"}
                  {theme === t && <span className="text-[10px] text-muted">activo</span>}
                </button>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );

  // ── RENDER ──
  return (
    <div data-theme={theme} className="bg-bg min-h-screen text-text">
      <div className="bg-bg border-b border-border px-5 py-2.5">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-sm font-medium text-text">Mi Portafolio</div>
          <div className="flex gap-2 items-center">
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="bg-transparent border-none cursor-pointer text-[15px] text-muted px-1 leading-none"
            >
              {theme === "dark" ? "☀" : "🌙"}
            </button>
            <span className="text-[10px] text-dim">{user?.email}</span>
            <Btn onClick={() => signOut()} small>Salir</Btn>
          </div>
        </div>
        <div className="flex flex-wrap gap-0">
          <Tab active={tab === "dashboard"} label="Dashboard"     onClick={() => setTab("dashboard")} />
          <Tab active={tab === "portafolio"} label="Acciones"    onClick={() => setTab("portafolio")} />
          <Tab active={tab === "cripto"}    label="Cripto"        onClick={() => setTab("cripto")} />
          <Tab active={tab === "finanzas"}  label="Finanzas"      onClick={() => setTab("finanzas")} />
          <Tab active={tab === "hys"}       label="Alto Rendim."  onClick={() => setTab("hys")} />
          <Tab active={tab === "perfil"}    label="Perfil"        onClick={() => setTab("perfil")} />
        </div>
      </div>
      <div className="p-5 max-w-[1100px] mx-auto">
        {tab === "dashboard"  && <Dashboard />}
        {tab === "portafolio" && <Portafolio />}
        {tab === "cripto"     && <CriptoTab />}
        {tab === "finanzas"   && <Finanzas />}
        {tab === "hys"        && <AltoRend />}
        {tab === "perfil"     && <PerfilSection />}
      </div>
    </div>
  );
}
