import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { createPurchase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { items, accountId, supplierId, dueDate, note } = await req.json();
    await createPurchase(userId, items, { accountId, supplierId, dueDate, note });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) { return apiError(e); }
}
