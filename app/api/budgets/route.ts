import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const [budgets, budgetConfigs] = await Promise.all([
      prisma.budget.findMany({ where: { userId }, orderBy: { category: "asc" } }),
      prisma.budgetConfig.findMany({ where: { userId } }),
    ]);
    return NextResponse.json({ budgets, budgetConfigs });
  } catch (e) { return apiError(e); }
}
