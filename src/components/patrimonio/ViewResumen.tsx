"use client";

import React, { useMemo, useState } from "react";
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
import { toAssets, toTransactions, toAccounts } from "./transforms";

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

export default function ViewResumen({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const onNav = (v: string) => router.push(`/${v}`);
  const transactions = toTransactions(initialData.finances);
  const holdings = toAssets(initialData.stocks, initialData.prices);
  const cryptoAssets = toAssets(initialData.crypto, initialData.prices);
  const accounts = toAccounts(initialData);
  const [range, setRange] = useState<"1M" | "6M" | "1A" | "Todo">("1A");

  const stockValue = holdings.reduce((s, h) => s + valueOf(h), 0);
  const stockCost = holdings.reduce((s, h) => s + costOf(h), 0);
  const stockPL = stockValue - stockCost;

  const cryptoValue = cryptoAssets.reduce((s, c) => s + valueOf(c), 0);
  const cryptoCost = cryptoAssets.reduce((s, c) => s + costOf(c), 0);
  const cryptoPL = cryptoValue - cryptoCost;

  const cash = accounts.reduce((s, a) => s + a.balance, 0);
  const total = stockValue + cryptoValue + cash;

  // Filter transactions to current month
  const nowYM = new Date().toISOString().slice(0, 7);
  const monthTx = transactions.filter((t) => t.dateISO.startsWith(nowYM));

  const income = monthTx.filter((t) => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
  const monthBalance = income - expense;

  // Net-worth series (12 months) ending at total
  const series = useMemo(() => {
    const start = total * 0.72;
    const pts: number[] = [];
    for (let i = 0; i < 12; i++) {
      const base = start + (total - start) * (i / 11);
      const wobble = Math.sin(i * 1.7) * total * 0.012;
      pts.push(Math.round(base + wobble));
    }
    pts[11] = total;
    return pts;
  }, [total]);

  const heroSpark = useMemo(() => series.slice(), [series]);

  const monthLabel = new Date().toLocaleDateString("es-CO", { month: "long" });

  return (
    <div className="flex flex-col gap-[18px]">
      {/* A. Hero + KPI grid */}
      <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}
      >
        {/* Hero */}
        <div
          className={`${cardBase} [grid-column:1/-1] rounded-[18px] p-6 flex flex-wrap items-center justify-between gap-5`}
        >
          <div>
            <div className={`${microLabel} tracking-[0.04em]`}>Patrimonio total</div>
            <div
              className="font-medium tracking-[-0.02em] leading-[1.05] my-1.5 mb-2"
              style={{ fontFamily: "Spectral, serif", fontSize: "clamp(34px,5vw,52px)" }}
            >
              <Bal n={total} privacy={privacy} />
            </div>
            <div className="text-[13px] text-muted">
              <span className="text-pos font-medium">▲ {PCT(0.084)}</span>
              {" · últimos 12 meses"}
            </div>
          </div>
          <HeroSpark values={heroSpark} privacy={privacy} />
        </div>

        {/* KPIs */}
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
        <KpiCard
          label="Efectivo y bancos"
          value={<Bal n={cash} privacy={privacy} />}
          sub={<span className="text-dim">{accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}</span>}
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

      {/* B. Net worth chart */}
      <div className={`${cardBase} rounded-[18px] p-6`}>
        <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
          <div>
            <div className={sectionTitle}>Evolución del patrimonio</div>
            <div className="text-[12.5px] text-muted mt-0.5">
              Valor neto consolidado
            </div>
          </div>
          <Segmented options={["1M", "6M", "1A", "Todo"]} value={range} onChange={(v) => setRange(v as typeof range)} />
        </div>
        <NetWorthChart values={series} privacy={privacy} />
      </div>

      {/* C. Donut + bars */}
      <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        <PortfolioDonut privacy={privacy} total={stockValue + cryptoValue} holdings={holdings} cryptoAssets={cryptoAssets} />
        <IncomeExpenseBars privacy={privacy} transactions={transactions} />
      </div>

      {/* D. Recent transactions */}
      <div className={`${cardBase} rounded-[18px] p-[22px]`}>
        <div className="flex items-center justify-between mb-3.5">
          <div className={sectionTitle}>Movimientos recientes</div>
          <button
            onClick={() => onNav("transacciones")}
            className="bg-transparent border-none text-muted cursor-pointer text-[13px]"
          >
            Ver todas →
          </button>
        </div>
        <div className="flex flex-col">
          {transactions.slice(0, 6).map((t, i) => (
            <TxRow key={t.id} tx={t} privacy={privacy} first={i === 0} />
          ))}
        </div>
      </div>
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
    <div className="border border-line bg-panel rounded-2xl px-5 py-[18px]">
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
      <path d={area} fill="url(#heroGrad)" />
      <path d={line} fill="none" stroke="var(--line-accent)" strokeWidth={2.2} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill="var(--line-accent)" />
    </svg>
  );
}

function NetWorthChart({ values, privacy }: { values: number[]; privacy: boolean }) {
  const W = 800;
  const H = 250;
  const pts = scalePoints(values, W, H, 30, 40);
  const line = catmullRomPath(pts);
  const area = areaPath(line, W, H - 40);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const gridVals = [max, (max + min) / 2, min];
  const last = pts[pts.length - 1];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--line-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--line-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridVals.map((gv, i) => {
        const y = 30 + (i / 2) * (H - 70);
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

      <path d={area} fill="url(#nwGrad)" />
      <path d={line} fill="none" stroke="var(--line-accent)" strokeWidth={2.4} />
      <circle cx={last[0]} cy={last[1]} r={8} fill="var(--line-accent)" opacity={0.18} />
      <circle cx={last[0]} cy={last[1]} r={4} fill="var(--line-accent)" />

      {MONTHS.map((m, i) => {
        const x = (i / (MONTHS.length - 1)) * W;
        const anchor = i === 0 ? "start" : i === MONTHS.length - 1 ? "end" : "middle";
        return (
          <text
            key={m}
            x={x}
            y={H - 8}
            fill="var(--dim)"
            fontSize={11}
            fontFamily="'IBM Plex Mono', monospace"
            textAnchor={anchor as "start" | "middle" | "end"}
          >
            {m}
          </text>
        );
      })}
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

function TxRow({ tx, privacy, first }: { tx: Transaction; privacy: boolean; first: boolean }) {
  const pos = tx.type === "ingreso";
  const d = new Date(tx.dateISO + "T00:00:00");
  const dateLabel = d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  return (
    <div
      className={`flex items-center gap-3 py-[11px] ${first ? "" : "border-t border-line"}`}
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
