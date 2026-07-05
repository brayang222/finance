import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const config = await prisma.userConfig.findUnique({ where: { userId } });
    if (!config) return NextResponse.json(null);
    return NextResponse.json({
      theme: config.theme,
      onboardingDone: config.onboardingDone,
      showStocks: config.showStocks,
      showCrypto: config.showCrypto,
      showHys: config.showHys,
      showActivity: config.showActivity,
      showGoals: config.showGoals,
      baseCurrency: config.baseCurrency,
      trm: config.trm,
      trmUpdatedAt: config.trmUpdatedAt?.toISOString() ?? null,
      summaryWidgets: config.summaryWidgets ? JSON.parse(config.summaryWidgets) : null,
      telegramId: config.telegramId,
    });
  } catch (e) { return apiError(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const body = await req.json();
    const allowed = [
      "theme", "onboardingDone",
      "showStocks", "showCrypto", "showHys", "showActivity", "showGoals",
      "baseCurrency", "telegramId",
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    if ("summaryWidgets" in body) {
      data.summaryWidgets = JSON.stringify(body.summaryWidgets);
    }
    const config = await prisma.userConfig.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return NextResponse.json(config);
  } catch (e) { return apiError(e); }
}
