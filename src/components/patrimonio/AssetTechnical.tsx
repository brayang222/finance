"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Segmented } from "./utils";
import PriceChart, { type EmaConfig, type Drawing, type DrawingTool } from "./PriceChart";
import { saveChartEmaConfig, loadChartDrawings, addChartDrawing, deleteChartDrawing, clearChartDrawings } from "../../../lib/actions";

type Snapshot = {
  date: string;
  price?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  changeDayPct?: number;
  changeWeekPct?: number;
  changeMonthPct?: number;
  changeYearPct?: number;
  ema8?: number;
  ema34?: number;
  ema200?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMid?: number;
  bbLower?: number;
};

type LookupSeries = {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  realBarCount?: number;
  totalBarCount?: number;
  series: { dates: string[]; open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[]; volume: (number | null)[] };
  indicators: { ema8: (number | null)[]; ema34: (number | null)[]; ema200: (number | null)[]; rsi14: (number | null)[] };
  latest?: Snapshot;
  asOf?: Snapshot;
};

const fmt = (v?: number, digits = 2) =>
  typeof v === "number" ? v.toLocaleString("es-CO", { maximumFractionDigits: digits }) : "—";

const fmtPct = (v?: number) => (typeof v === "number" ? `${v >= 0 ? "+" : ""}${(v * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })}%` : "—");

function rsiRead(v?: number) {
  if (typeof v !== "number") return null;
  if (v >= 70) return { label: "Sobrecompra", color: "text-neg", bg: "bg-neg/10" };
  if (v <= 30) return { label: "Sobreventa", color: "text-pos", bg: "bg-pos/10" };
  return { label: "Neutral", color: "text-muted", bg: "bg-panel2" };
}

function trendRead(price?: number, ema34?: number, ema200?: number) {
  if (typeof price !== "number" || typeof ema34 !== "number" || typeof ema200 !== "number") return null;
  if (price > ema34 && ema34 > ema200) return { label: "Tendencia alcista", color: "text-pos", bg: "bg-pos/10" };
  if (price < ema34 && ema34 < ema200) return { label: "Tendencia bajista", color: "text-neg", bg: "bg-neg/10" };
  return { label: "Sin tendencia clara", color: "text-muted", bg: "bg-panel2" };
}

function VariationPill({ label, value }: { label: string; value?: number }) {
  const known = typeof value === "number";
  const up = known && value! >= 0;
  const cls = !known ? "bg-panel2 text-dim" : up ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg";
  return (
    <div className={`rounded-full px-3 py-1.5 text-[12px] font-medium tabular-nums whitespace-nowrap ${cls}`}>
      <span className="opacity-70 mr-1">{label}</span>{fmtPct(value)}
    </div>
  );
}

function StatTile({ label, value, valueClass, sub }: { label: string; value: React.ReactNode; valueClass?: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel2/50 px-3.5 py-3">
      <div className="text-[10.5px] tracking-[0.06em] uppercase text-dim font-medium mb-1.5">{label}</div>
      <div
        className={`text-[15px] font-medium tabular-nums ${valueClass ?? "text-fg"}`}
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AssetTechnical({
  ticker, kind, purchaseDate, emaConfig,
}: {
  ticker: string;
  kind: "stock" | "crypto";
  purchaseDate?: string;
  emaConfig?: EmaConfig[] | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<LookupSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"Actual" | "En tu compra">("Actual");
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ ticker, kind, series: "1" });
    if (purchaseDate) params.set("at", purchaseDate);
    fetch(`/api/stocks/lookup?${params.toString()}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "No se pudo obtener el histórico técnico");
        if (!cancelled) setData(json);
      })
      .catch((e) => { if (!cancelled) setError(e.message ?? "Error al cargar datos técnicos"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticker, kind, purchaseDate]);

  // Drawings are per-ticker, persisted in ChartDrawing — reload whenever the
  // ticker changes; adds/deletes update local state right away (optimistic)
  // and persist in the background.
  useEffect(() => {
    let cancelled = false;
    loadChartDrawings(ticker).then(rows => { if (!cancelled) setDrawings(rows as Drawing[]); }).catch(() => {});
    return () => { cancelled = true; };
  }, [ticker]);

  const handleAddDrawing = async (kindDrawn: DrawingTool, drawData: Drawing["data"]) => {
    const tempId = `pending-${Date.now()}`;
    setDrawings(list => [...list, { id: tempId, kind: kindDrawn, data: drawData }]);
    try {
      const id = await addChartDrawing(ticker, kindDrawn, drawData);
      setDrawings(list => list.map(d => (d.id === tempId ? { ...d, id } : d)));
    } catch {
      setDrawings(list => list.filter(d => d.id !== tempId));
    }
  };
  const handleDeleteDrawing = (id: string) => {
    setDrawings(list => list.filter(d => d.id !== id));
    deleteChartDrawing(id).catch(() => {});
  };
  const handleClearDrawings = () => {
    setDrawings([]);
    clearChartDrawings(ticker).catch(() => {});
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-dim py-6 justify-center">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-line border-t-accent animate-spin" />
        Cargando datos técnicos…
      </div>
    );
  }
  if (error) return <div className="text-[13px] text-neg">{error}</div>;
  if (!data) return null;

  const snap = mode === "Actual" ? data.latest : (data.asOf ?? data.latest);
  const rsi = rsiRead(snap?.rsi14);
  const trend = trendRead(snap?.price, snap?.ema34, snap?.ema200);

  // EMA config is a per-account preference (UserConfig.chartEmaConfig), not
  // browser localStorage — persist it there and refresh so a reload / other
  // device picks up the change instead of the page's server-fetched default.
  const handleEmaConfigChange = async (emas: EmaConfig[]) => {
    await saveChartEmaConfig(emas);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[13px] text-dim">
          {data.name} <span className="text-dim/70">·</span> <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{data.symbol}</span>
          {data.exchange ? ` · ${data.exchange}` : ""}
        </div>
        {purchaseDate && (
          <Segmented options={["Actual", "En tu compra"]} value={mode} onChange={(v) => setMode(v as any)} />
        )}
      </div>

      {typeof data.realBarCount === "number" && data.realBarCount < 30 && (
        <div className="rounded-xl border border-line bg-panel2/60 px-4 py-3 text-[12px] text-dim leading-relaxed">
          <span className="text-amber-400 font-medium">⚠ Muy poco historial de trading real. </span>
          {data.symbol} solo tiene {data.realBarCount} día{data.realBarCount === 1 ? "" : "s"} con operaciones
          reales registradas de {data.totalBarCount} consultados — el resto son sesiones sin volumen que la fuente
          gratuita (Yahoo Finance) tampoco tiene precio de referencia para. El gráfico solo muestra esas{" "}
          {data.realBarCount} vela{data.realBarCount === 1 ? "" : "s"} reales, sin relleno artificial. Los
          indicadores que necesitan más historial (EMA34/200, RSI, MACD, Bollinger) quedarán en "—" hasta que haya
          suficientes días reales para calcularlos — eso es lo honesto con lo que realmente se negoció, no un error.
        </div>
      )}

      {snap && (
        <div className="flex flex-col gap-4">
          {/* Hero: price + variations */}
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <div className="text-[11px] text-dim uppercase tracking-[0.06em] mb-1">
                {mode === "En tu compra" ? `Al ${snap.date} · fecha de tu primera compra` : `Hoy · ${snap.date}`}
              </div>
              <div className="text-[30px] font-medium tabular-nums" style={{ fontFamily: "Spectral, serif" }}>
                {fmt(snap.price, 4)}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <VariationPill label="Día" value={snap.changeDayPct} />
              <VariationPill label="Semana" value={snap.changeWeekPct} />
              <VariationPill label="Mes" value={snap.changeMonthPct} />
              <VariationPill label="Año" value={snap.changeYearPct} />
            </div>
          </div>

          {/* Trend + RSI badges */}
          <div className="flex gap-2 flex-wrap">
            {trend && (
              <div className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${trend.bg} ${trend.color}`}>
                {trend.label}
              </div>
            )}
            {rsi && (
              <div className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${rsi.bg} ${rsi.color}`}>
                RSI {fmt(snap.rsi14)} · {rsi.label}
              </div>
            )}
          </div>

          {/* Stat grid */}
          <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
            <StatTile label="Rango día" value={`${fmt(snap.dayLow, 4)} – ${fmt(snap.dayHigh, 4)}`} />
            <StatTile label="Rango 52 sem." value={`${fmt(snap.fiftyTwoWeekLow, 4)} – ${fmt(snap.fiftyTwoWeekHigh, 4)}`} />
            <StatTile label="Volumen" value={fmt(snap.volume, 0)} />
            <StatTile label="EMA8" value={fmt(snap.ema8, 4)} valueClass="text-[#f5b642]" />
            <StatTile label="EMA34" value={fmt(snap.ema34, 4)} valueClass="text-[#5b9bd5]" />
            <StatTile label="EMA200" value={fmt(snap.ema200, 4)} valueClass="text-[#b565d9]" />
            <StatTile label="MACD" value={fmt(snap.macd, 3)} />
            <StatTile label="Señal MACD" value={fmt(snap.macdSignal, 3)} />
            <StatTile
              label="Histograma MACD"
              value={fmt(snap.macdHistogram, 3)}
              valueClass={typeof snap.macdHistogram === "number" ? (snap.macdHistogram >= 0 ? "text-pos" : "text-neg") : undefined}
            />
            <StatTile label="Bollinger inf." value={fmt(snap.bbLower, 4)} />
            <StatTile label="Bollinger media" value={fmt(snap.bbMid, 4)} />
            <StatTile label="Bollinger sup." value={fmt(snap.bbUpper, 4)} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="text-[11.5px] tracking-[0.08em] uppercase text-dim font-medium">Gráfico</div>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <PriceChart
            series={data.series}
            rsi14={data.indicators.rsi14}
            highlightDate={purchaseDate}
            initialEmaConfig={emaConfig}
            onEmaConfigChange={handleEmaConfigChange}
            drawings={drawings}
            onAddDrawing={handleAddDrawing}
            onDeleteDrawing={handleDeleteDrawing}
            onClearDrawings={handleClearDrawings}
          />
        </div>
      </div>

      <div className="text-[11px] text-dim leading-relaxed">
        Datos técnicos de referencia (Yahoo Finance), no constituyen asesoría de inversión. EMA8/34/200, RSI14, MACD(12,26,9) y Bandas de Bollinger(20,2) calculados sobre el cierre diario.
      </div>
    </div>
  );
}
