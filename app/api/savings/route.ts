import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const hys = await prisma.hys.findUnique({ where: { userId } });
    if (!hys) return NextResponse.json(null);
    const movements = await prisma.hysMovement.findMany({ where: { userId }, orderBy: { date: "asc" } });
    return NextResponse.json({ rate: hys.rate, movements });
  } catch (e) { return apiError(e); }
}
