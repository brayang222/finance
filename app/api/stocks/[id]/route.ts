import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { adjustBalance, logActivity } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const { source, ...body } = await req.json();
    const old = await prisma.stock.findUnique({ where: { id } });
    if (!old || old.userId !== userId) return notFound();
    if (old.accountId) await adjustBalance(userId, old.accountId, old.priceCOP * old.qty + old.commission);
    await adjustBalance(userId, body.accountId, -(body.priceCOP * body.qty + body.commission));
    const updated = await prisma.stock.update({ where: { id }, data: body });
    await logActivity(userId, "stock_edit", `Edición acción: ${body.ticker}`, { ticker: body.ticker });
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const row = await prisma.stock.findUnique({ where: { id } });
    if (!row || row.userId !== userId) return notFound();
    await prisma.stock.delete({ where: { id } });
    if (row.accountId) await adjustBalance(userId, row.accountId, row.priceCOP * row.qty + row.commission);
    await logActivity(userId, "stock_delete", `Eliminación acción: ${row.ticker}`, { ticker: row.ticker });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return apiError(e); }
}
