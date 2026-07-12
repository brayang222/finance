import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, badRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { name, phone, note, kind = "customer" } = await req.json();
    if (!name?.trim()) return badRequest("Nombre requerido");
    const c = await prisma.customer.create({ data: { userId, name: name.trim(), phone, note, kind } });
    return NextResponse.json(c, { status: 201 });
  } catch (e) { return apiError(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id, name, phone, note } = await req.json();
    await prisma.customer.updateMany({ where: { id, userId }, data: { name, phone, note } });
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await req.json();
    await prisma.customer.deleteMany({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}
