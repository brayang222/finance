import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const cash = await prisma.cash.findUnique({ where: { userId } });
    return NextResponse.json(cash ?? { banco: 0 });
  } catch (e) { return apiError(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { banco } = await req.json();
    const cash = await prisma.cash.upsert({
      where: { userId },
      create: { userId, banco: Number(banco) || 0 },
      update: { banco: Number(banco) || 0 },
    });
    return NextResponse.json(cash);
  } catch (e) { return apiError(e); }
}
