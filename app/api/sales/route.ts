import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { createSale, removeSale } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { items, payMethod, customerId, note } = await req.json();
    const id = await createSale(userId, items, payMethod, customerId, note);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await req.json();
    await removeSale(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) { return apiError(e); }
}
