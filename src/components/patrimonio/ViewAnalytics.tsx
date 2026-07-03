"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AllData } from "../../types";
import { upsertBudget, deleteBudget, upsertBudgetConfig } from "../../../lib/actions";
import { COLORS } from "../../data/constants";
import { usePrivacy } from "./PrivacyContext";
import { MoneyInput } from "./ModalShell";

const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const card = "border border-line bg-panel rounded-2xl p-5";
const inputSm = "h-7 text-xs border border-line rounded px-2 bg-panel2 text-fg outline-none font-mono tabular-nums";

type Period = "semanal" | "mensual" | "anual";

const PERIOD_LABELS: Record<Period, string> = { semanal: "Semanal", mensual: "Mensual", anual: "Anual" };

// Full calendar ranges (week Mon–Sun, whole month, whole year) so
// transactions dated "tomorrow" by timezone shift still count in the period
function getPeriodRange(period: Period, now: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "semanal") {
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: fmt(monday), to: fmt(sunday) };
  }
  if (period === "anual") return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: fmt(lastDay) };
}

function periodSubLabel(period: Period, now: Date): string {
  if (period === "semanal") {
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString("es-CO", { month: "short" })}`;
    return `${fmt(monday)} – ${fmt(sunday)}`;
  }
  if (period === "anual") return String(now.getFullYear());
  return now.toLocaleString("es-CO", { month: "long", year: "numeric" });
}

// ── Donut chart ────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 160 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const cx = size / 2, cy = size / 2, R = size * 0.4, ri = size * 0.24;
  let angle = -Math.PI / 2;
  const paths = slices.map((d) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const g = 0.018;
    const a1 = angle + g, a2 = angle + sweep - g;
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
    const xi1 = cx + ri * Math.cos(a1), yi1 = cy + ri * Math.sin(a1);
    const xi2 = cx + ri * Math.cos(a2), yi2 = cy + ri * Math.sin(a2);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ri} ${ri} 0 ${large} 0 ${xi1} ${yi1} Z`;
    angle += sweep;
    return { ...d, path };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {paths.map((p, i) => <path key={i} d={p.path} fill={p.color} />)}
    </svg>
  );
}

// ── Month bar chart ────────────────────────────────────────────────────────
function MonthBarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const H = 100;
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1" style={{ height: H + 20, minWidth: data.length * 36 }}>
        {data.map((d) => {
          const ih = (d.income / max) * H, eh = (d.expense / max) * H;
          return (
            <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-end gap-0.5" style={{ height: H }}>
                <div className="w-3 rounded-t" style={{ height: ih || 1, background: "var(--pos)", opacity: ih < 2 ? 0.2 : 1 }} title={`Ingreso: ${COP(d.income)}`} />
                <div className="w-3 rounded-t" style={{ height: eh || 1, background: "var(--neg)", opacity: eh < 2 ? 0.2 : 1 }} title={`Egreso: ${COP(d.expense)}`} />
              </div>
              <span className="text-dim" style={{ fontSize: 9 }}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({ pct, over }: { pct: number; over: boolean }) {
  return (
    <div className="h-2 rounded-full overflow-hidden bg-panel2">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(pct * 100, 100)}%`, background: over ? "var(--neg)" : pct > 0.85 ? "#f59e0b" : "var(--pos)" }}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function ViewAnalytics({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const { finances, budgets, budgetConfigs } = initialData;

  const now = new Date();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Period tab (pure UI state — each period has its own budget) ──
  const [period, setPeriod] = useState<Period>("mensual");

  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState("");
  const totalAmount = budgetConfigs.find(c => c.period === period)?.amount ?? 0;

  // Only budgets for the selected period
  const periodBudgets = budgets.filter(b => b.period === period);

  // ── Category item state ──
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newCatCustom, setNewCatCustom] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Analysis state ──
  const [analysisType, setAnalysisType] = useState<"egreso" | "ingreso">("egreso");
  const [analysisYear, setAnalysisYear] = useState(String(now.getFullYear()));

  // ── Spending in current period ──
  const { from: pFrom, to: pTo } = getPeriodRange(period, now);
  const spentByCat: Record<string, number> = {};
  for (const f of finances.filter(f => f.type === "egreso" && f.date >= pFrom && f.date <= pTo)) {
    spentByCat[f.category] = (spentByCat[f.category] || 0) + f.amount;
  }
  const totalSpent = Object.values(spentByCat).reduce((s, v) => s + v, 0);

  // Case-insensitive budget map
  const spentKeyMap: Record<string, string> = {};
  for (const cat of Object.keys(spentByCat)) spentKeyMap[cat.toLowerCase()] = cat;

  const budgetMap: Record<string, number> = {};
  const canonicalToDbCat: Record<string, string> = {};
  for (const b of periodBudgets) {
    const canonical = spentKeyMap[b.category.toLowerCase()] ?? b.category;
    budgetMap[canonical] = b.amount;
    canonicalToDbCat[canonical] = b.category;
  }

  const totalAssigned = periodBudgets.reduce((s, b) => s + b.amount, 0);
  const unassigned = Math.max(0, totalAmount - totalAssigned);
  const overallPct = totalAmount > 0 ? totalSpent / totalAmount : 0;
  const overallOver = totalAmount > 0 && totalSpent > totalAmount;

  // Categories: budgeted first, then spent-only
  const budgetedCats = Object.keys(budgetMap).sort();
  const spentOnlyCats = Object.keys(spentByCat).filter(c =>
    !Object.keys(budgetMap).map(k => k.toLowerCase()).includes(c.toLowerCase())
  ).sort();
  const allBudgetCats = [...budgetedCats, ...spentOnlyCats];

  // Known categories for add selector: from DB + from transaction history
  const dbEgressCats = initialData.categories.filter(c => c.type === "egreso").map(c => c.name);
  const txCats = [...new Set(finances.filter(f => f.type === "egreso").map(f => f.category))];
  const allKnown = [...new Set([...dbEgressCats, ...txCats])].sort();
  const selectorCats = allKnown.filter(c =>
    !Object.keys(budgetMap).map(k => k.toLowerCase()).includes(c.toLowerCase())
  );

  // Validation helpers
  const parseRaw = (s: string) => parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;

  const overallExceedWarning = (extra: number, replacing = 0) => {
    if (totalAmount <= 0) return null;
    const projected = totalAssigned - replacing + extra;
    if (projected > totalAmount) {
      return `Supera el total por ${COP(projected - totalAmount)}`;
    }
    return null;
  };

  // ── Actions ──
  const saveTotal = async (raw: string) => {
    const amount = parseRaw(raw);
    setSaving(true);
    try { await upsertBudgetConfig(period, amount); router.refresh(); setEditingTotal(false); }
    finally { setSaving(false); }
  };

  const switchPeriod = (p: Period) => {
    setPeriod(p);
    setEditingTotal(false);
    setEditingCat(null);
    setAddingItem(false);
  };

  const saveCatBudget = async (cat: string, raw: string) => {
    const amount = parseRaw(raw);
    if (amount <= 0) return;
    setSaving(true);
    try {
      await upsertBudget(cat, amount, period);
      router.refresh();
      setEditingCat(null);
      setAddingItem(false);
      setNewCat(""); setNewCatCustom(""); setNewCatAmount("");
    } finally { setSaving(false); }
  };

  // ── Category analysis ──
  const analysisRows = finances.filter(f => f.type === analysisType && f.date.startsWith(analysisYear));
  const byCat: Record<string, number> = {};
  for (const f of analysisRows) byCat[f.category] = (byCat[f.category] || 0) + f.amount;
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const totalAnalysis = catEntries.reduce((s, [, v]) => s + v, 0);
  const donutSlices = catEntries.map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }));

  // ── Month data ──
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("es-CO", { month: "short" }).replace(".", "").slice(0, 3),
      full: d.toLocaleString("es-CO", { month: "long", year: "numeric" }),
    };
  });
  const monthData = months.map(({ ym, label, full }) => {
    const mf = finances.filter(f => f.date.startsWith(ym));
    const income = mf.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amount, 0);
    const expense = mf.filter(f => f.type === "egreso").reduce((s, f) => s + f.amount, 0);
    return { ym, label, full, income, expense, balance: income - expense };
  });

  const years = [...new Set(finances.map(f => f.date.slice(0, 4)))].sort().reverse();

  // ── Edit category warning ──
  const editWarn = editingCat
    ? overallExceedWarning(parseRaw(editAmount), budgetMap[editingCat] || 0)
    : null;
  const addWarn = addingItem
    ? overallExceedWarning(parseRaw(newCatAmount), 0)
    : null;

  return (
    <div className="flex flex-col gap-5">

      {/* ── PRESUPUESTO ─────────────────────────────────────────────────── */}
      <div className={card}>
        {/* Period selector */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <div className="text-sm font-medium">Presupuesto {PERIOD_LABELS[period].toLowerCase()}</div>
            <div className="text-xs text-dim capitalize">{periodSubLabel(period, now)}</div>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-line text-xs">
            {(["semanal", "mensual", "anual"] as Period[]).map(p => (
              <button key={p} onClick={() => switchPeriod(p)} className="px-3 py-1.5 border-none cursor-pointer"
                style={period === p ? { background: "var(--accent)", color: "var(--accentFg)" } : { background: "var(--panel2)", color: "var(--muted)" }}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Total + 3-column summary */}
        {totalAmount > 0 ? (
          <div className="mb-5">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-panel2 rounded-xl p-3">
                <div className="text-xs text-dim mb-1">Disponible</div>
                <div className={`text-base font-medium font-mono ${overallOver ? "text-neg" : "text-pos"}`}>
                  {privacy ? "••••" : COP(Math.max(0, totalAmount - totalSpent))}
                </div>
              </div>
              <div className="bg-panel2 rounded-xl p-3">
                <div className="text-xs text-dim mb-1">Gastado</div>
                <div className={`text-base font-medium font-mono ${overallOver ? "text-neg" : "text-fg"}`}>
                  {privacy ? "••••" : COP(totalSpent)}
                </div>
              </div>
              <div className="bg-panel2 rounded-xl p-3">
                <div className="text-xs text-dim mb-1">Presupuesto</div>
                <div className="flex items-center gap-2">
                  {editingTotal ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <MoneyInput value={totalInput} onChange={setTotalInput} className={`${inputSm} w-28`} placeholder="0" />
                      <button onClick={() => saveTotal(totalInput)} disabled={saving} className="text-xs text-accent bg-transparent border-none cursor-pointer">✓</button>
                      <button onClick={() => setEditingTotal(false)} className="text-xs text-muted bg-transparent border-none cursor-pointer">✕</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-base font-medium font-mono">{privacy ? "••••" : COP(totalAmount)}</span>
                      <button onClick={() => { setEditingTotal(true); setTotalInput(String(Math.round(totalAmount))); }}
                        className="text-xs text-accent bg-transparent border-none cursor-pointer shrink-0">Editar</button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {overallOver && (
              <div className="text-xs text-neg mb-2 font-medium">
                ⚠ Excediste el presupuesto por {COP(totalSpent - totalAmount)}
              </div>
            )}
            <ProgressBar pct={overallPct} over={overallOver} />
            <div className="flex justify-between text-xs text-dim mt-1">
              <span>{(Math.min(overallPct, 1) * 100).toFixed(1)}% utilizado</span>
              {!overallOver && totalAmount > 0 && <span>Quedan {COP(totalAmount - totalSpent)}</span>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="text-sm text-muted">Sin presupuesto {PERIOD_LABELS[period].toLowerCase()} — cada periodo tiene el suyo</span>
            {!editingTotal ? (
              <button onClick={() => { setEditingTotal(true); setTotalInput(""); }}
                className="text-xs text-accent border border-line rounded-lg px-3 py-1.5 cursor-pointer bg-panel2">
                Definir presupuesto
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <MoneyInput value={totalInput} onChange={setTotalInput} className={`${inputSm} w-36`} placeholder="Monto total" />
                <button onClick={() => saveTotal(totalInput)} disabled={saving} className="text-xs text-accent bg-transparent border-none cursor-pointer">✓</button>
                <button onClick={() => setEditingTotal(false)} className="text-xs text-muted bg-transparent border-none cursor-pointer">✕</button>
              </div>
            )}
          </div>
        )}

        {/* Category breakdown */}
        <div className="border-t border-line pt-4">
          <div className="text-xs text-dim uppercase tracking-wide mb-3">Por categoría</div>

          {allBudgetCats.length === 0 && (
            <p className="text-xs text-muted mb-3">Agrega categorías para distribuir tu presupuesto.</p>
          )}

          <div className="flex flex-col gap-4">
            {allBudgetCats.map(cat => {
              const budget = budgetMap[cat] || 0;
              const spent = spentByCat[cat] || 0;
              const pct = budget > 0 ? spent / budget : 0;
              const over = budget > 0 && spent > budget;
              const near = !over && pct > 0.8;
              const isEditing = editingCat === cat;
              const editParsed = parseRaw(editAmount);
              const warn = isEditing ? overallExceedWarning(editParsed, budget) : null;

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{cat}</span>
                      {over && <span className="text-xs text-neg shrink-0">⚠ Excedido</span>}
                      {near && !over && <span className="text-xs" style={{ color: "#f59e0b" }}>⚡ Cerca del límite</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <MoneyInput value={editAmount} onChange={setEditAmount} className={`${inputSm} w-28`} placeholder="0" />
                          <button onClick={() => saveCatBudget(cat, editAmount)} disabled={saving} className="text-xs text-accent bg-transparent border-none cursor-pointer">✓</button>
                          <button onClick={() => setEditingCat(null)} className="text-xs text-muted bg-transparent border-none cursor-pointer">✕</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => { setEditingCat(cat); setEditAmount(budget > 0 ? String(Math.round(budget)) : ""); }}
                            className="text-xs text-accent border border-line rounded px-1.5 py-0.5 cursor-pointer bg-panel2">
                            {budget > 0 ? "Editar" : "+ Límite"}
                          </button>
                          {budget > 0 && (
                            <button onClick={async () => { await deleteBudget(canonicalToDbCat[cat] ?? cat, period); router.refresh(); }}
                              className="text-xs text-neg bg-transparent border-none cursor-pointer">✕</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {warn && <div className="text-xs text-neg mb-1">⚠ {warn}</div>}

                  {budget > 0 ? (
                    <>
                      <ProgressBar pct={pct} over={over} />
                      <div className="flex justify-between text-xs text-dim mt-1">
                        <span className={over ? "text-neg" : near ? "" : ""}
                          style={near && !over ? { color: "#f59e0b" } : {}}>
                          {privacy ? "••••" : COP(spent)} gastado
                        </span>
                        <span>{privacy ? "••••" : COP(budget)} límite</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-dim">
                      {privacy ? "••••" : COP(spent)} gastado · Sin límite definido
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned */}
            {unassigned > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-line border-dashed">
                <span className="text-xs text-dim">Sin asignar a categorías</span>
                <span className="text-xs font-mono text-muted">{privacy ? "••••" : COP(unassigned)}</span>
              </div>
            )}

            {totalAssigned > totalAmount && totalAmount > 0 && (
              <div className="text-xs text-neg pt-1">
                ⚠ Las categorías suman {COP(totalAssigned)}, superando el presupuesto total de {COP(totalAmount)}
              </div>
            )}

            {/* Add category */}
            <div className="pt-1">
              {addingItem ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={newCat} onChange={e => setNewCat(e.target.value)} autoFocus
                      className={`${inputSm} flex-1 min-w-32 cursor-pointer`}>
                      <option value="">— Categoría —</option>
                      {selectorCats.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__other__">Otra…</option>
                    </select>
                    {newCat === "__other__" && (
                      <input value={newCatCustom} onChange={e => setNewCatCustom(e.target.value)}
                        placeholder="Nombre de categoría" className={`${inputSm} flex-1 min-w-28`} />
                    )}
                    <MoneyInput value={newCatAmount} onChange={setNewCatAmount} className={`${inputSm} w-28`} placeholder="Límite" />
                    <button
                      onClick={() => { const cat = newCat === "__other__" ? newCatCustom : newCat; if (cat) saveCatBudget(cat, newCatAmount); }}
                      disabled={saving || !newCat || (newCat === "__other__" && !newCatCustom) || !newCatAmount}
                      className="text-xs text-accent bg-transparent border-none cursor-pointer disabled:opacity-40">✓</button>
                    <button onClick={() => { setAddingItem(false); setNewCat(""); setNewCatCustom(""); setNewCatAmount(""); }}
                      className="text-xs text-muted bg-transparent border-none cursor-pointer">✕</button>
                  </div>
                  {addWarn && <div className="text-xs text-neg">⚠ {addWarn}</div>}
                </div>
              ) : (
                <button onClick={() => setAddingItem(true)}
                  className="text-xs text-accent border border-line rounded-lg px-3 py-1.5 cursor-pointer bg-panel2">
                  + Agregar categoría
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── DISTRIBUCIÓN POR CATEGORÍA ──────────────────────────────────── */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="text-sm font-medium">Distribución por categoría</div>
          <div className="flex gap-2 items-center">
            {years.length > 0 && (
              <select value={analysisYear} onChange={e => setAnalysisYear(e.target.value)}
                className="h-8 px-2 rounded-lg border border-line bg-panel2 text-fg text-xs outline-none cursor-pointer">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            <div className="flex rounded-lg overflow-hidden border border-line text-xs">
              {(["egreso", "ingreso"] as const).map(t => (
                <button key={t} onClick={() => setAnalysisType(t)} className="px-3 py-1.5 border-none cursor-pointer"
                  style={analysisType === t ? { background: "var(--accent)", color: "var(--accentFg)" } : { background: "var(--panel2)", color: "var(--muted)" }}>
                  {t === "egreso" ? "Egresos" : "Ingresos"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {catEntries.length === 0 ? (
          <p className="text-sm text-muted">Sin datos para el periodo.</p>
        ) : (
          <div className="flex gap-6 items-start flex-wrap">
            {mounted && <DonutChart slices={donutSlices} size={160} />}
            <div className="flex-1 min-w-48 flex flex-col gap-2">
              {catEntries.slice(0, 10).map(([cat, val], i) => {
                const color = COLORS[i % COLORS.length];
                const pct = (val / totalAnalysis) * 100;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
                        <span className="text-fg">{cat}</span>
                      </div>
                      <span className="text-muted font-mono">
                        {privacy ? "••••" : COP(val)}
                        <span className="text-dim"> ({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-panel2">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── COMPARATIVO MES A MES ────────────────────────────────────────── */}
      <div className={card}>
        <div className="text-sm font-medium mb-4">Comparativo mes a mes</div>
        <MonthBarChart data={monthData} />
        <div className="flex gap-4 mt-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--pos)" }} />Ingresos
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--neg)" }} />Egresos
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 480 }}>
            <thead>
              <tr>
                {["Mes", "Ingresos", "Egresos", "Balance", "Ahorro"].map((h, i) => (
                  <th key={h} className={`text-xs text-dim font-medium pb-2 ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...monthData].reverse().map(d => {
                const hasTx = d.income > 0 || d.expense > 0;
                const savingRate = d.income > 0 ? (d.balance / d.income) * 100 : null;
                return (
                  <tr key={d.ym}>
                    <td className="py-2 border-t border-line text-sm capitalize">{d.full}</td>
                    <td className="py-2 border-t border-line text-sm text-right font-mono text-pos">
                      {hasTx && d.income > 0 ? (privacy ? "••••" : COP(d.income)) : "—"}
                    </td>
                    <td className="py-2 border-t border-line text-sm text-right font-mono text-neg">
                      {hasTx && d.expense > 0 ? (privacy ? "••••" : COP(d.expense)) : "—"}
                    </td>
                    <td className={`py-2 border-t border-line text-sm text-right font-mono ${d.balance >= 0 ? "text-pos" : "text-neg"}`}>
                      {hasTx ? (privacy ? "••••" : COP(d.balance)) : "—"}
                    </td>
                    <td className="py-2 border-t border-line text-sm text-right text-muted">
                      {savingRate !== null ? `${savingRate.toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
