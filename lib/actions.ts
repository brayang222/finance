"use server";

import { auth } from "../auth";
import { prisma } from "./prisma";
import type { Stock, Crypto, Finance, Hys, Cash } from '../src/types';

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}

// ── LOAD ALL ──
export async function loadAll() {
  const userId = await getUserId();

  const [stocks, crypto, finances, hys, hysMovements, prices, targets, cash, config] =
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
  }));

  const typedCash = cash ? { banco: cash.banco, note: cash.note ?? undefined } : null;

  return { stocks, crypto, finances: typedFinances, hys: hysData, prices: pricesMap, targets: targetsMap, cash: typedCash, config: config ? { theme: config.theme as "dark" | "light" } : null };
}

// ── ADD SINGLE ENTRIES ──
export async function addFinance(item: Omit<Finance, "id">) {
  const userId = await getUserId();
  await prisma.finance.create({ data: { ...item, id: crypto.randomUUID(), userId } });
}

export async function addStock(item: Omit<Stock, "id">) {
  const userId = await getUserId();
  const { source, ...rest } = item;
  await prisma.stock.create({ data: { ...rest, id: crypto.randomUUID(), userId } });
}

export async function addCrypto(item: Omit<Crypto, "id">) {
  const userId = await getUserId();
  await prisma.crypto.create({ data: { ...item, id: crypto.randomUUID(), userId } });
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

  // Solo semilla si no tiene datos
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
