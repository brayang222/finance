import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { todayISO } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { initialBalance, rate } = await req.json();
    const today = todayISO();
    await prisma.$transaction([
      prisma.hys.upsert({ where: { userId }, update: { rate }, create: { userId, rate } }),
      prisma.hysMovement.deleteMany({ where: { userId } }),
      prisma.hysMovement.create({
        data: { id: crypto.randomUUID(), userId, date: today, type: "inicio", amount: initialBalance, balance: initialBalance, rate },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}
