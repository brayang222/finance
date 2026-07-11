import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    return NextResponse.json(await prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }));
  } catch (e) { return apiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { name, type } = await req.json();
    const item = await prisma.category.upsert({
      where: { userId_name_type: { userId, name, type } },
      create: { userId, name, type },
      update: {},
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) { return apiError(e); }
}
