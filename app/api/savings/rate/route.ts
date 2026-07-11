import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { compound, todayISO } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { hysId, rate } = await req.json();
    const today = todayISO();
    const hys = await prisma.hys.findFirst({ where: { id: hysId, userId } });
    if (!hys) return notFound();
    const last = await prisma.hysMovement.findFirst({ where: { hysId }, orderBy: { date: "desc" } });
    const accrued = last ? compound(last.balance, last.rate, last.date, today) : 0;
    await prisma.$transaction([
      prisma.hysMovement.create({
        data: { id: crypto.randomUUID(), userId, hysId, date: today, type: "rendimiento", amount: 0, balance: accrued, rate: hys.rate },
      }),
      prisma.hys.update({ where: { id: hysId }, data: { rate } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}
