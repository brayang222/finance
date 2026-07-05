import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { period, amount } = await req.json();
    const item = await prisma.budgetConfig.upsert({
      where: { userId_period: { userId, period } },
      create: { userId, period, amount },
      update: { amount },
    });
    return NextResponse.json(item);
  } catch (e) { return apiError(e); }
}
