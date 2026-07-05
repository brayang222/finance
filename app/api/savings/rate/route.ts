import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { compound, todayISO } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { rate } = await req.json();
    const today = todayISO();
    const hys = await prisma.hys.findUnique({ where: { userId } });
    if (!hys) return NextResponse.json({ error: "Cuenta no inicializada" }, { status: 400 });
    const last = await prisma.hysMovement.findFirst({ where: { userId }, orderBy: { date: "desc" } });
    const accrued = last ? compound(last.balance, last.rate, last.date, today) : 0;
    await prisma.$transaction([
      prisma.hysMovement.create({
        data: { id: crypto.randomUUID(), userId, date: today, type: "rendimiento", amount: 0, balance: accrued, rate: hys.rate },
      }),
      prisma.hys.update({ where: { userId }, data: { rate } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}
