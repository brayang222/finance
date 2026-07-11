import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { adjustBalance, logActivity } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    return NextResponse.json(await prisma.crypto.findMany({ where: { userId } }));
  } catch (e) { return apiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const body = await req.json();
    const item = await prisma.crypto.create({ data: { ...body, id: crypto.randomUUID(), userId } });
    await adjustBalance(userId, body.accountId, -(body.priceCOP * body.qty + body.commission));
    await logActivity(userId, "crypto_buy", `Compra cripto: ${body.ticker}`,
      { amount: body.priceCOP * body.qty, ticker: body.ticker, accountName: body.accountName });
    return NextResponse.json(item, { status: 201 });
  } catch (e) { return apiError(e); }
}
