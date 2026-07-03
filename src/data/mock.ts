export type Account = {
  id: string;
  name: string;
  type: string;
  kind: string;
  mono: string;
  balance: number;
};

export type Asset = {
  ticker: string;
  name: string;
  mono: string;
  qty: number;
  avg: number;
  price: number;
  dayPct: number;
  spark: number[];
};

export type TxType = "ingreso" | "egreso";

export type Transaction = {
  id: number;
  financeId?: string;
  dateISO: string;
  desc: string;
  category: string;
  account: string;
  type: TxType;
  amount: number;
};

export const ACCOUNTS: Account[] = [
  { id: "davivienda", name: "Davivienda", type: "Cuenta corriente", kind: "Banco", mono: "DV", balance: 12450000 },
  { id: "bancolombia", name: "Bancolombia", type: "Cuenta de ahorros", kind: "Banco", mono: "BC", balance: 28900000 },
  { id: "trii", name: "Trii", type: "Efectivo en comisionista", kind: "Inversión", mono: "TR", balance: 3200000 },
  { id: "nequi", name: "Nequi", type: "Billetera digital", kind: "Efectivo", mono: "NQ", balance: 1850000 },
  { id: "caja", name: "Efectivo", type: "Caja", kind: "Efectivo", mono: "$", balance: 600000 },
];

export const HOLDINGS: Asset[] = [
  { ticker: "ECOPETROL", name: "Ecopetrol S.A.", mono: "EC", qty: 1200, avg: 2180, price: 2415, dayPct: 0.021, spark: [2360, 2378, 2350, 2392, 2405, 2398, 2415] },
  { ticker: "PFBCOLOM", name: "Bancolombia Pref.", mono: "BC", qty: 300, avg: 31500, price: 34200, dayPct: 0.008, spark: [33800, 33950, 34100, 34000, 34150, 34120, 34200] },
  { ticker: "GRUPOSURA", name: "Grupo SURA", mono: "SU", qty: 250, avg: 38900, price: 42100, dayPct: -0.006, spark: [42400, 42300, 42250, 42350, 42200, 42160, 42100] },
  { ticker: "ISA", name: "Interconexión Eléctrica", mono: "IS", qty: 400, avg: 15200, price: 16850, dayPct: 0.014, spark: [16500, 16620, 16580, 16700, 16780, 16820, 16850] },
  { ticker: "NUTRESA", name: "Grupo Nutresa", mono: "NU", qty: 180, avg: 62000, price: 58400, dayPct: -0.012, spark: [59200, 59000, 58900, 58600, 58500, 58450, 58400] },
  { ticker: "CEMARGOS", name: "Cementos Argos", mono: "CA", qty: 900, avg: 4100, price: 4780, dayPct: 0.031, spark: [4600, 4650, 4620, 4700, 4740, 4760, 4780] },
  { ticker: "CORFICOLCF", name: "Corficolombiana", mono: "CF", qty: 150, avg: 22000, price: 20500, dayPct: -0.004, spark: [20700, 20650, 20600, 20560, 20530, 20510, 20500] },
];

export const CRYPTO: Asset[] = [
  { ticker: "BTC", name: "Bitcoin", mono: "BT", qty: 0.03, avg: 210000000, price: 268000000, dayPct: 0.018, spark: [255000000, 258000000, 254000000, 261000000, 265000000, 264000000, 268000000] },
  { ticker: "ETH", name: "Ethereum", mono: "ET", qty: 0.5, avg: 12800000, price: 14600000, dayPct: 0.025, spark: [13800000, 14000000, 13900000, 14200000, 14450000, 14400000, 14600000] },
  { ticker: "SOL", name: "Solana", mono: "SO", qty: 5, avg: 620000, price: 840000, dayPct: 0.041, spark: [760000, 780000, 770000, 800000, 820000, 825000, 840000] },
  { ticker: "ADA", name: "Cardano", mono: "AD", qty: 2000, avg: 2200, price: 1900, dayPct: -0.015, spark: [2050, 2020, 2000, 1970, 1940, 1920, 1900] },
  { ticker: "USDT", name: "Tether", mono: "UT", qty: 400, avg: 4100, price: 4180, dayPct: 0.001, spark: [4160, 4165, 4170, 4172, 4175, 4178, 4180] },
];

export const TRANSACTIONS: Transaction[] = [
  { id: 1, dateISO: "2026-06-28", desc: "Salario junio", category: "Nómina", account: "Bancolombia", type: "ingreso", amount: 8500000 },
  { id: 2, dateISO: "2026-06-27", desc: "Proyecto freelance", category: "Freelance", account: "Davivienda", type: "ingreso", amount: 1200000 },
  { id: 3, dateISO: "2026-06-25", desc: "Dividendo ECOPETROL", category: "Dividendos", account: "Trii", type: "ingreso", amount: 340000 },
  { id: 4, dateISO: "2026-06-24", desc: "Arriendo apartamento", category: "Vivienda", account: "Bancolombia", type: "egreso", amount: 2100000 },
  { id: 5, dateISO: "2026-06-23", desc: "Mercado Éxito", category: "Mercado", account: "Davivienda", type: "egreso", amount: 320000 },
  { id: 6, dateISO: "2026-06-21", desc: "Restaurante", category: "Restaurantes", account: "Nequi", type: "egreso", amount: 128000 },
  { id: 7, dateISO: "2026-06-20", desc: "Transporte Uber", category: "Transporte", account: "Nequi", type: "egreso", amount: 46000 },
  { id: 8, dateISO: "2026-06-18", desc: "Netflix + Spotify", category: "Suscripciones", account: "Davivienda", type: "egreso", amount: 96000 },
  { id: 9, dateISO: "2026-06-15", desc: "EPM servicios", category: "Servicios", account: "Bancolombia", type: "egreso", amount: 340000 },
  { id: 10, dateISO: "2026-06-12", desc: "Farmacia", category: "Salud", account: "Davivienda", type: "egreso", amount: 84000 },
  { id: 11, dateISO: "2026-06-10", desc: "Mercado D1", category: "Mercado", account: "Efectivo", type: "egreso", amount: 165000 },
  { id: 12, dateISO: "2026-06-08", desc: "Gasolina", category: "Transporte", account: "Davivienda", type: "egreso", amount: 180000 },
];

export const CATEGORIES: Record<TxType, string[]> = {
  ingreso: ["Nómina", "Freelance", "Dividendos", "Intereses", "Ventas", "Otros"],
  egreso: ["Vivienda", "Mercado", "Restaurantes", "Transporte", "Suscripciones", "Servicios", "Salud", "Otros"],
};

// Formatters
export const COP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const COPSHORT = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return COP(n);
};

export const PCT = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;

export const today = () => new Date().toISOString().slice(0, 10);
