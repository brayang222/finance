import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { compound, todayISO } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { amount, note } = await req.json();
    const today = todayISO();
    const hys = await prisma.hys.findUnique({ where: { userId } });
    if (!hys) return NextResponse.json({ error: "Cuenta no inicializada" }, { status: 400 });
    const last = await prisma.hysMovement.findFirst({ where: { userId }, orderBy: { date: "desc" } });
    const base = last ? compound(last.balance, last.rate, last.date, today) : 0;
    const movement = await prisma.hysMovement.create({
      data: { id: crypto.randomUUID(), userId, date: today, type: "retiro", amount, balance: base - amount, rate: hys.rate, note },
    });
    return NextResponse.json(movement, { status: 201 });
  } catch (e) { return apiError(e); }
}
