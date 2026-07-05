import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { category } = await params;
    const { amount, period } = await req.json();
    const item = await prisma.budget.upsert({
      where: { userId_category_period: { userId, category, period } },
      create: { userId, category, amount, period },
      update: { amount },
    });
    return NextResponse.json(item);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { category } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "mensual";
    await prisma.budget.deleteMany({ where: { userId, category, period } });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return apiError(e); }
}
