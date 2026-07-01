"use client";

import { useState, useCallback } from "react";
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
  // ── STATE ──
  const [tab, setTab] = useState("dashboard");
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

  // ── SAVE CALLBACKS (optimistic + Server Action) ──
  const saveStocks = useCallback(v => { setStocks(v); dbSaveStocks(v).catch(console.error); }, []);
  const saveCrypto = useCallback(v => { setCrypto(v); dbSaveCrypto(v).catch(console.error); }, []);
  const saveFinances = useCallback(v => { setFinances(v); dbSaveFinances(v).catch(console.error); }, []);
  const saveHys = useCallback(v => { setHys(v); dbSaveHys(v).catch(console.error); }, []);
  const savePrices = useCallback(v => { setPrices(v); dbSavePrices(v).catch(console.error); }, []);
  const saveTargets = useCallback(v => { setTargets(v); dbSaveTargets(v).catch(console.error); }, []);
  const saveCash = useCallback(v => { setCash(v); dbSaveCash(v).catch(console.error); }, []);


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
  const stockMetrics = computeStockMetrics(stocks, prices, targets);
  const cryptoMetrics = computeCryptoMetrics(crypto, prices);
  const totalStocks = stockMetrics.reduce((s, m) => s + m.marketVal, 0);
  const totalCrypto = cryptoMetrics.reduce((s, m) => s + m.marketVal, 0);
  const totalComm = [...stockMetrics, ...cryptoMetrics].reduce((s, m) => s + m.totalComm, 0);

  // ── HYS ──
  const hysState = computeHysBalance(hys);
  const hysBalance = hysState.balance;
  const hysPj = computeHysProjection(hysBalance, hysState.dailyRate) as any[];
  const hysFinal = hysPj.length ? hysPj[11].fin : hysBalance;

  // ── FINANCES ──
  const totalIn = finances.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amount, 0);
  const totalOut = finances.filter(f => f.type === "egreso").reduce((s, f) => s + f.amount, 0);

  const filteredFin = finances.filter(f => {
    if (finFilter.dateFrom && f.date < finFilter.dateFrom) return false;
    if (finFilter.dateTo && f.date > finFilter.dateTo) return false;
    if (finFilter.type && f.type !== finFilter.type) return false;
    if (finFilter.category && f.category !== finFilter.category) return false;
    if (finFilter.search && !((f.desc || "") + (f.category || "")).toLowerCase().includes(finFilter.search.toLowerCase())) return false;
    return true;
  });

  const filteredIn = filteredFin.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amount, 0);
  const filteredOut = filteredFin.filter(f => f.type === "egreso").reduce((s, f) => s + f.amount, 0);
  const hasFilter = !!(finFilter.dateFrom || finFilter.dateTo || finFilter.type || finFilter.category || finFilter.search);
  const allCategories = [...new Set(finances.map(f => f.category))].sort();

  const handleFinanceSubmit = entry => {
    const nextFinances = editingFin
      ? finances.map(f => (f.id === editingFin.id ? { ...f, ...entry } : f))
      : [...finances, entry];
    saveFinances(nextFinances);
    setEditingFin(null);
  };

  const dineroReal = (cash.banco || 0) + hysBalance;
  const totalPortafolio = totalStocks + totalCrypto;
  const distClase = [{ name: "Acciones", value: totalStocks }, { name: "Cripto", value: totalCrypto }].filter(d => d.value > 0);
  const distActivo = [
    ...stockMetrics.filter(m => m.marketVal > 0).map(m => ({ name: m.ticker, value: m.marketVal })),
    ...cryptoMetrics.filter(m => m.marketVal > 0).map(m => ({ name: m.ticker, value: m.marketVal }))
  ];

  // ── DASHBOARD ──
  const Dashboard = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Btn onClick={fetchAllPrices} color={fetching ? "" : "#2D9CDB"} small disabled={fetching}>
            {fetching ? "Actualizando..." : "Actualizar precios"}
          </Btn>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {trm && <span style={{ fontSize: 10, color: "#555" }}>TRM: ${Math.round(trm).toLocaleString("es-CO")}</span>}
          {lastFetch && <span style={{ fontSize: 10, color: "#333" }}>Última: {lastFetch}</span>}
          <span style={{ fontSize: 10, color: "#444" }}>{user?.email}</span>
          <Btn onClick={() => signOut()} color="" small>Salir</Btn>
        </div>
      </div>

      <Section title="💰 Dinero Real Disponible">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <Card title="BANCO (sin rendimiento)" value={COP(cash.banco || 0)} />
          <Card title="ALTO RENDIMIENTO" value={COP(hysBalance)} sub={hysState.daysSince > 0 ? `+${hysState.daysSince}d compuestos` : ""} />
          <Card title="DINERO REAL TOTAL" value={COP(dineroReal)} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#aaa" }}>Ajustar saldo banco:</span>
          <PriceInput value={cash.banco || 0} placeholder="Saldo banco" width={130} onChange={n => saveCash({ ...cash, banco: n })} />
        </div>
      </Section>

      <Section title="📊 Portafolio de Inversiones (Acciones + Cripto)">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <Card title="ACCIONES" value={COP(totalStocks)} />
          <Card title="CRIPTO" value={COP(totalCrypto)} />
          <Card title="TOTAL INVERSIONES" value={COP(totalPortafolio)} />
          <Card title="COMISIONES" value={COP(totalComm)} />
        </div>
      </Section>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {distClase.length > 0 && (
          <Section title="Distribución inversiones">
            <ResponsiveContainer width={250} height={180}>
              <PieChart>
                <Pie data={distClase} cx="50%" cy="50%" innerRadius={40} outerRadius={72} dataKey="value" label={({ name, percent = 0 }: { name?: string; percent?: number }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
                <Pie data={distActivo} cx="50%" cy="50%" innerRadius={40} outerRadius={72} dataKey="value" label={({ name, percent = 0 }: { name?: string; percent?: number }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 9 }} />
                <YAxis tick={{ fill: "#888", fontSize: 9 }} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                <Tooltip formatter={v => COP(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="ingresos" fill="#27AE60" name="Ingresos" radius={[3, 3, 0, 0]} />
                <Bar dataKey="egresos" fill="#E94560" name="Egresos" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {computeExpenseByCategory(finances).length > 0 && (
          <Section title="Gastos por categoría">
            <ResponsiveContainer width={300} height={180}>
              <BarChart data={computeExpenseByCategory(finances).slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fill: "#888", fontSize: 9 }} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#aaa", fontSize: 9 }} width={80} />
                <Tooltip formatter={v => COP(v)} />
                <Bar dataKey="value" fill="#E94560" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
        {hysPj.length > 0 && hysBalance > 0 && (
          <Section title={`Proyección Alto Rend. → ${COP(hysFinal)}`}>
            <ResponsiveContainer width={300} height={180}>
              <LineChart data={hysPj}>
                <XAxis dataKey="mes" tick={{ fill: "#888", fontSize: 9 }} />
                <YAxis tick={{ fill: "#888", fontSize: 9 }} tickFormatter={v => "$" + (v / 1e6).toFixed(1) + "M"} domain={["dataMin-20000", "dataMax+20000"]} />
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
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <Btn onClick={fetchAllPrices} color={fetching ? "" : "#2D9CDB"} small disabled={fetching}>
                {fetching ? "Actualizando..." : "Actualizar"}
              </Btn>
            </div>
            <PriceEditor metrics={stockMetrics} prices={prices} setPrices={savePrices} save={() => {}} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {stockMetrics.map(m => (
                <div key={m.ticker} style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <span style={{ color: "#aaa", fontSize: 10 }}>Obj {m.ticker}</span>
                  <PriceInput value={targets[m.ticker] || ""} placeholder="Objetivo" color="#F39C12" onChange={n => saveTargets({ ...targets, [m.ticker]: n })} />
                </div>
              ))}
            </div>
          </Section>
          <Section title="PPA y métricas">
            <Table
              cols={[
                { key: "ticker", label: "Acción", sortKey: r => r.ticker },
                { label: "Cant.", render: r => r.holding.toFixed(0), sortKey: r => r.holding, align: "right" },
                { label: "PPA", render: r => COP(r.ppa), sortKey: r => r.ppa, align: "right" },
                { label: "Valor", render: r => COP(r.marketVal), sortKey: r => r.marketVal, align: "right" },
                { label: "G/P", render: r => COP(r.gain), sortKey: r => r.gain, align: "right", color: r => (r.gain >= 0 ? "#27AE60" : "#E94560") },
                { label: "%", render: r => (r.current ? PCT(r.ret) : "—"), sortKey: r => r.ret, align: "right", color: r => (r.ret >= 0 ? "#27AE60" : "#E94560") },
                { label: "Objetivo", render: r => (r.target ? COP(r.targetGain) : "—"), sortKey: r => r.targetGain, align: "right" },
                { label: "Obj%", render: r => (r.target ? PCT(r.targetRet) : "—"), sortKey: r => r.targetRet, align: "right" },
                { label: "Com.", render: r => COP(r.totalComm), sortKey: r => r.totalComm, align: "right" }
              ]}
              rows={stockMetrics}
            />
          </Section>
        </>
      )}
      <Section title="Historial">
        <Table
          cols={[
            { key: "date", label: "Fecha", sortKey: r => r.date },
            { key: "ticker", label: "Acción", sortKey: r => r.ticker },
            { label: "Qty", render: r => r.qty, sortKey: r => r.qty, align: "right" },
            { label: "Precio", render: r => COP(r.priceCOP), sortKey: r => r.priceCOP, align: "right", color: r => (r.priceCOP > 0 ? "#27AE60" : "#E94560") },
            { label: "Fuente", render: r => r.source || "—", sortKey: r => r.source },
            { label: "Com.", render: r => COP(r.commission), sortKey: r => r.commission, align: "right" }
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
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <Btn onClick={fetchAllPrices} color={fetching ? "" : "#2D9CDB"} small disabled={fetching}>
                {fetching ? "Actualizando..." : "Actualizar"}
              </Btn>
              {trm && <span style={{ fontSize: 10, color: "#555" }}>TRM: ${Math.round(trm).toLocaleString("es-CO")}</span>}
            </div>
            <PriceEditor metrics={cryptoMetrics} prefix="C_" prices={prices} setPrices={savePrices} save={() => {}} />
          </Section>
          <Section title="Métricas">
            <Table
              cols={[
                { key: "ticker", label: "Cripto", sortKey: r => r.ticker },
                { label: "Cartera", render: r => r.holding.toFixed(8), sortKey: r => r.holding, align: "right" },
                { label: "PPA", render: r => COP(r.ppa), sortKey: r => r.ppa, align: "right" },
                { label: "Valor", render: r => COP(r.marketVal), sortKey: r => r.marketVal, align: "right" },
                { label: "G/P", render: r => COP(r.gain), sortKey: r => r.gain, align: "right", color: r => (r.gain >= 0 ? "#27AE60" : "#E94560") },
                { label: "%", render: r => (r.current ? PCT(r.ret) : "—"), sortKey: r => r.ret, align: "right", color: r => (r.ret >= 0 ? "#27AE60" : "#E94560") },
                { label: "Com.", render: r => COP(r.totalComm), sortKey: r => r.totalComm, align: "right" }
              ]}
              rows={cryptoMetrics}
            />
          </Section>
        </>
      )}
      <Section title="Historial">
        <Table
          cols={[
            { key: "date", label: "Fecha" },
            { key: "ticker", label: "Cripto" },
            { label: "Qty", render: r => r.qty.toFixed(8), align: "right" },
            { label: "COP", render: r => COP(r.priceCOP), align: "right", color: r => (r.priceCOP > 0 ? "#27AE60" : "#E94560") },
            { label: "Com.", render: r => COP(r.commission), align: "right" }
          ]}
          rows={crypto}
          onDelete={id => saveCrypto(crypto.filter(c => c.id !== id))}
        />
      </Section>
    </div>
  );

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

  // ── FINANZAS ──
  const Finanzas = () => (
    <div>
      <Section title="Registrar ingreso o gasto">
        <FinForm key="new" saveFinances={saveFinances} finances={finances} editingItem={null} onSave={handleFinanceSubmit} />
      </Section>
      <Modal open={!!editingFin} onClose={() => setEditingFin(null)} title={`Editar movimiento #${editingFin?.id || ""}`}>
        <FinForm key={editingFin?.id || "edit"} editingItem={editingFin} onSave={handleFinanceSubmit} onCancel={() => setEditingFin(null)} />
      </Modal>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Card title="INGRESOS" value={COP(filteredIn)} sub={hasFilter ? `de ${COP(totalIn)} total` : ""} />
        <Card title="EGRESOS" value={COP(filteredOut)} sub={hasFilter ? `de ${COP(totalOut)} total` : ""} />
        <Card title="BALANCE" value={COP(filteredIn - filteredOut)} sub={hasFilter ? `${filteredFin.length} de ${finances.length} registros` : "(no es tu dinero real)"} />
      </div>
      <Section title="Filtros">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 8 }}>
          <Input label="Desde" type="date" value={finFilter.dateFrom} onChange={e => setFinFilter({ ...finFilter, dateFrom: e.target.value })} style={{ width: 120 }} />
          <Input label="Hasta" type="date" value={finFilter.dateTo} onChange={e => setFinFilter({ ...finFilter, dateTo: e.target.value })} style={{ width: 120 }} />
          <Select label="Tipo" options={["", "ingreso", "egreso"]} value={finFilter.type} onChange={e => setFinFilter({ ...finFilter, type: e.target.value })} />
          <Select label="Categoría" options={["", ...allCategories]} value={finFilter.category} onChange={e => setFinFilter({ ...finFilter, category: e.target.value })} />
          <Input label="Buscar" value={finFilter.search} onChange={e => setFinFilter({ ...finFilter, search: e.target.value })} placeholder="texto..." />
          <Btn onClick={() => setFinFilter({ dateFrom: "", dateTo: "", type: "", category: "", search: "" })} small color="">Limpiar</Btn>
          <Btn onClick={() => exportExcel(filteredFin, `finanzas-filtrado-${new Date().toISOString().slice(0,10)}.xlsx`)} small color="#27AE60">
            Excel filtrado
          </Btn>
          <Btn onClick={() => exportExcel(finances, `finanzas-todo-${new Date().toISOString().slice(0,10)}.xlsx`)} small color="#2D9CDB">
            Excel todo
          </Btn>
        </div>
        {hasFilter && (
          <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
            Filtrado: {filteredFin.length} de {finances.length} registros | Ingresos: {COP(filteredIn)} | Egresos: {COP(filteredOut)} | Balance: {COP(filteredIn - filteredOut)}
          </div>
        )}
      </Section>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {computeMonthlyFinances(filteredFin).length > 0 && (
          <Section title="Mensual">
            <ResponsiveContainer width={380} height={200}>
              <BarChart data={computeMonthlyFinances(filteredFin)}>
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 9 }} />
                <YAxis tick={{ fill: "#888", fontSize: 9 }} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                <Tooltip formatter={v => COP(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="ingresos" fill="#27AE60" name="Ingresos" radius={[3, 3, 0, 0]} />
                <Bar dataKey="egresos" fill="#E94560" name="Egresos" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
        {computeExpenseByCategory(filteredFin).length > 0 && (
          <Section title="Por categoría">
            <ResponsiveContainer width={300} height={200}>
              <BarChart data={computeExpenseByCategory(filteredFin).slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fill: "#888", fontSize: 9 }} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#aaa", fontSize: 9 }} width={80} />
                <Tooltip formatter={v => COP(v)} />
                <Bar dataKey="value" fill="#E94560" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
      </div>
      <Section title={`Historial (${filteredFin.length} registros)`}>
        <Table
          cols={[
            { key: "date", label: "Fecha", sortKey: r => r.date },
            { label: "Tipo", render: r => (r.type === "ingreso" ? "↑ Ingreso" : "↓ Egreso"), sortKey: r => r.type, color: r => (r.type === "ingreso" ? "#27AE60" : "#E94560") },
            { key: "category", label: "Categoría", sortKey: r => r.category },
            { label: "Monto", render: r => COP(r.amount), sortKey: r => r.amount, align: "right" },
            { key: "desc", label: "Descripción", noSort: true },
            {
              label: "",
              render: r => (
                <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingFin(r); }}
                  style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 12 }}>✎</button>
              ),
              noSort: true
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
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: 11, color: "#555" }}>Tasa EA (%)</label>
          <PriceInput value={hys.rate} placeholder="9.25" width={70} onChange={n => saveHys({ ...hys, rate: n })} />
        </div>
        <div style={{ color: "#555", fontSize: 11, paddingBottom: 6 }}>
          Diaria: {(hysState.dailyRate * 100).toFixed(5)}%
        </div>
      </div>
      <Section title="Registrar movimiento">
        <HysForm saveHys={saveHys} hys={hys} saveCash={saveCash} cash={cash} />
        <div style={{ fontSize: 10, color: "#444", marginTop: -6 }}>
          APERTURA=saldo inicial · INGRESO=metes (debita banco) · RETIRO=sacas (acredita banco) · SALDO=anota saldo real. Tasa vigente ({hys.rate}%) se guarda en cada movimiento.
        </div>
      </Section>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Card title="SALDO ACTUAL" value={COP(hysBalance)} sub={hysState.daysSince > 0 ? `+${hysState.daysSince}d compuestos` : ""} />
        <Card title="PROYECTADO 1 AÑO" value={COP(hysFinal)} sub={`+${COP(hysFinal - hysBalance)}`} />
        <Card title="GANADO DESDE APERTURA" value={COP(hysBalance - (hys.movements.find(m => m.type === "APERTURA")?.amount || 0))} />
      </div>
      <Section title="Movimientos">
        <Table
          cols={[
            { key: "date", label: "Fecha" },
            { key: "type", label: "Tipo" },
            { label: "Monto", render: r => COP(r.amount), align: "right", color: r => (r.type === "RETIRO" ? "#E94560" : "#27AE60") },
            { label: "Saldo", render: r => (r.balance != null ? COP(r.balance) : "—"), align: "right" },
            { label: "Tasa", render: r => (r.rate ? r.rate + "%" : "—"), align: "right", color: () => "#2D9CDB" },
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
              <XAxis dataKey="mes" tick={{ fill: "#888", fontSize: 9 }} />
              <YAxis tick={{ fill: "#888", fontSize: 9 }} tickFormatter={v => "$" + (v / 1e6).toFixed(1) + "M"} />
              <Tooltip formatter={v => COP(v)} />
              <Line type="monotone" dataKey="fin" stroke="#16A085" strokeWidth={2} dot={{ r: 2 }} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
          <Table
            cols={[
              { label: "Mes", render: r => r.mes, align: "center" },
              { label: "Inicio", render: r => COP(r.inicio), align: "right" },
              { label: "Interés", render: r => COP(r.interes), align: "right", color: () => "#27AE60" },
              { label: "Final", render: r => COP(r.fin), align: "right" }
            ]}
            rows={hysPj}
          />
        </Section>
      )}
    </div>
  );

  // ── RENDER ──
  return (
    <div style={{ background: "#0c0c0c", minHeight: "100vh", color: "#f0f0f0" }}>
      <div style={{ background: "#0c0c0c", padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#f0f0f0" }}>Mi Portafolio</div>
        </div>
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
          <Tab active={tab === "dashboard"} label="Dashboard" onClick={() => setTab("dashboard")} />
          <Tab active={tab === "portafolio"} label="Acciones" onClick={() => setTab("portafolio")} />
          <Tab active={tab === "cripto"} label="Cripto" onClick={() => setTab("cripto")} />
          <Tab active={tab === "finanzas"} label="Finanzas" onClick={() => setTab("finanzas")} />
          <Tab active={tab === "hys"} label="Alto Rendim." onClick={() => setTab("hys")} />
        </div>
      </div>
      <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "portafolio" && <Portafolio />}
        {tab === "cripto" && <CriptoTab />}
        {tab === "finanzas" && <Finanzas />}
        {tab === "hys" && <AltoRend />}
      </div>
    </div>
  );
}
