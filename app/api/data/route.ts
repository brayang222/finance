import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const [stocks, crypto, finances, hysAccounts, hysMovements, prices, targets, cash, config,
      bankAccounts, activityLogs, budgets, budgetConfigs, categories, goals, recurrings] =
      await Promise.all([
        prisma.stock.findMany({ where: { userId } }),
        prisma.crypto.findMany({ where: { userId } }),
        prisma.finance.findMany({ where: { userId } }),
        prisma.hys.findMany({ where: { userId }, include: { movements: { orderBy: { date: "asc" } } } }),
        prisma.hysMovement.findMany({ where: { userId } }),
        prisma.price.findMany({ where: { userId } }),
        prisma.target.findMany({ where: { userId } }),
        prisma.cash.findUnique({ where: { userId } }),
        prisma.userConfig.findUnique({ where: { userId } }),
        prisma.bankAccount.findMany({ where: { userId }, orderBy: { createdAt: "asc" },
          select: { id: true, name: true, bank: true, type: true, balance: true, color: true } }),
        prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.budget.findMany({ where: { userId }, orderBy: { category: "asc" } }),
        prisma.budgetConfig.findMany({ where: { userId } }),
        prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
        prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
        prisma.recurring.findMany({ where: { userId }, orderBy: { nextDate: "asc" } }),
      ]);

    return NextResponse.json({
      stocks,
      crypto,
      finances,
      hys: hysAccounts[0] ? { rate: hysAccounts[0].rate, movements: hysMovements } : null,
      hysAccounts: hysAccounts.map(a => ({
        id: a.id, name: a.name, currency: a.currency, rate: a.rate,
        openedAt: a.openedAt, movements: a.movements,
      })),
      prices: Object.fromEntries(prices.map(p => [p.ticker, p.value])),
      targets: Object.fromEntries(targets.map(t => [t.ticker, t.value])),
      cash,
      config: config ? {
        ...config,
        trmUpdatedAt: config.trmUpdatedAt?.toISOString() ?? null,
        summaryWidgets: config.summaryWidgets ? JSON.parse(config.summaryWidgets) : null,
      } : null,
      bankAccounts,
      activityLogs: activityLogs.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
      budgets,
      budgetConfigs,
      categories,
      goals: goals.map(g => ({ ...g, createdAt: g.createdAt.toISOString() })),
      recurrings,
    });
  } catch (e) {
    return apiError(e);
  }
}
