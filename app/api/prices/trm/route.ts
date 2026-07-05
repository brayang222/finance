import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("No se pudo consultar la tasa de cambio");
    const json = await res.json();
    const cop = json?.rates?.COP;
    if (!cop || cop <= 0) throw new Error("TRM no disponible");
    const now = new Date();
    await prisma.userConfig.upsert({
      where: { userId },
      create: { userId, trm: cop, trmUpdatedAt: now },
      update: { trm: cop, trmUpdatedAt: now },
    });
    return NextResponse.json({ trm: cop, updatedAt: now.toISOString() });
  } catch (e) { return apiError(e); }
}
