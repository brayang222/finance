import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });
    return NextResponse.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
  } catch (e) { return apiError(e); }
}
