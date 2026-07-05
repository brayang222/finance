import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();
    const updated = await prisma.bankAccount.update({ where: { id, userId }, data: body });
    await logActivity(userId, "account_edit", `Cuenta editada: ${body.name}`, { accountName: body.name });
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const row = await prisma.bankAccount.findUnique({ where: { id } });
    if (!row || row.userId !== userId) return notFound();
    await prisma.bankAccount.delete({ where: { id } });
    await logActivity(userId, "account_delete", `Cuenta eliminada: ${row.name}`, { accountName: row.name });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return apiError(e); }
}
