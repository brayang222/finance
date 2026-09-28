import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError, badRequest } from "@/lib/api-auth";
import { computeIndicators } from "@/lib/technicals";

// Free, no-key Yahoo Finance lookup: resolves a ticker and returns price +
// technical data so the user can confirm it's the right stock/crypto before
// saving, and (with series=1) a full OHLC history + indicators for charting.
// Uses the v8/finance/chart endpoint — the v10 quoteSummary endpoint now
// requires an auth "crumb" and 401s without it.
async function fetchChart(symbol: string, range: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return null;
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result?.meta?.regularMarketPrice) return null;
  return result;
}

function average(values: (number | null | undefined)[] | undefined, days: number) {
  if (!values || values.length === 0) return undefined;
  const recent = values.filter((v): v is number => typeof v === "number").slice(-days);
  if (recent.length === 0) return undefined;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function tickerCandidates(ticker: string, kind: string) {
  if (ticker.includes(".") || ticker.includes("-")) return [ticker];
  if (kind === "crypto") return [`${ticker}-USD`, ticker];
  return [ticker, `${ticker}.CL`];
}

function shapeBasic(symbol: string, meta: any, closes?: (number | null)[]) {
  return {
    symbol,
    name: meta.longName || meta.shortName || symbol,
    exchange: meta.fullExchangeName || meta.exchangeName,
    currency: meta.currency,
    price: meta.regularMarketPrice,
    previousClose: meta.chartPreviousClose,
    change: typeof meta.regularMarketPrice === "number" && typeof meta.chartPreviousClose === "number"
      ? meta.regularMarketPrice - meta.chartPreviousClose
      : undefined,
    changePercent: meta.regularMarketChangePercent,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    fiftyDayAverage: average(closes, 50),
    twoHundredDayAverage: average(closes, 200),
  };
}

// Nearest trading day at or before `dateISO` — used for "as of purchase" snapshots.
function indexAtOrBefore(dates: string[], dateISO: string) {
  let idx = -1;
  for (let i = 0; i < dates.length; i++) {
    if (dates[i] <= dateISO) idx = i; else break;
  }
  return idx;
}

function round(n: number | null | undefined, digits = 4) {
  if (typeof n !== "number" || Number.isNaN(n)) return undefined;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function subtractDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// % change from the trading day closest to (idx's date − daysBack) to idx.
function changeOverDays(dates: string[], closes: (number | null)[], idx: number, daysBack: number) {
  const fromIdx = indexAtOrBefore(dates, subtractDays(dates[idx], daysBack));
  if (fromIdx < 0 || fromIdx === idx) return undefined;
  const base = closes[fromIdx];
  const now = closes[idx];
  if (typeof base !== "number" || typeof now !== "number" || base === 0) return undefined;
  return (now - base) / base;
}

function snapshotAt(dates: string[], quote: any, ind: ReturnType<typeof computeIndicators>, idx: number) {
  if (idx < 0) return undefined;
  const closes = quote.close as (number | null)[];
  const windowStart = Math.max(0, idx - 251);
  const yearSlice = closes.slice(windowStart, idx + 1).filter((v): v is number => typeof v === "number");
  return {
    date: dates[idx],
    price: round(closes[idx]),
    dayHigh: round(quote.high?.[idx]),
    dayLow: round(quote.low?.[idx]),
    volume: quote.volume?.[idx] ?? undefined,
    fiftyTwoWeekHigh: yearSlice.length ? round(Math.max(...yearSlice)) : undefined,
    fiftyTwoWeekLow: yearSlice.length ? round(Math.min(...yearSlice)) : undefined,
    changeDayPct: idx > 0 && typeof closes[idx - 1] === "number" && closes[idx - 1] !== 0
      ? round((closes[idx]! - closes[idx - 1]!) / closes[idx - 1]!, 4)
      : undefined,
    changeWeekPct: round(changeOverDays(dates, closes, idx, 7), 4),
    changeMonthPct: round(changeOverDays(dates, closes, idx, 30), 4),
    changeYearPct: round(changeOverDays(dates, closes, idx, 365), 4),
    ema8: round(ind.ema8[idx]),
    ema34: round(ind.ema34[idx]),
    ema200: round(ind.ema200[idx]),
    rsi14: round(ind.rsi14[idx], 2),
    macd: round(ind.macdLine[idx]),
    macdSignal: round(ind.macdSignal[idx]),
    macdHistogram: round(ind.macdHistogram[idx]),
    bbUpper: round(ind.bbUpper[idx]),
    bbMid: round(ind.bbMid[idx]),
    bbLower: round(ind.bbLower[idx]),
  };
}

export async function GET(req: NextRequest) {
  try {
    await getUserIdFromRequest(req);
    const ticker = req.nextUrl.searchParams.get("ticker")?.trim().toUpperCase();
    if (!ticker) return badRequest("Falta el parámetro 'ticker'");
    const kind = req.nextUrl.searchParams.get("kind") === "crypto" ? "crypto" : "stock";
    const wantSeries = req.nextUrl.searchParams.get("series") === "1";
    const atDate = req.nextUrl.searchParams.get("at") ?? undefined;
    const range = wantSeries ? "5y" : "1y";

    for (const symbol of tickerCandidates(ticker, kind)) {
      const result = await fetchChart(symbol, range);
      if (!result) continue;

      const meta = result.meta;
      const quote = result.indicators?.quote?.[0] ?? {};
      const closesRaw = (quote.close ?? []) as (number | null)[];
      const basic = shapeBasic(symbol, meta, closesRaw);

      if (!wantSeries) return NextResponse.json(basic);

      const timestamps = (result.timestamp ?? []) as number[];
      const dates = timestamps.map((t: number) => new Date(t * 1000).toISOString().slice(0, 10));
      const opensRaw = (quote.open ?? []) as (number | null)[];
      const highsRaw = (quote.high ?? []) as (number | null)[];
      const lowsRaw = (quote.low ?? []) as (number | null)[];
      const volumesRaw = (quote.volume ?? []) as (number | null)[];

      // Thinly-traded tickers (e.g. BVC stocks) sometimes get a day with zero
      // volume or a null field from Yahoo — rendering that day's raw OHLC as
      // a candle produces a visual glitch ("floating" candle disconnected
      // from its neighbors). Flatten those bars to the last real close
      // instead, for both the candles and the indicators, so the chart and
      // EMA/RSI stay continuous through the gap.
      let last = 0;
      const opens: number[] = [], highs: number[] = [], lows: number[] = [], closes: number[] = [];
      for (let i = 0; i < dates.length; i++) {
        const hasRealBar = volumesRaw[i] != null && volumesRaw[i]! > 0
          && opensRaw[i] != null && highsRaw[i] != null && lowsRaw[i] != null && closesRaw[i] != null;
        if (hasRealBar) {
          opens.push(opensRaw[i]!); highs.push(highsRaw[i]!); lows.push(lowsRaw[i]!); closes.push(closesRaw[i]!);
          last = closesRaw[i]!;
        } else {
          opens.push(last); highs.push(last); lows.push(last); closes.push(last);
        }
      }

      // Second pass: an isolated single-day spike that still reports some
      // (low) volume slips past the check above but is still a data glitch,
      // not a real move — a genuine move persists into the next day, a
      // glitch reverts immediately. Flatten any bar whose close jumps away
      // from *and back to* its neighbors' level.
      for (let i = 1; i < closes.length - 1; i++) {
        const prev = closes[i - 1], cur = closes[i], next = closes[i + 1];
        if (cur === prev || prev === 0) continue;
        const devPrev = Math.abs(cur - prev) / prev;
        const devNext = cur !== 0 ? Math.abs(next - cur) / cur : 0;
        const neighborsAgree = prev !== 0 && Math.abs(next - prev) / prev < 0.03;
        if (devPrev > 0.12 && devNext > 0.12 && neighborsAgree) {
          opens[i] = prev; highs[i] = prev; lows[i] = prev; closes[i] = prev;
        }
      }

      // Some BVC tickers (recent spin-offs, corporate restructurings) barely
      // trade at all — Yahoo carries the symbol but almost every day has
      // zero volume, which our free feed has no reference price for (unlike
      // a licensed exchange feed). Filling those days with a flat "last
      // close" candle is fine when it's a handful of gaps in an otherwise
      // liquid stock (see the loop above), but when MOST of the history is
      // fake, drop the filler entirely and chart only the sessions that
      // actually traded — indicators then naturally show "—" until there's
      // enough real history for their period, instead of computing on a
      // mostly-synthetic flat line.
      const realBarCount = volumesRaw.filter(v => typeof v === "number" && v > 0).length;
      const THIN_TICKER_THRESHOLD = 30;
      const isThin = realBarCount > 0 && realBarCount < THIN_TICKER_THRESHOLD;

      let outDates = dates, outOpens = opens, outHighs = highs, outLows = lows, outCloses = closes;
      let outVolumes = volumesRaw.map(v => v ?? 0);
      if (isThin) {
        outDates = []; outOpens = []; outHighs = []; outLows = []; outCloses = []; outVolumes = [];
        for (let i = 0; i < dates.length; i++) {
          if (volumesRaw[i] != null && volumesRaw[i]! > 0 && opensRaw[i] != null && highsRaw[i] != null && lowsRaw[i] != null && closesRaw[i] != null) {
            outDates.push(dates[i]); outOpens.push(opensRaw[i]!); outHighs.push(highsRaw[i]!);
            outLows.push(lowsRaw[i]!); outCloses.push(closesRaw[i]!); outVolumes.push(volumesRaw[i]!);
          }
        }
      }

      const ind = computeIndicators(outCloses);
      const latestIdx = outCloses.length - 1;
      const asOfIdx = atDate ? indexAtOrBefore(outDates, atDate) : -1;

      return NextResponse.json({
        ...basic,
        realBarCount,
        totalBarCount: dates.length,
        thin: isThin,
        series: { dates: outDates, open: outOpens, high: outHighs, low: outLows, close: outCloses, volume: outVolumes },
        indicators: ind,
        latest: snapshotAt(outDates, { close: outCloses, high: outHighs, low: outLows, volume: outVolumes }, ind, latestIdx),
        asOf: atDate ? snapshotAt(outDates, { close: outCloses, high: outHighs, low: outLows, volume: outVolumes }, ind, asOfIdx) : undefined,
      });
    }
    return NextResponse.json({ error: "No se encontró información para ese ticker" }, { status: 404 });
  } catch (e) {
    return apiError(e);
  }
}
