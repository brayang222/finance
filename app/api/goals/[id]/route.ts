import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();
    const updated = await prisma.goal.updateMany({ where: { id, userId }, data: { ...body, deadline: body.deadline ?? null } });
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) return notFound();
    await prisma.goal.delete({ where: { id } });
    await logActivity(userId, "goal_delete", `Meta eliminada: ${goal.name}`);
    return new NextResponse(null, { status: 204 });
  } catch (e) { return apiError(e); }
}
