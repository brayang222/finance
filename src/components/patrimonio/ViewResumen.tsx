"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Asset,
  Transaction,
  COP,
  COPSHORT,
  PCT,
} from "../../data/mock";
import type { AllData } from "../../types";
import {
  Bal,
  catmullRomPath,
  areaPath,
  scalePoints,
  DONUT_COLORS,
} from "./utils";
import { usePrivacy } from "./PrivacyContext";
import { toAssets, toTransactions } from "./transforms";

// ponytail: shared style objects replaced with className strings; kept as consts for readability
const cardBase = "border border-line bg-panel";
const microLabel = "text-[11px] tracking-[0.08em] uppercase text-dim font-medium";
const kpiValueClass = "text-[27px] font-medium tabular-nums";
const sectionTitle = "text-[14px] font-medium";

function valueOf(asset: { qty: number; price: number }) {
  return asset.qty * asset.price;
}
function costOf(asset: { qty: number; avg: number }) {
  return asset.qty * asset.avg;
}

const MONTHS = ["Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun"];

const ALL_WIDGET_KEYS = ["hero", "kpis", "goals", "chart", "allocation", "cashflow", "recent"];

export default function ViewResumen({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const onNav = (v: string) => router.push(`/${v}`);
  const transactions = toTransactions(initialData.finances);
  const holdings = toAssets(initialData.stocks, initialData.prices);
  const cryptoAssets = toAssets(initialData.crypto, initialData.prices);
  const [range, setRange] = useState<"1M" | "6M" | "1A" | "Todo">("1A");
  const config = initialData.config;

  const stockValue = holdings.reduce((s, h) => s + valueOf(h), 0);
  const stockCost = holdings.reduce((s, h) => s + costOf(h), 0);
  const stockPL = stockValue - stockCost;

  const cryptoValue = cryptoAssets.reduce((s, c) => s + valueOf(c), 0);
  const cryptoCost = cryptoAssets.reduce((s, c) => s + costOf(c), 0);
  const cryptoPL = cryptoValue - cryptoCost;

  // Liquid accounts: bank accounts + HYS (exclude bolsa/cripto-type accounts)
  const liquidAccounts = initialData.bankAccounts.filter(a => a.type !== "bolsa" && a.type !== "cripto");
  const bankTotal = liquidAccounts.reduce((s, a) => s + a.balance, 0);
  // now is null on SSR → hysBalance stays 0 to avoid hydration mismatch (Date.now() differs server/client)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  const hysBalance = useMemo(() => {
    if (!now) return 0;
    const hys = initialData.hys;
    if (!hys || !hys.movements.length) return 0;
    const last = hys.movements[hys.movements.length - 1];
    const days = (now - new Date(last.date).getTime()) / 86400000;
    return last.balance * Math.pow(1 + hys.rate / 100, days / 365);
  }, [now, initialData.hys]);
  const cash = bankTotal + hysBalance;
  const total = stockValue + cryptoValue + cash;

  // Filter transactions to current month
  const nowYM = new Date().toISOString().slice(0, 7);
  const monthTx = transactions.filter((t) => t.dateISO.startsWith(nowYM));

  const income = monthTx.filter((t) => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
  const monthBalance = income - expense;

  // ── Insights: month-over-month category comparison ──
  const prevYM = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, []);

  const insights = useMemo(() => {
    const sumBy = (ym: string) => {
      const m: Record<string, number> = {};
      for (const t of transactions)
        if (t.type === "egreso" && t.dateISO.startsWith(ym))
          m[t.category] = (m[t.category] || 0) + t.amount;
      return m;
    };
    const cur = sumBy(nowYM);
    const prev = sumBy(prevYM);
    const out: { icon: string; tone: "pos" | "neg"; text: string }[] = [];
    let bestUp: { cat: string; pct: number } | null = null;
    let bestDown: { cat: string; pct: number } | null = null;
    for (const cat of new Set([...Object.keys(cur), ...Object.keys(prev)])) {
      const c = cur[cat] || 0;
      const p = prev[cat] || 0;
      if (p < 20000) continue;
      const pct = (c - p) / p;
      if (pct > 0.15 && (!bestUp || pct > bestUp.pct)) bestUp = { cat, pct };
      if (pct < -0.15 && (!bestDown || pct < bestDown.pct)) bestDown = { cat, pct };
    }
    if (bestUp)
      out.push({ icon: "▲", tone: "neg", text: `Llevas ${PCT(bestUp.pct)} más en ${bestUp.cat} que el mes pasado` });
    if (bestDown)
      out.push({ icon: "▼", tone: "pos", text: `Llevas ${PCT(-bestDown.pct)} menos en ${bestDown.cat} que el mes pasado` });
    return out;
  }, [transactions, nowYM, prevYM]);

  // ── Streak: consecutive days with at least one record ──
  const streak = useMemo(() => {
    const days = new Set(transactions.map(t => t.dateISO));
    const iso = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const d = new Date();
    if (!days.has(iso(d))) d.setDate(d.getDate() - 1); // today still pending is fine
    let n = 0;
    while (days.has(iso(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }, [transactions]);

  // ── Monthly recap: shown the first days of each month, dismissible ──
  const recap = useMemo(() => {
    const tx = transactions.filter(t => t.dateISO.startsWith(prevYM));
    if (tx.length === 0) return null;
    const inc = tx.filter(t => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
    const exp = tx.filter(t => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
    const byCat: Record<string, number> = {};
    for (const t of tx) if (t.type === "egreso") byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const label = new Date(prevYM + "-15T00:00:00").toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    return { inc, exp, net: inc - exp, topCat, count: tx.length, label };
  }, [transactions, prevYM]);

  const [showRecap, setShowRecap] = useState(false);
  useEffect(() => {
    if (new Date().getDate() <= 5 && !localStorage.getItem(`gfp-recap-${prevYM}`)) setShowRecap(true);
  }, [prevYM]);
  const dismissRecap = () => {
    localStorage.setItem(`gfp-recap-${prevYM}`, "1");
    setShowRecap(false);
  };

  // Real net-worth series from actual transaction dates
  const allSeries = useMemo(() => {
    type Ev = { date: string; delta: number };
    const events: Ev[] = [];
    for (const s of initialData.stocks)
      events.push({ date: s.date, delta: s.priceCOP * s.qty + (s.commission ?? 0) });
    for (const c of initialData.crypto)
      events.push({ date: c.date, delta: c.priceCOP * c.qty + (c.commission ?? 0) });
    for (const f of initialData.finances)
      events.push({ date: f.date, delta: f.type === "ingreso" ? f.amount : -f.amount });
    if (events.length === 0) return [{ ym: new Date().toISOString().slice(0, 7), value: total }];
    events.sort((a, b) => a.date.localeCompare(b.date));
    const minYM = events[0].date.slice(0, 7);
    const maxYM = new Date().toISOString().slice(0, 7);
    const months: string[] = [];
    let cur = new Date(minYM + "-01");
    const end = new Date(maxYM + "-01");
    while (cur <= end) {
      months.push(cur.toISOString().slice(0, 7));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    let running = 0;
    const result = months.map((ym) => {
      events.filter(e => e.date.slice(0, 7) === ym).forEach(e => { running += e.delta; });
      return { ym, value: running };
    });
    result[result.length - 1].value = total;
    return result;
  }, [initialData, total]);

  const rangeMonths: Record<string, number> = { "1M": 1, "6M": 6, "1A": 12, "Todo": 9999 };
  const series = useMemo(() => {
    const n = rangeMonths[range];
    return allSeries.slice(-n);
  }, [allSeries, range]);

  // Real 12-month change
  const val12mAgo = allSeries.length > 12 ? allSeries[allSeries.length - 13].value : allSeries[0].value;
  const change12m = val12mAgo > 0 ? (total - val12mAgo) / val12mAgo : 0;

  const heroSpark = useMemo(() => allSeries.slice(-12).map(s => s.value), [allSeries]);

  const monthLabel = new Date().toLocaleDateString("es-CO", { month: "long" });

  // USD display when preferred and TRM known
  const inUSD = config?.baseCurrency === "USD" && !!config?.trm;
  const usdTotal = inUSD ? total / config!.trm! : null;

  // Widget order: saved config, or sensible default based on active modules
  const widgetOrder = useMemo(() => {
    if (config?.summaryWidgets) return config.summaryWidgets.filter(k => ALL_WIDGET_KEYS.includes(k));
    return ALL_WIDGET_KEYS.filter(k => {
      if (k === "goals") return config?.showGoals ?? true;
      if (k === "allocation") return (config?.showStocks ?? true) || (config?.showCrypto ?? true);
      return true;
    });
  }, [config]);

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <div className={`${cardBase} rounded-[18px] p-6 flex flex-wrap items-center justify-between gap-5`}>
        <div>
          <div className={`${microLabel} tracking-[0.04em]`}>Patrimonio total</div>
          <div
            className="font-medium tracking-[-0.02em] leading-[1.05] my-1.5 mb-2"
            style={{ fontFamily: "Spectral, serif", fontSize: "clamp(34px,5vw,52px)" }}
          >
            {inUSD
              ? (privacy ? "••••" : `US$ ${usdTotal!.toLocaleString("en-US", { maximumFractionDigits: 0 })}`)
              : <Bal n={total} privacy={privacy} />}
          </div>
          <div className="text-[13px] text-muted">
            <span className={change12m >= 0 ? "text-pos font-medium" : "text-neg font-medium"}>
              {change12m >= 0 ? "▲" : "▼"} {PCT(Math.abs(change12m))}
            </span>
            {" · últimos 12 meses"}
            {inUSD && !privacy && <span className="text-dim"> · ≈ {COP(total)}</span>}
          </div>
        </div>
        <HeroSpark values={heroSpark} privacy={privacy} />
      </div>
    ),
    kpis: (
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {(config?.showStocks ?? true) && (
          <KpiCard
            label="Inversiones · bolsa"
            value={<Bal n={stockValue} privacy={privacy} />}
            sub={
              <span className={stockPL >= 0 ? "text-pos" : "text-neg"}>
                {stockPL >= 0 ? "↑ " : "↓ "}
                {privacy ? "••••" : COP(Math.abs(stockPL))} P/G sin realizar
              </span>
            }
          />
        )}
        {(config?.showCrypto ?? true) && (
          <KpiCard
            label="Cripto"
            value={<Bal n={cryptoValue} privacy={privacy} />}
            sub={
              <span className={cryptoPL >= 0 ? "text-pos" : "text-neg"}>
                {cryptoPL >= 0 ? "↑ " : "↓ "}
                {privacy ? "••••" : COP(Math.abs(cryptoPL))} P/G sin realizar
              </span>
            }
          />
        )}
        <KpiCard
          label="Efectivo y bancos"
          value={<Bal n={cash} privacy={privacy} />}
          sub={
            <div className="flex flex-col gap-0.5 mt-0.5">
              {liquidAccounts.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-2">
                  <span className="text-dim truncate">{a.name}</span>
                  <span className="text-dim tabular-nums shrink-0">
                    {privacy ? "••••" : COP(a.balance)}
                  </span>
                </div>
              ))}
              {hysBalance > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-dim">Alto rendimiento</span>
                  <span className="text-dim tabular-nums shrink-0">
                    {privacy ? "••••" : COP(hysBalance)}
                  </span>
                </div>
              )}
              {liquidAccounts.length === 0 && hysBalance === 0 && (
                <span className="text-dim">0 cuentas</span>
              )}
            </div>
          }
        />
        <KpiCard
          label={`Ingresos · ${monthLabel}`}
          value={<span className="text-pos"><Bal n={income} privacy={privacy} /></span>}
          sub={
            <span className="text-dim">
              Balance {privacy ? "••••" : COP(monthBalance)}
            </span>
          }
        />
        <KpiCard
          label={`Egresos · ${monthLabel}`}
          value={<span className="text-neg"><Bal n={expense} privacy={privacy} /></span>}
          sub={
            <span className="text-dim">
              {monthTx.filter((t) => t.type === "egreso").length} movimientos
            </span>
          }
        />
      </div>
    ),
    goals: <GoalsWidget goals={initialData.goals} privacy={privacy} onNav={onNav} />,
    chart: (
      <div className={`${cardBase} rounded-[18px] p-6`}>
        <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
          <div>
            <div className={sectionTitle}>Evolución del patrimonio</div>
            <div className="text-[12.5px] text-muted mt-0.5">Valor neto consolidado</div>
          </div>
          <Segmented options={["1M", "6M", "1A", "Todo"]} value={range} onChange={(v) => setRange(v as typeof range)} />
        </div>
        <NetWorthChart points={series} privacy={privacy} />
      </div>
    ),
    allocation: <PortfolioDonut privacy={privacy} total={stockValue + cryptoValue} holdings={holdings} cryptoAssets={cryptoAssets} />,
    cashflow: <IncomeExpenseBars privacy={privacy} transactions={transactions} />,
    recent: (
      <div className={`${cardBase} rounded-[18px] p-[22px]`}>
        <div className="flex items-center justify-between mb-3.5">
          <div className={sectionTitle}>Movimientos recientes</div>
          <button
            onClick={() => onNav("transactions")}
            className="bg-transparent border-none text-muted cursor-pointer text-[13px]"
          >
            Ver todas →
          </button>
        </div>
        <div className="flex flex-col">
          {transactions.slice(0, 6).map((t, i) => (
            <TxRow key={t.id} tx={t} privacy={privacy} first={i === 0} delay={i * 45} />
          ))}
        </div>
      </div>
    ),
  };

  // Render in configured order; pair allocation+cashflow side by side when adjacent
  const rendered: React.ReactNode[] = [];
  const PAIRABLE = ["allocation", "cashflow"];
  for (let i = 0; i < widgetOrder.length; i++) {
    const key = widgetOrder[i];
    const next = widgetOrder[i + 1];
    if (PAIRABLE.includes(key) && next && PAIRABLE.includes(next)) {
      rendered.push(
        <div key={key + next} className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {blocks[key]}
          {blocks[next]}
        </div>
      );
      i++;
    } else {
      rendered.push(<React.Fragment key={key}>{blocks[key]}</React.Fragment>);
    }
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {showRecap && recap && (
        <div className={`animate-card ${cardBase} rounded-[18px] p-[22px] relative`}>
          <button
            onClick={dismissRecap}
            className="absolute top-3.5 right-4 bg-transparent border-none text-dim cursor-pointer text-[18px] leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
          <div className={`${microLabel} mb-1`}>Tu mes en números</div>
          <div className="text-[17px] font-medium mb-3 capitalize" style={{ fontFamily: "Spectral, serif" }}>
            {recap.label}
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13px]">
            <span>Ingresos <span className="text-pos font-medium">{privacy ? "••••" : COP(recap.inc)}</span></span>
            <span>Egresos <span className="text-neg font-medium">{privacy ? "••••" : COP(recap.exp)}</span></span>
            <span>Balance <span className={`font-medium ${recap.net >= 0 ? "text-pos" : "text-neg"}`}>{privacy ? "••••" : COP(recap.net)}</span></span>
            {recap.topCat && (
              <span className="text-muted">Mayor gasto: <span className="text-fg">{recap.topCat[0]}</span>{privacy ? "" : ` (${COP(recap.topCat[1])})`}</span>
            )}
            <span className="text-muted">{recap.count} movimientos</span>
          </div>
        </div>
      )}

      {(insights.length > 0 || streak >= 3) && (
        <div className="animate-item flex flex-wrap gap-2">
          {streak >= 3 && (
            <span className="border border-line bg-panel rounded-full px-3.5 py-1.5 text-[12.5px]">
              🔥 {streak} días seguidos registrando
            </span>
          )}
          {insights.map((ins, i) => (
            <span key={i} className="border border-line bg-panel rounded-full px-3.5 py-1.5 text-[12.5px]">
              <span className={ins.tone === "pos" ? "text-pos" : "text-neg"}>{ins.icon}</span> {ins.text}
            </span>
          ))}
        </div>
      )}

      {rendered}
    </div>
  );
}

function GoalsWidget({ goals, privacy, onNav }: { goals: AllData["goals"]; privacy: boolean; onNav: (v: string) => void }) {
  const top = goals.slice(0, 3);
  return (
    <div className="border border-line bg-panel rounded-[18px] p-[22px]">
      <div className="flex items-center justify-between mb-3.5">
        <div className={sectionTitle}>Metas de ahorro</div>
        <button
          onClick={() => onNav("goals")}
          className="bg-transparent border-none text-muted cursor-pointer text-[13px]"
        >
          Ver todas →
        </button>
      </div>
      {top.length === 0 ? (
        <div className="text-[13px] text-muted">
          Sin metas aún.{" "}
          <button onClick={() => onNav("goals")} className="bg-transparent border-none text-fg underline cursor-pointer text-[13px] p-0">
            Crea la primera
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {top.map(g => {
            const pct = g.target > 0 ? Math.min(1, g.saved / g.target) : 0;
            const done = g.saved >= g.target;
            return (
              <div key={g.id}>
                <div className="flex justify-between text-[12.5px] mb-1.5">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-muted tabular-nums">
                    {privacy ? "••••" : `${(pct * 100).toFixed(0)}%`}
                  </span>
                </div>
                <div className="h-2 bg-panel2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full animate-bar"
                    style={{ width: `${pct * 100}%`, background: done ? "var(--pos)" : (g.color ?? "var(--line-accent)") }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <div className="animate-card border border-line bg-panel rounded-2xl px-5 py-[18px]">
      <div className={`${microLabel} mb-2.5`}>{label}</div>
      <div className={kpiValueClass} style={{ fontFamily: "Spectral, serif" }}>{value}</div>
      <div className="text-[12.5px] mt-1.5">{sub}</div>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-panel2 rounded-[10px] p-[3px] gap-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={[
            "border-none cursor-pointer px-[11px] py-[5px] rounded-[7px] text-[12px] font-medium",
            value === o ? "bg-accent text-accentFg" : "bg-transparent text-muted",
          ].join(" ")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function HeroSpark({ values, privacy }: { values: number[]; privacy: boolean }) {
  const W = 340;
  const H = 90;
  const pts = scalePoints(values, W, H, 12, 12);
  const line = catmullRomPath(pts);
  const area = areaPath(line, W, H);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: "100%", opacity: privacy ? 0.5 : 1 }}>
      <defs>
        <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--line-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--line-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#heroGrad)" suppressHydrationWarning />
      <path d={line} fill="none" stroke="var(--line-accent)" strokeWidth={2.2} suppressHydrationWarning />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill="var(--line-accent)" />
    </svg>
  );
}

const MO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
function ymLabel(ym: string) {
  const [yr, mo] = ym.split("-");
  return `${MO[+mo - 1]} '${yr.slice(2)}`;
}

function NetWorthChart({ points, privacy }: { points: { ym: string; value: number }[]; privacy: boolean }) {
  const values = points.map(p => p.value);
  const W = 800;
  const H = 260;
  const PAD_B = 28; // space for x-axis labels
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const pts = scalePoints(values, W, H - PAD_B, 30, 36);
  const line = catmullRomPath(pts);
  const area = areaPath(line, W, H - PAD_B);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const gridVals = [max, (max + min) / 2, min];
  const last = pts[pts.length - 1];

  // Pick ~6 evenly spaced x-axis labels, never overlapping (min 80px apart)
  const MIN_PX = 90;
  const labelIdxs = useMemo(() => {
    if (points.length <= 1) return [0];
    const step = Math.max(1, Math.ceil((points.length - 1) / Math.floor(W / MIN_PX)));
    const idxs: number[] = [];
    for (let i = 0; i < points.length; i += step) idxs.push(i);
    if (idxs[idxs.length - 1] !== points.length - 1) idxs.push(points.length - 1);
    return idxs;
  }, [points.length]);

  const onMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const svgX = ratio * W;
    // find nearest point
    let best = 0;
    let bestDist = Infinity;
    pts.forEach(([px], i) => {
      const d = Math.abs(px - svgX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setHoverIdx(best);
  };

  const hov = hoverIdx !== null ? hoverIdx : null;
  const hovPt = hov !== null ? pts[hov] : null;
  const hovVal = hov !== null ? values[hov] : null;
  const hovYM  = hov !== null ? points[hov].ym : null;

  // Tooltip box: keep it inside the SVG
  const TT_W = 130; const TT_H = 42;
  const ttX = hovPt ? Math.min(Math.max(hovPt[0] - TT_W / 2, 2), W - TT_W - 2) : 0;
  const ttY = hovPt ? Math.max(hovPt[1] - TT_H - 12, 4) : 0;

  return (
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--line-accent)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--line-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridVals.map((gv, i) => {
        const y = 30 + (i / 2) * (H - PAD_B - 66);
        return (
          <g key={i}>
            <line x1={0} y1={y} x2={W} y2={y} stroke="var(--line)" strokeDasharray="2 5" />
            {!privacy && (
              <text x={2} y={y - 5} fill="var(--dim)" fontSize={11} fontFamily="'IBM Plex Mono', monospace">
                {COPSHORT(gv)}
              </text>
            )}
          </g>
        );
      })}

      <path d={area} fill="url(#nwGrad)" suppressHydrationWarning />
      <path d={line} fill="none" stroke="var(--line-accent)" strokeWidth={2.4} suppressHydrationWarning />

      {/* Hover crosshair */}
      {hovPt && (
        <>
          <line x1={hovPt[0]} y1={30} x2={hovPt[0]} y2={H - PAD_B} stroke="var(--dim)" strokeWidth={1} strokeDasharray="3 3" />
          <circle cx={hovPt[0]} cy={hovPt[1]} r={9} fill="var(--line-accent)" opacity={0.15} />
          <circle cx={hovPt[0]} cy={hovPt[1]} r={4} fill="var(--line-accent)" />
          {/* Tooltip */}
          <rect x={ttX} y={ttY} width={TT_W} height={TT_H} rx={8} fill="var(--panel)" stroke="var(--line)" strokeWidth={1} />
          <text x={ttX + TT_W / 2} y={ttY + 15} textAnchor="middle" fill="var(--dim)" fontSize={11} fontFamily="'IBM Plex Mono', monospace">
            {hovYM ? ymLabel(hovYM) : ""}
          </text>
          <text x={ttX + TT_W / 2} y={ttY + 32} textAnchor="middle" fill="var(--fg)" fontSize={13} fontFamily="'IBM Plex Mono', monospace" fontWeight="500">
            {privacy ? "••••••" : (hovVal !== null ? COPSHORT(hovVal) : "")}
          </text>
        </>
      )}

      {/* Default end-dot when not hovering */}
      {hov === null && (
        <>
          <circle cx={last[0]} cy={last[1]} r={8} fill="var(--line-accent)" opacity={0.18} />
          <circle cx={last[0]} cy={last[1]} r={4} fill="var(--line-accent)" />
        </>
      )}

      {/* X-axis labels */}
      {labelIdxs.map((idx) => {
        const x = pts[idx][0];
        const anchor = idx === 0 ? "start" : idx === points.length - 1 ? "end" : "middle";
        return (
          <text key={idx} x={x} y={H - 6} fill="var(--dim)" fontSize={11} fontFamily="'IBM Plex Mono', monospace" textAnchor={anchor as "start" | "middle" | "end"}>
            {ymLabel(points[idx].ym)}
          </text>
        );
      })}

      {/* Invisible hover capture rect */}
      <rect
        x={0} y={0} width={W} height={H - PAD_B}
        fill="transparent"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ cursor: "crosshair" }}
      />
    </svg>
  );
}

function PortfolioDonut({ privacy, total, holdings, cryptoAssets }: { privacy: boolean; total: number; holdings: Asset[]; cryptoAssets: Asset[] }) {
  const assets = [...holdings, ...cryptoAssets];
  const R = 58;
  const CIRC = 2 * Math.PI * R;
  const totalVal = assets.reduce((s, a) => s + valueOf(a), 0);
  let acc = 0;
  const segs = assets
    .map((a, i) => {
      const pct = valueOf(a) / totalVal;
      const seg = { ticker: a.ticker, pct, color: DONUT_COLORS[i % DONUT_COLORS.length], offset: acc };
      acc += pct;
      return seg;
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 7);

  return (
    <div className="border border-line bg-panel rounded-[18px] p-[22px]">
      <div className={`${sectionTitle} mb-4`}>Asignación del portafolio</div>
      <div className="flex items-center gap-[22px] flex-wrap">
        <div className="relative w-[150px] h-[150px] shrink-0">
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={R} fill="none" stroke="var(--line)" strokeWidth={16} />
            {segs.map((s) => (
              <circle
                key={s.ticker}
                cx={75}
                cy={75}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={16}
                strokeDasharray={`${s.pct * CIRC} ${CIRC}`}
                strokeDashoffset={-s.offset * CIRC}
                transform="rotate(-90 75 75)"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[11px] text-dim">Total</div>
            <div className="text-[17px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
              {privacy ? "••••" : COPSHORT(total)}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {segs.map((s) => (
            <div key={s.ticker} className="flex items-center gap-2">
              <span className="w-[9px] h-[9px] rounded-[3px] shrink-0" style={{ background: s.color }} />
              <span className="text-[12px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.ticker}</span>
              <span className="ml-auto text-[12px] text-muted tabular-nums">
                {(s.pct * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IncomeExpenseBars({
  privacy,
  transactions,
}: {
  privacy: boolean;
  transactions: Transaction[];
}) {
  // Build last-6-months data from real transactions
  const data = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const ym = d.toISOString().slice(0, 7);
      const monthTxs = transactions.filter((t) => t.dateISO.startsWith(ym));
      const m = d.toLocaleDateString("es-CO", { month: "short" });
      return {
        m: m.charAt(0).toUpperCase() + m.slice(1, 3),
        inc: monthTxs.filter((t) => t.type === "ingreso").reduce((s, t) => s + t.amount, 0),
        exp: monthTxs.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);
  const maxV = Math.max(...data.flatMap((d) => [d.inc, d.exp]), 1);

  return (
    <div className="border border-line bg-panel rounded-[18px] p-[22px]">
      <div className="flex items-center justify-between mb-4">
        <div className={sectionTitle}>Ingresos vs. egresos</div>
        <div className="flex gap-3.5 text-[12px] text-muted">
          <span className="flex items-center gap-[5px]">
            <span className="w-2 h-2 rounded-[2px] bg-pos" /> Ingresos
          </span>
          <span className="flex items-center gap-[5px]">
            <span className="w-2 h-2 rounded-[2px] bg-neg" /> Egresos
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between h-[150px] gap-3.5">
        {data.map((d) => (
          <div key={d.m} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-end gap-1 h-[130px] w-full justify-center">
              <div
                className="w-[42%] max-w-[22px] bg-pos rounded-t-[3px]"
                style={{ height: `${(d.inc / maxV) * 100}%` }}
              />
              <div
                className="w-[42%] max-w-[22px] bg-neg rounded-t-[3px]"
                style={{ height: `${(d.exp / maxV) * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-dim" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{d.m}</div>
          </div>
        ))}
      </div>
      {privacy && (
        <div className="text-[11.5px] text-dim mt-1.5 text-center">Valores ocultos</div>
      )}
    </div>
  );
}

function TxRow({ tx, privacy, first, delay = 0 }: { tx: Transaction; privacy: boolean; first: boolean; delay?: number }) {
  const pos = tx.type === "ingreso";
  const d = new Date(tx.dateISO + "T00:00:00");
  const dateLabel = d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  return (
    <div
      className={`animate-item flex items-center gap-3 py-[11px] ${first ? "" : "border-t border-line"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-[34px] h-[34px] rounded-[9px] bg-panel2 border border-line flex items-center justify-center shrink-0 text-[15px] ${pos ? "text-pos" : "text-neg"}`}
      >
        {pos ? "↓" : "↑"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {tx.desc}
        </div>
        <div className="text-[12px] text-dim">
          {tx.category} · {tx.account}
        </div>
      </div>
      <div className="text-[12px] text-dim whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {dateLabel}
      </div>
      <div
        className={`tabular-nums text-[13px] font-medium whitespace-nowrap min-w-[90px] text-right ${pos ? "text-pos" : "text-neg"}`}
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {privacy ? "••••••" : `${pos ? "+" : "−"}${COP(tx.amount)}`}
      </div>
    </div>
  );
}
