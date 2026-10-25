import type { AllData, Stock, Crypto as CryptoType, Finance } from "../../types";
import type { Asset, Account, Transaction, TxType } from "../../data/mock";

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

export function toAssets(rows: Stock[] | CryptoType[], prices: Record<string, number>): Asset[] {
  const map = new Map<string, {
    totalQty: number; totalPricePaid: number; totalCost: number;
    totalPricePaidUSD: number | null; totalCostUSD: number | null;
  }>();
  for (const r of rows) {
    const key = r.ticker.toUpperCase();
    const prev = map.get(key) ?? { totalQty: 0, totalPricePaid: 0, totalCost: 0, totalPricePaidUSD: null, totalCostUSD: null };
    // USD-native lots: price holds real USD value when price !== priceCOP.
    // COP-native lots (BVC stocks): trm is stored as 1 — treat as no USD conversion available.
    // Only convert via TRM when it looks like a real FX rate (> 100 COP/USD).
    const hasRealUSD = r.price !== r.priceCOP;
    const realTRM = r.trm > 100 ? r.trm : null;
    const usdPerUnit = hasRealUSD ? r.price : (realTRM ? r.priceCOP / realTRM : null);
    const trmForCommission = realTRM;
    map.set(key, {
      totalQty: prev.totalQty + r.qty,
      // PPA: price only, no commission (backs avg shown to user)
      totalPricePaid: prev.totalPricePaid + r.qty * r.priceCOP,
      // Real cash outlay: includes commission (backs totalCost used for P/G)
      totalCost: prev.totalCost + r.qty * r.priceCOP + (r.commission ?? 0),
      totalPricePaidUSD: usdPerUnit != null
        ? (prev.totalPricePaidUSD ?? 0) + r.qty * usdPerUnit
        : prev.totalPricePaidUSD,
      totalCostUSD: usdPerUnit != null
        ? (prev.totalCostUSD ?? 0) + r.qty * usdPerUnit + (trmForCommission ? (r.commission ?? 0) / trmForCommission : 0)
        : prev.totalCostUSD,
    });
  }
  return Array.from(map.entries())
    .filter(([, v]) => v.totalQty > 0)
    .map(([ticker, v]) => {
      const avg = v.totalPricePaid / v.totalQty;
      const price = prices[ticker] ?? avg;
      const { name, mono } = metaFor(ticker);
      const avgUSD = v.totalPricePaidUSD != null ? v.totalPricePaidUSD / v.totalQty : undefined;
      const totalCostUSD = v.totalCostUSD != null ? v.totalCostUSD : undefined;
      return { ticker, name, mono, qty: v.totalQty, avg, totalCost: v.totalCost, price, dayPct: 0, spark: [], avgUSD, totalCostUSD };
    });
}

export function toTransactions(finances: Finance[]): Transaction[] {
  return finances
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((f, i) => ({
      id: i + 1,
      financeId: f.id,
      dateISO: f.date,
      desc: f.desc ?? f.category,
      category: f.category,
      account: f.accountName ?? "",
      type: f.type as TxType,
      amount: f.amount,
    }));
}

export function toAccounts(data: AllData): Account[] {
  const cashTotal = data.cash?.banco ?? 0;
  if (cashTotal <= 0) return [];
  return [{ id: "efectivo", name: "Efectivo y bancos", type: "Cuenta", kind: "Efectivo", mono: "$", balance: cashTotal }];
}
