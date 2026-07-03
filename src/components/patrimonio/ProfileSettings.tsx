"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserConfig, Category } from "../../types";
import {
  updateModules,
  addCategory,
  deleteCategory,
  saveCurrency,
  refreshTrm,
  saveSummaryWidgets,
} from "../../../lib/actions";
import { fieldClass } from "./ModalShell";

const MODULE_OPTIONS = [
  { key: "showStocks",   label: "Portafolio de acciones",  sub: "Bolsa de valores y BVC" },
  { key: "showCrypto",   label: "Criptomonedas",           sub: "Bitcoin, Ethereum y activos digitales" },
  { key: "showHys",      label: "Alto rendimiento",        sub: "Cuenta con intereses" },
  { key: "showGoals",    label: "Metas de ahorro",         sub: "Objetivos con progreso y fechas" },
  { key: "showActivity", label: "Historial de actividad",  sub: "Registro de acciones en la app" },
] as const;

export const SUMMARY_WIDGETS = [
  { key: "hero",       label: "Patrimonio total" },
  { key: "kpis",       label: "Indicadores rápidos" },
  { key: "goals",      label: "Metas de ahorro" },
  { key: "chart",      label: "Evolución del patrimonio" },
  { key: "allocation", label: "Asignación del portafolio" },
  { key: "cashflow",   label: "Ingresos vs. egresos" },
  { key: "recent",     label: "Movimientos recientes" },
] as const;

export const DEFAULT_WIDGET_KEYS = SUMMARY_WIDGETS.map(w => w.key as string);

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={[
        "relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors shrink-0",
        on ? "bg-accent" : "bg-panel2 border border-line",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all",
          on ? "left-[22px]" : "left-[3px]",
        ].join(" ")}
      />
    </button>
  );
}

const cardClass = "border border-line bg-panel rounded-[18px] p-[22px] flex flex-col gap-4";
const cardTitle = "text-[11.5px] tracking-[0.08em] uppercase text-dim font-medium";

export default function ProfileSettings({ config, categories }: { config: UserConfig | null; categories: Category[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // ── Modules ──
  const [mods, setMods] = useState({
    showStocks:   config?.showStocks   ?? true,
    showCrypto:   config?.showCrypto   ?? true,
    showHys:      config?.showHys      ?? true,
    showGoals:    config?.showGoals    ?? true,
    showActivity: config?.showActivity ?? true,
  });

  const toggleModule = (key: keyof typeof mods) => {
    const next = { ...mods, [key]: !mods[key] };
    setMods(next);
    startTransition(async () => {
      await updateModules(next);
      router.refresh();
    });
  };

  // ── Currency / TRM ──
  const [currency, setCurrency] = useState<"COP" | "USD">(config?.baseCurrency ?? "COP");
  const [trm, setTrm] = useState(config?.trm ?? null);
  const [trmAt, setTrmAt] = useState(config?.trmUpdatedAt ?? null);
  const [trmBusy, setTrmBusy] = useState(false);
  const [trmError, setTrmError] = useState("");

  const switchCurrency = (c: "COP" | "USD") => {
    setCurrency(c);
    startTransition(async () => {
      await saveCurrency(c);
      router.refresh();
    });
  };

  const handleRefreshTrm = async () => {
    setTrmBusy(true);
    setTrmError("");
    try {
      const value = await refreshTrm();
      setTrm(value);
      setTrmAt(new Date().toISOString());
      router.refresh();
    } catch {
      setTrmError("No se pudo actualizar. Intenta de nuevo.");
    } finally {
      setTrmBusy(false);
    }
  };

  // ── Summary widgets ──
  // Ordered list: saved enabled keys first (in order), then the disabled rest
  const savedKeys = config?.summaryWidgets ?? DEFAULT_WIDGET_KEYS;
  const initialOrder = [
    ...savedKeys.filter(k => DEFAULT_WIDGET_KEYS.includes(k)),
    ...DEFAULT_WIDGET_KEYS.filter(k => !savedKeys.includes(k)),
  ].map(key => ({ key, enabled: savedKeys.includes(key) }));

  const [widgets, setWidgets] = useState(initialOrder);

  const persistWidgets = (next: typeof widgets) => {
    setWidgets(next);
    startTransition(async () => {
      await saveSummaryWidgets(next.filter(w => w.enabled).map(w => w.key));
      router.refresh();
    });
  };

  const toggleWidget = (key: string) =>
    persistWidgets(widgets.map(w => w.key === key ? { ...w, enabled: !w.enabled } : w));

  const moveWidget = (key: string, dir: -1 | 1) => {
    const idx = widgets.findIndex(w => w.key === key);
    const target = idx + dir;
    if (target < 0 || target >= widgets.length) return;
    const next = [...widgets];
    [next[idx], next[target]] = [next[target], next[idx]];
    persistWidgets(next);
  };

  // ── Categories ──
  const [catTab, setCatTab] = useState<"egreso" | "ingreso">("egreso");
  const [newCat, setNewCat] = useState("");
  const [catBusy, setCatBusy] = useState(false);

  const visibleCats = categories.filter(c => c.type === catTab);

  const handleAdd = async () => {
    const name = newCat.trim();
    if (!name || catBusy) return;
    setCatBusy(true);
    await addCategory(name, catTab);
    setNewCat("");
    router.refresh();
    setCatBusy(false);
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    router.refresh();
  };

  const trmAgeLabel = trmAt
    ? new Date(trmAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Currency */}
      <div className={cardClass}>
        <div className={cardTitle}>Moneda</div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[13.5px] font-medium">Moneda principal</div>
            <div className="text-xs text-muted mt-0.5">Cómo ves tu patrimonio en el resumen</div>
          </div>
          <div className="flex bg-panel2 rounded-xl p-[3px]">
            {(["COP", "USD"] as const).map(c => (
              <button
                key={c}
                onClick={() => switchCurrency(c)}
                className={[
                  "h-[30px] px-4 rounded-[9px] border-none cursor-pointer text-[12.5px] font-medium",
                  currency === c ? "bg-accent text-accentFg" : "bg-transparent text-muted",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
          <div>
            <div className="text-[13.5px] font-medium">
              TRM {trm ? `· $${Math.round(trm).toLocaleString("es-CO")}` : "· sin datos"}
            </div>
            <div className="text-xs text-muted mt-0.5">
              {trmError || (trmAgeLabel ? `Actualizada ${trmAgeLabel}` : "Tasa USD → COP para conversiones")}
            </div>
          </div>
          <button
            onClick={handleRefreshTrm}
            disabled={trmBusy}
            className="h-8 px-3.5 rounded-lg border border-line bg-panel2 text-muted text-xs font-medium cursor-pointer disabled:opacity-50 shrink-0"
          >
            {trmBusy ? "Consultando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {/* Module toggles */}
      <div className={cardClass}>
        <div className={cardTitle}>Módulos activos</div>
        {MODULE_OPTIONS.map(({ key, label, sub }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[13.5px] font-medium">{label}</div>
              <div className="text-xs text-muted mt-0.5">{sub}</div>
            </div>
            <Toggle on={mods[key]} onToggle={() => toggleModule(key)} />
          </div>
        ))}
      </div>

      {/* Summary widgets */}
      <div className={cardClass}>
        <div className={cardTitle}>Mi resumen</div>
        <div className="text-xs text-muted -mt-2">Elige qué ves en el resumen y en qué orden.</div>
        <div className="flex flex-col gap-1.5">
          {widgets.map((w, i) => {
            const meta = SUMMARY_WIDGETS.find(s => s.key === w.key)!;
            return (
              <div
                key={w.key}
                className={[
                  "flex items-center gap-3 rounded-xl border px-3.5 py-2.5",
                  w.enabled ? "border-line bg-panel2" : "border-transparent bg-transparent opacity-50",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={w.enabled}
                  onChange={() => toggleWidget(w.key)}
                  className="w-4 h-4 accent-accent shrink-0 cursor-pointer"
                />
                <span className="text-[13px] flex-1">{meta.label}</span>
                <button
                  onClick={() => moveWidget(w.key, -1)}
                  disabled={i === 0}
                  className="w-6 h-6 rounded border border-line bg-panel text-muted text-xs cursor-pointer disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveWidget(w.key, 1)}
                  disabled={i === widgets.length - 1}
                  className="w-6 h-6 rounded border border-line bg-panel text-muted text-xs cursor-pointer disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category management */}
      <div className={cardClass}>
        <div className={cardTitle}>Mis categorías</div>

        <div className="flex bg-panel2 rounded-xl p-[3px] w-fit">
          {(["egreso", "ingreso"] as const).map(t => (
            <button
              key={t}
              onClick={() => setCatTab(t)}
              className={[
                "h-[30px] px-4 rounded-[9px] border-none cursor-pointer text-[12.5px] font-medium",
                catTab === t ? "bg-accent text-accentFg" : "bg-transparent text-muted",
              ].join(" ")}
            >
              {t === "egreso" ? "Gastos" : "Ingresos"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleCats.map(cat => (
            <span key={cat.id} className="flex items-center gap-1.5 bg-panel2 rounded-lg px-3 py-1.5 text-[12.5px]">
              {cat.name}
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-dim hover:text-neg border-none bg-transparent cursor-pointer p-0 text-xs leading-none"
              >
                ✕
              </button>
            </span>
          ))}
          {visibleCats.length === 0 && (
            <span className="text-[12.5px] text-dim">Sin categorías. Agrega una abajo.</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder={catTab === "egreso" ? "Ej. Mascotas" : "Ej. Renta"}
            className={`${fieldClass} flex-1`}
          />
          <button
            onClick={handleAdd}
            disabled={!newCat.trim() || catBusy}
            className="h-[38px] px-4 bg-accent text-accentFg rounded-[10px] text-[13px] font-medium border-none cursor-pointer disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
