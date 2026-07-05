import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { adjustBalance, autoSaveCategory, logActivity, advanceDate } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const r = await prisma.recurring.findFirst({ where: { id, userId } });
    if (!r) return notFound();
    await prisma.finance.create({
      data: {
        id: crypto.randomUUID(), userId,
        type: r.type, category: r.category, desc: r.desc,
        amount: r.amount, date: r.nextDate,
        accountId: r.accountId, accountName: r.accountName,
      },
    });
    await autoSaveCategory(userId, r.category, r.type);
    await adjustBalance(userId, r.accountId ?? undefined, r.type === "ingreso" ? r.amount : -r.amount);
    const next = advanceDate(r.nextDate, r.frequency);
    const updated = await prisma.recurring.update({ where: { id }, data: { nextDate: next } });
    await logActivity(userId, r.type, `Recurrente: ${r.desc}`, { amount: r.amount, accountName: r.accountName ?? undefined });
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}
