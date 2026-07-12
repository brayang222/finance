import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, badRequest } from "@/lib/api-auth";
import { closeCashDay } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { countedCash, note } = await req.json();
    if (typeof countedCash !== "number" || countedCash < 0) return badRequest("Conteo inválido");
    const close = await closeCashDay(userId, countedCash, note);
    return NextResponse.json(close, { status: 201 });
  } catch (e) { return apiError(e); }
}
