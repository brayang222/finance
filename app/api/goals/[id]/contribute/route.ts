import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const { amount } = await req.json();
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) return notFound();
    const updated = await prisma.goal.update({ where: { id }, data: { saved: { increment: amount } } });
    await logActivity(userId, "goal_contribute", `Abono a meta: ${goal.name}`, { amount });
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}
