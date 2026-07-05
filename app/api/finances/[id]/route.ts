import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { adjustBalance, autoSaveCategory } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();
    const old = await prisma.finance.findUnique({ where: { id } });
    if (!old || old.userId !== userId) return notFound();
    await adjustBalance(userId, old.accountId, old.type === "ingreso" ? -old.amount : old.amount);
    await adjustBalance(userId, body.accountId, body.type === "ingreso" ? body.amount : -body.amount);
    const updated = await prisma.finance.update({ where: { id }, data: { ...body, userId } });
    await autoSaveCategory(userId, body.category, body.type);
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const old = await prisma.finance.findUnique({ where: { id } });
    if (!old || old.userId !== userId) return notFound();
    await adjustBalance(userId, old.accountId, old.type === "ingreso" ? -old.amount : old.amount);
    await prisma.finance.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return apiError(e); }
}
