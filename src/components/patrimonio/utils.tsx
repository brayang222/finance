import React from "react";
import { COP } from "../../data/mock";

export type View =
  | "resumen"
  | "inversiones"
  | "cripto"
  | "detalle"
  | "transacciones"
  | "cuentas";

/** Masked monetary value display honoring privacy mode. */
export const Bal = ({ n, privacy }: { n: number; privacy: boolean }) =>
  privacy ? (
    <span style={{ letterSpacing: "0.1em", color: "var(--dim)" }}>••••••</span>
  ) : (
    <>{COP(n)}</>
  );

/** Catmull-rom spline through points -> smooth SVG path. */
export function catmullRomPath(points: [number, number][], tension = 0.18): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function areaPath(linePath: string, width: number, height: number): string {
  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}

/** Scale a series of values into SVG [x,y] points within a box. */
export function scalePoints(
  values: number[],
  width: number,
  height: number,
  padTop = 30,
  padBottom = 30,
  padX = 0
): [number, number][] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableH = height - padTop - padBottom;
  const usableW = width - padX * 2;
  return values.map((v, i) => {
    const x = padX + (values.length === 1 ? 0 : (i / (values.length - 1)) * usableW);
    const y = padTop + (1 - (v - min) / range) * usableH;
    return [x, y];
  });
}

export const DONUT_COLORS = [
  "#8a8f98",
  "#a6abb2",
  "#6a707a",
  "#c0c3c8",
  "#565c66",
  "#767c86",
  "#9aa0a8",
];

// ---- SVG icons ----
type IconProps = { size?: number };

export const IconGrid = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="7" height="7" rx="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.6" />
  </svg>
);

export const IconTrending = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 16 9 10 13 14 21 6" />
    <polyline points="15 6 21 6 21 12" />
  </svg>
);

export const IconCrypto = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="9.5" cy="9.5" r="6" />
    <circle cx="15" cy="15" r="6" />
  </svg>
);

export const IconArrows = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4v14M7 4L4 7M7 4l3 3" />
    <path d="M17 20V6M17 20l-3-3M17 20l3-3" />
  </svg>
);

export const IconCard = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="6" width="18" height="13" rx="2.4" />
    <path d="M3 10.5h18" strokeLinecap="round" />
    <circle cx="17" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconEye = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconEyeOff = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.6 6.6A18.5 18.5 0 0 0 2 12s3.5 8 10 8a9.1 9.1 0 0 0 4-.86" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <path d="m2 2 20 20" />
  </svg>
);

export const IconSun = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const IconClock = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export const IconBank: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7l8-4 8 4" />
    <rect x="3" y="7" width="14" height="9" rx="1" />
    <line x1="6" y1="7" x2="6" y2="16" />
    <line x1="10" y1="7" x2="10" y2="16" />
    <line x1="14" y1="7" x2="14" y2="16" />
    <line x1="2" y1="16" x2="18" y2="16" />
  </svg>
);
