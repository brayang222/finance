import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { autoSaveCategory } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const items: Array<{ type: string; amount: number; desc: string; category: string; date: string; accountId?: string; accountName?: string }> =
      await req.json();
    await prisma.finance.createMany({
      data: items.map(item => ({ ...item, id: crypto.randomUUID(), userId })),
    });
    for (const item of items) await autoSaveCategory(userId, item.category, item.type);
    return NextResponse.json({ imported: items.length }, { status: 201 });
  } catch (e) { return apiError(e); }
}
