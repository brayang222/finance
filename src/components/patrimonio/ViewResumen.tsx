import React, { useMemo, useState } from "react";
import {
  ACCOUNTS,
  HOLDINGS,
  CRYPTO,
  Transaction,
  COP,
  COPSHORT,
  PCT,
} from "../../data/mock";
import {
  View,
  Bal,
  catmullRomPath,
  areaPath,
  scalePoints,
  DONUT_COLORS,
} from "./utils";

const cardBase: React.CSSProperties = {
  border: "1px solid var(--line)",
  background: "var(--panel)",
};

const microLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--dim)",
  fontWeight: 500,
};

const kpiValue: React.CSSProperties = {
  fontFamily: "Spectral, serif",
  fontSize: 27,
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums",
};

const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 500 };

function valueOf(asset: { qty: number; price: number }) {
  return asset.qty * asset.price;
}
function costOf(asset: { qty: number; avg: number }) {
  return asset.qty * asset.avg;
}

const MONTHS = ["Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun"];

export default function ViewResumen({
  privacy,
  onNav,
  transactions,
}: {
  privacy: boolean;
  onNav: (v: View) => void;
  transactions: Transaction[];
}) {
  const [range, setRange] = useState<"1M" | "6M" | "1A" | "Todo">("1A");

  const stockValue = HOLDINGS.reduce((s, h) => s + valueOf(h), 0);
  const stockCost = HOLDINGS.reduce((s, h) => s + costOf(h), 0);
  const stockPL = stockValue - stockCost;

  const cryptoValue = CRYPTO.reduce((s, c) => s + valueOf(c), 0);
  const cryptoCost = CRYPTO.reduce((s, c) => s + costOf(c), 0);
  const cryptoPL = cryptoValue - cryptoCost;

  const cash = ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const total = stockValue + cryptoValue + cash;

  const income = transactions.filter((t) => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* A. Hero + KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
        }}
      >
        {/* Hero */}
        <div
          style={{
            ...cardBase,
            gridColumn: "1 / -1",
            borderRadius: 18,
            padding: 24,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div>
            <div style={{ ...microLabel, letterSpacing: "0.04em" }}>Patrimonio total</div>
            <div
              style={{
                fontFamily: "Spectral, serif",
                fontSize: "clamp(34px,5vw,52px)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                margin: "6px 0 8px",
              }}
            >
              <Bal n={total} privacy={privacy} />
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              <span style={{ color: "var(--pos)", fontWeight: 500 }}>▲ {PCT(0.084)}</span>
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
            <span style={{ color: stockPL >= 0 ? "var(--pos)" : "var(--neg)" }}>
              {stockPL >= 0 ? "↑ " : "↓ "}
              {privacy ? "••••" : COP(Math.abs(stockPL))} P/G sin realizar
            </span>
          }
        />
        <KpiCard
          label="Cripto"
          value={<Bal n={cryptoValue} privacy={privacy} />}
          sub={
            <span style={{ color: cryptoPL >= 0 ? "var(--pos)" : "var(--neg)" }}>
              {cryptoPL >= 0 ? "↑ " : "↓ "}
              {privacy ? "••••" : COP(Math.abs(cryptoPL))} P/G sin realizar
            </span>
          }
        />
        <KpiCard
          label="Efectivo y bancos"
          value={<Bal n={cash} privacy={privacy} />}
          sub={<span style={{ color: "var(--dim)" }}>{ACCOUNTS.length} cuentas</span>}
        />
        <KpiCard
          label="Ingresos · junio"
          value={<span style={{ color: "var(--pos)" }}><Bal n={income} privacy={privacy} /></span>}
          sub={
            <span style={{ color: "var(--dim)" }}>
              Balance {privacy ? "••••" : COP(monthBalance)}
            </span>
          }
        />
        <KpiCard
          label="Egresos · junio"
          value={<span style={{ color: "var(--neg)" }}><Bal n={expense} privacy={privacy} /></span>}
          sub={
            <span style={{ color: "var(--dim)" }}>
              {transactions.filter((t) => t.type === "egreso").length} movimientos
            </span>
          }
        />
      </div>

      {/* B. Net worth chart */}
      <div style={{ ...cardBase, borderRadius: 18, padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div>
            <div style={sectionTitle}>Evolución del patrimonio</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
              Valor neto consolidado
            </div>
          </div>
          <Segmented options={["1M", "6M", "1A", "Todo"]} value={range} onChange={(v) => setRange(v as typeof range)} />
        </div>
        <NetWorthChart values={series} privacy={privacy} />
      </div>

      {/* C. Donut + bars */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 14,
        }}
      >
        <PortfolioDonut privacy={privacy} total={stockValue + cryptoValue} />
        <IncomeExpenseBars privacy={privacy} income={income} expense={expense} />
      </div>

      {/* D. Recent transactions */}
      <div style={{ ...cardBase, borderRadius: 18, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={sectionTitle}>Movimientos recientes</div>
          <button
            onClick={() => onNav("transacciones")}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Ver todas →
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
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
    <div style={{ ...cardBase, borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ ...microLabel, marginBottom: 10 }}>{label}</div>
      <div style={kpiValue}>{value}</div>
      <div style={{ fontSize: 12.5, marginTop: 6 }}>{sub}</div>
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
    <div style={{ display: "flex", background: "var(--panel2)", borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{
            border: "none",
            cursor: "pointer",
            padding: "5px 11px",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            background: value === o ? "var(--accent)" : "transparent",
            color: value === o ? "var(--accentFg)" : "var(--muted)",
          }}
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

function PortfolioDonut({ privacy, total }: { privacy: boolean; total: number }) {
  const assets = [...HOLDINGS, ...CRYPTO];
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
    <div style={{ ...cardBase, borderRadius: 18, padding: 22 }}>
      <div style={{ ...sectionTitle, marginBottom: 16 }}>Asignación del portafolio</div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--dim)" }}>Total</div>
            <div style={{ fontFamily: "Spectral, serif", fontSize: 17, fontWeight: 500 }}>
              {privacy ? "••••" : COPSHORT(total)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 }}>
          {segs.map((s) => (
            <div key={s.ticker} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{s.ticker}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "var(--muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
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
  income,
  expense,
}: {
  privacy: boolean;
  income: number;
  expense: number;
}) {
  // last 6 months, current = actual totals
  const data = [
    { m: "Ene", inc: income * 0.9, exp: expense * 0.95 },
    { m: "Feb", inc: income * 0.94, exp: expense * 1.05 },
    { m: "Mar", inc: income * 1.02, exp: expense * 0.88 },
    { m: "Abr", inc: income * 0.97, exp: expense * 1.1 },
    { m: "May", inc: income * 1.05, exp: expense * 0.92 },
    { m: "Jun", inc: income, exp: expense },
  ];
  const maxV = Math.max(...data.flatMap((d) => [d.inc, d.exp]));

  return (
    <div style={{ ...cardBase, borderRadius: 18, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={sectionTitle}>Ingresos vs. egresos</div>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--pos)" }} /> Ingresos
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--neg)" }} /> Egresos
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 150, gap: 14 }}>
        {data.map((d) => (
          <div key={d.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130, width: "100%", justifyContent: "center" }}>
              <div
                style={{
                  width: "42%",
                  maxWidth: 22,
                  height: `${(d.inc / maxV) * 100}%`,
                  background: "var(--pos)",
                  borderRadius: "3px 3px 0 0",
                }}
              />
              <div
                style={{
                  width: "42%",
                  maxWidth: 22,
                  height: `${(d.exp / maxV) * 100}%`,
                  background: "var(--neg)",
                  borderRadius: "3px 3px 0 0",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono', monospace" }}>{d.m}</div>
          </div>
        ))}
      </div>
      {privacy && (
        <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 6 }}>Valores ocultos</div>
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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 0",
        borderTop: first ? "none" : "1px solid var(--line)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "var(--panel2)",
          border: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: pos ? "var(--pos)" : "var(--neg)",
          flexShrink: 0,
          fontSize: 15,
        }}
      >
        {pos ? "↓" : "↑"}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tx.desc}
        </div>
        <div style={{ fontSize: 12, color: "var(--dim)" }}>
          {tx.category} · {tx.account}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--dim)", whiteSpace: "nowrap", fontFamily: "'IBM Plex Mono', monospace" }}>
        {dateLabel}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontVariantNumeric: "tabular-nums",
          fontSize: 13,
          fontWeight: 500,
          color: pos ? "var(--pos)" : "var(--neg)",
          whiteSpace: "nowrap",
          minWidth: 90,
          textAlign: "right",
        }}
      >
        {privacy ? "••••••" : `${pos ? "+" : "−"}${COP(tx.amount)}`}
      </div>
    </div>
  );
}
