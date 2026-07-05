import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    return NextResponse.json(await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }));
  } catch (e) { return apiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const body = await req.json();
    const item = await prisma.goal.create({ data: { ...body, userId } });
    await logActivity(userId, "goal_create", `Nueva meta: ${body.name}`, { amount: body.target });
    return NextResponse.json(item, { status: 201 });
  } catch (e) { return apiError(e); }
}
