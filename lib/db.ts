/**
 * Shared DB helpers used by both server actions and API routes.
 * These are pure Prisma operations with no auth logic.
 */
import { prisma } from "./prisma";

export async function logActivity(
  userId: string,
  type: string,
  description: string,
  extras?: { amount?: number; ticker?: string; accountName?: string }
) {
  await prisma.activityLog.create({ data: { userId, type, description, ...extras } });
}

export async function autoSaveCategory(userId: string, name: string, type: string) {
  await prisma.category.upsert({
    where: { userId_name_type: { userId, name, type } },
    create: { userId, name, type },
    update: {},
  });
}

// delta > 0 = credit, delta < 0 = debit
export async function adjustBalance(
  userId: string,
  accountId: string | undefined | null,
  delta: number
) {
  if (!accountId || Math.abs(delta) < 0.01) return;
  if (accountId === "cash") {
    await prisma.cash.upsert({
      where: { userId },
      create: { userId, banco: Math.max(0, delta) },
      update: { banco: { increment: delta } },
    });
    return;
  }
  if (accountId === "hys") {
    const hys = await prisma.hys.findFirst({ where: { userId } });
    if (!hys) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const last = await prisma.hysMovement.findFirst({ where: { hysId: hys.id }, orderBy: { date: "desc" } });
    const base = last
      ? last.balance * (1 + hys.rate / 100) **
          (Math.max(0, Math.floor((new Date(todayStr).getTime() - new Date(last.date).getTime()) / 86400000)) / 365)
      : 0;
    await prisma.hysMovement.create({
      data: {
        id: crypto.randomUUID(), userId, hysId: hys.id,
        date: todayStr,
        type: delta >= 0 ? "deposito" : "retiro",
        amount: Math.abs(delta),
        balance: Math.max(0, base + delta),
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

export function diffDays(later: string, earlier: string) {
  return Math.floor((new Date(later).getTime() - new Date(earlier).getTime()) / 86400000);
}

export function compound(B: number, tea: number, dateL: string, dateT: string) {
  const days = diffDays(dateT, dateL);
  return days <= 0 ? B : B * (1 + tea / 100) ** (days / 365);
}

export async function replayBalances(userId: string, fromDate: string, hysId?: string) {
  const all = await prisma.hysMovement.findMany({ where: hysId ? { hysId } : { userId }, orderBy: { date: "asc" } });
  const pivotIdx = all.findIndex(m => m.date >= fromDate);
  if (pivotIdx <= 0) return;
  let prev = all[pivotIdx - 1];
  for (let i = pivotIdx; i < all.length; i++) {
    const m = all[i];
    const accrued = compound(prev.balance, prev.rate, prev.date, m.date);
    const finalBalance = m.type === "rendimiento" ? accrued
      : m.type === "retiro" ? accrued - m.amount : accrued + m.amount;
    await prisma.hysMovement.update({ where: { id: m.id }, data: { balance: finalBalance } });
    prev = { ...m, balance: finalBalance };
  }
}

export function advanceDate(date: string, frequency: string): string {
  const d = new Date(date + "T00:00:00");
  switch (frequency) {
    case "diario":    d.setDate(d.getDate() + 1); break;
    case "semanal":   d.setDate(d.getDate() + 7); break;
    case "quincenal": d.setDate(d.getDate() + 15); break;
    case "mensual":   d.setMonth(d.getMonth() + 1); break;
    case "anual":     d.setFullYear(d.getFullYear() + 1); break;
  }
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
