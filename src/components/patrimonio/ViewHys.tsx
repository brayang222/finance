"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COP } from "../../data/mock";
import type { AllData, HysMovement } from "../../types";
import { Bal, catmullRomPath, areaPath, scalePoints } from "./utils";
import { usePrivacy } from "./PrivacyContext";
import { initHys, hysDeleteMovement } from "../../../lib/actions";
import ModalHysMovement from "./ModalHysMovement";

// ── helpers ──────────────────────────────────────────────────────────────────

function diffDays(later: string, earlier: string): number {
  return Math.floor((new Date(later).getTime() - new Date(earlier).getTime()) / 86400000);
}

function compound(B: number, tea: number, dateL: string, dateT: string): number {
  const days = diffDays(dateT, dateL);
  if (days <= 0) return B;
  return B * (1 + tea / 100) ** (days / 365);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function addMonths(date: string, n: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

/** Compute running balance for any date given sorted movements. */
function balanceAt(movements: HysMovement[], date: string): number {
  // Find last movement on or before date
  const prev = [...movements].reverse().find(m => m.date <= date);
  if (!prev) return 0;
  return compound(prev.balance, prev.rate, prev.date, date);
}

// ── types ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { kind: "deposit" }
  | { kind: "withdraw" }
  | { kind: "rate"; currentRate: number }
  | { kind: "edit"; item: HysMovement }
  | null;

// ── constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  inicio: "Apertura",
  deposito: "Depósito",
  retiro: "Retiro",
  rendimiento: "Rendimiento",
};

const cardBase = "border border-line bg-panel rounded-2xl p-5";
const microLabel = "text-[11px] tracking-[0.08em] uppercase text-dim font-medium";

// ── setup card ────────────────────────────────────────────────────────────────

function SetupCard() {
  const router = useRouter();
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = (parseFloat(balance) || 0) > 0 && (parseFloat(rate) || 0) > 0;

  const save = async () => {
    setSaving(true);
    try {
      await initHys(parseFloat(balance), parseFloat(rate));
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${cardBase} w-full max-w-[420px] flex flex-col gap-4`}>
        <h2 className="text-[20px] font-medium m-0" style={{ fontFamily: "Spectral, serif" }}>
          Iniciar cuenta de alto rendimiento
        </h2>
        <div>
          <label className={`${microLabel} mb-1.5 block`}>Capital inicial</label>
          <input
            type="number"
            min="0"
            className="w-full h-[42px] px-3 rounded-xl border border-line bg-panel2 text-fg text-[14px] outline-none"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>
        <div>
          <label className={`${microLabel} mb-1.5 block`}>Tasa efectiva anual (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full h-[42px] px-3 rounded-xl border border-line bg-panel2 text-fg text-[14px] outline-none"
            value={rate}
            onChange={e => setRate(e.target.value)}
            placeholder="Ej: 14.00"
          />
        </div>
        <button
          disabled={!canSave || saving}
          onClick={save}
          className={[
            "h-[42px] rounded-xl border-none bg-accent text-accentFg text-[13.5px] font-medium",
            canSave && !saving ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-[0.45]",
          ].join(" ")}
        >
          {saving ? "Iniciando…" : "Iniciar cuenta"}
        </button>
      </div>
    </div>
  );
}

// ── growth chart ──────────────────────────────────────────────────────────────

function GrowthChart({ movements, rate }: { movements: HysMovement[]; rate: number }) {
  const [mounted, setMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; date: string; value: number } | null>(null);
  const [range, setRange] = useState<"3M" | "6M" | "1A">("6M");
  useEffect(() => { setMounted(true); }, []);

  const today = todayISO();
  const projEnd = addMonths(today, 6);
  const sorted = useMemo(() => [...movements].sort((a, b) => a.date.localeCompare(b.date)), [movements]);
  const firstDate = sorted[0]?.date ?? today;

  const windowStart = useMemo(() => {
    if (range === "3M") return addMonths(today, -3);
    if (range === "6M") return addMonths(today, -6);
    return addMonths(today, -12);
  }, [range, today]);

  const { histPoints, projPoints, allValues } = useMemo(() => {
    const totalDays = diffDays(projEnd, windowStart);
    const step = Math.max(1, Math.floor(totalDays / 120));
    const hist: { date: string; value: number }[] = [];
    const proj: { date: string; value: number }[] = [];
    for (let d = 0; d <= totalDays; d += step) {
      const date = addDays(windowStart, d);
      const value = date <= firstDate ? (sorted[0]?.balance ?? 0) : balanceAt(sorted, date);
      if (date <= today) hist.push({ date, value });
      else proj.push({ date, value });
    }
    if (!hist.find(p => p.date === today)) hist.push({ date: today, value: balanceAt(sorted, today) });
    const lastHist = hist[hist.length - 1];
    if (!proj.find(p => p.date === projEnd))
      proj.push({ date: projEnd, value: compound(lastHist.value, rate, lastHist.date, projEnd) });
    return { histPoints: hist, projPoints: proj, allValues: [...hist, ...proj].map(p => p.value) };
  }, [sorted, rate, windowStart, today, projEnd, firstDate]);

  if (!mounted) return <div className="border border-line bg-panel rounded-[18px] p-[22px] h-[280px]" />;
  if (histPoints.length < 2) return null;

  const W = 700, H = 200;
  const allPoints = [...histPoints, ...projPoints];
  const scaled = scalePoints(allValues, W, H, 20, 20);
  const histScaled = scaled.slice(0, histPoints.length);
  const projScaled = scaled.slice(histPoints.length - 1); // overlap by 1

  const histLine = catmullRomPath(histScaled);
  const projLine = catmullRomPath(projScaled);
  const histArea = areaPath(histLine, W, H);

  const xAt = (i: number) => scaled[i][0];
  const dateAt = (clientX: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const frac = (clientX - rect.left) / rect.width;
    const idx = Math.round(frac * (allPoints.length - 1));
    const clamped = Math.max(0, Math.min(allPoints.length - 1, idx));
    return { idx: clamped, ...allPoints[clamped], x: xAt(clamped) };
  };

  const rangeBtn = (r: typeof range) => (
    <button
      key={r}
      onClick={() => setRange(r)}
      className={[
        "px-3 py-1 rounded-lg text-[12px] border-none cursor-pointer",
        range === r ? "bg-accent text-accentFg font-medium" : "bg-panel2 text-muted",
      ].join(" ")}
    >
      {r}
    </button>
  );

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-3">
        <span className={microLabel}>Evolución del saldo</span>
        <div className="flex gap-1">{(["3M", "6M", "1A"] as const).map(rangeBtn)}</div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 200, overflow: "visible" }}
        onMouseMove={e => {
          const res = dateAt(e.clientX);
          if (res) setHover({ x: res.x, date: res.date, value: res.value });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="hysGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hysProjGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Historical area + line */}
        <path d={histArea} fill="url(#hysGrad)" />
        <path d={histLine} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />

        {/* Projection dashed line */}
        <path d={projLine} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 4" strokeLinecap="round" opacity="0.5" />

        {/* Crosshair */}
        {hover && (
          <>
            <line x1={hover.x} y1={0} x2={hover.x} y2={H} stroke="var(--line)" strokeWidth="1" />
            <g transform={`translate(${Math.min(hover.x + 10, W - 130)}, 16)`}>
              <rect x={0} y={-14} width={120} height={34} rx={6} fill="var(--panel)" stroke="var(--line)" strokeWidth="1" />
              <text fill="var(--dim)" fontSize="10" y={0}>{hover.date}</text>
              <text fill="var(--fg)" fontSize="12" fontWeight="600" y={14}>{COP(hover.value)}</text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

// ── main view ─────────────────────────────────────────────────────────────────

export default function ViewHys({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!initialData.hys) return <SetupCard />;

  const { rate, movements } = initialData.hys;
  const sorted = [...movements].sort((a, b) => a.date.localeCompare(b.date));
  const today = todayISO();

  const lastMov = sorted[sorted.length - 1];
  const currentBalance = lastMov ? compound(lastMov.balance, rate, lastMov.date, today) : 0;
  const dailyRate = (1 + rate / 100) ** (1 / 365) - 1;
  const todayEarnings = currentBalance * dailyRate;
  const rateDisplay = rate.toFixed(2);

  // KPI projections
  const proj = (days: number) => currentBalance * (1 + rate / 100) ** (days / 365);

  const doDelete = async (id: string) => {
    setDeleting(true);
    try {
      await hysDeleteMovement(id);
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className={`${cardBase} flex flex-col gap-1`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className={microLabel + " mb-1"}>Saldo actual</div>
            <div className="text-[36px] font-medium tabular-nums leading-none">
              <Bal n={currentBalance} privacy={privacy} />
            </div>
            <div className="flex gap-4 mt-2 text-[13px]">
              <span className="text-pos">
                + <Bal n={todayEarnings} privacy={privacy} /> hoy
              </span>
              <span className="text-muted">Tasa: {rateDisplay}% EA</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-1">
            <button
              onClick={() => setModal({ kind: "deposit" })}
              className="h-[36px] px-4 rounded-xl border-none bg-accent text-accentFg text-[13px] font-medium cursor-pointer"
            >
              Depositar
            </button>
            <button
              onClick={() => setModal({ kind: "withdraw" })}
              className="h-[36px] px-4 rounded-xl border border-line bg-transparent text-fg text-[13px] font-medium cursor-pointer"
            >
              Retirar
            </button>
          </div>
        </div>
        <button
          onClick={() => setModal({ kind: "rate", currentRate: rate })}
          className="self-start mt-2 text-[12px] text-dim border-none bg-transparent cursor-pointer underline underline-offset-2 p-0"
        >
          Cambiar tasa
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["30D", 30], ["90D", 90], ["180D", 180], ["1A", 365]] as [string, number][]).map(([label, days]) => (
          <div key={label} className={cardBase}>
            <div className={microLabel + " mb-1"}>{label}</div>
            <div className="text-[18px] font-medium tabular-nums">
              <Bal n={proj(days)} privacy={privacy} />
            </div>
            <div className="text-[11px] text-pos mt-0.5">
              + <Bal n={proj(days) - currentBalance} privacy={privacy} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {sorted.length >= 1 && <GrowthChart movements={sorted} rate={rate} />}

      {/* Movement table */}
      <div className={cardBase}>
        <div className={microLabel + " mb-3"}>Movimientos</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-dim text-[11px] border-b border-line">
                <th className="pb-2 font-medium pr-4">Fecha</th>
                <th className="pb-2 font-medium pr-4">Tipo</th>
                <th className="pb-2 font-medium pr-4">Nota</th>
                <th className="pb-2 font-medium pr-4 text-right">Monto</th>
                <th className="pb-2 font-medium pr-4 text-right">Saldo</th>
                <th className="pb-2 font-medium pr-4 text-right">Tasa</th>
                <th className="pb-2 font-medium w-16" />
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map(m => {
                const isIngress = m.type !== "retiro";
                return (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-4 text-muted whitespace-nowrap">{m.date}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{TYPE_LABELS[m.type] ?? m.type}</td>
                    <td className="py-2 pr-4 text-muted max-w-[160px] truncate">{m.note ?? "—"}</td>
                    <td className={`py-2 pr-4 text-right tabular-nums whitespace-nowrap ${isIngress ? "text-pos" : "text-neg"}`}>
                      {isIngress ? "+" : "-"}<Bal n={m.amount} privacy={privacy} />
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums whitespace-nowrap">
                      <Bal n={m.balance} privacy={privacy} />
                    </td>
                    <td className="py-2 pr-4 text-right text-muted whitespace-nowrap">
                      {m.rate.toFixed(2)}%
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setModal({ kind: "edit", item: m })}
                          className="text-[11px] text-dim border border-line rounded-lg px-2 py-0.5 bg-transparent cursor-pointer hover:text-fg"
                        >
                          Editar
                        </button>
                        {confirmDelete === m.id ? (
                          <button
                            onClick={() => doDelete(m.id)}
                            disabled={deleting}
                            className="text-[11px] text-neg border border-neg rounded-lg px-2 py-0.5 bg-transparent cursor-pointer"
                          >
                            {deleting ? "…" : "Confirmar"}
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(m.id)}
                            className="text-[11px] text-dim border border-line rounded-lg px-2 py-0.5 bg-transparent cursor-pointer hover:text-neg"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal?.kind === "deposit" && (
        <ModalHysMovement mode="deposit" onClose={() => setModal(null)} />
      )}
      {modal?.kind === "withdraw" && (
        <ModalHysMovement mode="withdraw" onClose={() => setModal(null)} />
      )}
      {modal?.kind === "rate" && (
        <ModalHysMovement mode="rate" currentRate={modal.currentRate} onClose={() => setModal(null)} />
      )}
      {modal?.kind === "edit" && (
        <ModalHysMovement mode="edit" editItem={modal.item} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
