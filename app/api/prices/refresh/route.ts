import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", ADA: "cardano",
  USDT: "tether", BNB: "binancecoin", XRP: "ripple", DOT: "polkadot",
  MATIC: "matic-network", AVAX: "avalanche-2", DOGE: "dogecoin",
  LINK: "chainlink", LTC: "litecoin", UNI: "uniswap", ATOM: "cosmos",
};

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { stockTickers = [], cryptoTickers = [] } = await req.json();
    const pricesMap: Record<string, number> = {};

    for (const ticker of stockTickers as string[]) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.CL?range=1d&interval=1d`;
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) continue;
        const json = await res.json();
        const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price && price > 0) pricesMap[ticker] = price;
      } catch { /* skip */ }
    }

    const ids = (cryptoTickers as string[]).map(t => COINGECKO_IDS[t.toUpperCase()]).filter(Boolean);
    if (ids.length > 0) {
      try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=cop`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          for (const ticker of cryptoTickers as string[]) {
            const coinId = COINGECKO_IDS[ticker.toUpperCase()];
            if (coinId && json[coinId]?.cop) pricesMap[ticker.toUpperCase()] = json[coinId].cop;
          }
        }
      } catch { /* skip */ }
    }

    if (Object.keys(pricesMap).length === 0) return NextResponse.json({ updated: 0 });

    await Promise.all(
      Object.entries(pricesMap).map(([ticker, value]) =>
        prisma.price.upsert({
          where: { userId_ticker: { userId, ticker } },
          create: { userId, ticker, value },
          update: { value },
        })
      )
    );
    return NextResponse.json({ updated: Object.keys(pricesMap).length, prices: pricesMap });
  } catch (e) { return apiError(e); }
}
