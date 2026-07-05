import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { adjustBalance, autoSaveCategory, logActivity } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const finances = await prisma.finance.findMany({ where: { userId } });
    return NextResponse.json(finances);
  } catch (e) { return apiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const body = await req.json();
    const { type, amount, desc, category, date, accountId, accountName } = body;
    const item = await prisma.finance.create({
      data: { id: crypto.randomUUID(), userId, type, amount, desc, category, date, accountId, accountName },
    });
    await autoSaveCategory(userId, category, type);
    await adjustBalance(userId, accountId, type === "ingreso" ? amount : -amount);
    await logActivity(userId, type, `${type === "ingreso" ? "Ingreso" : "Egreso"}: ${desc ?? category}`,
      { amount, accountName });
    return NextResponse.json(item, { status: 201 });
  } catch (e) { return apiError(e); }
}
