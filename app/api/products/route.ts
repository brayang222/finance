import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, badRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { name, category, cost = 0, price, stock = 0, minStock = 0 } = await req.json();
    if (!name?.trim() || !(price > 0)) return badRequest("Nombre y precio requeridos");
    const p = await prisma.product.create({
      data: { userId, name: name.trim(), category, cost, price, stock, minStock },
    });
    return NextResponse.json(p, { status: 201 });
  } catch (e) { return apiError(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id, ...patch } = await req.json();
    await prisma.product.updateMany({ where: { id, userId }, data: patch });
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await req.json();
    await prisma.product.deleteMany({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}
