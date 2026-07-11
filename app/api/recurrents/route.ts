import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    return NextResponse.json(await prisma.recurring.findMany({ where: { userId }, orderBy: { nextDate: "asc" } }));
  } catch (e) { return apiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const body = await req.json();
    const item = await prisma.recurring.create({ data: { ...body, userId } });
    return NextResponse.json(item, { status: 201 });
  } catch (e) { return apiError(e); }
}
