import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const accounts = await prisma.hys.findMany({
      where: { userId },
      include: { movements: { orderBy: { date: "asc" } } },
    });
    return NextResponse.json(accounts.map(a => ({
      id: a.id, name: a.name, currency: a.currency, rate: a.rate,
      openedAt: a.openedAt, movements: a.movements,
    })));
  } catch (e) { return apiError(e); }
}
