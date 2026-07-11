import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { replayBalances } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const patch = await req.json();
    const movement = await prisma.hysMovement.findFirst({ where: { id, userId } });
    if (!movement) return notFound();
    const updated = await prisma.hysMovement.update({ where: { id }, data: patch });
    await replayBalances(userId, updated.date, movement.hysId ?? undefined);
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const movement = await prisma.hysMovement.findFirst({ where: { id, userId } });
    if (!movement) return notFound();
    await prisma.hysMovement.delete({ where: { id } });
    await replayBalances(userId, movement.date, movement.hysId ?? undefined);
    return new NextResponse(null, { status: 204 });
  } catch (e) { return apiError(e); }
}
