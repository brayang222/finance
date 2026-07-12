"use server";

import { auth } from "../auth";
import { prisma } from "./prisma";
import { cookies } from "next/headers";
import type { Stock, Crypto, Finance, Hys, Cash, BankAccount } from '../src/types';
import { GENERIC_CATS_IN, GENERIC_CATS_OUT } from '../src/data/constants';

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
  try {
    return await _loadAll();
  } catch (e: any) {
    // Neon cold start: retry once after 2s
    if (e?.code === "P1001") {
      await new Promise(r => setTimeout(r, 2000));
      return await _loadAll();
    }
    throw e;
  }
}

async function _loadAll() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  const userId = session.user.id;
  const userEmail = session.user.email ?? "";

  // Resolve view-as cookie
  const cookieStore = await cookies();
  const viewAsId = cookieStore.get("gfp-view-as")?.value;
  let targetUserId = userId;
  let viewingAs: { userId: string; name: string } | null = null;

  if (viewAsId && viewAsId !== userId) {
    const share = await prisma.shareInvite.findFirst({
      where: { ownerId: viewAsId, guestId: userId, status: "accepted" },
      include: { owner: { select: { name: true, email: true } } },
    });
    if (share) {
      targetUserId = viewAsId;
      viewingAs = { userId: viewAsId, name: share.owner.name ?? share.owner.email ?? viewAsId };
    }
  }

  const [stocks, crypto, finances, hysAccountsRaw, hysMovements, prices, targets, cash, config, bankAccounts, activityLogs, budgets, budgetConfigs, categories, goals, recurrings, sharesGiven, sharesReceived] =
    await Promise.all([
      prisma.stock.findMany({ where: { userId: targetUserId } }),
      prisma.crypto.findMany({ where: { userId: targetUserId } }),
      prisma.finance.findMany({ where: { userId: targetUserId } }),
      prisma.hys.findMany({ where: { userId: targetUserId }, include: { movements: { orderBy: { date: "asc" } } } }),
      prisma.hysMovement.findMany({ where: { userId: targetUserId } }),
      prisma.price.findMany({ where: { userId: targetUserId } }),
      prisma.target.findMany({ where: { userId: targetUserId } }),
      prisma.cash.findUnique({ where: { userId: targetUserId } }),
      prisma.userConfig.findUnique({ where: { userId: targetUserId } }),
      prisma.bankAccount.findMany({ where: { userId: targetUserId }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, bank: true, type: true, balance: true, color: true } }),
      prisma.activityLog.findMany({ where: { userId: targetUserId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.budget.findMany({ where: { userId: targetUserId }, orderBy: { category: 'asc' } }),
      prisma.budgetConfig.findMany({ where: { userId: targetUserId } }),
      prisma.category.findMany({ where: { userId: targetUserId }, orderBy: { name: 'asc' } }),
      prisma.goal.findMany({ where: { userId: targetUserId }, orderBy: { createdAt: 'asc' } }),
      prisma.recurring.findMany({ where: { userId: targetUserId }, orderBy: { nextDate: 'asc' } }),
      // Sharing metadata always from the real user
      prisma.shareInvite.findMany({
        where: { ownerId: userId, status: { not: "revoked" } },
        include: { guest: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shareInvite.findMany({
        where: { status: { not: "revoked" }, OR: [{ guestId: userId }, { guestEmail: userEmail }] },
        include: { owner: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const pricesMap = Object.fromEntries(prices.map(p => [p.ticker, p.value]));
  const targetsMap = Object.fromEntries(targets.map(t => [t.ticker, t.value]));
  const firstHys = hysAccountsRaw[0];
  const hysData = firstHys
    ? { rate: firstHys.rate, movements: hysMovements.map(m => ({ ...m, note: m.note ?? undefined })) }
    : null;

  const typedHysAccounts = hysAccountsRaw.map(h => ({
    id: h.id, name: h.name, currency: h.currency, rate: h.rate,
    openedAt: h.openedAt ?? undefined,
    movements: h.movements.map(m => ({ ...m, note: m.note ?? undefined })),
  }));

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
    type: b.type ?? "banco",
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
    hysAccounts: typedHysAccounts,
    prices: pricesMap,
    targets: targetsMap,
    cash: typedCash,
    config: config ? {
      theme: config.theme as "dark" | "light",
      onboardingDone: config.onboardingDone,
      showStocks: config.showStocks,
      showCrypto: config.showCrypto,
      showHys: config.showHys,
      showActivity: config.showActivity,
      showGoals: config.showGoals,
      baseCurrency: config.baseCurrency as "COP" | "USD",
      trm: config.trm,
      trmUpdatedAt: config.trmUpdatedAt?.toISOString() ?? null,
      summaryWidgets: config.summaryWidgets ? JSON.parse(config.summaryWidgets) : null,
    } : null,
    bankAccounts: typedBankAccounts,
    activityLogs: typedActivityLogs,
    budgets: budgets.map(b => ({
      id: b.id, category: b.category, amount: b.amount,
      period: b.period as "semanal" | "mensual" | "anual",
    })),
    budgetConfigs: budgetConfigs.map(c => ({
      period: c.period as "semanal" | "mensual" | "anual", amount: c.amount,
    })),
    categories: categories.map(c => ({ id: c.id, name: c.name, type: c.type as "ingreso" | "egreso" })),
    goals: goals.map(g => ({
      id: g.id, name: g.name, target: g.target, saved: g.saved,
      deadline: g.deadline ?? undefined, color: g.color ?? undefined,
    })),
    recurrings: recurrings.map(r => ({
      id: r.id,
      type: r.type as "ingreso" | "egreso",
      category: r.category,
      desc: r.desc,
      amount: r.amount,
      accountId: r.accountId ?? undefined,
      accountName: r.accountName ?? undefined,
      frequency: r.frequency as "diario" | "semanal" | "quincenal" | "mensual" | "anual",
      nextDate: r.nextDate,
      active: r.active,
    })),
    sharesGiven: sharesGiven.map(s => ({
      id: s.id, ownerId: s.ownerId, ownerName: null,
      guestEmail: s.guestEmail, guestId: s.guestId,
      guestName: s.guest?.name ?? s.guest?.email ?? null,
      role: s.role as "viewer" | "editor",
      status: s.status as "pending" | "accepted",
    })),
    sharesReceived: sharesReceived.map(s => ({
      id: s.id, ownerId: s.ownerId,
      ownerName: s.owner.name ?? s.owner.email ?? null,
      guestEmail: s.guestEmail, guestId: s.guestId, guestName: null,
      role: s.role as "viewer" | "editor",
      status: s.status as "pending" | "accepted",
    })),
    viewingAs,
  };
}

// ── BALANCE ADJUSTMENT HELPER ──
// delta > 0 = credit (money in), delta < 0 = debit (money out)
async function adjustBalance(userId: string, accountId: string | undefined | null, delta: number) {
  if (!accountId || Math.abs(delta) < 0.01) return;
  if (accountId === "hys") {
    const hys = await prisma.hys.findFirst({ where: { userId } });
    if (!hys) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const last = await prisma.hysMovement.findFirst({ where: { hysId: hys.id }, orderBy: { date: "desc" } });
    const base = last ? last.balance * (1 + hys.rate / 100) ** (
      Math.max(0, Math.floor((new Date(todayStr).getTime() - new Date(last.date).getTime()) / 86400000)) / 365
    ) : 0;
    const newBal = Math.max(0, base + delta);
    await prisma.hysMovement.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        hysId: hys.id,
        date: todayStr,
        type: delta >= 0 ? "deposito" : "retiro",
        amount: Math.abs(delta),
        balance: newBal,
        rate: hys.rate,
      },
    });
  } else {
    await prisma.bankAccount.updateMany({
      where: { id: accountId, userId },
      data: { balance: { increment: delta } },
    });
  }
}

// ── ADD SINGLE ENTRIES ──
export async function updateFinance(id: string, item: Omit<Finance, "id">) {
  const userId = await getUserId();
  const old = await prisma.finance.findUnique({ where: { id } });
  if (!old || old.userId !== userId) throw new Error("Not found");
  await adjustBalance(userId, old.accountId, old.type === "ingreso" ? -old.amount : old.amount);
  await adjustBalance(userId, item.accountId, item.type === "ingreso" ? item.amount : -item.amount);
  await prisma.finance.update({ where: { id }, data: { ...item, userId } });
  await autoSaveCategory(userId, item.category, item.type);
}

export async function deleteFinance(id: string) {
  const userId = await getUserId();
  const old = await prisma.finance.findUnique({ where: { id } });
  if (!old || old.userId !== userId) return;
  await adjustBalance(userId, old.accountId, old.type === "ingreso" ? -old.amount : old.amount);
  await prisma.finance.delete({ where: { id } });
}

async function autoSaveCategory(userId: string, name: string, type: string) {
  await prisma.category.upsert({
    where: { userId_name_type: { userId, name, type } },
    create: { userId, name, type },
    update: {},
  });
}

export async function addFinance(item: Omit<Finance, "id">) {
  const userId = await getUserId();
  await prisma.finance.create({ data: { ...item, id: crypto.randomUUID(), userId } });
  await autoSaveCategory(userId, item.category, item.type);
  const delta = item.type === "ingreso" ? item.amount : -item.amount;
  await adjustBalance(userId, item.accountId, delta);
  await logActivity(userId, item.type, `${item.type === "ingreso" ? "Ingreso" : "Egreso"}: ${item.desc ?? item.category}`, {
    amount: item.amount,
    accountName: item.accountName,
  });
}

export async function addStock(item: Omit<Stock, "id">) {
  const userId = await getUserId();
  const { source, ...rest } = item;
  await prisma.stock.create({ data: { ...rest, id: crypto.randomUUID(), userId } });
  await adjustBalance(userId, item.accountId, -(item.priceCOP * item.qty + item.commission));
  await logActivity(userId, "stock_buy", `Compra acción: ${item.ticker}`, {
    amount: item.priceCOP * item.qty,
    ticker: item.ticker,
    accountName: item.accountName,
  });
}

export async function addCrypto(item: Omit<Crypto, "id">) {
  const userId = await getUserId();
  await prisma.crypto.create({ data: { ...item, id: crypto.randomUUID(), userId } });
  await adjustBalance(userId, item.accountId, -(item.priceCOP * item.qty + item.commission));
  await logActivity(userId, "crypto_buy", `Compra cripto: ${item.ticker}`, {
    amount: item.priceCOP * item.qty,
    ticker: item.ticker,
    accountName: item.accountName,
  });
}

// ── UPDATE / DELETE SINGLE ENTRIES ──
export async function updateStock(id: string, item: Omit<Stock, "id">) {
  const userId = await getUserId();
  const old = await prisma.stock.findUnique({ where: { id } });
  const { source, ...rest } = item;
  await prisma.stock.update({ where: { id, userId }, data: rest });
  // Reverse old debit, apply new debit
  if (old?.accountId) await adjustBalance(userId, old.accountId, old.priceCOP * old.qty + old.commission);
  await adjustBalance(userId, item.accountId, -(item.priceCOP * item.qty + item.commission));
  await logActivity(userId, "stock_edit", `Edición acción: ${item.ticker}`, { ticker: item.ticker });
}

export async function deleteStock(id: string) {
  const userId = await getUserId();
  const row = await prisma.stock.findUnique({ where: { id } });
  await prisma.stock.delete({ where: { id, userId } });
  if (row?.accountId) await adjustBalance(userId, row.accountId, row.priceCOP * row.qty + row.commission);
  await logActivity(userId, "stock_delete", `Eliminación acción: ${row?.ticker ?? id}`, { ticker: row?.ticker });
}

export async function updateCrypto(id: string, item: Omit<Crypto, "id">) {
  const userId = await getUserId();
  const old = await prisma.crypto.findUnique({ where: { id } });
  await prisma.crypto.update({ where: { id, userId }, data: item });
  if (old?.accountId) await adjustBalance(userId, old.accountId, old.priceCOP * old.qty + old.commission);
  await adjustBalance(userId, item.accountId, -(item.priceCOP * item.qty + item.commission));
  await logActivity(userId, "crypto_edit", `Edición cripto: ${item.ticker}`, { ticker: item.ticker });
}

export async function deleteCrypto(id: string) {
  const userId = await getUserId();
  const row = await prisma.crypto.findUnique({ where: { id } });
  await prisma.crypto.delete({ where: { id, userId } });
  if (row?.accountId) await adjustBalance(userId, row.accountId, row.priceCOP * row.qty + row.commission);
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

  await Promise.all(
    Object.entries(pricesMap).map(([ticker, value]) =>
      prisma.price.upsert({
        where: { userId_ticker: { userId, ticker } },
        create: { userId, ticker, value },
        update: { value },
      })
    )
  );
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
  let hys = await prisma.hys.findFirst({ where: { userId } });
  if (!hys) hys = await prisma.hys.create({ data: { userId, name: "Nubank", rate } });
  else await prisma.hys.update({ where: { id: hys.id }, data: { rate } });
  await prisma.hysMovement.deleteMany({ where: { hysId: hys.id } });
  await prisma.hysMovement.createMany({
    data: movements.map(m => ({ ...m, userId, hysId: hys.id })),
  });
}

// ── HYS GRANULAR ACTIONS ──

function diffDays(later: string, earlier: string): number {
  return Math.floor((new Date(later).getTime() - new Date(earlier).getTime()) / 86400000);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Compound balance B from date L to date T using TEA. */
function compound(B: number, tea: number, dateL: string, dateT: string): number {
  const days = diffDays(dateT, dateL);
  if (days <= 0) return B;
  return B * (1 + tea / 100) ** (days / 365);
}

/** After changing or deleting a movement, replay the series to fix subsequent balances. */
async function replayBalancesForAccount(hysId: string, fromDate: string) {
  const all = await prisma.hysMovement.findMany({ where: { hysId }, orderBy: { date: "asc" } });
  const pivotIdx = all.findIndex(m => m.date >= fromDate);
  if (pivotIdx <= 0) return; // nothing before to base from, or nothing after
  let prev = all[pivotIdx - 1];
  for (let i = pivotIdx; i < all.length; i++) {
    const m = all[i];
    const accrued = compound(prev.balance, prev.rate, prev.date, m.date);
    const isDeposit = m.type === "deposito" || m.type === "inicio" || m.type === "rendimiento";
    const isRetiro = m.type === "retiro";
    const newBalance = isRetiro ? accrued - m.amount : accrued + (isDeposit ? m.amount : m.amount);
    // rendimiento movements record a 0 amount deposit (just the accrual capture)
    const finalBalance = m.type === "rendimiento" ? accrued : newBalance;
    await prisma.hysMovement.update({ where: { id: m.id }, data: { balance: finalBalance } });
    prev = { ...m, balance: finalBalance };
  }
}

export async function initHys(initialBalance: number, rate: number, name = "Nubank", currency = "COP", accountId?: string, sourceAmount?: number) {
  const userId = await getUserId();
  const today = todayISO();
  const hys = await prisma.hys.create({
    data: { userId, name, currency, rate, openedAt: today },
  });
  await prisma.hysMovement.create({
    data: { id: crypto.randomUUID(), userId, hysId: hys.id, date: today, type: "inicio", amount: initialBalance, balance: initialBalance, rate },
  });
  if (accountId) await adjustBalance(userId, accountId, -(sourceAmount ?? initialBalance));
  return hys.id;
}

export async function hysDeposit(hysId: string, amount: number, note?: string, accountId?: string) {
  const userId = await getUserId();
  const today = todayISO();
  const hys = await prisma.hys.findFirst({ where: { id: hysId, userId } });
  if (!hys) throw new Error("Cuenta no encontrada");
  const last = await prisma.hysMovement.findFirst({ where: { hysId }, orderBy: { date: "desc" } });
  const base = last ? compound(last.balance, last.rate, last.date, today) : amount;
  const newBalance = base + amount;
  await prisma.hysMovement.create({
    data: { id: crypto.randomUUID(), userId, hysId, date: today, type: "deposito", amount, balance: newBalance, rate: hys.rate, note },
  });
  if (accountId) await adjustBalance(userId, accountId, -amount);
}

export async function hysWithdraw(hysId: string, amount: number, note?: string, accountId?: string) {
  const userId = await getUserId();
  const today = todayISO();
  const hys = await prisma.hys.findFirst({ where: { id: hysId, userId } });
  if (!hys) throw new Error("Cuenta no encontrada");
  const last = await prisma.hysMovement.findFirst({ where: { hysId }, orderBy: { date: "desc" } });
  const base = last ? compound(last.balance, last.rate, last.date, today) : 0;
  const newBalance = base - amount;
  await prisma.hysMovement.create({
    data: { id: crypto.randomUUID(), userId, hysId, date: today, type: "retiro", amount, balance: newBalance, rate: hys.rate, note },
  });
  if (accountId) await adjustBalance(userId, accountId, amount);
}

export async function hysChangeRate(hysId: string, newRate: number) {
  const userId = await getUserId();
  const today = todayISO();
  const hys = await prisma.hys.findFirst({ where: { id: hysId, userId } });
  if (!hys) throw new Error("Cuenta no encontrada");
  const last = await prisma.hysMovement.findFirst({ where: { hysId }, orderBy: { date: "desc" } });
  const accrued = last ? compound(last.balance, last.rate, last.date, today) : 0;
  await prisma.$transaction([
    prisma.hysMovement.create({
      data: { id: crypto.randomUUID(), userId, hysId, date: today, type: "rendimiento", amount: 0, balance: accrued, rate: hys.rate },
    }),
    prisma.hys.update({ where: { id: hysId }, data: { rate: newRate } }),
  ]);
}

export async function hysEditMovement(id: string, patch: { amount?: number; note?: string; date?: string }) {
  const userId = await getUserId();
  const movement = await prisma.hysMovement.findFirst({ where: { id, userId } });
  if (!movement) throw new Error("Movimiento no encontrado");
  const updated = await prisma.hysMovement.update({ where: { id }, data: patch });
  await replayBalancesForAccount(movement.hysId!, updated.date);
}

export async function hysDeleteMovement(id: string) {
  const userId = await getUserId();
  const movement = await prisma.hysMovement.findFirst({ where: { id, userId } });
  if (!movement) throw new Error("Movimiento no encontrado");
  const hysId = movement.hysId;
  const date = movement.date;
  await prisma.hysMovement.delete({ where: { id } });
  if (hysId) await replayBalancesForAccount(hysId, date);
}

export async function hysDeleteAccount(hysId: string) {
  const userId = await getUserId();
  const hys = await prisma.hys.findFirst({ where: { id: hysId, userId } });
  if (!hys) throw new Error("Cuenta no encontrada");
  await prisma.hys.delete({ where: { id: hysId } });
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

export async function saveTelegramId(telegramId: string) {
  const userId = await getUserId();
  await prisma.userConfig.upsert({
    where: { userId },
    update: { telegramId: telegramId || null },
    create: { userId, telegramId: telegramId || null },
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
    prisma.hys.create({ data: { userId, name: "Nubank", rate: data.hys.rate } }),
    prisma.hysMovement.createMany({
      data: data.hys.movements.map((m: any) => ({ ...m, userId })),
    }),
    prisma.cash.create({ data: { userId, banco: data.cash.banco } }),
  ]);

  return { seeded: true };
}

// ── BUDGETS (independent per period: semanal/mensual/anual) ──
export async function upsertBudgetConfig(period: string, amount: number) {
  const userId = await getUserId();
  await prisma.budgetConfig.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period, amount },
    update: { amount },
  });
}

export async function upsertBudget(category: string, amount: number, period: string) {
  const userId = await getUserId();
  await prisma.budget.upsert({
    where: { userId_category_period: { userId, category, period } },
    create: { userId, category, amount, period },
    update: { amount },
  });
}

export async function deleteBudget(category: string, period: string) {
  const userId = await getUserId();
  await prisma.budget.deleteMany({ where: { userId, category, period } });
}

// ── ONBOARDING / MODULES ──
export async function completeOnboarding(modules: {
  showStocks: boolean;
  showCrypto: boolean;
  showHys: boolean;
  showActivity: boolean;
  showGoals: boolean;
}) {
  const userId = await getUserId();

  // Bootstrap from existing transaction categories
  const existing = await prisma.finance.findMany({
    where: { userId },
    select: { category: true, type: true },
    distinct: ['category', 'type'],
  });

  const defaults = [
    ...GENERIC_CATS_IN.map(name => ({ name, type: "ingreso" })),
    ...GENERIC_CATS_OUT.map(name => ({ name, type: "egreso" })),
  ];

  const existingSet = new Set(existing.map(f => `${f.type}::${f.category.toLowerCase()}`));
  const toInsert = [
    ...existing.map(f => ({ name: f.category, type: f.type })),
    ...defaults.filter(d => !existingSet.has(`${d.type}::${d.name.toLowerCase()}`)),
  ];

  for (const cat of toInsert) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId, name: cat.name, type: cat.type } },
      create: { userId, name: cat.name, type: cat.type },
      update: {},
    });
  }

  await prisma.userConfig.upsert({
    where: { userId },
    create: { userId, onboardingDone: true, ...modules },
    update: { onboardingDone: true, ...modules },
  });
}

export async function updateModules(modules: {
  showStocks: boolean;
  showCrypto: boolean;
  showHys: boolean;
  showActivity: boolean;
  showGoals: boolean;
}) {
  const userId = await getUserId();
  await prisma.userConfig.upsert({
    where: { userId },
    create: { userId, onboardingDone: true, ...modules },
    update: modules,
  });
}

// ── CATEGORIES ──
export async function addCategory(name: string, type: string) {
  const userId = await getUserId();
  await prisma.category.upsert({
    where: { userId_name_type: { userId, name, type } },
    create: { userId, name, type },
    update: {},
  });
}

export async function deleteCategory(id: string) {
  const userId = await getUserId();
  await prisma.category.deleteMany({ where: { id, userId } });
}

// ── CURRENCY / TRM ──
export async function saveCurrency(baseCurrency: string) {
  const userId = await getUserId();
  await prisma.userConfig.upsert({
    where: { userId },
    create: { userId, baseCurrency },
    update: { baseCurrency },
  });
}

export async function refreshTrm() {
  const userId = await getUserId();
  const res = await fetch("https://latest.currency-api.pages.dev/v1/currencies/usd.json", { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("No se pudo consultar la tasa de cambio");
  const json = await res.json();
  const cop = json?.usd?.cop;
  if (!cop || cop <= 0) throw new Error("TRM no disponible");
  const now = new Date();
  await prisma.userConfig.upsert({
    where: { userId },
    create: { userId, trm: cop, trmUpdatedAt: now },
    update: { trm: cop, trmUpdatedAt: now },
  });
  return cop as number;
}

// ── SUMMARY WIDGETS ──
export async function saveSummaryWidgets(keys: string[]) {
  const userId = await getUserId();
  const json = JSON.stringify(keys);
  await prisma.userConfig.upsert({
    where: { userId },
    create: { userId, summaryWidgets: json },
    update: { summaryWidgets: json },
  });
}

// ── GOALS ──
export async function addGoal(item: { name: string; target: number; saved?: number; deadline?: string; color?: string }) {
  const userId = await getUserId();
  await prisma.goal.create({ data: { ...item, userId } });
  await logActivity(userId, "goal_create", `Nueva meta: ${item.name}`, { amount: item.target });
}

export async function updateGoal(id: string, item: { name: string; target: number; saved: number; deadline?: string; color?: string }) {
  const userId = await getUserId();
  await prisma.goal.updateMany({
    where: { id, userId },
    data: { ...item, deadline: item.deadline ?? null },
  });
}

export async function deleteGoal(id: string) {
  const userId = await getUserId();
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) return;
  await prisma.goal.delete({ where: { id } });
  await logActivity(userId, "goal_delete", `Meta eliminada: ${goal.name}`);
}

export async function contributeGoal(id: string, amount: number) {
  const userId = await getUserId();
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error("Meta no encontrada");
  await prisma.goal.update({ where: { id }, data: { saved: { increment: amount } } });
  await logActivity(userId, "goal_contribute", `Abono a meta: ${goal.name}`, { amount });
}

// ── RECURRING TRANSACTIONS ──
export async function addRecurring(item: {
  type: string; category: string; desc: string; amount: number;
  accountId?: string; accountName?: string; frequency: string; nextDate: string;
}) {
  const userId = await getUserId();
  await prisma.recurring.create({ data: { ...item, userId } });
}

export async function updateRecurring(id: string, item: {
  type: string; category: string; desc: string; amount: number;
  accountId?: string; accountName?: string; frequency: string; nextDate: string; active: boolean;
}) {
  const userId = await getUserId();
  await prisma.recurring.updateMany({ where: { id, userId }, data: item });
}

export async function deleteRecurring(id: string) {
  const userId = await getUserId();
  await prisma.recurring.deleteMany({ where: { id, userId } });
}

function advanceDate(date: string, frequency: string): string {
  const d = new Date(date + "T00:00:00");
  switch (frequency) {
    case "diario":     d.setDate(d.getDate() + 1); break;
    case "semanal":    d.setDate(d.getDate() + 7); break;
    case "quincenal":  d.setDate(d.getDate() + 15); break;
    case "mensual":    d.setMonth(d.getMonth() + 1); break;
    case "anual":      d.setFullYear(d.getFullYear() + 1); break;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ── SHARED ACCESS ──
export async function inviteShare(guestEmail: string, role: string = "viewer") {
  const userId = await getUserId();
  const guestUser = await prisma.user.findUnique({ where: { email: guestEmail }, select: { id: true } });
  await prisma.shareInvite.upsert({
    where: { ownerId_guestEmail: { ownerId: userId, guestEmail } },
    create: { ownerId: userId, guestEmail, guestId: guestUser?.id ?? null, role, status: "pending" },
    update: { status: "pending", role, guestId: guestUser?.id ?? undefined },
  });
}

export async function acceptShare(inviteId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  const userId = session.user.id;
  const userEmail = session.user.email ?? "";
  const invite = await prisma.shareInvite.findFirst({
    where: { id: inviteId, status: "pending", OR: [{ guestId: userId }, { guestEmail: userEmail }] },
  });
  if (!invite) throw new Error("Invitación no encontrada");
  await prisma.shareInvite.update({ where: { id: inviteId }, data: { guestId: userId, status: "accepted" } });
}

export async function revokeShare(inviteId: string) {
  const userId = await getUserId();
  // Owner revokes, or guest removes themselves
  await prisma.shareInvite.updateMany({
    where: { id: inviteId, OR: [{ ownerId: userId }, { guestId: userId }] },
    data: { status: "revoked" },
  });
}

export async function switchViewAs(targetUserId: string | null) {
  const userId = await getUserId();
  const cookieStore = await cookies();
  if (!targetUserId || targetUserId === userId) {
    cookieStore.delete("gfp-view-as");
    return;
  }
  const share = await prisma.shareInvite.findFirst({
    where: { ownerId: targetUserId, guestId: userId, status: "accepted" },
  });
  if (!share) throw new Error("Sin permiso");
  cookieStore.set("gfp-view-as", targetUserId, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function applyRecurring(id: string) {
  const userId = await getUserId();
  const r = await prisma.recurring.findFirst({ where: { id, userId } });
  if (!r) throw new Error("Recurrente no encontrado");
  await prisma.finance.create({
    data: {
      id: crypto.randomUUID(), userId,
      type: r.type, category: r.category, desc: r.desc,
      amount: r.amount, date: todayISO(),
      accountId: r.accountId, accountName: r.accountName,
    },
  });
  await autoSaveCategory(userId, r.category, r.type);
  const delta = r.type === "ingreso" ? r.amount : -r.amount;
  await adjustBalance(userId, r.accountId ?? undefined, delta);
  const next = advanceDate(r.nextDate, r.frequency);
  await prisma.recurring.update({ where: { id }, data: { nextDate: next } });
  await logActivity(userId, r.type, `Recurrente: ${r.desc}`, { amount: r.amount, accountName: r.accountName ?? undefined });
}

export async function importFinances(items: Array<{
  type: "ingreso" | "egreso";
  amount: number;
  desc: string;
  category: string;
  date: string;
  accountId?: string;
  accountName?: string;
}>) {
  const userId = await getUserId();
  await prisma.finance.createMany({
    data: items.map(item => ({
      id: crypto.randomUUID(),
      userId,
      type: item.type,
      amount: item.amount,
      desc: item.desc,
      category: item.category,
      date: item.date,
      accountId: item.accountId,
      accountName: item.accountName,
    })),
  });
  for (const item of items) {
    await autoSaveCategory(userId, item.category, item.type);
  }
}
