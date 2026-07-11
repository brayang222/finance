import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { todayISO } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { initialBalance, rate, name = "Nubank", currency = "COP" } = await req.json();
    const today = todayISO();
    const hys = await prisma.hys.create({
      data: { userId, name, currency, rate, openedAt: today },
    });
    await prisma.hysMovement.create({
      data: { id: crypto.randomUUID(), userId, hysId: hys.id, date: today, type: "inicio", amount: initialBalance, balance: initialBalance, rate },
    });
    return NextResponse.json({ id: hys.id });
  } catch (e) { return apiError(e); }
}
