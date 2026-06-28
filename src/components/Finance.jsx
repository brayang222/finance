import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { COLORS, CATS_IN, CATS_OUT, STORAGE_KEYS } from "../data/constants";
import { SEED_STOCKS, SEED_CRYPTO, SEED_PRICES, SEED_HYS, SEED_FINANCES, SEED_CASH } from "../data/seed";
import { COP, PCT, uid, today, uniqueTickers } from "../utils/formatters";
import { fetchPricesFromAPI, fetchTRM, load, save } from "../utils/api";
import {
  computeStockMetrics,
  computeCryptoMetrics,
  computeHysBalance,
  computeHysProjection,
  computeMonthlyFinances,
  computeExpenseByCategory
} from "../utils/calculations";
import { Tab, Card, Input, Select, Btn, Section } from "./UI/UIComponents";
import { Table } from "./UI/Table";
import { PriceInput } from "./UI/PriceInput";
import { StockForm } from "./Forms/StockForm";
import { FinForm } from "./Forms/FinForm";
import { HysForm } from "./Forms/HysForm";
import { PriceEditor } from "./Forms/PriceEditor";

export default function Finance() {
  // ── STATE ──
  const [tab, setTab] = useState("dashboard");
  const [stocks, setStocks] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [finances, setFinances] = useState([]);
  const [hys, setHys] = useState({ rate: 9.25, movements: [] });
  const [prices, setPrices] = useState({});
  const [targets, setTargets] = useState({});
  const [cash, setCash] = useState({ banco: 0 });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [trm, setTrm] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [finFilter, setFinFilter] = useState({
    dateFrom: "",
    dateTo: "",
    type: "",
    category: "",
    search: ""
  });

  // ── SAVE CALLBACKS ──
  const saveStocks = useCallback(v => {
    setStocks(v);
    save(STORAGE_KEYS.STOCKS, v);
  }, []);

  const saveCrypto = useCallback(v => {
    setCrypto(v);
    save(STORAGE_KEYS.CRYPTO, v);
  }, []);

  const saveFinances = useCallback(v => {
    setFinances(v);
    save(STORAGE_KEYS.FINANCES, v);
  }, []);

  const saveHys = useCallback(v => {
    setHys(v);
    save(STORAGE_KEYS.HYS, v);
  }, []);

  const savePrices = useCallback(v => {
    setPrices(v);
    save(STORAGE_KEYS.PRICES, v);
  }, []);

  const saveTargets = useCallback(v => {
    setTargets(v);
    save(STORAGE_KEYS.TARGETS, v);
  }, []);

  const saveCash = useCallback(v => {
    setCash(v);
    save(STORAGE_KEYS.CASH, v);
  }, []);

  // ── LOAD DATA ──
  useEffect(() => {
    (async () => {
      const [s, c, f, h, p, t, ca] = await Promise.all([
        load(STORAGE_KEYS.STOCKS, null),
        load(STORAGE_KEYS.CRYPTO, null),
        load(STORAGE_KEYS.FINANCES, null),
        load(STORAGE_KEYS.HYS, null),
        load(STORAGE_KEYS.PRICES, null),
        load(STORAGE_KEYS.TARGETS, null),
        load(STORAGE_KEYS.CASH, null)
      ]);

      const st = s || SEED_STOCKS;
      if (!s) save(STORAGE_KEYS.STOCKS, st);
      const cr = c || SEED_CRYPTO;
      if (!c) save(STORAGE_KEYS.CRYPTO, cr);
      const fi = f || SEED_FINANCES;
      if (!f) save(STORAGE_KEYS.FINANCES, fi);
      const hy = h || SEED_HYS;
      if (!h) save(STORAGE_KEYS.HYS, hy);
      const pr = p || SEED_PRICES;
      if (!p) save(STORAGE_KEYS.PRICES, pr);
      const tg = t || {};
      if (!t) save(STORAGE_KEYS.TARGETS, tg);
      const cs = ca || SEED_CASH;
      if (!ca) save(STORAGE_KEYS.CASH, cs);

      setStocks(st);
      setCrypto(cr);
      setFinances(fi);
      setHys(hy);
      setPrices(pr);
      setTargets(tg);
      setCash(cs);

      const trm2 = await load(STORAGE_KEYS.TRM, null);
      if (trm2) setTrm(trm2);
      setLoading(false);
    })();
  }, []);

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
      for (const [k, v] of Object.entries(np)) {
        merged[k] = k.startsWith("C_") && v < 1000000 ? Math.round(v * t) : v;
      }
      setPrices(merged);
      save(STORAGE_KEYS.PRICES, merged);
      save(STORAGE_KEYS.TRM, t);
      setLastFetch(new Date().toLocaleTimeString("es-CO"));
    } catch (e) {
      console.error(e);
    }
    setFetching(false);
  }, [stocks, crypto, prices, trm]);

  // ── METRICS ──
  const stockMetrics = computeStockMetrics(stocks, prices, targets);
  const cryptoMetrics = computeCryptoMetrics(crypto, prices);
  const totalStocks = stockMetrics.reduce((s, m) => s + m.marketVal, 0);
  const totalCrypto = cryptoMetrics.reduce((s, m) => s + m.marketVal, 0);
  const totalComm = [...stockMetrics, ...cryptoMetrics].reduce((s, m) => s + m.totalComm, 0);

  // ── HYS ──
  const hysState = computeHysBalance(hys);
  const hysBalance = hysState.balance;
  const hysPj = computeHysProjection(hysBalance, hysState.dailyRate);
  const hysFinal = hysPj.length ? hysPj[11].fin : hysBalance;

  // ── FINANCES ──
  const totalIn = finances.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amount, 0);
  const totalOut = finances.filter(f => f.type === "egreso").reduce((s, f) => s + f.amount, 0);

  const filteredFin = finances.filter(f => {
    if (finFilter.dateFrom && f.date < finFilter.dateFrom) return false;
    if (finFilter.dateTo && f.date > finFilter.dateTo) return false;
    if (finFilter.type && f.type !== finFilter.type) return false;
    if (finFilter.category && f.category !== finFilter.category) return false;
    if (
      finFilter.search &&
      !((f.desc || "") + (f.category || ""))
        .toLowerCase()
        .includes(finFilter.search.toLowerCase())
    )
      return false;
    return true;
  });

  const filteredIn = filteredFin
    .filter(f => f.type === "ingreso")
    .reduce((s, f) => s + f.amount, 0);
  const filteredOut = filteredFin
    .filter(f => f.type === "egreso")
    .reduce((s, f) => s + f.amount, 0);

  const hasFilter = !!(
    finFilter.dateFrom ||
    finFilter.dateTo ||
    finFilter.type ||
    finFilter.category ||
    finFilter.search
  );

  const allCategories = [...new Set(finances.map(f => f.category))].sort();

  const dineroReal = (cash.banco || 0) + hysBalance;
  const totalPortafolio = totalStocks + totalCrypto;

  const distClase = [
    { name: "Acciones", value: totalStocks },
    { name: "Cripto", value: totalCrypto }
  ].filter(d => d.value > 0);

  const distActivo = [
    ...stockMetrics
      .filter(m => m.marketVal > 0)
      .map(m => ({ name: m.ticker, value: m.marketVal })),
    ...cryptoMetrics
      .filter(m => m.marketVal > 0)
      .map(m => ({ name: m.ticker, value: m.marketVal }))
  ];

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0e0e1f",
          color: "#7B4FB5",
          fontSize: 16
        }}
      >
        Cargando datos...
      </div>
    );

  // ── DASHBOARD ──
  const Dashboard = () => (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
          gap: 6
        }}
      >
        <Btn
          onClick={fetchAllPrices}
          color={fetching ? "#555" : "#2D9CDB"}
          small
          disabled={fetching}
        >
          {fetching ? "⏳ Buscando precios..." : "🔄 Actualizar precios"}
        </Btn>
        <div style={{ display: "flex", gap: 8 }}>
          {trm && (
            <span style={{ fontSize: 10, color: "#888" }}>
              TRM: ${Math.round(trm).toLocaleString("es-CO")}
            </span>
          )}
          {lastFetch && (
            <span style={{ fontSize: 10, color: "#555" }}>Última: {lastFetch}</span>
          )}
        </div>
      </div>

      <Section title="💰 Dinero Real Disponible">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <Card title="BANCO (sin rendimiento)" value={COP(cash.banco || 0)} color="#2D2D6B" />
          <Card
            title="ALTO RENDIMIENTO"
            value={COP(hysBalance)}
            color="#16A085"
            sub={
              hysState.daysSince > 0
                ? `+${hysState.daysSince}d compuestos`
                : ""
            }
          />
          <Card title="DINERO REAL TOTAL" value={COP(dineroReal)} color="#5B2E96" />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#aaa" }}>Ajustar saldo banco:</span>
          <PriceInput
            value={cash.banco || 0}
            placeholder="Saldo banco"
            color="#2D9CDB"
            width={130}
            onChange={n => saveCash({ ...cash, banco: n })}
          />
        </div>
      </Section>

      <Section title="📊 Portafolio de Inversiones (Acciones + Cripto)">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <Card title="ACCIONES" value={COP(totalStocks)} color="#2D2D6B" />
          <Card title="CRIPTO" value={COP(totalCrypto)} color="#F39C12" />
          <Card title="TOTAL INVERSIONES" value={COP(totalPortafolio)} color="#7B4FB5" />
          <Card title="COMISIONES" value={COP(totalComm)} color="#9B59B6" />
        </div>
      </Section>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {distClase.length > 0 && (
          <Section title="Distribución inversiones">
            <ResponsiveContainer width={250} height={180}>
              <PieChart>
                <Pie
                  data={distClase}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={72}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {distClase.map((_, i) => (
                    <Cell key={i} fill={["#7B4FB5", "#F39C12"][i]} />
                  ))}
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
                <Pie
                  data={distActivo}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={72}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {distActivo.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
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
                <YAxis
                  tick={{ fill: "#888", fontSize: 9 }}
                  tickFormatter={v => "$" + Math.round(v / 1000) + "k"}
                />
                <Tooltip formatter={v => COP(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar
                  dataKey="ingresos"
                  fill="#27AE60"
                  name="Ingresos"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="egresos"
                  fill="#E94560"
                  name="Egresos"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {computeExpenseByCategory(finances).length > 0 && (
          <Section title="Gastos por categoría">
            <ResponsiveContainer width={300} height={180}>
              <BarChart
                data={computeExpenseByCategory(finances).slice(0, 8)}
                layout="vertical"
              >
                <XAxis
                  type="number"
                  tick={{ fill: "#888", fontSize: 9 }}
                  tickFormatter={v => "$" + Math.round(v / 1000) + "k"}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#aaa", fontSize: 9 }}
                  width={80}
                />
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
                <YAxis
                  tick={{ fill: "#888", fontSize: 9 }}
                  tickFormatter={v => "$" + (v / 1e6).toFixed(1) + "M"}
                  domain={["dataMin-20000", "dataMax+20000"]}
                />
                <Tooltip formatter={v => COP(v)} />
                <Line
                  type="monotone"
                  dataKey="fin"
                  stroke="#16A085"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Saldo"
                />
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
              <Btn
                onClick={fetchAllPrices}
                color={fetching ? "#555" : "#2D9CDB"}
                small
                disabled={fetching}
              >
                {fetching ? "⏳" : "🔄 Actualizar"}
              </Btn>
            </div>
            <PriceEditor
              metrics={stockMetrics}
              prices={prices}
              setPrices={savePrices}
              save={save}
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {stockMetrics.map(m => (
                <div key={m.ticker} style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <span style={{ color: "#aaa", fontSize: 10 }}>Obj {m.ticker}</span>
                  <PriceInput
                    value={targets[m.ticker] || ""}
                    placeholder="Objetivo"
                    color="#F39C12"
                    onChange={n => {
                      const v = { ...targets, [m.ticker]: n };
                      saveTargets(v);
                    }}
                  />
                </div>
              ))}
            </div>
          </Section>
          <Section title="PPA y métricas">
            <Table
              cols={[
                { key: "ticker", label: "Acción", sortKey: r => r.ticker },
                {
                  label: "Cant.",
                  render: r => r.holding.toFixed(0),
                  sortKey: r => r.holding,
                  align: "right"
                },
                {
                  label: "PPA",
                  render: r => COP(r.ppa),
                  sortKey: r => r.ppa,
                  align: "right"
                },
                {
                  label: "Valor",
                  render: r => COP(r.marketVal),
                  sortKey: r => r.marketVal,
                  align: "right"
                },
                {
                  label: "G/P",
                  render: r => COP(r.gain),
                  sortKey: r => r.gain,
                  align: "right",
                  color: r => (r.gain >= 0 ? "#27AE60" : "#E94560")
                },
                {
                  label: "%",
                  render: r => (r.current ? PCT(r.ret) : "—"),
                  sortKey: r => r.ret,
                  align: "right",
                  color: r => (r.ret >= 0 ? "#27AE60" : "#E94560")
                },
                {
                  label: "Objetivo",
                  render: r => (r.target ? COP(r.targetGain) : "—"),
                  sortKey: r => r.targetGain,
                  align: "right"
                },
                {
                  label: "Obj%",
                  render: r => (r.target ? PCT(r.targetRet) : "—"),
                  sortKey: r => r.targetRet,
                  align: "right"
                },
                {
                  label: "Com.",
                  render: r => COP(r.totalComm),
                  sortKey: r => r.totalComm,
                  align: "right"
                }
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
            {
              label: "Qty",
              render: r => r.qty,
              sortKey: r => r.qty,
              align: "right"
            },
            {
              label: "Precio",
              render: r => COP(r.priceCOP),
              sortKey: r => r.priceCOP,
              align: "right",
              color: r => (r.priceCOP > 0 ? "#27AE60" : "#E94560")
            },
            {
              label: "Fuente",
              render: r => r.source || "—",
              sortKey: r => r.source
            },
            {
              label: "Com.",
              render: r => COP(r.commission),
              sortKey: r => r.commission,
              align: "right"
            }
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
        <StockForm
          onAdd={tx => saveCrypto([...crypto, tx])}
          saveCash={saveCash}
          cash={cash}
          type="crypto"
        />
      </Section>
      {cryptoMetrics.length > 0 && (
        <>
          <Section title="Precios actuales">
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <Btn
                onClick={fetchAllPrices}
                color={fetching ? "#555" : "#2D9CDB"}
                small
                disabled={fetching}
              >
                {fetching ? "⏳" : "🔄 Actualizar"}
              </Btn>
              {trm && (
                <span style={{ fontSize: 10, color: "#888" }}>
                  TRM: ${Math.round(trm).toLocaleString("es-CO")}
                </span>
              )}
            </div>
            <PriceEditor
              metrics={cryptoMetrics}
              prefix="C_"
              prices={prices}
              setPrices={savePrices}
              save={save}
            />
          </Section>
          <Section title="Métricas">
            <Table
              cols={[
                { key: "ticker", label: "Cripto", sortKey: r => r.ticker },
                {
                  label: "Cartera",
                  render: r => r.holding.toFixed(8),
                  sortKey: r => r.holding,
                  align: "right"
                },
                {
                  label: "PPA",
                  render: r => COP(r.ppa),
                  sortKey: r => r.ppa,
                  align: "right"
                },
                {
                  label: "Valor",
                  render: r => COP(r.marketVal),
                  sortKey: r => r.marketVal,
                  align: "right"
                },
                {
                  label: "G/P",
                  render: r => COP(r.gain),
                  sortKey: r => r.gain,
                  align: "right",
                  color: r => (r.gain >= 0 ? "#27AE60" : "#E94560")
                },
                {
                  label: "%",
                  render: r => (r.current ? PCT(r.ret) : "—"),
                  sortKey: r => r.ret,
                  align: "right",
                  color: r => (r.ret >= 0 ? "#27AE60" : "#E94560")
                },
                {
                  label: "Com.",
                  render: r => COP(r.totalComm),
                  sortKey: r => r.totalComm,
                  align: "right"
                }
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
            {
              label: "Qty",
              render: r => r.qty.toFixed(8),
              align: "right"
            },
            {
              label: "COP",
              render: r => COP(r.priceCOP),
              align: "right",
              color: r => (r.priceCOP > 0 ? "#27AE60" : "#E94560")
            },
            {
              label: "Com.",
              render: r => COP(r.commission),
              align: "right"
            }
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
        <FinForm saveFinances={saveFinances} finances={finances} />
      </Section>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Card
          title="INGRESOS"
          value={COP(filteredIn)}
          color="#27AE60"
          sub={hasFilter ? `de ${COP(totalIn)} total` : ""}
        />
        <Card
          title="EGRESOS"
          value={COP(filteredOut)}
          color="#E94560"
          sub={hasFilter ? `de ${COP(totalOut)} total` : ""}
        />
        <Card
          title="BALANCE"
          value={COP(filteredIn - filteredOut)}
          color={filteredIn - filteredOut >= 0 ? "#27AE60" : "#C0392B"}
          sub={
            hasFilter
              ? `${filteredFin.length} de ${finances.length} registros`
              : "(no es tu dinero real)"
          }
        />
      </div>

      <Section title="Filtros">
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "flex-end",
            marginBottom: 8
          }}
        >
          <Input
            label="Desde"
            type="date"
            value={finFilter.dateFrom}
            onChange={e => setFinFilter({ ...finFilter, dateFrom: e.target.value })}
            style={{ width: 120 }}
          />
          <Input
            label="Hasta"
            type="date"
            value={finFilter.dateTo}
            onChange={e => setFinFilter({ ...finFilter, dateTo: e.target.value })}
            style={{ width: 120 }}
          />
          <Select
            label="Tipo"
            options={["", "ingreso", "egreso"]}
            value={finFilter.type}
            onChange={e => setFinFilter({ ...finFilter, type: e.target.value })}
          />
          <Select
            label="Categoría"
            options={["", ...allCategories]}
            value={finFilter.category}
            onChange={e => setFinFilter({ ...finFilter, category: e.target.value })}
          />
          <Input
            label="Buscar"
            value={finFilter.search}
            onChange={e => setFinFilter({ ...finFilter, search: e.target.value })}
            placeholder="texto..."
          />
          <Btn
            onClick={() =>
              setFinFilter({
                dateFrom: "",
                dateTo: "",
                type: "",
                category: "",
                search: ""
              })
            }
            small
            color="#555"
          >
            Limpiar
          </Btn>
        </div>
        {(finFilter.dateFrom ||
          finFilter.dateTo ||
          finFilter.type ||
          finFilter.category ||
          finFilter.search) && (
          <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
            Filtrado: {filteredFin.length} de {finances.length} registros | Ingresos:{" "}
            {COP(filteredIn)} | Egresos: {COP(filteredOut)} | Balance:{" "}
            {COP(filteredIn - filteredOut)}
          </div>
        )}
      </Section>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {computeMonthlyFinances(filteredFin).length > 0 && (
          <Section title="Mensual">
            <ResponsiveContainer width={380} height={200}>
              <BarChart data={computeMonthlyFinances(filteredFin)}>
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 9 }} />
                <YAxis
                  tick={{ fill: "#888", fontSize: 9 }}
                  tickFormatter={v => "$" + Math.round(v / 1000) + "k"}
                />
                <Tooltip formatter={v => COP(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar
                  dataKey="ingresos"
                  fill="#27AE60"
                  name="Ingresos"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="egresos"
                  fill="#E94560"
                  name="Egresos"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}
        {computeExpenseByCategory(filteredFin).length > 0 && (
          <Section title="Por categoría">
            <ResponsiveContainer width={300} height={200}>
              <BarChart
                data={computeExpenseByCategory(filteredFin).slice(0, 8)}
                layout="vertical"
              >
                <XAxis
                  type="number"
                  tick={{ fill: "#888", fontSize: 9 }}
                  tickFormatter={v => "$" + Math.round(v / 1000) + "k"}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#aaa", fontSize: 9 }}
                  width={80}
                />
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
            {
              label: "Tipo",
              render: r => (r.type === "ingreso" ? "↑ Ingreso" : "↓ Egreso"),
              sortKey: r => r.type,
              color: r => (r.type === "ingreso" ? "#27AE60" : "#E94560")
            },
            { key: "category", label: "Categoría", sortKey: r => r.category },
            {
              label: "Monto",
              render: r => COP(r.amount),
              sortKey: r => r.amount,
              align: "right"
            },
            {
              key: "desc",
              label: "Descripción",
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
          <label style={{ fontSize: 10, color: "#aaa" }}>Tasa EA (%)</label>
          <PriceInput
            value={hys.rate}
            placeholder="9.25"
            color="#16A085"
            width={70}
            onChange={n => saveHys({ ...hys, rate: n })}
          />
        </div>
        <div style={{ color: "#888", fontSize: 11, paddingBottom: 6 }}>
          Diaria: {(hysState.dailyRate * 100).toFixed(5)}%
        </div>
      </div>
      <Section title="Registrar movimiento">
        <HysForm saveHys={saveHys} hys={hys} saveCash={saveCash} cash={cash} />
        <div style={{ fontSize: 10, color: "#666", marginTop: -6 }}>
          APERTURA=saldo inicial · INGRESO=metes (debita banco) · RETIRO=sacas
          (acredita banco) · SALDO=anota saldo real. Tasa vigente ({hys.rate}%) se
          guarda en cada movimiento.
        </div>
      </Section>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Card
          title="SALDO ACTUAL"
          value={COP(hysBalance)}
          color="#16A085"
          sub={
            hysState.daysSince > 0
              ? `+${hysState.daysSince}d compuestos`
              : ""
          }
        />
        <Card
          title="PROYECTADO 1 AÑO"
          value={COP(hysFinal)}
          color="#2D9CDB"
          sub={`+${COP(hysFinal - hysBalance)}`}
        />
        <Card
          title="GANADO DESDE APERTURA"
          value={COP(
            hysBalance -
              (hys.movements.find(m => m.type === "APERTURA")?.amount || 0)
          )}
          color="#27AE60"
        />
      </div>
      <Section title="Movimientos">
        <Table
          cols={[
            { key: "date", label: "Fecha" },
            { key: "type", label: "Tipo" },
            {
              label: "Monto",
              render: r => COP(r.amount),
              align: "right",
              color: r => (r.type === "RETIRO" ? "#E94560" : "#27AE60")
            },
            {
              label: "Saldo",
              render: r => (r.balance != null ? COP(r.balance) : "—"),
              align: "right"
            },
            {
              label: "Tasa",
              render: r => (r.rate ? r.rate + "%" : "—"),
              align: "right",
              color: () => "#2D9CDB"
            },
            { key: "note", label: "Nota" }
          ]}
          rows={hys.movements}
          onDelete={id =>
            saveHys({
              ...hys,
              movements: hys.movements.filter(m => m.id !== id)
            })
          }
        />
      </Section>
      {hysPj.length > 0 && hysBalance > 0 && (
        <Section title="Proyección 12 meses">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hysPj}>
              <XAxis dataKey="mes" tick={{ fill: "#888", fontSize: 9 }} />
              <YAxis
                tick={{ fill: "#888", fontSize: 9 }}
                tickFormatter={v => "$" + (v / 1e6).toFixed(1) + "M"}
              />
              <Tooltip formatter={v => COP(v)} />
              <Line
                type="monotone"
                dataKey="fin"
                stroke="#16A085"
                strokeWidth={2}
                dot={{ r: 2 }}
                name="Saldo"
              />
            </LineChart>
          </ResponsiveContainer>
          <Table
            cols={[
              {
                label: "Mes",
                render: r => r.mes,
                align: "center"
              },
              {
                label: "Inicio",
                render: r => COP(r.inicio),
                align: "right"
              },
              {
                label: "Interés",
                render: r => COP(r.interes),
                align: "right",
                color: () => "#27AE60"
              },
              {
                label: "Final",
                render: r => COP(r.fin),
                align: "right"
              }
            ]}
            rows={hysPj}
          />
        </Section>
      )}
    </div>
  );

  // ── RENDER ──
  return (
    <div
      style={{
        background: "#0e0e1f",
        minHeight: "100vh",
        color: "#ddd",
        fontFamily: "Arial,sans-serif"
      }}
    >
      <div
        style={{
          background: "#14142b",
          padding: "10px 14px",
          borderBottom: "1px solid #2d2d6b"
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 6
          }}
        >
          ◆ Mi Portafolio & Finanzas
        </div>
        <div style={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tab
            active={tab === "dashboard"}
            label="Dashboard"
            onClick={() => setTab("dashboard")}
          />
          <Tab
            active={tab === "portafolio"}
            label="Acciones"
            onClick={() => setTab("portafolio")}
            color="#2D2D6B"
          />
          <Tab
            active={tab === "cripto"}
            label="Cripto"
            onClick={() => setTab("cripto")}
            color="#F39C12"
          />
          <Tab
            active={tab === "finanzas"}
            label="Finanzas"
            onClick={() => setTab("finanzas")}
            color="#27AE60"
          />
          <Tab
            active={tab === "hys"}
            label="Alto Rendim."
            onClick={() => setTab("hys")}
            color="#16A085"
          />
        </div>
      </div>
      <div style={{ padding: 14, maxWidth: 1100, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "portafolio" && <Portafolio />}
        {tab === "cripto" && <CriptoTab />}
        {tab === "finanzas" && <Finanzas />}
        {tab === "hys" && <AltoRend />}
      </div>
    </div>
  );
}
