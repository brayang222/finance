"use server";

import { auth } from "../auth";
import { prisma } from "./prisma";
import {
  resolveBusinessUser, adjustBalance,
  createSale, removeSale, createPurchase, closeCashDay,
  type SaleItemInput, type PurchaseItemInput,
} from "./db";
import { cookies } from "next/headers";
import type { Stock, Crypto, Finance, Hys, Cash, BankAccount, Bien, Dividend } from '../src/types';
import { GENERIC_CATS_IN, GENERIC_CATS_OUT } from '../src/data/constants';

async function getSessionUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}

async function getUserId() {
  const userId = await getSessionUserId();
  const cookieStore = await cookies();
  if (cookieStore.get("gfp-profile")?.value === "business") {
    return (await resolveBusinessUser(userId)).id;
  }
  return userId;
}

export async function switchProfile(profile: "personal" | "business") {
  const userId = await getSessionUserId();
  const cookieStore = await cookies();
  if (profile === "business") {
    await resolveBusinessUser(userId);
    cookieStore.set("gfp-profile", "business", { httpOnly: true, sameSite: "lax", path: "/" });
    cookieStore.delete("gfp-view-as");
  } else {
    cookieStore.delete("gfp-profile");
  }
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

  // Resolve profile + view-as cookies
  const cookieStore = await cookies();
  const profile: "personal" | "business" =
    cookieStore.get("gfp-profile")?.value === "business" ? "business" : "personal";
  const viewAsId = cookieStore.get("gfp-view-as")?.value;
  let targetUserId = userId;
  let viewingAs: { userId: string; name: string } | null = null;

  if (profile === "business") {
    targetUserId = (await resolveBusinessUser(userId)).id;
  } else if (viewAsId && viewAsId !== userId) {
    const share = await prisma.shareInvite.findFirst({
      where: { ownerId: viewAsId, guestId: userId, status: "accepted" },
      include: { owner: { select: { name: true, email: true } } },
    });
    if (share) {
      targetUserId = viewAsId;
      viewingAs = { userId: viewAsId, name: share.owner.name ?? share.owner.email ?? viewAsId };
    }
  }

  const [stocks, crypto, finances, hysAccountsRaw, hysMovements, prices, targets, cash, config, bankAccounts, bienes, activityLogs, budgets, budgetConfigs, categories, goals, recurrings, transfers, dividends, sharesGiven, sharesReceived] =
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
      prisma.bien.findMany({ where: { userId: targetUserId }, orderBy: { createdAt: 'asc' } }),
      prisma.activityLog.findMany({ where: { userId: targetUserId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.budget.findMany({ where: { userId: targetUserId }, orderBy: { category: 'asc' } }),
      prisma.budgetConfig.findMany({ where: { userId: targetUserId } }),
      prisma.category.findMany({ where: { userId: targetUserId }, orderBy: { name: 'asc' } }),
      prisma.goal.findMany({ where: { userId: targetUserId }, orderBy: { createdAt: 'asc' } }),
      prisma.recurring.findMany({ where: { userId: targetUserId }, orderBy: { nextDate: 'asc' } }),
      prisma.transfer.findMany({ where: { userId: targetUserId }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
      prisma.dividend.findMany({ where: { userId: targetUserId }, orderBy: { date: 'desc' } }),
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

  const [customers, products, sales, cashCloses] = profile === "business"
    ? await Promise.all([
        prisma.customer.findMany({
          where: { userId: targetUserId },
          include: { movements: { orderBy: { date: "asc" } } },
          orderBy: { name: "asc" },
        }),
        prisma.product.findMany({ where: { userId: targetUserId }, orderBy: { name: "asc" } }),
        prisma.sale.findMany({
          where: { userId: targetUserId },
          include: { items: true },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 400,
        }),
        prisma.cashClose.findMany({ where: { userId: targetUserId }, orderBy: { date: "desc" }, take: 60 }),
      ])
    : [[], [], [], []] as const;

  // showCommerce lives on the real user, not the shadow
  const realUserConfig = targetUserId !== userId
    ? await prisma.userConfig.findUnique({ where: { userId } })
    : null;

  const pricesMap = Object.fromEntries(prices.map(p => [p.ticker, p.value]));
  const targetsMap = Object.fromEntries(targets.map(t => [t.ticker, t.value]));
  const firstHys = hysAccountsRaw[0];
  const hysData = firstHys
    ? { rate: firstHys.rate, movements: hysMovements.map(m => ({ ...m, note: m.note ?? undefined })) }
    : null;

  const typedHysAccounts = hysAccountsRaw.map(h => ({
    id: h.id, name: h.name, currency: h.currency, rate: h.rate,
    openedAt: h.openedAt ?? undefined,
    parentId: h.parentId ?? undefined,
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
    accountId2: s.accountId2 ?? undefined,
    accountName2: s.accountName2 ?? undefined,
    amount2: s.amount2 ?? undefined,
  }));

  const typedCrypto = crypto.map(c => ({
    ...c,
    accountId: c.accountId ?? undefined,
    accountName: c.accountName ?? undefined,
    accountId2: c.accountId2 ?? undefined,
    accountName2: c.accountName2 ?? undefined,
    amount2: c.amount2 ?? undefined,
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
      showBienes: config.showBienes,
      baseCurrency: config.baseCurrency as "COP" | "USD",
      trm: config.trm,
      trmUpdatedAt: config.trmUpdatedAt?.toISOString() ?? null,
      summaryWidgets: config.summaryWidgets ? JSON.parse(config.summaryWidgets) : null,
      chartEmaConfig: config.chartEmaConfig ? JSON.parse(config.chartEmaConfig) : null,
      showCommerce: realUserConfig?.showCommerce ?? config.showCommerce,
      telegramId: config.telegramId,
      salesGoal: config.salesGoal,
    } : null,
    bankAccounts: typedBankAccounts,
    bienes: bienes.map(b => ({ id: b.id, name: b.name, value: b.value, date: b.date })),
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
    profile,
    customers: customers.map(c => ({
      id: c.id, name: c.name, phone: c.phone ?? undefined, note: c.note ?? undefined,
      kind: (c.kind ?? "customer") as "customer" | "supplier",
      movements: c.movements.map(m => ({
        id: m.id, customerId: m.customerId, date: m.date,
        type: m.type as "fiado" | "abono", amount: m.amount, note: m.note ?? undefined,
        dueDate: m.dueDate ?? undefined,
      })),
    })),
    products: products.map(p => ({
      id: p.id, name: p.name, category: p.category ?? undefined,
      cost: p.cost, price: p.price, stock: p.stock, minStock: p.minStock, active: p.active,
    })),
    sales: sales.map(s => ({
      id: s.id, date: s.date, total: s.total, cost: s.cost,
      payMethod: s.payMethod, customerId: s.customerId ?? undefined, note: s.note ?? undefined,
      createdAt: s.createdAt.toISOString(),
      items: s.items.map(i => ({
        id: i.id, productId: i.productId ?? undefined, name: i.name,
        qty: i.qty, price: i.price, cost: i.cost,
      })),
    })),
    cashCloses: cashCloses.map(c => ({
      id: c.id, date: c.date, expectedCash: c.expectedCash, countedCash: c.countedCash,
      diff: c.diff, note: c.note ?? undefined,
      summary: c.summary ? JSON.parse(c.summary) : null,
    })),
    transfers: transfers.map(t => ({
      id: t.id, date: t.date, amount: t.amount, costBasis: t.costBasis ?? undefined,
      qty: t.qty ?? undefined, commission: t.commission ?? undefined, detail: t.detail ?? undefined,
      fromAccountId: t.fromAccountId, fromAccountName: t.fromAccountName ?? undefined,
      toAccountId: t.toAccountId, toAccountName: t.toAccountName ?? undefined,
      note: t.note ?? undefined,
    })),
    dividends: dividends.map(d => ({
      id: d.id, ticker: d.ticker, date: d.date, amount: d.amount,
      shares: d.shares ?? undefined, perShare: d.perShare ?? undefined, grossAmount: d.grossAmount ?? undefined,
      adminCost: d.adminCost ?? undefined, tax: d.tax ?? undefined,
      accountId: d.accountId ?? undefined, accountName: d.accountName ?? undefined, note: d.note ?? undefined,
    })),
  };
}

// ── BALANCE ADJUSTMENT HELPER ──
// delta > 0 = credit (money in), delta < 0 = debit (money out)
// adjustBalance vive en lib/db.ts (maneja "cash", "hys" y cuentas bancarias)

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

// Splits a total cost/proceeds across up to two accounts — e.g. "I paid
// part from cash already sitting in the broker, part from a bank transfer".
// amount2 is clamped to the total so the split can never debit more than
// was actually spent.
function splitDebit(total: number, amount2?: number | null) {
  const a2 = Math.min(Math.max(amount2 ?? 0, 0), total);
  return { amount1: total - a2, amount2: a2 };
}

async function applyStockDebit(userId: string, accountId: string | undefined, accountId2: string | undefined | null, total: number, amount2: number | null | undefined) {
  const { amount1, amount2: a2 } = splitDebit(total, amount2);
  await adjustBalance(userId, accountId, -amount1);
  if (accountId2 && a2 > 0) await adjustBalance(userId, accountId2, -a2);
}

async function reverseStockDebit(userId: string, accountId: string | null | undefined, accountId2: string | null | undefined, total: number, amount2: number | null | undefined) {
  const { amount1, amount2: a2 } = splitDebit(total, amount2);
  if (accountId) await adjustBalance(userId, accountId, amount1);
  if (accountId2 && a2 > 0) await adjustBalance(userId, accountId2, a2);
}

export async function addStock(item: Omit<Stock, "id">) {
  const userId = await getUserId();
  const { source, ...rest } = item;
  await prisma.stock.create({ data: { ...rest, id: crypto.randomUUID(), userId } });
  const total = item.priceCOP * item.qty + item.commission;
  await applyStockDebit(userId, item.accountId, item.accountId2, total, item.amount2);
  await logActivity(userId, "stock_buy", `Compra acción: ${item.ticker}`, {
    amount: item.priceCOP * item.qty,
    ticker: item.ticker,
    accountName: item.accountName,
  });
}

export async function addCrypto(item: Omit<Crypto, "id">) {
  const userId = await getUserId();
  const trm = await resolveTrmForDate(item.date);
  await prisma.crypto.create({ data: { ...item, trm, id: crypto.randomUUID(), userId } });
  const total = item.priceCOP * item.qty + item.commission;
  await applyStockDebit(userId, item.accountId, item.accountId2, total, item.amount2);
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
  if (old) await reverseStockDebit(userId, old.accountId, old.accountId2, old.priceCOP * old.qty + old.commission, old.amount2);
  await applyStockDebit(userId, item.accountId, item.accountId2, item.priceCOP * item.qty + item.commission, item.amount2);
  await logActivity(userId, "stock_edit", `Edición acción: ${item.ticker}`, { ticker: item.ticker });
}

export async function deleteStock(id: string) {
  const userId = await getUserId();
  const row = await prisma.stock.findUnique({ where: { id } });
  await prisma.stock.delete({ where: { id, userId } });
  if (row) await reverseStockDebit(userId, row.accountId, row.accountId2, row.priceCOP * row.qty + row.commission, row.amount2);
  await logActivity(userId, "stock_delete", `Eliminación acción: ${row?.ticker ?? id}`, { ticker: row?.ticker });
}

export async function updateCrypto(id: string, item: Omit<Crypto, "id">) {
  const userId = await getUserId();
  const old = await prisma.crypto.findUnique({ where: { id } });
  const trm = old && old.date === item.date ? old.trm : await resolveTrmForDate(item.date);
  await prisma.crypto.update({ where: { id, userId }, data: { ...item, trm } });
  if (old) await reverseStockDebit(userId, old.accountId, old.accountId2, old.priceCOP * old.qty + old.commission, old.amount2);
  await applyStockDebit(userId, item.accountId, item.accountId2, item.priceCOP * item.qty + item.commission, item.amount2);
  await logActivity(userId, "crypto_edit", `Edición cripto: ${item.ticker}`, { ticker: item.ticker });
}

export async function deleteCrypto(id: string) {
  const userId = await getUserId();
  const row = await prisma.crypto.findUnique({ where: { id } });
  await prisma.crypto.delete({ where: { id, userId } });
  if (row) await reverseStockDebit(userId, row.accountId, row.accountId2, row.priceCOP * row.qty + row.commission, row.amount2);
  await logActivity(userId, "crypto_delete", `Eliminación cripto: ${row?.ticker ?? id}`, { ticker: row?.ticker });
}

// ── TRANSFERS (capital rotation) ──
export async function addTransfer(opts: {
  fromAccountId: string; fromAccountName?: string;
  toAccountId: string; toAccountName?: string;
  amount: number; note?: string; date?: string;
}) {
  const userId = await getUserId();
  const date = opts.date ?? todayISO();
  await adjustBalance(userId, opts.fromAccountId, -opts.amount);
  await adjustBalance(userId, opts.toAccountId, opts.amount);
  await prisma.transfer.create({
    data: {
      userId, date, amount: opts.amount, note: opts.note,
      fromAccountId: opts.fromAccountId, fromAccountName: opts.fromAccountName,
      toAccountId: opts.toAccountId, toAccountName: opts.toAccountName,
    },
  });
  await logActivity(userId, "transfer", `Transferencia: ${opts.fromAccountName ?? opts.fromAccountId} → ${opts.toAccountName ?? opts.toAccountId}`, { amount: opts.amount });
}

export async function deleteTransfer(id: string) {
  const userId = await getUserId();
  const row = await prisma.transfer.findFirst({ where: { id, userId } });
  if (!row) return;
  await adjustBalance(userId, row.fromAccountId, row.amount);
  await adjustBalance(userId, row.toAccountId, -row.amount);
  await prisma.transfer.delete({ where: { id } });
  await logActivity(userId, "transfer_delete", `Transferencia eliminada`, { amount: row.amount });
}

// A position can be split across several buy lots (rows). Selling must draw
// from the whole position, not just one lot — and proportionally, so the
// booked cost basis matches the weighted-average cost (`avg`/`totalCost`)
// already shown everywhere else in the UI (see transforms.ts toAssets()).
// Sale proceeds can optionally be split across two destination accounts
// (e.g. part stays in the broker, part gets transferred out to a bank
// account) — one Transfer row per destination.
export async function sellStock(
  ticker: string, qty: number, sellPriceCOP: number, toAccountId: string, toAccountName?: string,
  date?: string, commissionCOP: number = 0, detail?: string, toAccountId2?: string, toAccountName2?: string, amount2?: number,
) {
  const userId = await getUserId();
  const rows = await prisma.stock.findMany({ where: { userId, ticker } });
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  if (rows.length === 0 || totalQty <= 0) throw new Error("Acción no encontrada");
  if (qty <= 0 || qty > totalQty + 1e-9) throw new Error("Cantidad inválida");
  const d = date ?? todayISO();
  const totalCost = rows.reduce((s, r) => s + r.qty * r.priceCOP + r.commission, 0);
  const isFullSale = qty >= totalQty - 1e-9;
  const soldQty = isFullSale ? totalQty : qty;
  const sellFraction = soldQty / totalQty;
  const costBasis = totalCost * sellFraction;

  for (const row of rows) {
    const keepQty = isFullSale ? 0 : row.qty * (1 - sellFraction);
    if (keepQty < 1e-9) {
      await prisma.stock.delete({ where: { id: row.id } });
    } else {
      await prisma.stock.update({ where: { id: row.id }, data: { qty: keepQty, commission: row.commission * (1 - sellFraction) } });
    }
  }

  const netProceeds = sellPriceCOP - commissionCOP;
  const realizedPL = netProceeds - costBasis;
  const { amount1, amount2: a2 } = splitDebit(netProceeds, toAccountId2 ? amount2 : 0);
  await adjustBalance(userId, toAccountId, amount1);
  await prisma.transfer.create({
    data: {
      userId, date: d, amount: amount1, costBasis, qty: soldQty, commission: commissionCOP, detail: detail || undefined,
      note: `Venta ${ticker} (${soldQty} uds)${commissionCOP > 0 ? ` · comisión ${commissionCOP}` : ""}`,
      fromAccountId: `stock:${ticker}`, fromAccountName: `Acción ${ticker}`,
      toAccountId, toAccountName,
    },
  });
  if (toAccountId2 && a2 > 0) {
    await adjustBalance(userId, toAccountId2, a2);
    await prisma.transfer.create({
      data: {
        userId, date: d, amount: a2, detail: detail || undefined,
        note: `Venta ${ticker} (${soldQty} uds) · segunda cuenta`,
        fromAccountId: `stock:${ticker}`, fromAccountName: `Acción ${ticker}`,
        toAccountId: toAccountId2, toAccountName: toAccountName2,
      },
    });
  }
  await logActivity(userId, "stock_sell", `Venta acción: ${ticker}`, { amount: realizedPL, ticker, accountName: toAccountName });
}

export async function sellCrypto(
  ticker: string, qty: number, sellPriceCOP: number, toAccountId: string, toAccountName?: string,
  date?: string, commissionCOP: number = 0, detail?: string, toAccountId2?: string, toAccountName2?: string, amount2?: number,
) {
  const userId = await getUserId();
  const rows = await prisma.crypto.findMany({ where: { userId, ticker } });
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  if (rows.length === 0 || totalQty <= 0) throw new Error("Cripto no encontrada");
  if (qty <= 0 || qty > totalQty + 1e-9) throw new Error("Cantidad inválida");
  const d = date ?? todayISO();
  const totalCost = rows.reduce((s, r) => s + r.qty * r.priceCOP + r.commission, 0);
  const isFullSale = qty >= totalQty - 1e-9;
  const soldQty = isFullSale ? totalQty : qty;
  const sellFraction = soldQty / totalQty;
  const costBasis = totalCost * sellFraction;

  for (const row of rows) {
    const keepQty = isFullSale ? 0 : row.qty * (1 - sellFraction);
    if (keepQty < 1e-9) {
      await prisma.crypto.delete({ where: { id: row.id } });
    } else {
      await prisma.crypto.update({ where: { id: row.id }, data: { qty: keepQty, commission: row.commission * (1 - sellFraction) } });
    }
  }

  const netProceeds = sellPriceCOP - commissionCOP;
  const realizedPL = netProceeds - costBasis;
  const { amount1, amount2: a2 } = splitDebit(netProceeds, toAccountId2 ? amount2 : 0);
  await adjustBalance(userId, toAccountId, amount1);
  await prisma.transfer.create({
    data: {
      userId, date: d, amount: amount1, costBasis, qty: soldQty, commission: commissionCOP, detail: detail || undefined,
      note: `Venta ${ticker} (${soldQty} uds)${commissionCOP > 0 ? ` · comisión ${commissionCOP}` : ""}`,
      fromAccountId: `crypto:${ticker}`, fromAccountName: `Cripto ${ticker}`,
      toAccountId, toAccountName,
    },
  });
  if (toAccountId2 && a2 > 0) {
    await adjustBalance(userId, toAccountId2, a2);
    await prisma.transfer.create({
      data: {
        userId, date: d, amount: a2, detail: detail || undefined,
        note: `Venta ${ticker} (${soldQty} uds) · segunda cuenta`,
        fromAccountId: `crypto:${ticker}`, fromAccountName: `Cripto ${ticker}`,
        toAccountId: toAccountId2, toAccountName: toAccountName2,
      },
    });
  }
  await logActivity(userId, "crypto_sell", `Venta cripto: ${ticker}`, { amount: realizedPL, ticker, accountName: toAccountName });
}

// ── DIVIDENDS ── (the full list already comes from loadAll — dividends are
// few enough per user that per-ticker lazy loading isn't worth the extra
// round trip; ViewDetalle filters initialData.dividends by ticker.)
export async function addDividend(item: Omit<Dividend, "id">) {
  const userId = await getUserId();
  const row = await prisma.dividend.create({ data: { ...item, userId } });
  if (item.accountId) {
    await adjustBalance(userId, item.accountId, item.amount);
    // A dividend landing in an account is money actually entering it — it
    // must count toward the DIAN "consignaciones" threshold, same as any
    // other ingreso (see [[dian-consignaciones]] logic in ProfileSettings).
    await prisma.finance.create({
      data: {
        id: crypto.randomUUID(), userId, date: item.date, type: "ingreso",
        category: "Dividendos", desc: item.note || `Dividendo ${item.ticker}`,
        amount: item.amount, accountId: item.accountId, accountName: item.accountName,
      },
    });
  }
  await logActivity(userId, "dividend", `Dividendo: ${item.ticker}`, { amount: item.amount, ticker: item.ticker });
  return row.id;
}

export async function deleteDividend(id: string) {
  const userId = await getUserId();
  const row = await prisma.dividend.findFirst({ where: { id, userId } });
  if (!row) return;
  if (row.accountId) {
    await adjustBalance(userId, row.accountId, -row.amount);
    await prisma.finance.deleteMany({
      where: { userId, accountId: row.accountId, date: row.date, category: "Dividendos", amount: row.amount },
    });
  }
  await prisma.dividend.delete({ where: { id } });
  await logActivity(userId, "dividend_delete", `Dividendo eliminado: ${row.ticker}`, { amount: row.amount, ticker: row.ticker });
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

// ── BIENES (patrimonio no monetario: moto, carro, inmueble, etc.) ──
export async function createBien(item: Omit<Bien, "id">) {
  const userId = await getUserId();
  await prisma.bien.create({ data: { ...item, userId } });
  await logActivity(userId, "bien_create", `Nuevo bien: ${item.name}`, { amount: item.value });
}

export async function updateBien(id: string, item: Omit<Bien, "id">) {
  const userId = await getUserId();
  await prisma.bien.update({ where: { id, userId }, data: item });
  await logActivity(userId, "bien_edit", `Bien editado: ${item.name}`, { amount: item.value });
}

const BIEN_LOSS_REASONS: Record<string, string> = {
  venta: "Venta",
  robo: "Robo o hurto",
  dano: "Daño o pérdida",
  otro: "Otro",
};

// A bien leaving the patrimonio is never a money transaction — no balance is
// touched, we just keep a record of why it left via the activity log.
export async function loseBien(id: string, reason: string) {
  const userId = await getUserId();
  const row = await prisma.bien.findUnique({ where: { id } });
  await prisma.bien.delete({ where: { id, userId } });
  const reasonLabel = BIEN_LOSS_REASONS[reason] ?? reason;
  await logActivity(userId, "bien_lost", `Bien dado de baja: ${row?.name ?? id} (${reasonLabel})`, { amount: row?.value });
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
      // CoinGecko's simple/price endpoint does not support "cop" as vs_currency
      // (it silently returns an empty object for unsupported currencies instead
      // of erroring) — fetch in USD and convert with the live USD→COP rate.
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (res.ok) {
        const json = await res.json();
        const todayISO = new Date().toISOString().slice(0, 10);
        const usdToCop = (await fetchOfficialTrmForDate(todayISO)) ?? (await fetchUsdToCop());
        if (usdToCop) {
          for (const ticker of cryptoTickers) {
            const coinId = COINGECKO_IDS[ticker.toUpperCase()];
            const usd = coinId && json[coinId]?.usd;
            if (usd) pricesMap[ticker.toUpperCase()] = usd * usdToCop;
          }
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

// ── PORTFOLIO HISTORY (real mark-to-market, for P/G-over-time — not just
// cumulative cost basis, which conflates new contributions with actual gains) ──

const DAY_MS = 86400000;

// One request covering ~400 days of official TRM, reused across every crypto
// ticker instead of one call per (ticker, day).
async function fetchOfficialTrmRange(): Promise<{ day: string; value: number }[]> {
  try {
    const from = new Date();
    from.setDate(from.getDate() - 400);
    const fromIso = `${from.toISOString().slice(0, 10)}T00:00:00.000`;
    const params = new URLSearchParams({
      $where: `vigenciadesde>='${fromIso}'`,
      $order: "vigenciadesde ASC",
      $limit: "500",
    });
    const res = await fetch(`https://www.datos.gov.co/resource/32sa-8pi3.json?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json
      .map((r: any) => ({ day: String(r.vigenciadesde).slice(0, 10), value: parseFloat(r.valor) }))
      .filter((r: any) => r.value > 0);
  } catch {
    return [];
  }
}

function trmForDay(range: { day: string; value: number }[], day: string): number | null {
  let best: number | null = null;
  for (const r of range) { if (r.day <= day) best = r.value; }
  return best ?? range[0]?.value ?? null;
}

// Fills every day in [first known trade, last known trade] from a sparse map
// of real (traded) closes keyed by ISO day, linearly interpolating across any
// gap between two real trades instead of leaving it flat or empty — a
// straight line between two confirmed prices is a closer approximation of
// what actually happened than either a fabricated flat price or an invisible
// gap. Pure UTC-ms stepping throughout: no local-timezone date arithmetic, so
// no risk of the off-by-one that bit the month-stepping version of this.
function fillDailyGaps(realByDay: Record<string, number>): Record<string, number> {
  const knownDays = Object.keys(realByDay).sort();
  if (knownDays.length === 0) return {};
  const map: Record<string, number> = {};
  const startMs = new Date(knownDays[0] + "T00:00:00.000Z").getTime();
  const endMs = new Date(knownDays[knownDays.length - 1] + "T00:00:00.000Z").getTime();
  for (let ms = startMs; ms <= endMs; ms += DAY_MS) {
    const day = new Date(ms).toISOString().slice(0, 10);
    if (realByDay[day] != null) {
      map[day] = realByDay[day];
      continue;
    }
    const before = [...knownDays].reverse().find(k => k < day);
    const after = knownDays.find(k => k > day);
    if (before && after) {
      const beforeMs = new Date(before + "T00:00:00.000Z").getTime();
      const afterMs = new Date(after + "T00:00:00.000Z").getTime();
      const frac = (ms - beforeMs) / (afterMs - beforeMs);
      map[day] = realByDay[before] + (realByDay[after] - realByDay[before]) * frac;
    } else if (before) {
      map[day] = realByDay[before];
    }
  }
  return map;
}

// Daily COP closes straight from Yahoo (BVC tickers already quote in COP).
//
// Fetched at daily resolution deliberately, not monthly: Yahoo's own `1mo`
// bucketing turned out to be unreliable for thin BVC tickers (it silently
// drops a month near a listing date, and for a no-trade month it doesn't
// leave the price `null` — it repeats the listing/reference price with
// volume=0, so a fake month looks like a real historical close). It also
// collapses a real intra-month swing — a stock that spiked and gave it back
// within the same month — down to a single flat point, hiding it entirely.
// `volume` tells a real trade apart from a placeholder for every single day.
async function fetchStockDailyHistory(ticker: string): Promise<Record<string, number>> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.CL?range=5y&interval=1d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0] ?? {};
    const closes: (number | null)[] = quote.close ?? [];
    const volumes: (number | null)[] = quote.volume ?? [];

    const realByDay: Record<string, number> = {};
    timestamps.forEach((t, i) => {
      const close = closes[i];
      const traded = (volumes[i] ?? 0) > 0;
      if (close == null || !traded) return;
      realByDay[new Date(t * 1000).toISOString().slice(0, 10)] = close;
    });
    return fillDailyGaps(realByDay);
  } catch {
    return {};
  }
}

// CoinGecko's public API caps historical data at 365 days back — days older
// than that simply have no entry (the caller falls back to cost for those).
async function fetchCryptoDailyHistory(ticker: string, trmRange: { day: string; value: number }[]): Promise<Record<string, number>> {
  const coinId = COINGECKO_IDS[ticker.toUpperCase()];
  if (!coinId) return {};
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=365`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const json = await res.json();
    const prices: [number, number][] = json?.prices ?? [];
    // CoinGecko returns several intraday points per day at this range — keep
    // the last one of each day as that day's mark.
    const dailyUsd: Record<string, number> = {};
    for (const [t, usd] of prices) dailyUsd[new Date(t).toISOString().slice(0, 10)] = usd;
    const map: Record<string, number> = {};
    for (const [day, usd] of Object.entries(dailyUsd)) {
      const trm = trmForDay(trmRange, day);
      if (trm) map[day] = usd * trm;
    }
    return map;
  } catch {
    return {};
  }
}

export async function getPortfolioHistory(stockTickers: string[], cryptoTickers: string[]) {
  const trmRange = cryptoTickers.length > 0 ? await fetchOfficialTrmRange() : [];
  const [stockEntries, cryptoEntries] = await Promise.all([
    Promise.all(stockTickers.map(async (t) => [t, await fetchStockDailyHistory(t)] as const)),
    Promise.all(cryptoTickers.map(async (t) => [t, await fetchCryptoDailyHistory(t, trmRange)] as const)),
  ]);
  const history: Record<string, Record<string, number>> = {};
  for (const [t, m] of stockEntries) history[t] = m;
  for (const [t, m] of cryptoEntries) history[t] = m;
  return history;
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

export async function initHys(initialBalance: number, rate: number, name = "Nubank", currency = "COP", accountId?: string, sourceAmount?: number, parentId?: string) {
  const userId = await getUserId();
  const today = todayISO();
  // Si el capital sale de otra cuenta HYS (un bolsillo hermano o la cuenta padre),
  // se retira primero: hysWithdraw valida saldo y lanza antes de crear nada.
  const fromHys = accountId?.startsWith("hys:") ? accountId.slice(4) : null;
  if (fromHys) await hysWithdraw(fromHys, initialBalance, `Traslado a ${name}`);
  const hys = await prisma.hys.create({
    data: { userId, name, currency, rate, openedAt: today, parentId },
  });
  await prisma.hysMovement.create({
    data: { id: crypto.randomUUID(), userId, hysId: hys.id, date: today, type: "inicio", amount: initialBalance, balance: initialBalance, rate },
  });
  if (accountId && !fromHys) await adjustBalance(userId, accountId, -(sourceAmount ?? initialBalance));
  return hys.id;
}

// `amount` siempre está en la moneda nativa de la cuenta HYS (USD si currency==="USD").
// `sourceAmount`, cuando se da, es lo que realmente se debita/acredita en la cuenta
// bancaria en COP (a la TRM real de la operación) — igual que en initHys. Sin esto,
// una cuenta en USD terminaba restando el número de dólares directo de los pesos.
export async function hysDeposit(hysId: string, amount: number, note?: string, accountId?: string, sourceAmount?: number) {
  const userId = await getUserId();
  const today = todayISO();
  const hys = await prisma.hys.findFirst({ where: { id: hysId, userId } });
  if (!hys) throw new Error("Cuenta no encontrada");
  // Origen otra cuenta HYS: retirar primero para que un saldo insuficiente lance
  // antes de crear el depósito (adjustBalance recortaría a 0 en silencio).
  const fromHys = accountId?.startsWith("hys:") ? accountId.slice(4) : null;
  if (fromHys) await hysWithdraw(fromHys, sourceAmount ?? amount, `Traslado a ${hys.name}`);
  const last = await prisma.hysMovement.findFirst({ where: { hysId }, orderBy: { date: "desc" } });
  const base = last ? compound(last.balance, last.rate, last.date, today) : amount;
  const newBalance = base + amount;
  await prisma.hysMovement.create({
    data: { id: crypto.randomUUID(), userId, hysId, date: today, type: "deposito", amount, balance: newBalance, rate: hys.rate, note },
  });
  if (accountId && !fromHys) await adjustBalance(userId, accountId, -(sourceAmount ?? amount));
}

export async function hysWithdraw(hysId: string, amount: number, note?: string, accountId?: string, sourceAmount?: number) {
  const userId = await getUserId();
  const today = todayISO();
  const hys = await prisma.hys.findFirst({ where: { id: hysId, userId } });
  if (!hys) throw new Error("Cuenta no encontrada");
  const last = await prisma.hysMovement.findFirst({ where: { hysId }, orderBy: { date: "desc" } });
  const base = last ? compound(last.balance, last.rate, last.date, today) : 0;
  if (amount > base) throw new Error(`Saldo insuficiente — disponible: ${Math.round(base)}`);
  const newBalance = base - amount;
  await prisma.hysMovement.create({
    data: { id: crypto.randomUUID(), userId, hysId, date: today, type: "retiro", amount, balance: newBalance, rate: hys.rate, note },
  });
  if (accountId) await adjustBalance(userId, accountId, sourceAmount ?? amount);
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

// ── SEED (initial migration) ──
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
  showBienes: boolean;
  showCommerce: boolean;
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

// Colombia's official daily TRM (Tasa Representativa del Mercado), published by
// the Superintendencia Financiera — this is the actual "TRM" Colombians mean,
// as opposed to a generic market feed or a P2P exchange's own negotiated price.
async function fetchOfficialTrmForDate(dateISO: string): Promise<number | null> {
  try {
    const iso = `${dateISO}T00:00:00.000`;
    const params = new URLSearchParams({
      $where: `vigenciadesde<='${iso}' AND vigenciahasta>='${iso}'`,
      $limit: "1",
    });
    const res = await fetch(`https://www.datos.gov.co/resource/32sa-8pi3.json?${params}`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const json = await res.json();
    const valor = parseFloat(json?.[0]?.valor);
    return valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

// Fallback used only if the official government endpoint is unreachable.
async function fetchUsdToCop(): Promise<number | null> {
  try {
    const res = await fetch("https://latest.currency-api.pages.dev/v1/currencies/usd.json", { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const json = await res.json();
    const cop = json?.usd?.cop;
    return cop && cop > 0 ? (cop as number) : null;
  } catch {
    return null;
  }
}

async function fetchUsdToCopForDate(dateISO: string): Promise<number | null> {
  try {
    const res = await fetch(`https://${dateISO}.currency-api.pages.dev/v1/currencies/usd.json`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const json = await res.json();
    const cop = json?.usd?.cop;
    return cop && cop > 0 ? (cop as number) : null;
  } catch {
    return null;
  }
}

async function resolveTrmForDate(dateISO: string): Promise<number> {
  return (
    (await fetchOfficialTrmForDate(dateISO)) ??
    (await fetchUsdToCopForDate(dateISO)) ??
    (await fetchUsdToCop()) ??
    1
  );
}

export async function refreshTrm() {
  const userId = await getUserId();
  const todayISO = new Date().toISOString().slice(0, 10);
  const cop = (await fetchOfficialTrmForDate(todayISO)) ?? (await fetchUsdToCop());
  if (!cop) throw new Error("TRM no disponible");
  const now = new Date();
  await prisma.userConfig.upsert({
    where: { userId },
    create: { userId, trm: cop, trmUpdatedAt: now },
    update: { trm: cop, trmUpdatedAt: now },
  });
  return cop;
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

// EMA lines drawn on the technical chart (period, color, visibility) — a
// per-user preference like theme or summaryWidgets, not a per-browser one,
// so it follows the account across devices instead of living in localStorage.
export async function saveChartEmaConfig(emas: { id: string; period: number; color: string; visible: boolean }[]) {
  const userId = await getUserId();
  const json = JSON.stringify(emas);
  await prisma.userConfig.upsert({
    where: { userId },
    create: { userId, chartEmaConfig: json },
    update: { chartEmaConfig: json },
  });
}

// ── CHART DRAWINGS (trendlines, Fibonacci, text, measurements) ──
export async function loadChartDrawings(ticker: string) {
  const userId = await getUserId();
  const rows = await prisma.chartDrawing.findMany({ where: { userId, ticker }, orderBy: { createdAt: "asc" } });
  return rows.map(r => ({ id: r.id, kind: r.kind, data: JSON.parse(r.data) }));
}

export async function addChartDrawing(ticker: string, kind: string, data: unknown) {
  const userId = await getUserId();
  const row = await prisma.chartDrawing.create({
    data: { userId, ticker, kind, data: JSON.stringify(data) },
  });
  return row.id;
}

export async function deleteChartDrawing(id: string) {
  const userId = await getUserId();
  await prisma.chartDrawing.deleteMany({ where: { id, userId } });
}

export async function clearChartDrawings(ticker: string) {
  const userId = await getUserId();
  await prisma.chartDrawing.deleteMany({ where: { userId, ticker } });
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

// ── COMERCIO: CLIENTES Y FIADO ──

export async function addCustomer(name: string, phone?: string, note?: string, kind: "customer" | "supplier" = "customer") {
  const userId = await getUserId();
  const c = await prisma.customer.create({ data: { userId, name: name.trim(), phone, note, kind } });
  return c.id;
}

export async function updateCustomer(id: string, patch: { name?: string; phone?: string; note?: string }) {
  const userId = await getUserId();
  await prisma.customer.updateMany({ where: { id, userId }, data: patch });
}

export async function deleteCustomer(id: string) {
  const userId = await getUserId();
  await prisma.customer.deleteMany({ where: { id, userId } });
}

// Clientes: "fiado" = queda debiendo, "abono" = paga (entra plata).
// Proveedores: "fiado" = les debes, "abono" = les pagas (sale plata).
export async function addFiadoMovement(
  customerId: string,
  type: "fiado" | "abono",
  amount: number,
  note?: string,
  accountId?: string,
  dueDate?: string,
) {
  const userId = await getUserId();
  const customer = await prisma.customer.findFirst({ where: { id: customerId, userId } });
  if (!customer) throw new Error("Cliente no encontrado");
  const movement = await prisma.fiadoMovement.create({
    data: { userId, customerId, date: todayISO(), type, amount, note, dueDate, accountId: type === "abono" ? accountId : undefined },
  });
  const isSupplier = customer.kind === "supplier";
  if (type === "abono" && accountId) {
    await adjustBalance(userId, accountId, isSupplier ? -amount : amount);
    // A customer paying off fiado is money actually entering an account —
    // it must count toward the DIAN "consignaciones" threshold, same as any
    // other ingreso. A payment to a supplier is an egreso and never counts.
    if (!isSupplier) {
      const account = await prisma.bankAccount.findFirst({ where: { id: accountId, userId } });
      const finance = await prisma.finance.create({
        data: {
          id: crypto.randomUUID(), userId, date: todayISO(), type: "ingreso",
          category: "Fiado", desc: note ?? `Abono de ${customer.name}`,
          amount, accountId, accountName: account?.name,
        },
      });
      await prisma.fiadoMovement.update({ where: { id: movement.id }, data: { financeId: finance.id } });
    }
  }
  await logActivity(
    userId, type,
    isSupplier
      ? `${type === "fiado" ? "Deuda con" : "Pago a"} ${customer.name}`
      : `${type === "fiado" ? "Fiado a" : "Abono de"} ${customer.name}`,
    { amount },
  );
}

export async function deleteFiadoMovement(id: string) {
  const userId = await getUserId();
  const row = await prisma.fiadoMovement.findFirst({ where: { id, userId }, include: { customer: true } });
  if (!row) return;
  // Reverse the balance + linked Finance row an "abono" created, so deleting
  // a mistaken payment also removes it from the DIAN consignaciones tally.
  if (row.type === "abono" && row.accountId) {
    const isSupplier = row.customer.kind === "supplier";
    await adjustBalance(userId, row.accountId, isSupplier ? row.amount : -row.amount);
    if (row.financeId) await prisma.finance.deleteMany({ where: { id: row.financeId, userId } });
  }
  await prisma.fiadoMovement.delete({ where: { id } });
}

// ── COMERCIO: PRODUCTOS, VENTAS, COMPRAS Y CAJA ──

export async function addProduct(data: { name: string; category?: string; cost: number; price: number; stock: number; minStock?: number }) {
  const userId = await getUserId();
  const p = await prisma.product.create({ data: { userId, ...data, name: data.name.trim() } });
  return p.id;
}

export async function updateProduct(id: string, patch: { name?: string; category?: string; cost?: number; price?: number; stock?: number; minStock?: number; active?: boolean }) {
  const userId = await getUserId();
  await prisma.product.updateMany({ where: { id, userId }, data: patch });
}

export async function deleteProduct(id: string) {
  const userId = await getUserId();
  await prisma.product.deleteMany({ where: { id, userId } });
}

export async function registerSale(items: SaleItemInput[], payMethod: string, customerId?: string, note?: string) {
  const userId = await getUserId();
  return createSale(userId, items, payMethod, customerId, note);
}

export async function deleteSale(id: string) {
  const userId = await getUserId();
  await removeSale(userId, id);
}

export async function registerPurchase(items: PurchaseItemInput[], opts: { accountId?: string; supplierId?: string; dueDate?: string; note?: string }) {
  const userId = await getUserId();
  await createPurchase(userId, items, opts);
}

export async function closeCash(countedCash: number, note?: string) {
  const userId = await getUserId();
  await closeCashDay(userId, countedCash, note);
}

export async function setSalesGoal(amount: number | null) {
  const userId = await getUserId();
  await prisma.userConfig.upsert({
    where: { userId },
    create: { userId, salesGoal: amount },
    update: { salesGoal: amount },
  });
}
