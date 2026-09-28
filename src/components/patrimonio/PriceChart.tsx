"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ema } from "../../../lib/technicals";

type Series = {
  dates: string[];
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume?: (number | null)[];
};

export type EmaConfig = { id: string; period: number; color: string; visible: boolean };

const DEFAULT_EMAS: EmaConfig[] = [
  { id: "ema-8",   period: 8,   color: "#f5b642", visible: true },
  { id: "ema-34",  period: 34,  color: "#5b9bd5", visible: true },
  { id: "ema-200", period: 200, color: "#b565d9", visible: true },
];

const W = 680;
const PRICE_H = 220;
const GAP = 14;
const RSI_H = 90;
const AXIS_H = 18;
const H = PRICE_H + GAP + RSI_H + AXIS_H;
const PAD_L = 44;
const PAD_R = 46;
const PLOT_W = W - PAD_L - PAD_R;
const MIN_WINDOW = 15;

// How far you can pan past the first/last real candle, in "screens" worth
// of index space — lets you scroll into blank space on either side instead
// of hitting a hard wall at the data's edge.
const FREE_PAN_SCREENS = 1;

function windowArray<T>(arr: (T | null | undefined)[] | undefined, left: number, right: number, empty: T): T[] {
  const out: T[] = [];
  const src = arr ?? [];
  for (let i = left; i <= right; i++) {
    const v = i >= 0 && i < src.length ? src[i] : undefined;
    out.push(v == null ? empty : v);
  }
  return out;
}

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function formatAxisDate(iso: string, showYear: boolean) {
  const [y, m, d] = iso.split("-");
  return showYear ? `${MONTHS_ES[Number(m) - 1]} ${y}` : `${d} ${MONTHS_ES[Number(m) - 1]}`;
}
function formatTooltipDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS_ES[Number(m) - 1]} ${y}`;
}

function linePath(values: (number | null)[], scaleX: (i: number) => number, scaleY: (v: number) => number) {
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v == null) { drawing = false; return; }
    const cmd = drawing ? "L" : "M";
    d += `${cmd}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)} `;
    drawing = true;
  });
  return d.trim();
}

const RANDOM_COLORS = ["#e06666", "#6fcf97", "#56ccf2", "#f2994a", "#bb6bd9", "#4fd1c5"];

// `idx` is the absolute series index at the moment the point was placed —
// a fallback anchor for when you drop a point in blank panned-out space
// (before the first / after the last real candle), where there's no real
// trading date to key off of. `date` is preferred when it resolves (stable
// across re-fetches); `idx` is what makes points placeable *anywhere*,
// including right next to the chart, not just on top of candles.
export type DPoint = { date: string; price: number; idx: number };
export type DrawingTool = "line" | "hline" | "fib" | "text" | "measure" | "channel";
export type Drawing = {
  id: string;
  kind: DrawingTool;
  data: { p1?: DPoint; p2?: DPoint; p3?: DPoint; p?: DPoint; price?: number; text?: string; color?: string };
};

// Retracement levels (0–1) PLUS the standard extension levels beyond 100% —
// TradingView's default Fib Retracement tool shows both, as projected price
// targets past the original swing, not just the levels between the two
// clicked points.
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.414, 1.618, 2.618, 3.618, 4.236];
// One fixed color per level (not a small palette cycled across bands) —
// matches TradingView's own default Fib Retracement color scheme.
const FIB_LEVEL_COLORS = [
  "#787b86", "#f23645", "#ff9800", "#4caf50", "#089981", "#00bcd4",
  "#787b86", "#5b9bd5", "#3f51b5", "#2962ff", "#f23645", "#9c27b0", "#e91e63",
];
const TOOL_LABELS: Record<DrawingTool, string> = {
  line: "Línea", hline: "Horizontal", fib: "Fibonacci", text: "Texto", measure: "Medir", channel: "Canal",
};
// Fib levels/prices in this app's usual es-CO number format ("4,236"), not
// a percentage — matches how the reference (TradingView) labels them.
const fmtLevel = (level: number) => level.toLocaleString("es-CO", { maximumFractionDigits: 3 });

function daysBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);
}

export default function PriceChart({
  series, rsi14, highlightDate, initialEmaConfig, onEmaConfigChange,
  drawings = [], onAddDrawing, onDeleteDrawing, onClearDrawings,
}: {
  series: Series;
  rsi14: (number | null)[];
  highlightDate?: string;
  // EMA lines are a per-user preference (saved to the account, not this
  // browser) so they follow you across devices — see saveChartEmaConfig.
  initialEmaConfig?: EmaConfig[] | null;
  onEmaConfigChange?: (emas: EmaConfig[]) => void | Promise<void>;
  // Drawings (trendlines, Fibonacci, text, measurements) are per-ticker and
  // persisted server-side too — see ChartDrawing / lib/actions.
  drawings?: Drawing[];
  onAddDrawing?: (kind: DrawingTool, data: Drawing["data"]) => void;
  onDeleteDrawing?: (id: string) => void;
  onClearDrawings?: () => void;
}) {
  const n = series.dates.length;
  const closesFull = useMemo(() => series.close.map(v => v ?? 0), [series.close]);
  const lastRealClose = useMemo(() => {
    for (let i = series.close.length - 1; i >= 0; i--) if (typeof series.close[i] === "number") return series.close[i] as number;
    return undefined;
  }, [series.close]);
  const dateIndexMap = useMemo(() => {
    const m = new Map<string, number>();
    series.dates.forEach((d, i) => m.set(d, i));
    return m;
  }, [series.dates]);

  const [emas, setEmas] = useState<EmaConfig[]>(
    () => (initialEmaConfig && initialEmaConfig.length > 0 ? initialEmaConfig : DEFAULT_EMAS)
  );
  // Debounce persistence so dragging a color picker or retyping a period
  // doesn't fire a server write on every intermediate value. Visible status
  // so it's clear the change actually saved to the account (not just local
  // state) — there's no separate "Guardar" button, this is the save.
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (!onEmaConfigChange) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveStatus("saving");
      Promise.resolve(onEmaConfigChange(emas))
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("error"));
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [emas, onEmaConfigChange]);

  const [windowSize, setWindowSize] = useState(() => Math.min(200, n));
  const [rightIndex, setRightIndex] = useState(n - 1);
  const [yZoom, setYZoom] = useState(1);
  const [yPan, setYPan] = useState(0); // free vertical pan, in price units
  const lastPriceRange = useRef({ min: 0, max: 1 });

  // Re-clamp when a new ticker's series loads (different length).
  useEffect(() => {
    setWindowSize(Math.min(200, n));
    setRightIndex(n - 1);
    setYZoom(1);
    setYPan(0);
  }, [n]);

  const emaSeries = useMemo(
    () => emas.map(cfg => ({ cfg, values: ema(closesFull, cfg.period) })),
    [closesFull, emas]
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ startX: number; startY: number; startRight: number; startYPan: number; moved: boolean } | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drawing tools (line/hline/fib/text/measure/channel)
  const [tool, setTool] = useState<DrawingTool | "none">("none");
  const [drawColor, setDrawColor] = useState("#e06666");
  const drawStart = useRef<DPoint | null>(null);
  const [drawPreviewEnd, setDrawPreviewEnd] = useState<DPoint | null>(null);
  // Channel is a 3-click tool: p1→p2 sets the base trendline, a 3rd click
  // sets how far the parallel line sits from it (like TradingView's Parallel
  // Channel). drawSecond holds the committed p2 while waiting for click 3.
  const drawSecond = useRef<DPoint | null>(null);

  // Fullscreen
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  };

  // Pan freely past the data's edges — up to a screen's worth of blank
  // space on either side — instead of hard-stopping at the first/last candle.
  const clampRight = (idx: number, win: number) => {
    const pad = Math.round(win * FREE_PAN_SCREENS);
    return Math.min(n - 1 + pad, Math.max(win - 1 - pad, idx));
  };
  const clampWindow = (w: number) => Math.min(n * 3, Math.max(MIN_WINDOW, Math.round(w)));

  const zoomX = (factor: number) => {
    setWindowSize(w => clampWindow(w * factor));
  };
  const panX = (deltaIdx: number) => {
    setRightIndex(r => clampRight(r + deltaIdx, windowSize));
  };
  const resetView = () => {
    setWindowSize(Math.min(200, n));
    setRightIndex(n - 1);
    setYZoom(1);
    setYPan(0);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey) {
      setYZoom(z => Math.min(6, Math.max(0.15, z * (e.deltaY < 0 ? 1.12 : 1 / 1.12))));
    } else {
      zoomX(e.deltaY < 0 ? 0.85 : 1 / 0.85);
    }
  };

  // svg-space (viewBox units) coordinates for the current pointer position,
  // regardless of the rendered (CSS) size of the chart.
  const toSvg = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) * (W / rect.width), y: (clientY - rect.top) * (H / rect.height) };
  };

  // Screen ↔ data-space conversion for placing drawings. Defined here (used
  // only from event handlers, invoked after this render has finished, same
  // as `count` below) but they close over yMin/yMax/scaleX etc. computed
  // further down in this same render pass.
  const priceAtY = (ySvg: number) => yMin + ((PRICE_H - ySvg) / PRICE_H) * (yMax - yMin);
  // Returns both the (possibly blank/"") date at this x AND the absolute
  // series index, so a point can still be anchored even where there's no
  // real trading date (panned-out blank space beside the chart).
  const pointAtX = (xSvg: number) => {
    const rel = Math.round(((xSvg - PAD_L) / PLOT_W) * (count - 1));
    const clamped = Math.min(count - 1, Math.max(0, rel));
    return { date: dates[clamped], idx: leftIndex + clamped };
  };

  // Drawing tools use a TradingView-style click → move → click flow, not a
  // press-and-hold drag: first click drops the anchor, the shape previews
  // live as you move the (unpressed) mouse, second click commits it.
  const onPointerDown = (e: React.PointerEvent) => {
    if (tool !== "none") return; // don't start panning while placing a drawing
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, startRight: rightIndex, startYPan: yPan, moved: false };
    setIsDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const { x: xSvg, y: ySvg } = toSvg(e.clientX, e.clientY);
    if (drawStart.current) {
      setDrawPreviewEnd({ ...pointAtX(xSvg), price: priceAtY(ySvg) });
    }
    if (drag.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const dxSvg = (e.clientX - drag.current.startX) * (W / rect.width);
      const dySvg = (e.clientY - drag.current.startY) * (H / rect.height);
      if (Math.abs(dxSvg) > 0.5 || Math.abs(dySvg) > 0.5) drag.current.moved = true;
      const idxPerSvgUnit = windowSize / PLOT_W;
      const deltaIdx = Math.round(-dxSvg * idxPerSvgUnit);
      setRightIndex(clampRight(drag.current.startRight + deltaIdx, windowSize));
      // Free vertical panning — drag content up/down regardless of where the
      // data actually sits, using the range captured when the drag started.
      const pricePerSvgUnit = (lastPriceRange.current.max - lastPriceRange.current.min) / PRICE_H || 0;
      setYPan(drag.current.startYPan + dySvg * pricePerSvgUnit);
    }
    const rel = Math.round(((xSvg - PAD_L) / PLOT_W) * (count - 1));
    setHoverIdx(Math.min(count - 1, Math.max(0, rel)));
    // The horizontal crosshair line follows the raw cursor Y (like
    // TradingView) — only the vertical line snaps to the nearest candle.
    setHoverY(ySvg);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current) { try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {} }
    drag.current = null;
    setIsDragging(false);
  };
  const onClick = (e: React.MouseEvent) => {
    if (tool === "none" || !svgRef.current) return;
    if (drag.current?.moved) return; // a real pan drag, not a click to place
    const { x, y } = toSvg(e.clientX, e.clientY);
    const point = { ...pointAtX(x), price: priceAtY(y) };
    if (tool === "hline") {
      onAddDrawing?.("hline", { price: point.price, color: drawColor });
      setTool("none");
      return;
    }
    if (tool === "text") {
      const text = window.prompt("Texto de la anotación:")?.trim();
      if (text) onAddDrawing?.("text", { p: point, text, color: drawColor });
      setTool("none");
      return;
    }
    // line / fib / measure: first click anchors, second click commits.
    // channel: a 3rd click sets the parallel line's offset.
    if (tool === "channel" && drawSecond.current) {
      onAddDrawing?.("channel", { p1: drawStart.current!, p2: drawSecond.current, p3: point, color: drawColor });
      drawStart.current = null;
      drawSecond.current = null;
      setDrawPreviewEnd(null);
      setTool("none");
      return;
    }
    if (!drawStart.current) {
      drawStart.current = point;
      setDrawPreviewEnd(point);
      return;
    }
    if (tool === "channel") {
      drawSecond.current = point;
      setDrawPreviewEnd(point);
      return;
    }
    onAddDrawing?.(tool, { p1: drawStart.current, p2: point, color: drawColor });
    drawStart.current = null;
    setDrawPreviewEnd(null);
    setTool("none");
  };
  const onPointerLeave = () => {
    // Don't cancel a pending click-click placement just because the cursor
    // left the canvas momentarily — only a real pan-drag should reset here.
    drag.current = null;
    setIsDragging(false);
    setHoverIdx(null);
    setHoverY(null);
  };

  const leftIndex = rightIndex - windowSize + 1;
  const dates = windowArray(series.dates, leftIndex, rightIndex, "");
  const close = windowArray(series.close, leftIndex, rightIndex, null);
  const high = windowArray(series.high, leftIndex, rightIndex, null);
  const low = windowArray(series.low, leftIndex, rightIndex, null);
  const open = windowArray(series.open, leftIndex, rightIndex, null);
  const volume = windowArray(series.volume, leftIndex, rightIndex, null);
  const rsiWindow = windowArray(rsi14, leftIndex, rightIndex, null);
  const emaWindows = emaSeries.map(({ cfg, values }) => ({ cfg, values: windowArray(values, leftIndex, rightIndex, null) }));

  const count = dates.length;
  if (count < 2) return <div className="text-[13px] text-dim">No hay suficiente historial para graficar.</div>;

  const safeHoverIdx = hoverIdx != null && !isDragging ? Math.min(count - 1, Math.max(0, hoverIdx)) : null;
  // Show "mes año" ticks once the visible window spans more than ~4 months,
  // otherwise "día mes" — this is the "quiero ver los meses" zoomed-out view.
  const showYearOnAxis = count > 120;
  const tickCount = Math.min(7, count);
  const axisTicks = Array.from({ length: tickCount }, (_, i) => Math.round((i / (tickCount - 1)) * (count - 1)));

  const nums = (arr: (number | null)[]) => arr.filter((v): v is number => typeof v === "number");
  const priceValues = [...nums(high), ...nums(low), ...emaWindows.filter(e => e.cfg.visible).flatMap(e => nums(e.values))];
  // When panned past the data's edge, the visible window can be entirely
  // blank — fall back to the last range that actually had data instead of
  // collapsing to NaN.
  let dataMin: number, dataMax: number;
  if (priceValues.length > 0) {
    dataMin = Math.min(...priceValues);
    dataMax = Math.max(...priceValues);
    lastPriceRange.current = { min: dataMin, max: dataMax };
  } else {
    dataMin = lastPriceRange.current.min;
    dataMax = lastPriceRange.current.max;
  }
  const center = (dataMax + dataMin) / 2 + yPan;
  const halfRange = Math.max((dataMax - dataMin) / 2, dataMax * 0.02, 0.01) / yZoom;
  const pad = halfRange * 0.15;
  const yMin = center - halfRange - pad;
  const yMax = center + halfRange + pad;

  const scaleX = (i: number) => PAD_L + (i / (count - 1)) * PLOT_W;
  const scaleYPrice = (v: number) => PRICE_H - ((v - yMin) / (yMax - yMin)) * PRICE_H;
  const scaleYRsi = (v: number) => PRICE_H + GAP + RSI_H - (v / 100) * RSI_H;

  const bodyW = Math.max(1.2, (PLOT_W / count) * 0.6);
  const highlightIdx = highlightDate ? dates.findIndex(d => d >= highlightDate) : -1;

  const priceLabels = [yMax, (yMax + yMin) / 2, yMin];
  const fmtPrice = (v: number) => v.toLocaleString("es-CO", { maximumFractionDigits: v < 10 ? 4 : 0 });

  // Maps a drawing point to its x position even if it's currently off-screen
  // (panned away) or was placed in blank space beside the chart where there
  // was no real trading date to key off of — falls back to the absolute
  // index captured when the point was placed.
  const xForPoint = (p: DPoint): number | null => {
    const byDate = p.date ? dateIndexMap.get(p.date) : undefined;
    const idx = byDate ?? p.idx;
    if (idx == null) return null;
    return scaleX(idx - leftIndex);
  };

  const renderFibLevels = (key: string, p1: DPoint, p2: DPoint, opacityScale: number) => {
    const x1 = xForPoint(p1), x2 = xForPoint(p2);
    if (x1 == null || x2 == null) return null;
    const lo = Math.min(x1, x2);
    const rightEdge = W - PAD_R;
    const levelY = (level: number) => scaleYPrice(p1.price + (p2.price - p1.price) * level);
    return (
      <g key={key}>
        {FIB_LEVELS.slice(0, -1).map((level, i) => {
          const yA = levelY(level), yB = levelY(FIB_LEVELS[i + 1]);
          return (
            <rect
              key={`band-${level}`}
              x={lo} width={rightEdge - lo}
              y={Math.min(yA, yB)} height={Math.abs(yB - yA)}
              fill={FIB_LEVEL_COLORS[i % FIB_LEVEL_COLORS.length]}
              opacity={0.16 * opacityScale}
            />
          );
        })}
        {FIB_LEVELS.map((level, i) => {
          const price = p1.price + (p2.price - p1.price) * level;
          const y = levelY(level);
          const lineColor = FIB_LEVEL_COLORS[i % FIB_LEVEL_COLORS.length];
          return (
            <g key={level}>
              <line x1={lo} x2={rightEdge} y1={y} y2={y} stroke={lineColor} strokeWidth="1" opacity={(level === 0 || level === 1 ? 0.9 : 0.75) * opacityScale} />
              <text x={lo + 3} y={y - 3} fontSize="8.5" fill={lineColor} fontFamily="'IBM Plex Mono', monospace" opacity={opacityScale}>
                {fmtLevel(level)} ({fmtPrice(price)})
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // "Medir" as a right-angled box (TradingView's actual Measure tool), not a
  // free diagonal line — the rect visually brackets the price range and bar
  // count you're measuring between the two points.
  const renderMeasure = (key: string, p1: DPoint, p2: DPoint, opacityScale: number) => {
    const x1 = xForPoint(p1), x2 = xForPoint(p2);
    if (x1 == null || x2 == null) return null;
    const y1 = scaleYPrice(p1.price), y2 = scaleYPrice(p2.price);
    const pct = p1.price !== 0 ? ((p2.price - p1.price) / p1.price) * 100 : 0;
    const bars = p1.date && p2.date ? daysBetween(p1.date, p2.date) : p2.idx - p1.idx;
    const up = pct >= 0;
    const boxColor = up ? "var(--pos)" : "var(--neg)";
    const [lo, hi] = [Math.min(x1, x2), Math.max(x1, x2)];
    const [top, bottom] = [Math.min(y1, y2), Math.max(y1, y2)];
    const midX = (lo + hi) / 2, midY = Math.min(y1, y2) - 12;
    return (
      <g key={key} opacity={opacityScale}>
        <rect x={lo} y={top} width={hi - lo} height={bottom - top} fill={boxColor} opacity="0.12" />
        <rect x={lo} y={top} width={hi - lo} height={bottom - top} fill="none" stroke={boxColor} strokeWidth="1" strokeDasharray="4,3" />
        <rect x={midX - 50} y={midY - 11} width={100} height={22} rx={4} fill="var(--panel)" stroke="var(--line)" />
        <text x={midX} y={midY - 3} fontSize="9" fill={boxColor} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">
          {up ? "+" : ""}{pct.toFixed(2)}%
        </text>
        <text x={midX} y={midY + 8} fontSize="8.5" fill="var(--dim)" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">
          {Math.abs(bars)}d · {fmtPrice(Math.abs(p2.price - p1.price))}
        </text>
      </g>
    );
  };

  // Parallel channel: p1→p2 is the base trendline, p3 sets how far (in
  // price) the second line sits from it, on either side.
  const renderChannel = (key: string, p1: DPoint, p2: DPoint, p3: DPoint, color: string, opacityScale: number) => {
    const x1 = xForPoint(p1), x2 = xForPoint(p2), x3 = xForPoint(p3);
    if (x1 == null || x2 == null || x3 == null) return null;
    const rightEdge = W - PAD_R;
    const idx1 = p1.idx, idx2 = p2.idx;
    if (idx1 === idx2) return null;
    const slope = (p2.price - p1.price) / (idx2 - idx1);
    const baseAt = (idx: number) => p1.price + slope * (idx - idx1);
    const offset = p3.price - baseAt(p3.idx);
    // Extend both channel lines from the leftmost anchor to the chart's
    // right edge, same as the trendline/fib tools.
    const lo = Math.min(x1, x2);
    const loIdx = x1 <= x2 ? idx1 : idx2;
    const rightIdxAtEdge = loIdx + (rightEdge - lo) / (PLOT_W / (count - 1));
    const yBaseLo = scaleYPrice(baseAt(loIdx));
    const yBaseHi = scaleYPrice(baseAt(rightIdxAtEdge));
    const yTopLo = scaleYPrice(baseAt(loIdx) + offset);
    const yTopHi = scaleYPrice(baseAt(rightIdxAtEdge) + offset);
    return (
      <g key={key} opacity={opacityScale}>
        <polygon points={`${lo},${yBaseLo} ${rightEdge},${yBaseHi} ${rightEdge},${yTopHi} ${lo},${yTopLo}`} fill={color} opacity="0.13" />
        <line x1={lo} y1={yBaseLo} x2={rightEdge} y2={yBaseHi} stroke={color} strokeWidth="1.3" />
        <line x1={lo} y1={yTopLo} x2={rightEdge} y2={yTopHi} stroke={color} strokeWidth="1.3" />
      </g>
    );
  };

  const addEma = () => {
    const color = RANDOM_COLORS[emas.length % RANDOM_COLORS.length];
    setEmas(list => [...list, { id: `ema-${Date.now()}`, period: 10, color, visible: true }]);
  };
  const updateEma = (id: string, patch: Partial<EmaConfig>) => {
    setEmas(list => list.map(e => (e.id === id ? { ...e, ...patch } : e)));
  };
  const removeEma = (id: string) => setEmas(list => list.filter(e => e.id !== id));

  return (
    <div
      ref={containerRef}
      className={isFullscreen ? "flex flex-col gap-3 bg-panel p-4 h-screen overflow-auto" : "flex flex-col gap-3"}
    >
      {/* EMA config */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <span className="text-[11px] text-dim">Tus EMAs se guardan en tu cuenta, no en este navegador</span>
          <span className={`text-[11px] font-medium transition-opacity ${saveStatus === "idle" ? "opacity-0" : "opacity-100"} ${saveStatus === "error" ? "text-neg" : saveStatus === "saved" ? "text-pos" : "text-dim"}`}>
            {saveStatus === "saving" && "Guardando…"}
            {saveStatus === "saved" && "✓ Guardado"}
            {saveStatus === "error" && "Error al guardar"}
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          {emas.map(cfg => (
            <div
              key={cfg.id}
              className={`flex items-center gap-1.5 rounded-full border pl-1.5 pr-1.5 py-1 transition-opacity ${cfg.visible ? "border-line bg-panel2" : "border-line opacity-45"}`}
            >
              <button
                onClick={() => updateEma(cfg.id, { visible: !cfg.visible })}
                title={cfg.visible ? "Ocultar" : "Mostrar"}
                className="w-3.5 h-3.5 rounded-full border-none cursor-pointer shrink-0"
                style={{ background: cfg.color }}
              />
              <span className="text-[11px] text-dim">EMA</span>
              <input
                type="number"
                min={2}
                max={400}
                value={cfg.period}
                onChange={(e) => updateEma(cfg.id, { period: Math.min(400, Math.max(2, Number(e.target.value) || 2)) })}
                className="w-9 bg-transparent border-none text-[12px] text-fg tabular-nums focus:outline-none px-0"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
              <input
                type="color"
                value={cfg.color}
                onChange={(e) => updateEma(cfg.id, { color: e.target.value })}
                title="Color"
                className="w-3.5 h-3.5 rounded-full border-none cursor-pointer bg-transparent p-0 overflow-hidden"
              />
              <button
                onClick={() => removeEma(cfg.id)}
                title="Quitar"
                className="text-dim hover:text-neg cursor-pointer bg-transparent border-none text-[13px] leading-none w-3.5"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addEma}
            className="rounded-full border border-dashed border-line px-3 py-1.5 text-[11px] text-accent bg-transparent cursor-pointer hover:bg-panel2"
          >
            + EMA
          </button>
        </div>
      </div>

      {/* Chart controls */}
      <div className="flex items-center gap-3 flex-wrap text-[11px]">
        <div className="flex items-center gap-0.5 rounded-lg border border-line bg-panel2/60 p-0.5">
          <span className="text-dim px-1.5">Horiz.</span>
          <button onClick={() => zoomX(1 / 0.7)} className={ctrlBtn}>－</button>
          <button onClick={() => zoomX(0.7)} className={ctrlBtn}>＋</button>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-line bg-panel2/60 p-0.5">
          <span className="text-dim px-1.5">Vert.</span>
          <button onClick={() => setYZoom(z => Math.max(0.3, z / 1.3))} className={ctrlBtn}>－</button>
          <button onClick={() => setYZoom(z => Math.min(6, z * 1.3))} className={ctrlBtn}>＋</button>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-line bg-panel2/60 p-0.5">
          <button onClick={() => panX(-Math.round(windowSize * 0.3))} className={ctrlBtn}>←</button>
          <button onClick={() => panX(Math.round(windowSize * 0.3))} className={ctrlBtn}>→</button>
        </div>
        <button onClick={resetView} className="rounded-lg border border-line bg-panel2/60 px-2.5 py-1 text-dim cursor-pointer hover:border-accent">
          Reiniciar
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded-lg border border-line bg-panel2/60 px-2.5 py-1 text-dim cursor-pointer hover:border-accent"
        >
          {isFullscreen ? "✕ Salir" : "⛶ Pantalla completa"}
        </button>
        <span className="text-dim ml-auto hidden sm:inline">Rueda: zoom · Shift+rueda: vertical · Arrastra: desplazar</span>
      </div>

      {/* Drawing tools */}
      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
        <button
          onClick={() => { setTool("none"); drawStart.current = null; drawSecond.current = null; setDrawPreviewEnd(null); }}
          className={`rounded-lg border px-2.5 py-1 cursor-pointer ${tool === "none" ? "border-accent text-accent bg-accent/10" : "border-line bg-panel2/60 text-dim hover:border-accent"}`}
        >
          Cursor
        </button>
        {(Object.keys(TOOL_LABELS) as DrawingTool[]).map(t => (
          <button
            key={t}
            onClick={() => { setTool(t); drawStart.current = null; drawSecond.current = null; setDrawPreviewEnd(null); }}
            className={`rounded-lg border px-2.5 py-1 cursor-pointer ${tool === t ? "border-accent text-accent bg-accent/10" : "border-line bg-panel2/60 text-dim hover:border-accent"}`}
          >
            {TOOL_LABELS[t]}
          </button>
        ))}
        <input
          type="color"
          value={drawColor}
          onChange={(e) => setDrawColor(e.target.value)}
          title="Color del trazo"
          className="w-6 h-6 rounded-md border border-line cursor-pointer bg-transparent p-0"
        />
        {drawings.length > 0 && (
          <button
            onClick={() => onClearDrawings?.()}
            className="rounded-lg border border-line bg-panel2/60 px-2.5 py-1 text-dim cursor-pointer hover:border-neg hover:text-neg"
          >
            Borrar todo
          </button>
        )}
        {tool !== "none" && (
          <span className="text-dim">
            {tool === "hline" || tool === "text"
              ? "Clic para colocar"
              : tool === "channel" && drawSecond.current
              ? "Clic para fijar el ancho del canal"
              : drawStart.current
              ? "Clic para fijar el segundo punto"
              : tool === "fib"
              ? "Clic en el mínimo o máximo, luego clic en el otro extremo"
              : tool === "channel"
              ? "Clic para el primer punto, clic para el segundo (línea base)"
              : "Clic para el primer punto, clic para el segundo"}
          </span>
        )}
      </div>

      {drawings.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5">
          {drawings.map((d, i) => (
            <div key={d.id} className="flex items-center gap-1.5 rounded-full border border-line bg-panel2 pl-1.5 pr-1.5 py-1 text-[11px]">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.data.color ?? "var(--accent)" }} />
              <span className="text-dim">{TOOL_LABELS[d.kind]} {i + 1}{d.kind === "text" && d.data.text ? `: ${d.data.text.slice(0, 16)}` : ""}</span>
              <button
                onClick={() => onDeleteDrawing?.(d.id)}
                className="text-dim hover:text-neg cursor-pointer bg-transparent border-none text-[13px] leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={isFullscreen ? "80vh" : undefined}
        role="img"
        aria-label="Gráfico de precio con EMAs y RSI"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
        style={{ touchAction: "none", cursor: tool !== "none" ? "crosshair" : isDragging ? "grabbing" : "grab", userSelect: "none" }}
      >
        {/* Full-area hit target so drag/hover work from anywhere on the
            chart, not just on top of a candle or line (fill="transparent"
            alone isn't hit-tested by default — pointerEvents:"all" forces it). */}
        <rect x={0} y={0} width={W} height={H} fill="transparent" style={{ pointerEvents: "all" }} />

        {/* Price grid + labels (both sides, TradingView-style right scale + a mirrored left one) */}
        {priceLabels.map((v, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={scaleYPrice(v)} y2={scaleYPrice(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray="2,3" />
            <text x={2} y={scaleYPrice(v) + 3} fontSize="9" fill="var(--dim)" fontFamily="'IBM Plex Mono', monospace">{fmtPrice(v)}</text>
            <text x={W - PAD_R + 4} y={scaleYPrice(v) + 3} fontSize="9" fill="var(--dim)" fontFamily="'IBM Plex Mono', monospace">{fmtPrice(v)}</text>
          </g>
        ))}
        {/* Last known real close, as a reference line — stays visible even
            when you've panned past the edge into blank space. */}
        {lastRealClose != null && scaleYPrice(lastRealClose) >= 0 && scaleYPrice(lastRealClose) <= PRICE_H && (
          <g>
            <line x1={PAD_L} x2={W - PAD_R} y1={scaleYPrice(lastRealClose)} y2={scaleYPrice(lastRealClose)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
            <rect x={W - PAD_R + 1} y={scaleYPrice(lastRealClose) - 7} width={PAD_R - 2} height={14} fill="var(--accent)" opacity="0.85" />
            <text x={W - PAD_R + 4} y={scaleYPrice(lastRealClose) + 3} fontSize="9" fill="var(--accentFg)" fontFamily="'IBM Plex Mono', monospace" fontWeight="600">
              {fmtPrice(lastRealClose)}
            </text>
          </g>
        )}

        {/* Candles */}
        {dates.map((_, i) => {
          const o = open[i], c = close[i], h = high[i], l = low[i];
          if (o == null || c == null || h == null || l == null) return null;
          const x = scaleX(i);
          const up = c >= o;
          const color = up ? "var(--pos)" : "var(--neg)";
          const bodyTop = scaleYPrice(Math.max(o, c));
          const bodyBottom = scaleYPrice(Math.min(o, c));
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={scaleYPrice(h)} y2={scaleYPrice(l)} stroke={color} strokeWidth="1" />
              <rect x={x - bodyW / 2} y={bodyTop} width={bodyW} height={Math.max(0.6, bodyBottom - bodyTop)} fill={color} />
            </g>
          );
        })}

        {/* EMA overlays */}
        {emaWindows.filter(e => e.cfg.visible).map(e => (
          <path key={e.cfg.id} d={linePath(e.values, scaleX, scaleYPrice)} fill="none" stroke={e.cfg.color} strokeWidth="1.3" />
        ))}

        {/* Purchase marker */}
        {highlightIdx >= 0 && (
          <g>
            <line x1={scaleX(highlightIdx)} x2={scaleX(highlightIdx)} y1={0} y2={PRICE_H} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={scaleX(highlightIdx) + 3} y={10} fontSize="9" fill="var(--accent)">Compra</text>
          </g>
        )}

        {/* Legend */}
        <g fontSize="9" fontFamily="'IBM Plex Mono', monospace">
          {emas.filter(e => e.visible).map((e, i) => (
            <g key={e.id} transform={`translate(${PAD_L + i * 62}, ${PRICE_H - 12})`}>
              <rect width={8} height={2} fill={e.color} />
              <text x={11} y={3} fill="var(--dim)">EMA{e.period}</text>
            </g>
          ))}
        </g>

        {/* RSI panel */}
        <line x1={PAD_L} x2={W - PAD_R} y1={scaleYRsi(70)} y2={scaleYRsi(70)} stroke="var(--neg)" strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
        <line x1={PAD_L} x2={W - PAD_R} y1={scaleYRsi(30)} y2={scaleYRsi(30)} stroke="var(--pos)" strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
        <text x={2} y={scaleYRsi(70) + 3} fontSize="9" fill="var(--dim)">70</text>
        <text x={2} y={scaleYRsi(30) + 3} fontSize="9" fill="var(--dim)">30</text>
        <text x={2} y={scaleYRsi(100) + 8} fontSize="9" fill="var(--dim)" fontWeight="600">RSI</text>
        <path d={linePath(rsiWindow, scaleX, scaleYRsi)} fill="none" stroke="var(--accent)" strokeWidth="1.3" />

        {highlightIdx >= 0 && (
          <line x1={scaleX(highlightIdx)} x2={scaleX(highlightIdx)} y1={PRICE_H + GAP} y2={PRICE_H + GAP + RSI_H} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3,3" />
        )}

        {/* Time axis */}
        <line x1={PAD_L} x2={W - PAD_R} y1={PRICE_H + GAP + RSI_H} y2={PRICE_H + GAP + RSI_H} stroke="var(--line)" strokeWidth="1" />
        {axisTicks.map((i) => (
          <text
            key={i}
            x={Math.min(W - PAD_R - 24, Math.max(PAD_L, scaleX(i) - 12))}
            y={PRICE_H + GAP + RSI_H + 12}
            fontSize="9"
            fill="var(--dim)"
            fontFamily="'IBM Plex Mono', monospace"
          >
            {formatAxisDate(dates[i], showYearOnAxis)}
          </text>
        ))}

        {/* Drawings: trendlines, horizontal levels, Fibonacci retracements, text, measurements */}
        {drawings.map(d => {
          const color = d.data.color ?? "var(--accent)";
          if (d.kind === "hline" && typeof d.data.price === "number") {
            const y = scaleYPrice(d.data.price);
            return (
              <g key={d.id}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke={color} strokeWidth="1.3" />
                <text x={PAD_L + 4} y={y - 3} fontSize="9" fill={color} fontFamily="'IBM Plex Mono', monospace">{fmtPrice(d.data.price)}</text>
              </g>
            );
          }
          if (d.kind === "text" && d.data.p) {
            const x = xForPoint(d.data.p);
            if (x == null) return null;
            return (
              <text key={d.id} x={x} y={scaleYPrice(d.data.p.price)} fontSize="11" fill={color} fontFamily="'IBM Plex Mono', monospace">
                {d.data.text}
              </text>
            );
          }
          if (d.kind === "line" && d.data.p1 && d.data.p2) {
            const x1 = xForPoint(d.data.p1), x2 = xForPoint(d.data.p2);
            if (x1 == null || x2 == null) return null;
            return <line key={d.id} x1={x1} x2={x2} y1={scaleYPrice(d.data.p1.price)} y2={scaleYPrice(d.data.p2.price)} stroke={color} strokeWidth="1.5" />;
          }
          if (d.kind === "measure" && d.data.p1 && d.data.p2) {
            return renderMeasure(d.id, d.data.p1, d.data.p2, 1);
          }
          if (d.kind === "channel" && d.data.p1 && d.data.p2 && d.data.p3) {
            return renderChannel(d.id, d.data.p1, d.data.p2, d.data.p3, d.data.color ?? "var(--accent)", 1);
          }
          if (d.kind === "fib" && d.data.p1 && d.data.p2) {
            return renderFibLevels(d.id, d.data.p1, d.data.p2, 1);
          }
          return null;
        })}

        {/* Live preview while a multi-click tool is being placed */}
        {drawStart.current && drawPreviewEnd && tool === "fib" && renderFibLevels("preview", drawStart.current, drawPreviewEnd, 0.6)}
        {drawStart.current && drawPreviewEnd && tool === "measure" && renderMeasure("preview", drawStart.current, drawPreviewEnd, 0.6)}
        {drawStart.current && drawPreviewEnd && tool === "line" && (() => {
          const x1 = xForPoint(drawStart.current), x2 = xForPoint(drawPreviewEnd);
          if (x1 == null || x2 == null) return null;
          const y1 = scaleYPrice(drawStart.current.price), y2 = scaleYPrice(drawPreviewEnd.price);
          return <line x1={x1} x2={x2} y1={y1} y2={y2} stroke={drawColor} strokeWidth="1.3" strokeDasharray="3,3" opacity="0.8" />;
        })()}
        {tool === "channel" && drawStart.current && drawPreviewEnd && !drawSecond.current && (() => {
          const x1 = xForPoint(drawStart.current), x2 = xForPoint(drawPreviewEnd);
          if (x1 == null || x2 == null) return null;
          const y1 = scaleYPrice(drawStart.current.price), y2 = scaleYPrice(drawPreviewEnd.price);
          return <line x1={x1} x2={x2} y1={y1} y2={y2} stroke={drawColor} strokeWidth="1.3" strokeDasharray="3,3" opacity="0.8" />;
        })()}
        {tool === "channel" && drawStart.current && drawSecond.current && drawPreviewEnd &&
          renderChannel("preview", drawStart.current, drawSecond.current, drawPreviewEnd, drawColor, 0.6)}

        {/* Crosshair + hover tooltip (TradingView-style: follows the cursor, shows OHLC + date) */}
        {safeHoverIdx != null && (() => {
          const o = open[safeHoverIdx], c = close[safeHoverIdx], h = high[safeHoverIdx], l = low[safeHoverIdx];
          const v = volume[safeHoverIdx];
          const x = scaleX(safeHoverIdx);
          const tipLines = [
            formatTooltipDate(dates[safeHoverIdx]),
            `A ${fmtPrice(o ?? 0)}  M ${fmtPrice(h ?? 0)}  m ${fmtPrice(l ?? 0)}  C ${fmtPrice(c ?? 0)}`,
            `Vol ${typeof v === "number" ? v.toLocaleString("es-CO") : "—"}`,
          ];
          const tipW = 160;
          const tipX = Math.min(W - PAD_R - tipW, Math.max(PAD_L, x + 6));
          // The horizontal guide follows the raw cursor Y (hoverY), not the
          // hovered candle's close — matching how the vertical line follows
          // the raw cursor X within the price panel specifically (it only
          // makes sense there; over the RSI panel there's no price to show).
          const showPriceGuide = hoverY != null && hoverY >= 0 && hoverY <= PRICE_H;
          return (
            <g pointerEvents="none">
              <line x1={x} x2={x} y1={0} y2={PRICE_H + GAP + RSI_H} stroke="var(--dim)" strokeWidth="1" strokeDasharray="2,2" />
              {showPriceGuide && (
                <>
                  <line x1={PAD_L} x2={W - PAD_R} y1={hoverY!} y2={hoverY!} stroke="var(--dim)" strokeWidth="1" strokeDasharray="2,2" />
                  <rect x={W - PAD_R + 1} y={hoverY! - 7} width={PAD_R - 2} height={14} fill="var(--dim)" opacity="0.9" />
                  <text x={W - PAD_R + 4} y={hoverY! + 3} fontSize="9" fill="var(--panel)" fontFamily="'IBM Plex Mono', monospace" fontWeight="600">
                    {fmtPrice(priceAtY(hoverY!))}
                  </text>
                </>
              )}
              <rect x={tipX} y={2} width={tipW} height={42} rx={4} fill="var(--panel)" stroke="var(--line)" />
              {tipLines.map((line, i) => (
                <text key={i} x={tipX + 6} y={14 + i * 12} fontSize="9.5" fill="var(--muted)" fontFamily="'IBM Plex Mono', monospace">
                  {line}
                </text>
              ))}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

const ctrlBtn = "w-5 h-5 rounded-md border-none bg-transparent text-muted cursor-pointer hover:bg-panel hover:text-fg flex items-center justify-center";
