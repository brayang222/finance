"use server";

import { auth } from "../auth";
import { prisma } from "./prisma";
import type { Stock, Crypto, Finance, Hys, Cash, BankAccount } from '../src/types';

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}

async function logActivity(
  userId: string,
  type: string,
  description: string,
  extras?: { amount?: number; ticker?: string; accountName?: string }
) {
  await prisma.activityLog.create({
    data: { userId, type, description, ...extras },
  });
}

// ── LOAD ALL ──
export async function loadAll() {
  const userId = await getUserId();

  const [stocks, crypto, finances, hys, hysMovements, prices, targets, cash, config, bankAccounts, activityLogs] =
    await Promise.all([
      prisma.stock.findMany({ where: { userId } }),
      prisma.crypto.findMany({ where: { userId } }),
      prisma.finance.findMany({ where: { userId } }),
      prisma.hys.findUnique({ where: { userId } }),
      prisma.hysMovement.findMany({ where: { userId } }),
      prisma.price.findMany({ where: { userId } }),
      prisma.target.findMany({ where: { userId } }),
      prisma.cash.findUnique({ where: { userId } }),
      prisma.userConfig.findUnique({ where: { userId } }),
      prisma.bankAccount.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);

  const pricesMap = Object.fromEntries(prices.map(p => [p.ticker, p.value]));
  const targetsMap = Object.fromEntries(targets.map(t => [t.ticker, t.value]));
  const hysData = hys
    ? { rate: hys.rate, movements: hysMovements.map(m => ({ ...m, note: m.note ?? undefined })) }
    : null;

  const typedFinances = finances.map(f => ({
    ...f,
    type: f.type as "ingreso" | "egreso",
    desc: f.desc ?? undefined,
    accountId: f.accountId ?? undefined,
    accountName: f.accountName ?? undefined,
  }));

  const typedCash = cash ? { banco: cash.banco, note: cash.note ?? undefined } : null;

  const typedBankAccounts = bankAccounts.map(b => ({
    id: b.id,
    name: b.name,
    bank: b.bank ?? undefined,
    balance: b.balance,
    color: b.color ?? undefined,
  }));

  const typedActivityLogs = activityLogs.map(a => ({
    id: a.id,
    type: a.type,
    description: a.description,
    amount: a.amount ?? undefined,
    ticker: a.ticker ?? undefined,
    accountName: a.accountName ?? undefined,
    createdAt: a.createdAt.toISOString(),
  }));

  const typedStocks = stocks.map(s => ({
    ...s,
    accountId: s.accountId ?? undefined,
    accountName: s.accountName ?? undefined,
  }));

  const typedCrypto = crypto.map(c => ({
    ...c,
    accountId: c.accountId ?? undefined,
    accountName: c.accountName ?? undefined,
  }));

  return {
    stocks: typedStocks,
    crypto: typedCrypto,
    finances: typedFinances,
    hys: hysData,
    prices: pricesMap,
    targets: targetsMap,
    cash: typedCash,
    config: config ? { theme: config.theme as "dark" | "light" } : null,
    bankAccounts: typedBankAccounts,
    activityLogs: typedActivityLogs,
  };
}

// ── ADD SINGLE ENTRIES ──
export async function addFinance(item: Omit<Finance, "id">) {
  const userId = await getUserId();
  await prisma.finance.create({ data: { ...item, id: crypto.randomUUID(), userId } });
  await logActivity(userId, item.type, `${item.type === "ingreso" ? "Ingreso" : "Egreso"}: ${item.desc ?? item.category}`, {
    amount: item.amount,
    accountName: item.accountName,
  });
}

export async function addStock(item: Omit<Stock, "id">) {
  const userId = await getUserId();
  const { source, ...rest } = item;
  await prisma.stock.create({ data: { ...rest, id: crypto.randomUUID(), userId } });
  await logActivity(userId, "stock_buy", `Compra acción: ${item.ticker}`, {
    amount: item.priceCOP * item.qty,
    ticker: item.ticker,
    accountName: item.accountName,
  });
}

export async function addCrypto(item: Omit<Crypto, "id">) {
  const userId = await getUserId();
  await prisma.crypto.create({ data: { ...item, id: crypto.randomUUID(), userId } });
  await logActivity(userId, "crypto_buy", `Compra cripto: ${item.ticker}`, {
    amount: item.priceCOP * item.qty,
    ticker: item.ticker,
    accountName: item.accountName,
  });
}

// ── UPDATE / DELETE SINGLE ENTRIES ──
export async function updateStock(id: string, item: Omit<Stock, "id">) {
  const userId = await getUserId();
  const { source, ...rest } = item;
  await prisma.stock.update({ where: { id, userId }, data: rest });
  await logActivity(userId, "stock_edit", `Edición acción: ${item.ticker}`, { ticker: item.ticker });
}

export async function deleteStock(id: string) {
  const userId = await getUserId();
  const row = await prisma.stock.findUnique({ where: { id } });
  await prisma.stock.delete({ where: { id, userId } });
  await logActivity(userId, "stock_delete", `Eliminación acción: ${row?.ticker ?? id}`, { ticker: row?.ticker });
}

export async function updateCrypto(id: string, item: Omit<Crypto, "id">) {
  const userId = await getUserId();
  await prisma.crypto.update({ where: { id, userId }, data: item });
  await logActivity(userId, "crypto_edit", `Edición cripto: ${item.ticker}`, { ticker: item.ticker });
}

export async function deleteCrypto(id: string) {
  const userId = await getUserId();
  const row = await prisma.crypto.findUnique({ where: { id } });
  await prisma.crypto.delete({ where: { id, userId } });
  await logActivity(userId, "crypto_delete", `Eliminación cripto: ${row?.ticker ?? id}`, { ticker: row?.ticker });
}

// ── BANK ACCOUNTS ──
export async function createBankAccount(item: Omit<BankAccount, "id">) {
  const userId = await getUserId();
  await prisma.bankAccount.create({ data: { ...item, userId } });
  await logActivity(userId, "account_create", `Nueva cuenta: ${item.name}`, { accountName: item.name });
}

export async function updateBankAccount(id: string, item: Omit<BankAccount, "id">) {
  const userId = await getUserId();
  await prisma.bankAccount.update({ where: { id, userId }, data: item });
  await logActivity(userId, "account_edit", `Cuenta editada: ${item.name}`, { accountName: item.name });
}

export async function deleteBankAccount(id: string) {
  const userId = await getUserId();
  const row = await prisma.bankAccount.findUnique({ where: { id } });
  await prisma.bankAccount.delete({ where: { id, userId } });
  await logActivity(userId, "account_delete", `Cuenta eliminada: ${row?.name ?? id}`, { accountName: row?.name });
}

// ── REFRESH MARKET PRICES ──
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", ADA: "cardano",
  USDT: "tether", BNB: "binancecoin", XRP: "ripple", DOT: "polkadot",
  MATIC: "matic-network", AVAX: "avalanche-2", DOGE: "dogecoin",
  LINK: "chainlink", LTC: "litecoin", UNI: "uniswap", ATOM: "cosmos",
};

export async function refreshPrices(stockTickers: string[], cryptoTickers: string[]) {
  const userId = await getUserId();
  const pricesMap: Record<string, number> = {};

  for (const ticker of stockTickers) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.CL?range=1d&interval=1d`;
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } });
      if (!res.ok) continue;
      const json = await res.json();
      const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price && price > 0) pricesMap[ticker] = price;
    } catch { /* skip */ }
  }

  const ids = cryptoTickers.map(t => COINGECKO_IDS[t.toUpperCase()]).filter(Boolean);
  if (ids.length > 0) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=cop`;
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (res.ok) {
        const json = await res.json();
        for (const ticker of cryptoTickers) {
          const coinId = COINGECKO_IDS[ticker.toUpperCase()];
          if (coinId && json[coinId]?.cop) pricesMap[ticker.toUpperCase()] = json[coinId].cop;
        }
      }
    } catch { /* skip */ }
  }

  if (Object.keys(pricesMap).length === 0) return { updated: 0 };

  const existing = await prisma.price.findMany({ where: { userId } });
  const merged = { ...Object.fromEntries(existing.map(p => [p.ticker, p.value])), ...pricesMap };
  await prisma.$transaction([
    prisma.price.deleteMany({ where: { userId } }),
    prisma.price.createMany({ data: Object.entries(merged).map(([ticker, value]) => ({ userId, ticker, value })) }),
  ]);
  return { updated: Object.keys(pricesMap).length };
}

// ── STOCKS ──
export async function saveStocks(items: Stock[]) {
  const userId = await getUserId();
  await prisma.$transaction([
    prisma.stock.deleteMany({ where: { userId } }),
    prisma.stock.createMany({ data: items.map(s => ({ ...s, userId })) }),
  ]);
}

// ── CRYPTO ──
export async function saveCrypto(items: Crypto[]) {
  const userId = await getUserId();
  await prisma.$transaction([
    prisma.crypto.deleteMany({ where: { userId } }),
    prisma.crypto.createMany({ data: items.map(c => ({ ...c, userId })) }),
  ]);
}

// ── FINANCES ──
export async function saveFinances(items: Finance[]) {
  const userId = await getUserId();
  await prisma.$transaction([
    prisma.finance.deleteMany({ where: { userId } }),
    prisma.finance.createMany({ data: items.map(f => ({ ...f, userId })) }),
  ]);
}

// ── HYS ──
export async function saveHys({ rate, movements }: Hys) {
  const userId = await getUserId();
  await prisma.$transaction([
    prisma.hys.upsert({
      where: { userId },
      update: { rate },
      create: { userId, rate },
    }),
    prisma.hysMovement.deleteMany({ where: { userId } }),
    prisma.hysMovement.createMany({
      data: movements.map(m => ({ ...m, userId })),
    }),
  ]);
}

// ── PRICES ──
export async function savePrices(pricesMap: Record<string, number>) {
  const userId = await getUserId();
  const entries = Object.entries(pricesMap);
  await prisma.$transaction([
    prisma.price.deleteMany({ where: { userId } }),
    prisma.price.createMany({
      data: entries.map(([ticker, value]) => ({ userId, ticker, value })),
    }),
  ]);
}

// ── TARGETS ──
export async function saveTargets(targetsMap: Record<string, number>) {
  const userId = await getUserId();
  const entries = Object.entries(targetsMap);
  await prisma.$transaction([
    prisma.target.deleteMany({ where: { userId } }),
    prisma.target.createMany({
      data: entries.map(([ticker, value]) => ({ userId, ticker, value })),
    }),
  ]);
}

// ── CASH ──
export async function saveCash({ banco, note }: Cash) {
  const userId = await getUserId();
  await prisma.cash.upsert({
    where: { userId },
    update: { banco, note },
    create: { userId, banco, note },
  });
}

// ── USER CONFIG ──
export async function saveConfig(theme: string) {
  const userId = await getUserId();
  await prisma.userConfig.upsert({
    where: { userId },
    update: { theme },
    create: { userId, theme },
  });
}

// ── SEED (migración inicial) ──
export async function seedUserData(data: any) { // TODO: type
  const userId = await getUserId();

  const existing = await prisma.stock.count({ where: { userId } });
  if (existing > 0) return { seeded: false };

  await prisma.$transaction([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.stock.createMany({ data: data.stocks.map((s: any) => ({ ...s, userId })) }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.crypto.createMany({ data: data.crypto.map((c: any) => ({ ...c, userId })) }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.finance.createMany({ data: data.finances.map((f: any) => ({ ...f, userId })) }),
    prisma.hys.create({ data: { userId, rate: data.hys.rate } }),
    prisma.hysMovement.createMany({
      data: data.hys.movements.map((m: any) => ({ ...m, userId })),
    }),
    prisma.cash.create({ data: { userId, banco: data.cash.banco } }),
  ]);

  return { seeded: true };
}
