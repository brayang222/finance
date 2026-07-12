import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { compound, todayISO, adjustBalance } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { hysId, amount, note, accountId } = await req.json();
    const today = todayISO();
    const hys = await prisma.hys.findFirst({ where: { id: hysId, userId } });
    if (!hys) return notFound();
    const last = await prisma.hysMovement.findFirst({ where: { hysId }, orderBy: { date: "desc" } });
    const base = last ? compound(last.balance, last.rate, last.date, today) : 0;
    const movement = await prisma.hysMovement.create({
      data: { id: crypto.randomUUID(), userId, hysId, date: today, type: "retiro", amount, balance: base - amount, rate: hys.rate, note },
    });
    if (accountId) await adjustBalance(userId, accountId, amount);
    return NextResponse.json(movement, { status: 201 });
  } catch (e) { return apiError(e); }
}
