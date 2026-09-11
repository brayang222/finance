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
  avg: number; // weighted average price paid per unit — no commission (this is the PPA brokers quote)
  totalCost: number; // full cash outlay: qty * price paid + commission — use this for P/G, not qty * avg
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

export const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const COPSHORT = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return COP(n);
};

export const PCT = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;

// Local date, not UTC — Colombia is UTC-5, toISOString() shifts to tomorrow at night
export const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
