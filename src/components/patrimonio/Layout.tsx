"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { AllData, Stock, Crypto as CryptoType, Finance } from "../../types";
import { Asset, Account, Transaction, TxType } from "../../data/mock";
import { View } from "./utils";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import ModalRegistrar from "./ModalRegistrar";
import ViewResumen from "./ViewResumen";
import {
  ViewInversiones,
  ViewCripto,
  ViewDetalle,
  ViewTransacciones,
  ViewCuentas,
} from "./StubViews";

// ── Ticker metadata lookup ──────────────────────────────────────────────────
const TICKER_META: Record<string, { name: string; mono: string }> = {
  ECOPETROL:  { name: "Ecopetrol S.A.",            mono: "EC" },
  PFBCOLOM:   { name: "Bancolombia Pref.",          mono: "BC" },
  GRUPOSURA:  { name: "Grupo SURA",                 mono: "SU" },
  ISA:        { name: "Interconexión Eléctrica",    mono: "IS" },
  NUTRESA:    { name: "Grupo Nutresa",               mono: "NU" },
  CEMARGOS:   { name: "Cementos Argos",             mono: "CA" },
  CORFICOLCF: { name: "Corficolombiana",            mono: "CF" },
  GRUPOARGOS: { name: "Grupo Argos",                mono: "GA" },
  BOGOTA:     { name: "Banco de Bogotá",            mono: "BG" },
  ETB:        { name: "ETB",                        mono: "ET" },
  BTC:        { name: "Bitcoin",                    mono: "BT" },
  ETH:        { name: "Ethereum",                   mono: "ET" },
  SOL:        { name: "Solana",                     mono: "SO" },
  ADA:        { name: "Cardano",                    mono: "AD" },
  USDT:       { name: "Tether",                     mono: "UT" },
  BNB:        { name: "BNB",                        mono: "BN" },
  XRP:        { name: "XRP",                        mono: "XR" },
  DOT:        { name: "Polkadot",                   mono: "DT" },
  MATIC:      { name: "Polygon",                    mono: "MX" },
  AVAX:       { name: "Avalanche",                  mono: "AV" },
};

function metaFor(ticker: string) {
  return TICKER_META[ticker.toUpperCase()] ?? {
    name: ticker,
    mono: ticker.slice(0, 2).toUpperCase(),
  };
}

// ── DB → UI transform ───────────────────────────────────────────────────────
function toAssets(rows: Stock[] | CryptoType[], prices: Record<string, number>): Asset[] {
  const map = new Map<string, { totalQty: number; totalCost: number }>();
  for (const r of rows) {
    const key = r.ticker.toUpperCase();
    const prev = map.get(key) ?? { totalQty: 0, totalCost: 0 };
    map.set(key, {
      totalQty: prev.totalQty + r.qty,
      totalCost: prev.totalCost + r.qty * r.priceCOP,
    });
  }
  return Array.from(map.entries())
    .filter(([, v]) => v.totalQty > 0)
    .map(([ticker, v]) => {
      const avg = v.totalCost / v.totalQty;
      const price = prices[ticker] ?? avg;
      const { name, mono } = metaFor(ticker);
      return { ticker, name, mono, qty: v.totalQty, avg, price, dayPct: 0, spark: [] };
    });
}

function toTransactions(finances: Finance[]): Transaction[] {
  return finances
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((f, i) => ({
      id: i + 1,
      dateISO: f.date,
      desc: f.desc ?? f.category,
      category: f.category,
      account: "",
      type: f.type as TxType,
      amount: f.amount,
    }));
}

function toAccounts(data: AllData): Account[] {
  const cashTotal = data.cash?.banco ?? 0;
  if (cashTotal <= 0) return [];
  return [{ id: "efectivo", name: "Efectivo y bancos", type: "Cuenta", kind: "Efectivo", mono: "$", balance: cashTotal }];
}

// ── PAGE_META ───────────────────────────────────────────────────────────────
const PAGE_META: Record<View, { title: string; sub: string }> = {
  resumen:       { title: "Resumen",            sub: "Tu patrimonio de un vistazo" },
  inversiones:   { title: "Inversiones",        sub: "Portafolio en bolsa (BVC)" },
  cripto:        { title: "Cripto",             sub: "Activos digitales" },
  detalle:       { title: "Detalle del activo", sub: "Posición individual" },
  transacciones: { title: "Transacciones",      sub: "Ingresos y egresos" },
  cuentas:       { title: "Cuentas",            sub: "Efectivo y bancos" },
};

// ── Layout ──────────────────────────────────────────────────────────────────
export default function Layout({
  user,
  initialData,
}: {
  user?: { name?: string | null; email?: string | null } | null;
  initialData?: AllData;
}) {
  const [view, setView]         = useState<View>("resumen");
  const [theme, setTheme]       = useState<"dark" | "light">("dark");
  const [privacy, setPrivacy]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [selFrom, setSelFrom]   = useState<"inversiones" | "cripto">("inversiones");
  const [showModal, setShowModal]   = useState(false);
  const [modalType, setModalType]   = useState<TxType>("egreso");

  // Derive real data from DB, fall back to mock if no data
  const holdings = useMemo(
    () => initialData ? toAssets(initialData.stocks, initialData.prices) : [],
    [initialData]
  );
  const cryptoAssets = useMemo(
    () => initialData ? toAssets(initialData.crypto, initialData.prices) : [],
    [initialData]
  );
  const accounts = useMemo(
    () => initialData ? toAccounts(initialData) : [],
    [initialData]
  );

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    initialData ? toTransactions(initialData.finances) : []
  );

  // Theme: prefer DB config, fall back to localStorage
  useEffect(() => {
    const dbTheme = initialData?.config?.theme;
    if (dbTheme) {
      setTheme(dbTheme);
      return;
    }
    const stored = localStorage.getItem("gfp-theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, [initialData]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("gfp-theme", theme); } catch {}
  }, [theme]);

  // Responsive
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 880);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const openDetail = (ticker: string, from: "inversiones" | "cripto") => {
    setSelected(ticker);
    setSelFrom(from);
    setView("detalle");
  };

  const meta = PAGE_META[view];

  const addTransaction = (tx: Omit<Transaction, "id">) => {
    setTransactions((prev) =>
      [{ ...tx, id: Math.max(0, ...prev.map((p) => p.id)) + 1 }, ...prev]
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    );
    setShowModal(false);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {!isMobile && <Sidebar view={view} onNav={setView} user={user} />}

      <main className="flex-1 min-w-0 flex flex-col">
        <Header
          pageTitle={meta.title}
          pageSub={meta.sub}
          privacy={privacy}
          theme={theme}
          onTogglePrivacy={() => setPrivacy((p) => !p)}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onOpenModal={() => { setModalType("egreso"); setShowModal(true); }}
        />

        <div
          className="max-w-[1180px] mx-auto w-full"
          style={{ padding: isMobile ? "22px 16px 90px" : "26px 28px 40px" }}
        >
          {view === "resumen" && (
            <ViewResumen
              privacy={privacy}
              onNav={setView}
              transactions={transactions}
              holdings={holdings}
              cryptoAssets={cryptoAssets}
              accounts={accounts}
            />
          )}
          {view === "inversiones" && (
            <ViewInversiones
              privacy={privacy}
              assets={holdings}
              onSelect={(t) => openDetail(t, "inversiones")}
            />
          )}
          {view === "cripto" && (
            <ViewCripto
              privacy={privacy}
              assets={cryptoAssets}
              onSelect={(t) => openDetail(t, "cripto")}
            />
          )}
          {view === "detalle" && (
            <ViewDetalle
              privacy={privacy}
              selected={selected}
              selFrom={selFrom}
              holdings={holdings}
              cryptoAssets={cryptoAssets}
              onBack={() => setView(selFrom)}
            />
          )}
          {view === "transacciones" && (
            <ViewTransacciones
              privacy={privacy}
              transactions={transactions}
              onAdd={() => setShowModal(true)}
            />
          )}
          {view === "cuentas" && (
            <ViewCuentas
              privacy={privacy}
              accounts={accounts}
              holdings={holdings}
              cryptoAssets={cryptoAssets}
            />
          )}
        </div>
      </main>

      {isMobile && <BottomNav view={view} onNav={setView} />}

      {showModal && (
        <ModalRegistrar
          initialType={modalType}
          onClose={() => setShowModal(false)}
          onSave={addTransaction}
        />
      )}
    </div>
  );
}
