"use client";

import React, { useMemo, useState } from "react";
import type { AllData } from "../../types";
import { usePrivacy } from "./PrivacyContext";
import { useCurrency } from "./CurrencyContext";
import { COP, USD } from "../../data/mock";

// Resolución DIAN — UVT por año fiscal
const UVT: Record<number, number> = {
  2022: 38004,
  2023: 42412,
  2024: 47065,
  2025: 49799,
};

const PCT = (n: number) => (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const card = "border border-line bg-panel rounded-2xl p-5";
const microLabel = "text-[11px] tracking-[0.08em] uppercase text-dim font-medium";
const thCls = "text-[11.5px] tracking-[0.04em] uppercase text-dim font-medium text-left pb-2.5";
const tdCls = "py-2.5 border-t border-line text-[13px]";

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${color}`}>
      {children}
    </span>
  );
}

function KpiCard({ label, value, sub, color, note }: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
  note?: string;
}) {
  return (
    <div className={`${card} flex flex-col gap-1`}>
      <div className={microLabel}>{label}</div>
      <div className={`text-[24px] font-medium tabular-nums ${color ?? ""}`}>{value}</div>
      {sub && <div className="text-[12px] text-muted">{sub}</div>}
      {note && <div className="text-[11px] text-dim mt-0.5">{note}</div>}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="py-8 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-[14px] font-medium mb-1">{title}</div>
      <div className="text-[12.5px] text-muted max-w-sm mx-auto">{desc}</div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function csvDownload(filename: string, headers: string[], rows: string[][]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const content = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CsvButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Exportar CSV"
      className="h-[28px] px-2.5 rounded-lg border border-line bg-panel2 text-[11.5px] text-muted hover:text-fg cursor-pointer transition-colors flex items-center gap-1"
    >
      <DownloadIcon />
      CSV
    </button>
  );
}

export default function ViewFiscal({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const currency = useCurrency();
  const trm = initialData.config?.trm ?? null;
  const inUSD = currency === "USD" && !!trm;
  const fmt = (cop: number) => (inUSD ? USD(cop / trm!) : COP(cop));

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const years = useMemo(() => {
    const ys = new Set<number>();
    for (const t of initialData.transfers) {
      const y = Number(t.date.slice(0, 4));
      if (y >= 2020) ys.add(y);
    }
    for (const d of initialData.dividends) {
      const y = Number(d.date.slice(0, 4));
      if (y >= 2020) ys.add(y);
    }
    if (!ys.has(currentYear)) ys.add(currentYear);
    return Array.from(ys).sort((a, b) => b - a);
  }, [initialData.transfers, initialData.dividends, currentYear]);

  const prefix = String(year);
  const uvtValue = UVT[year] ?? null;

  // ── Ventas realizadas ─────────────────────────────────────────────────────
  const realizedSales = useMemo(() => {
    return initialData.transfers
      .filter(
        (t) =>
          t.date.startsWith(prefix) &&
          (t.fromAccountId.startsWith("stock:") || t.fromAccountId.startsWith("crypto:")) &&
          t.costBasis != null
      )
      .map((t) => ({
        ...t,
        kind: (t.fromAccountId.startsWith("stock:") ? "stock" : "crypto") as "stock" | "crypto",
        ticker: t.fromAccountId.startsWith("stock:") ? t.fromAccountId.slice(6) : t.fromAccountId.slice(7),
      }));
  }, [initialData.transfers, prefix]);

  const stockGain = realizedSales
    .filter((s) => s.kind === "stock")
    .reduce((sum, s) => sum + (s.amount - (s.costBasis ?? 0)), 0);

  const cryptoGain = realizedSales
    .filter((s) => s.kind === "crypto")
    .reduce((sum, s) => sum + (s.amount - (s.costBasis ?? 0)), 0);

  const totalGain = stockGain + cryptoGain;

  // Per-ticker summary
  const byTicker = useMemo(() => {
    const map = new Map<string, { kind: "stock" | "crypto"; ops: number; venta: number; costo: number }>();
    for (const s of realizedSales) {
      const prev = map.get(s.ticker) ?? { kind: s.kind, ops: 0, venta: 0, costo: 0 };
      map.set(s.ticker, {
        kind: s.kind,
        ops: prev.ops + 1,
        venta: prev.venta + s.amount,
        costo: prev.costo + (s.costBasis ?? 0),
      });
    }
    return Array.from(map.entries())
      .map(([ticker, v]) => ({ ticker, ...v, pl: v.venta - v.costo }))
      .sort((a, b) => b.pl - a.pl);
  }, [realizedSales]);

  // ── Dividendos ────────────────────────────────────────────────────────────
  const dividendsYear = useMemo(
    () => initialData.dividends.filter((d) => d.date.startsWith(prefix)),
    [initialData.dividends, prefix]
  );

  const totalDividendNeto = dividendsYear.reduce((s, d) => s + d.amount, 0);
  const totalDividendBruto = dividendsYear.reduce((s, d) => s + (d.grossAmount ?? d.amount), 0);
  const totalRetencion = dividendsYear.reduce((s, d) => s + (d.tax ?? 0) + (d.adminCost ?? 0), 0);

  const gravadosCount = dividendsYear.filter(
    (d) => (d.tax ?? 0) > 0 || (d.grossAmount != null && d.grossAmount > d.amount)
  ).length;
  const noGravadosCount = dividendsYear.length - gravadosCount;

  // ── Estimación tributaria (Art. E.T.) ─────────────────────────────────────
  // Ganancia ocasional: 15% sobre la ganancia neta (Art. 313 E.T.)
  const taxableGain = Math.max(0, totalGain);
  const estimatedTax = taxableGain * 0.15;

  // ── CSV exports ───────────────────────────────────────────────────────────
  const exportVentas = () => {
    csvDownload(
      `fiscal_ventas_${year}.csv`,
      ["Fecha", "Ticker", "Tipo", "Cantidad", "Precio Venta COP", "Costo Base COP", "P/G COP", "% P/G"],
      realizedSales.map((s) => {
        const pl = s.amount - (s.costBasis ?? 0);
        const pct = (s.costBasis ?? 0) > 0 ? ((pl / (s.costBasis ?? 1)) * 100).toFixed(2) : "0";
        return [
          s.date, s.ticker, s.kind === "stock" ? "Bolsa" : "Cripto",
          String(s.qty ?? ""), String(s.amount), String(s.costBasis ?? 0), String(pl), pct,
        ];
      })
    );
  };

  const exportDividendos = () => {
    csvDownload(
      `fiscal_dividendos_${year}.csv`,
      ["Fecha", "Ticker", "Tratamiento", "Bruto COP", "Retención COP", "Neto COP", "Nota"],
      dividendsYear.map((d) => {
        const retencion = (d.tax ?? 0) + (d.adminCost ?? 0);
        const isGravado = retencion > 0 || (d.grossAmount != null && d.grossAmount > d.amount);
        return [
          d.date, d.ticker, isGravado ? "Gravado" : "No gravado",
          String(d.grossAmount ?? d.amount), String(retencion), String(d.amount), d.note ?? "",
        ];
      })
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header + year picker */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[13px] text-muted">
            Ganancias realizadas y dividendos para tu declaración de renta.
          </div>
          <div className="text-[11px] text-dim mt-0.5">
            ⚠️ Solo informativo — consultá a tu contador para la declaración oficial.
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={[
                "h-7 px-3 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors",
                y === year
                  ? "bg-accent text-accentFg border-accent"
                  : "border-line bg-panel2 text-muted hover:text-fg",
              ].join(" ")}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <KpiCard
          label="P/G total realizado"
          value={privacy ? "••••" : fmt(Math.abs(totalGain))}
          sub={totalGain >= 0 ? "ganancia neta" : "pérdida neta"}
          color={totalGain >= 0 ? "text-pos" : "text-neg"}
        />
        <KpiCard
          label="Acciones BVC"
          value={privacy ? "••••" : fmt(Math.abs(stockGain))}
          sub={`${realizedSales.filter((s) => s.kind === "stock").length} op${realizedSales.filter((s) => s.kind === "stock").length !== 1 ? "s" : ""}`}
          color={stockGain >= 0 ? "text-pos" : "text-neg"}
        />
        <KpiCard
          label="Cripto"
          value={privacy ? "••••" : fmt(Math.abs(cryptoGain))}
          sub={`${realizedSales.filter((s) => s.kind === "crypto").length} op${realizedSales.filter((s) => s.kind === "crypto").length !== 1 ? "s" : ""}`}
          color={cryptoGain >= 0 ? "text-pos" : "text-neg"}
        />
        <KpiCard
          label="Dividendos brutos"
          value={privacy ? "••••" : fmt(totalDividendBruto)}
          sub={`${dividendsYear.length} pago${dividendsYear.length !== 1 ? "s" : ""} · ret. ${privacy ? "••••" : fmt(totalRetencion)}`}
        />
      </div>

      {/* Estimación tributaria */}
      {(taxableGain > 0 || dividendsYear.length > 0) && (
        <div className={card}>
          <div className="flex items-center gap-2 mb-4">
            <div className="text-[13.5px] font-medium">Estimación tributaria</div>
            <Pill color="bg-amber-500/15 text-amber-500">Estimado · no oficial</Pill>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))" }}>
            {taxableGain > 0 && (
              <div className="bg-panel2 rounded-xl p-4 flex flex-col gap-1">
                <div className={microLabel}>Impuesto ganancia ocasional</div>
                <div className="text-[22px] font-medium tabular-nums text-neg">
                  {privacy ? "••••" : fmt(estimatedTax)}
                </div>
                <div className="text-[11px] text-dim">
                  15% sobre {privacy ? "••••" : fmt(taxableGain)} · Art. 313 E.T.
                </div>
                {stockGain > 0 && (
                  <div className="text-[11px] text-amber-500 mt-0.5">
                    Acciones BVC: verificá exención Art. 36-1 con tu contador
                  </div>
                )}
              </div>
            )}
            {dividendsYear.length > 0 && (
              <div className="bg-panel2 rounded-xl p-4 flex flex-col gap-1">
                <div className={microLabel}>Retención dividendos ya pagada</div>
                <div className="text-[22px] font-medium tabular-nums text-muted">
                  {privacy ? "••••" : (totalRetencion > 0 ? fmt(totalRetencion) : "—")}
                </div>
                <div className="text-[11px] text-dim">
                  {gravadosCount} gravado{gravadosCount !== 1 ? "s" : ""} · {noGravadosCount} no gravado{noGravadosCount !== 1 ? "s" : ""}
                </div>
              </div>
            )}
            {uvtValue && (
              <div className="bg-panel2 rounded-xl p-4 flex flex-col gap-1">
                <div className={microLabel}>UVT {year}</div>
                <div className="text-[22px] font-medium tabular-nums">{COP(uvtValue)}</div>
                <div className="text-[11px] text-dim">
                  3.000 UVT = {COP(uvtValue * 3000)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Por activo */}
      {byTicker.length > 0 && (
        <div className={card}>
          <div className="text-[13.5px] font-medium mb-3">Resumen por activo</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-120">
              <thead>
                <tr>
                  <th className={thCls}>Activo</th>
                  <th className={`${thCls} pl-4`}>Tipo</th>
                  <th className={`${thCls} pl-4 text-right`}>Ops</th>
                  <th className={`${thCls} pl-4 text-right`}>Ingresos venta</th>
                  <th className={`${thCls} pl-4 text-right`}>Costo base</th>
                  <th className={`${thCls} pl-4 text-right`}>P/G</th>
                  <th className={`${thCls} pl-4 text-right`}>%</th>
                </tr>
              </thead>
              <tbody>
                {byTicker.map((row) => {
                  const plPct = row.costo > 0 ? row.pl / row.costo : 0;
                  const pos = row.pl >= 0;
                  return (
                    <tr key={row.ticker}>
                      <td className={`${tdCls} font-semibold`} style={mono}>{row.ticker}</td>
                      <td className={`${tdCls} pl-4`}>
                        <Pill color={row.kind === "stock" ? "bg-accent/20 text-accent" : "bg-purple-500/20 text-purple-400"}>
                          {row.kind === "stock" ? "Bolsa" : "Cripto"}
                        </Pill>
                      </td>
                      <td className={`${tdCls} pl-4 text-right text-muted`} style={mono}>{row.ops}</td>
                      <td className={`${tdCls} pl-4 text-right`} style={mono}>{privacy ? "••••" : fmt(row.venta)}</td>
                      <td className={`${tdCls} pl-4 text-right text-muted`} style={mono}>{privacy ? "••••" : fmt(row.costo)}</td>
                      <td className={`${tdCls} pl-4 text-right font-medium ${pos ? "text-pos" : "text-neg"}`} style={mono}>
                        {privacy ? "••••" : `${pos ? "+" : ""}${fmt(row.pl)}`}
                      </td>
                      <td className={`${tdCls} pl-4 text-right ${pos ? "text-pos" : "text-neg"}`} style={mono}>
                        {PCT(plPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="pt-3 text-[12px] text-dim font-medium">Total</td>
                  <td className={`pt-3 text-right text-[13px] font-semibold ${totalGain >= 0 ? "text-pos" : "text-neg"}`} style={mono}>
                    {privacy ? "••••" : `${totalGain >= 0 ? "+" : ""}${fmt(totalGain)}`}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Ventas realizadas */}
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13.5px] font-medium">Ventas realizadas</div>
          <div className="flex items-center gap-2">
            {realizedSales.length > 0 && (
              <>
                <span className="text-[12px] text-muted">
                  {realizedSales.length} op{realizedSales.length !== 1 ? "s" : ""}
                </span>
                <CsvButton onClick={exportVentas} />
              </>
            )}
          </div>
        </div>
        {realizedSales.length === 0 ? (
          <EmptyState
            icon="📊"
            title="Sin ventas en este período"
            desc="Las ventas de acciones y cripto que registres aparecerán aquí con su ganancia o pérdida."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160">
              <thead>
                <tr>
                  <th className={thCls}>Fecha</th>
                  <th className={`${thCls} pl-4`}>Activo</th>
                  <th className={`${thCls} pl-4`}>Tipo</th>
                  <th className={`${thCls} pl-4 text-right`}>Qty</th>
                  <th className={`${thCls} pl-4 text-right`}>Ingreso venta</th>
                  <th className={`${thCls} pl-4 text-right`}>Costo base</th>
                  <th className={`${thCls} pl-4 text-right`}>P/G</th>
                  <th className={`${thCls} pl-4 text-right`}>%</th>
                </tr>
              </thead>
              <tbody>
                {realizedSales.map((s) => {
                  const pl = s.amount - (s.costBasis ?? 0);
                  const plPct = (s.costBasis ?? 0) > 0 ? pl / (s.costBasis ?? 1) : 0;
                  const pos = pl >= 0;
                  return (
                    <tr key={s.id}>
                      <td className={`${tdCls} text-dim`} style={mono}>{s.date}</td>
                      <td className={`${tdCls} pl-4 font-semibold`} style={mono}>{s.ticker}</td>
                      <td className={`${tdCls} pl-4`}>
                        <Pill color={s.kind === "stock" ? "bg-accent/20 text-accent" : "bg-purple-500/20 text-purple-400"}>
                          {s.kind === "stock" ? "Bolsa" : "Cripto"}
                        </Pill>
                      </td>
                      <td className={`${tdCls} pl-4 text-right`} style={mono}>
                        {s.qty == null ? "—" : s.qty % 1 === 0 ? s.qty.toLocaleString("es-CO") : s.qty.toFixed(6)}
                      </td>
                      <td className={`${tdCls} pl-4 text-right`} style={mono}>{privacy ? "••••" : fmt(s.amount)}</td>
                      <td className={`${tdCls} pl-4 text-right text-muted`} style={mono}>{privacy ? "••••" : fmt(s.costBasis ?? 0)}</td>
                      <td className={`${tdCls} pl-4 text-right ${pos ? "text-pos" : "text-neg"}`} style={mono}>
                        {privacy ? "••••" : `${pos ? "+" : ""}${fmt(pl)}`}
                      </td>
                      <td className={`${tdCls} pl-4 text-right ${pos ? "text-pos" : "text-neg"}`} style={mono}>
                        {PCT(plPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="pt-3 text-[12px] text-dim font-medium">Total P/G</td>
                  <td className={`pt-3 text-right text-[13px] font-semibold ${totalGain >= 0 ? "text-pos" : "text-neg"}`} style={mono}>
                    {privacy ? "••••" : `${totalGain >= 0 ? "+" : ""}${fmt(totalGain)}`}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Dividendos */}
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13.5px] font-medium">Dividendos</div>
          <div className="flex items-center gap-2">
            {dividendsYear.length > 0 && (
              <>
                <span className="text-[12px] text-muted">Neto: {privacy ? "••••" : fmt(totalDividendNeto)}</span>
                <CsvButton onClick={exportDividendos} />
              </>
            )}
          </div>
        </div>
        {dividendsYear.length === 0 ? (
          <EmptyState
            icon="💰"
            title="Sin dividendos en este período"
            desc="Registrá los pagos de dividendos desde la vista de Inversiones."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-100">
              <thead>
                <tr>
                  <th className={thCls}>Fecha</th>
                  <th className={`${thCls} pl-4`}>Ticker</th>
                  <th className={`${thCls} pl-4`}>Tratamiento</th>
                  <th className={`${thCls} pl-4 text-right`}>Bruto</th>
                  <th className={`${thCls} pl-4 text-right`}>Retención</th>
                  <th className={`${thCls} pl-4 text-right`}>Neto</th>
                  <th className={`${thCls} pl-4`}>Nota</th>
                </tr>
              </thead>
              <tbody>
                {dividendsYear.map((d) => {
                  const retencion = (d.tax ?? 0) + (d.adminCost ?? 0);
                  const isGravado = retencion > 0 || (d.grossAmount != null && d.grossAmount > d.amount);
                  return (
                    <tr key={d.id}>
                      <td className={`${tdCls} text-dim`} style={mono}>{d.date}</td>
                      <td className={`${tdCls} pl-4 font-semibold`} style={mono}>{d.ticker}</td>
                      <td className={`${tdCls} pl-4`}>
                        <Pill color={isGravado ? "bg-amber-500/15 text-amber-500" : "bg-teal-500/15 text-teal-500"}>
                          {isGravado ? "Gravado" : "No gravado"}
                        </Pill>
                      </td>
                      <td className={`${tdCls} pl-4 text-right text-muted`} style={mono}>
                        {d.grossAmount != null ? (privacy ? "••••" : fmt(d.grossAmount)) : "—"}
                      </td>
                      <td className={`${tdCls} pl-4 text-right text-neg`} style={mono}>
                        {retencion > 0 ? (privacy ? "••••" : fmt(retencion)) : "—"}
                      </td>
                      <td className={`${tdCls} pl-4 text-right text-pos`} style={mono}>
                        {privacy ? "••••" : fmt(d.amount)}
                      </td>
                      <td className={`${tdCls} pl-4 text-dim text-[12px] max-w-40 truncate`}>{d.note ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-[12px] text-dim font-medium">Total</td>
                  <td className="pt-3 text-right text-[13px] font-semibold text-muted" style={mono}>
                    {privacy ? "••••" : fmt(totalDividendBruto)}
                  </td>
                  <td className="pt-3 text-right text-[13px] font-semibold text-neg" style={mono}>
                    {totalRetencion > 0 ? (privacy ? "••••" : fmt(totalRetencion)) : "—"}
                  </td>
                  <td className="pt-3 text-right text-[13px] font-semibold text-pos" style={mono}>
                    {privacy ? "••••" : fmt(totalDividendNeto)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Nota legal DIAN */}
      <div className="border border-line/60 bg-panel2 rounded-xl p-4 text-[12px] text-muted leading-relaxed">
        <strong className="text-fg">Colombia — referencia E.T.:</strong>{" "}
        Ganancias en acciones y cripto se gravan como <em>ganancia ocasional</em> al <strong>15%</strong> (Art. 313).
        Acciones BVC: puede aplicar exención del Art. 36-1 — confirmalo con tu contador.
        Dividendos <em>gravados</em>: la retención del 10% se descuenta en la fuente (Art. 343).
        Dividendos <em>no gravados</em>: la empresa ya tributó el 35% — no se incluyen como renta del accionista.
        Esta estimación es orientativa y no reemplaza la asesoría de un contador certificado.
      </div>
    </div>
  );
}
