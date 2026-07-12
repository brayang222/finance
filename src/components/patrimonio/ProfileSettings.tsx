"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserConfig, Category, ShareInfo, Finance, Transfer } from "../../types";
import {
  updateModules,
  addCategory,
  deleteCategory,
  saveCurrency,
  refreshTrm,
  saveSummaryWidgets,
  inviteShare,
  acceptShare,
  revokeShare,
  saveTelegramId,
} from "../../../lib/actions";
import { fieldClass } from "./ModalShell";
import { COP } from "../../data/mock";

const MODULE_OPTIONS = [
  { key: "showCommerce", label: "Perfil de comercio",      sub: "Ventas, inventario y clientes" },
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

export default function ProfileSettings({
  config, categories, sharesGiven = [], sharesReceived = [],
  finances = [], transfers = [],
}: {
  config: UserConfig | null;
  categories: Category[];
  sharesGiven?: ShareInfo[];
  sharesReceived?: ShareInfo[];
  finances?: Finance[];
  transfers?: Transfer[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // ── Modules ──
  const [mods, setMods] = useState({
    showCommerce: config?.showCommerce ?? false,
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

  // ── Telegram ──
  const [tgId, setTgId]       = useState(config?.telegramId ?? "");
  const [tgBusy, setTgBusy]   = useState(false);
  const [tgSaved, setTgSaved] = useState(false);
  const handleSaveTg = async () => {
    setTgBusy(true);
    await saveTelegramId(tgId.trim());
    setTgSaved(true);
    setTimeout(() => setTgSaved(false), 2000);
    setTgBusy(false);
  };

  // ── Sharing ──
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteBusy, setInviteBusy]     = useState(false);
  const [inviteError, setInviteError]   = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [shareTab, setShareTab]         = useState<"given" | "received">("received");

  const pendingReceived = sharesReceived.filter(s => s.status === "pending");
  const acceptedReceived = sharesReceived.filter(s => s.status === "accepted");

  // ── Profile top tabs ──
  const [profileTab, setProfileTab] = useState<"config" | "tributario">("config");

  // ── DIAN Tributario ──
  // DIAN mide "consignaciones bancarias": cada depósito/crédito que ENTRA a una cuenta.
  // Egresos NO suman (dinero sale). Transferencias SÍ (dinero entra a la cuenta destino).
  // Período = año gravable (calendario).
  const currentYear = new Date().getFullYear();
  const yearStr = String(currentYear);

  const yearFinances = finances.filter(f => f.date.startsWith(yearStr));
  const yearTransfers = transfers.filter(t => t.date.startsWith(yearStr));

  const totalIngresos = yearFinances.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amount, 0);
  const totalTransfers = yearTransfers.reduce((s, t) => s + t.amount, 0);
  // ponytail: consignaciones = ingresos + transferencias (cada entrada a cuenta). Egresos no cuentan.
  const consignaciones = totalIngresos + totalTransfers;
  const DIAN_THRESHOLD = 69_718_000;
  const rotacionPct = Math.min((consignaciones / DIAN_THRESHOLD) * 100, 100);
  const debeDeclarar = consignaciones >= DIAN_THRESHOLD;

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || inviteBusy) return;
    setInviteBusy(true);
    setInviteError("");
    setInviteSuccess(false);
    try {
      await inviteShare(email);
      setInviteEmail("");
      setInviteSuccess(true);
      router.refresh();
    } catch {
      setInviteError("No se pudo enviar. Verifica el correo.");
    } finally {
      setInviteBusy(false);
    }
  };

  const handleAccept = async (id: string) => {
    await acceptShare(id);
    router.refresh();
  };

  const handleRevoke = async (id: string) => {
    await revokeShare(id);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Profile tabs */}
      <div className="flex bg-panel2 rounded-xl p-[3px] border border-line">
        {([["config", "Configuración"], ["tributario", "Tributario"]] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setProfileTab(tab)}
            className={[
              "flex-1 h-[34px] rounded-[9px] border-none cursor-pointer text-[13px] font-medium transition-colors",
              profileTab === tab ? "bg-accent text-accentFg" : "bg-transparent text-muted",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {profileTab === "tributario" && (
        <>
          {/* DIAN Consignaciones */}
          <div className={cardClass}>
            <div className={cardTitle}>Consignaciones {currentYear}</div>
            <div className="text-xs text-muted -mt-2">
              La DIAN suma cada depósito que entra a tus cuentas. Si supera ~$69.7M COP en el año, debes declarar renta.
            </div>

            {/* Progress bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="text-[22px] font-semibold tabular-nums">{COP(consignaciones)}</div>
                <div className="text-xs text-muted">de {COP(DIAN_THRESHOLD)}</div>
              </div>
              <div className="h-3 rounded-full bg-panel2 border border-line overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${debeDeclarar ? "bg-red-500" : rotacionPct > 70 ? "bg-amber-400" : "bg-accent"}`}
                  style={{ width: `${rotacionPct}%` }}
                />
              </div>
              <div className={`text-[13px] font-medium ${debeDeclarar ? "text-red-400" : rotacionPct > 70 ? "text-amber-400" : "text-pos"}`}>
                {debeDeclarar
                  ? "Superas el umbral — debes declarar renta"
                  : `${rotacionPct.toFixed(1)}% del umbral`}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className={cardClass}>
            <div className={cardTitle}>Desglose</div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Ingresos recibidos", sub: "Dinero que entró a tus cuentas", value: totalIngresos, color: "text-pos" },
                { label: "Transferencias entre cuentas", sub: "Cada movimiento cuenta como consignación", value: totalTransfers, color: "text-accent" },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[13.5px]">{r.label}</span>
                    <div className="text-[11px] text-dim">{r.sub}</div>
                  </div>
                  <span className={`text-[14px] font-medium tabular-nums shrink-0 ${r.color}`}>{COP(r.value)}</span>
                </div>
              ))}
              <div className="border-t border-line pt-3 flex items-center justify-between">
                <span className="text-[13.5px] font-medium">Total consignaciones</span>
                <span className="text-[15px] font-semibold tabular-nums">{COP(consignaciones)}</span>
              </div>
            </div>
          </div>

          {/* Monthly breakdown */}
          <div className={cardClass}>
            <div className={cardTitle}>Por mes</div>
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 12 }, (_, i) => {
                const mm = String(i + 1).padStart(2, "0");
                const prefix = `${yearStr}-${mm}`;
                const mFin = yearFinances.filter(f => f.type === "ingreso" && f.date.startsWith(prefix)).reduce((s, f) => s + f.amount, 0);
                const mTr = yearTransfers.filter(t => t.date.startsWith(prefix)).reduce((s, t) => s + t.amount, 0);
                const mTotal = mFin + mTr;
                if (mTotal === 0) return null;
                const monthName = new Date(currentYear, i).toLocaleString("es-CO", { month: "short" });
                const barW = consignaciones > 0 ? (mTotal / consignaciones) * 100 : 0;
                return (
                  <div key={mm} className="flex items-center gap-3">
                    <span className="text-[12px] text-muted w-8 shrink-0 capitalize">{monthName}</span>
                    <div className="flex-1 h-5 bg-panel2 rounded overflow-hidden">
                      <div className="h-full bg-accent/60 rounded" style={{ width: `${barW}%` }} />
                    </div>
                    <span className="text-[12px] tabular-nums text-muted w-24 text-right shrink-0">{COP(mTotal)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-line bg-panel2/50 px-4 py-3 text-[12px] text-dim leading-relaxed">
            Este cálculo solo incluye los movimientos registrados en la app.
            Tu cifra real puede ser mayor si tienes consignaciones en cuentas bancarias que no registraste aquí.
            Consulta tus extractos bancarios o el portal de la DIAN para verificar el dato exacto.
            El umbral de 1.400 UVT puede variar cada año.
          </div>
        </>
      )}

      {profileTab === "config" && <>
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
            <div className="text-xs text-muted mt-0.5" suppressHydrationWarning>
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
      {/* Sharing */}
      <div className={cardClass}>
        <div className={cardTitle}>Acceso compartido</div>

        {/* Pending invites received */}
        {pendingReceived.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[12px] text-amber-300 font-medium">Invitaciones pendientes</div>
            {pendingReceived.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 bg-panel2 rounded-xl px-3.5 py-2.5">
                <div>
                  <div className="text-[13px] font-medium">{s.ownerName ?? s.guestEmail}</div>
                  <div className="text-xs text-muted">quiere compartir sus finanzas contigo</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(s.id)}
                    className="h-8 px-3 rounded-lg bg-accent text-accentFg text-xs font-medium border-none cursor-pointer"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleRevoke(s.id)}
                    className="h-8 px-3 rounded-lg border border-line bg-transparent text-muted text-xs cursor-pointer"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-panel2 rounded-xl p-[3px] w-fit">
          {([["received", "Tengo acceso a"], ["given", "Comparto mis datos"]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setShareTab(tab)}
              className={[
                "h-[30px] px-3 rounded-[9px] border-none cursor-pointer text-[12px] font-medium whitespace-nowrap",
                shareTab === tab ? "bg-accent text-accentFg" : "bg-transparent text-muted",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {shareTab === "received" && (
          <div className="flex flex-col gap-2">
            {acceptedReceived.length === 0 && (
              <p className="text-xs text-dim">Nadie ha compartido sus finanzas contigo aún.</p>
            )}
            {acceptedReceived.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 bg-panel2 rounded-xl px-3.5 py-2.5">
                <div>
                  <div className="text-[13px] font-medium">{s.ownerName ?? s.guestEmail}</div>
                  <div className="text-xs text-muted capitalize">{s.role}</div>
                </div>
                <button
                  onClick={() => handleRevoke(s.id)}
                  className="h-7 px-2.5 rounded-lg border border-line bg-transparent text-red-400 text-xs cursor-pointer"
                >
                  Salir
                </button>
              </div>
            ))}
          </div>
        )}

        {shareTab === "given" && (
          <div className="flex flex-col gap-3">
            {sharesGiven.length === 0 && (
              <p className="text-xs text-dim">Aún no has compartido tus finanzas con nadie.</p>
            )}
            {sharesGiven.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 bg-panel2 rounded-xl px-3.5 py-2.5">
                <div>
                  <div className="text-[13px] font-medium">{s.guestName ?? s.guestEmail}</div>
                  <div className={["text-xs capitalize", s.status === "pending" ? "text-amber-300" : "text-muted"].join(" ")}>
                    {s.status === "pending" ? "Pendiente de aceptar" : "Aceptado"}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(s.id)}
                  className="h-7 px-2.5 rounded-lg border border-line bg-transparent text-red-400 text-xs cursor-pointer"
                >
                  Revocar
                </button>
              </div>
            ))}

            <div className="border-t border-line pt-3">
              <div className="text-[12.5px] text-muted mb-2">Invitar a alguien por correo</div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => { setInviteEmail(e.target.value); setInviteError(""); setInviteSuccess(false); }}
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  placeholder="correo@ejemplo.com"
                  className={`${fieldClass} flex-1`}
                />
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteBusy}
                  className="h-[38px] px-4 bg-accent text-accentFg rounded-[10px] text-[13px] font-medium border-none cursor-pointer disabled:opacity-40 shrink-0"
                >
                  {inviteBusy ? "…" : "Invitar"}
                </button>
              </div>
              {inviteError && <p className="text-xs text-red-400 mt-1.5">{inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-emerald-400 mt-1.5">Invitación enviada. Dile que revise su perfil.</p>}
              <p className="text-[11px] text-dim mt-1.5">La persona debe tener cuenta en Patrimonio. Verá tus datos en modo lectura.</p>
            </div>
          </div>
        )}
      </div>

      {/* Telegram bot */}
      <div className={cardClass}>
        <div className={cardTitle}>Bot de Telegram</div>
        <div className="text-[12.5px] text-muted -mt-2">
          Registra gastos desde Telegram. Busca <strong>@PatrimonioBot</strong>, escribe <code>/start</code> y vincula tu ID aquí.
        </div>
        <div>
          <label className="block text-[12px] text-dim mb-1.5 font-medium tracking-wide uppercase">Tu Telegram ID</label>
          <div className="flex gap-2">
            <input
              value={tgId}
              onChange={e => setTgId(e.target.value)}
              placeholder="Ej. 123456789"
              className={`${fieldClass} flex-1`}
            />
            <button
              onClick={handleSaveTg}
              disabled={tgBusy}
              className="h-[38px] px-4 bg-accent text-accentFg rounded-[10px] text-[13px] font-medium border-none cursor-pointer disabled:opacity-40 shrink-0"
            >
              {tgSaved ? "Guardado ✓" : tgBusy ? "…" : "Guardar"}
            </button>
          </div>
          <p className="text-[11px] text-dim mt-1.5">Para obtener tu ID escríbele a @userinfobot en Telegram.</p>
        </div>
        <div className="rounded-xl border border-line px-3.5 py-2.5 text-[12.5px] text-muted">
          <div className="font-medium mb-0.5">Comandos disponibles</div>
          <div className="text-[12px] text-dim flex flex-col gap-0.5 mt-1">
            <div><code>35000 almuerzo</code> → egreso</div>
            <div><code>+2500000 salario</code> → ingreso</div>
            <div><code>/saldo</code> → ver balance neto</div>
          </div>
        </div>
      </div>
      </>}
    </div>
  );
}
