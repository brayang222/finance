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

// Perfil comercio: usuario sombra vinculado al dueño real. Se crea perezosamente
// con su UserConfig listo (onboarding hecho, tema/moneda/TRM copiados del dueño)
// para que nunca vea el onboarding personal.
export async function resolveBusinessUser(realUserId: string) {
  let biz = await prisma.user.findFirst({
    where: { businessOwnerId: realUserId },
    include: { config: { select: { id: true } } },
  });
  if (!biz) {
    const owner = await prisma.user.findUnique({ where: { id: realUserId }, select: { name: true } });
    biz = await prisma.user.create({
      data: { name: `Comercio de ${owner?.name?.split(" ")[0] ?? "mi negocio"}`, businessOwnerId: realUserId },
      include: { config: { select: { id: true } } },
    });
  }
  if (!biz.config) {
    const ownerCfg = await prisma.userConfig.findUnique({ where: { userId: realUserId } });
    await prisma.userConfig.create({
      data: {
        userId: biz.id,
        onboardingDone: true,
        theme: ownerCfg?.theme ?? "dark",
        baseCurrency: ownerCfg?.baseCurrency ?? "COP",
        trm: ownerCfg?.trm,
        trmUpdatedAt: ownerCfg?.trmUpdatedAt,
        showStocks: false,
        showCrypto: false,
        showHys: false,
      },
    });
  }
  return biz;
}

// ── COMERCIO: ventas, compras y cierre de caja ───────────────────────────────
// Lógica compartida entre server actions (web) y API routes (móvil).

export function todayISOShared() {
  return new Date().toISOString().slice(0, 10);
}

export type SaleItemInput = {
  productId?: string;
  name: string;
  qty: number;
  price: number;
  cost?: number;
};

// payMethod: "cash" | "fiado" | bankAccountId
export async function createSale(
  userId: string,
  items: SaleItemInput[],
  payMethod: string,
  customerId?: string,
  note?: string,
) {
  if (!items.length) throw new Error("Venta vacía");
  if (payMethod === "fiado" && !customerId) throw new Error("El fiado necesita un cliente");
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const cost = items.reduce((s, i) => s + i.qty * (i.cost ?? 0), 0);
  if (total <= 0) throw new Error("Total inválido");
  const date = todayISOShared();

  const sale = await prisma.sale.create({
    data: {
      userId, date, total, cost, payMethod,
      customerId: payMethod === "fiado" ? customerId : null,
      note,
      items: {
        create: items.map(i => ({
          productId: i.productId, name: i.name, qty: i.qty, price: i.price, cost: i.cost ?? 0,
        })),
      },
    },
  });

  // Descuenta inventario
  for (const i of items) {
    if (i.productId) {
      await prisma.product.updateMany({
        where: { id: i.productId, userId },
        data: { stock: { decrement: i.qty } },
      });
    }
  }

  const desc = items.map(i => `${i.qty}x ${i.name}`).join(", ").slice(0, 120);
  if (payMethod === "fiado") {
    await prisma.fiadoMovement.create({
      data: { userId, customerId: customerId!, date, type: "fiado", amount: total, note: desc, saleId: sale.id },
    });
  } else {
    const accountName = payMethod === "cash" ? "Efectivo"
      : (await prisma.bankAccount.findFirst({ where: { id: payMethod, userId } }))?.name;
    await prisma.finance.create({
      data: {
        id: crypto.randomUUID(), userId, date, type: "ingreso", category: "Ventas",
        desc, amount: total, accountId: payMethod, accountName, saleId: sale.id,
      },
    });
    await adjustBalance(userId, payMethod, total);
  }
  await logActivity(userId, "venta", `Venta: ${desc}`, { amount: total });
  return sale.id;
}

export async function removeSale(userId: string, saleId: string) {
  const sale = await prisma.sale.findFirst({ where: { id: saleId, userId }, include: { items: true } });
  if (!sale) throw new Error("Venta no encontrada");
  // Devuelve inventario
  for (const i of sale.items) {
    if (i.productId) {
      await prisma.product.updateMany({
        where: { id: i.productId, userId },
        data: { stock: { increment: i.qty } },
      });
    }
  }
  // Reversa el dinero o el fiado
  const fin = await prisma.finance.findFirst({ where: { saleId, userId } });
  if (fin) {
    await adjustBalance(userId, fin.accountId, -fin.amount);
    await prisma.finance.delete({ where: { id: fin.id } });
  }
  await prisma.fiadoMovement.deleteMany({ where: { saleId, userId } });
  await prisma.sale.delete({ where: { id: saleId } });
}

export type PurchaseItemInput = { productId: string; qty: number; unitCost: number };

// Compra de mercancía: sube stock y actualiza costo. Contado (accountId) o a crédito (supplierId).
export async function createPurchase(
  userId: string,
  items: PurchaseItemInput[],
  opts: { accountId?: string; supplierId?: string; dueDate?: string; note?: string },
) {
  if (!items.length) throw new Error("Compra vacía");
  const total = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  if (total <= 0) throw new Error("Total inválido");
  const date = todayISOShared();
  const names: string[] = [];
  for (const i of items) {
    const prod = await prisma.product.findFirst({ where: { id: i.productId, userId } });
    if (!prod) continue;
    names.push(`${i.qty}x ${prod.name}`);
    await prisma.product.update({
      where: { id: prod.id },
      data: { stock: { increment: i.qty }, cost: i.unitCost },
    });
  }
  const desc = (opts.note || names.join(", ")).slice(0, 120);
  if (opts.supplierId) {
    // A crédito: deuda con el proveedor
    await prisma.fiadoMovement.create({
      data: { userId, customerId: opts.supplierId, date, type: "fiado", amount: total, note: desc, dueDate: opts.dueDate },
    });
  } else {
    await prisma.finance.create({
      data: {
        id: crypto.randomUUID(), userId, date, type: "egreso", category: "Mercancía",
        desc, amount: total, accountId: opts.accountId,
        accountName: opts.accountId === "cash" ? "Efectivo" : undefined,
      },
    });
    await adjustBalance(userId, opts.accountId, -total);
  }
  await logActivity(userId, "compra", `Compra: ${desc}`, { amount: total });
}

// Cierre de caja: compara efectivo contado vs esperado y ajusta el saldo.
export async function closeCashDay(userId: string, countedCash: number, note?: string) {
  const date = todayISOShared();
  const [sales, finances, cash] = await Promise.all([
    prisma.sale.findMany({ where: { userId, date } }),
    prisma.finance.findMany({ where: { userId, date } }),
    prisma.cash.findUnique({ where: { userId } }),
  ]);
  const byMethod: Record<string, number> = {};
  for (const s of sales) {
    const key = s.payMethod === "cash" ? "Efectivo" : s.payMethod === "fiado" ? "Fiado" : s.payMethod;
    byMethod[key] = (byMethod[key] ?? 0) + s.total;
  }
  const gastos = finances.filter(f => f.type === "egreso").reduce((s, f) => s + f.amount, 0);
  const expectedCash = cash?.banco ?? 0;
  const diff = countedCash - expectedCash;
  const close = await prisma.cashClose.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId, date, expectedCash, countedCash, diff, note,
      summary: JSON.stringify({ byMethod, gastos, ventas: sales.reduce((s, x) => s + x.total, 0) }),
    },
    update: {
      expectedCash, countedCash, diff, note,
      summary: JSON.stringify({ byMethod, gastos, ventas: sales.reduce((s, x) => s + x.total, 0) }),
    },
  });
  // El conteo físico manda: ajusta el efectivo de la app
  await prisma.cash.upsert({
    where: { userId },
    create: { userId, banco: countedCash },
    update: { banco: countedCash },
  });
  await logActivity(userId, "caja", `Cierre de caja: ${diff === 0 ? "cuadró" : diff > 0 ? "sobrante" : "faltante"}`, { amount: Math.abs(diff) });
  return close;
}
