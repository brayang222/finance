import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, notFound, badRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { todayISO, adjustBalance, logActivity } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { customerId, type, amount, note, accountId, dueDate } = await req.json();
    if (type !== "fiado" && type !== "abono") return badRequest("Tipo inválido");
    if (!(amount > 0)) return badRequest("Monto inválido");
    const customer = await prisma.customer.findFirst({ where: { id: customerId, userId } });
    if (!customer) return notFound("Cliente no encontrado");
    const m = await prisma.fiadoMovement.create({
      data: { userId, customerId, date: todayISO(), type, amount, note, dueDate },
    });
    // Cliente que abona = entra plata; pago a proveedor = sale plata
    const isSupplier = customer.kind === "supplier";
    if (type === "abono" && accountId) {
      await adjustBalance(userId, accountId, isSupplier ? -amount : amount);
    }
    await logActivity(
      userId, type,
      isSupplier
        ? `${type === "fiado" ? "Deuda con" : "Pago a"} ${customer.name}`
        : `${type === "fiado" ? "Fiado a" : "Abono de"} ${customer.name}`,
      { amount },
    );
    return NextResponse.json(m, { status: 201 });
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await req.json();
    await prisma.fiadoMovement.deleteMany({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}
