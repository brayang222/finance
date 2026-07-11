import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat || cat.userId !== userId) return notFound();
    const updated = await prisma.category.update({ where: { id }, data: { ...body } });
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    await prisma.category.deleteMany({ where: { id, userId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return apiError(e); }
}
