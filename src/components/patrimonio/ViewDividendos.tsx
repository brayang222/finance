"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AllData, DividendSchedule } from "../../types";
import { addDividendSchedule, updateDividendSchedule, deleteDividendSchedule } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { toAssets } from "./transforms";
import { usePrivacy } from "./PrivacyContext";

const COP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function ViewDividendos({ initialData }: { initialData: AllData }) {
  const router = useRouter();
  const privacy = usePrivacy();

  const schedules  = initialData.dividendSchedules ?? [];
  const historical = initialData.dividends ?? [];
  const holdings   = toAssets(initialData.stocks, initialData.prices);
  const trm        = initialData.config?.trm ?? null;

  const [filterTicker, setFilterTicker] = useState<string>("all");
  const [view,         setView]         = useState<"calendar" | "list">("calendar");
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState<DividendSchedule | undefined>();

  // Today date string
  const today = new Date().toISOString().slice(0, 10);

  // All tickers with scheduled dividends or past dividends
  const allTickers = useMemo(() => {
    const s = new Set([...schedules.map(d => d.ticker), ...historical.map(d => d.ticker)]);
    return Array.from(s).sort();
  }, [schedules, historical]);

  // Shares held per ticker (from current holdings)
  const sharesMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of holdings) {
      const t = h.ticker.toUpperCase();
      m[t] = (m[t] || 0) + h.qty;
    }
    return m;
  }, [holdings]);

  const filtered = useMemo(() => {
    if (filterTicker === "all") return schedules;
    return schedules.filter(d => d.ticker.toUpperCase() === filterTicker.toUpperCase());
  }, [schedules, filterTicker]);

  // Build months for calendar (current + next 5)
  const calMonths = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}` };
    });
  }, []);

  // Schedule events indexed by "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const m: Record<string, DividendSchedule[]> = {};
    for (const s of filtered) {
      const key = s.expectedDate.slice(0, 10);
      if (!m[key]) m[key] = [];
      m[key].push(s);
    }
    return m;
  }, [filtered]);

  const openAdd  = () => { setEditItem(undefined); setShowModal(true); };
  const openEdit = (d: DividendSchedule) => { setEditItem(d); setShowModal(true); };
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este dividendo programado?")) return;
    await deleteDividendSchedule(id);
    router.refresh();
  };

  // Compute expected income per schedule item
  const expectedIncome = (s: DividendSchedule) => {
    const shares = sharesMap[s.ticker.toUpperCase()] ?? 0;
    if (!s.perShare || shares === 0) return null;
    return s.perShare * shares;
  };

  const totalExpectedCOP = filtered.reduce((sum, s) => {
    const inc = expectedIncome(s);
    return sum + (inc ?? 0);
  }, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-1">
            Dividendos esperados
          </div>
          <div className="text-[28px] font-medium tabular-nums" style={{ fontFamily: "Spectral, serif" }}>
            {privacy ? "••••••" : COP(totalExpectedCOP)}
            <span className="text-[14px] text-dim font-normal ml-2">próximos</span>
          </div>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex bg-panel2 rounded-[10px] p-[3px] gap-0.5">
            {(["calendar", "list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={[
                  "px-3 py-[5px] rounded-[8px] text-[12px] border-none cursor-pointer font-medium",
                  view === v ? "bg-accent text-accentFg" : "bg-transparent text-muted",
                ].join(" ")}
              >
                {v === "calendar" ? "Calendario" : "Lista"}
              </button>
            ))}
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accentFg border-none cursor-pointer text-[13px] font-medium"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Ticker filter */}
      {allTickers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...allTickers].map(t => (
            <button
              key={t}
              onClick={() => setFilterTicker(t)}
              className={[
                "px-3 py-1.5 rounded-full text-[12px] border-none cursor-pointer font-medium",
                filterTicker === t ? "bg-accent text-accentFg" : "bg-panel2 text-muted",
              ].join(" ")}
              style={t !== "all" ? { fontFamily: "'IBM Plex Mono', monospace" } : {}}
            >
              {t === "all" ? "Todos" : t}
            </button>
          ))}
        </div>
      )}

      {/* Calendar view */}
      {view === "calendar" && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {calMonths.map(({ year, month, label }) => {
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            // Sunday-based grid offset
            const offset = (firstDay + 7) % 7;

            const cells: (number | null)[] = [
              ...Array(offset).fill(null),
              ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
            ];

            return (
              <div key={label} className="border border-line bg-panel rounded-[18px] p-4">
                <div className="text-[13px] font-medium mb-3">{label}</div>
                <div className="grid grid-cols-7 gap-[2px] text-center">
                  {["D","L","M","X","J","V","S"].map(d => (
                    <div key={d} className="text-[10px] text-dim pb-1">{d}</div>
                  ))}
                  {cells.map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const dateKey = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                    const events = eventsByDate[dateKey] ?? [];
                    const isToday = dateKey === today;
                    const isPast  = dateKey < today;
                    return (
                      <div
                        key={idx}
                        title={events.map(e => `${e.ticker}${e.perShare ? ` · $${e.perShare}/acción` : ""}`).join("\n")}
                        className={[
                          "aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] relative",
                          isToday  ? "bg-accent text-accentFg font-bold" : "",
                          isPast   ? "text-dim" : "",
                          events.length > 0 && !isToday ? "bg-panel2 font-medium" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        {day}
                        {events.length > 0 && (
                          <span
                            className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full"
                            style={{ background: isToday ? "var(--accentFg)" : "var(--accent)" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Events in this month */}
                {calMonths && (() => {
                  const monthEvts = filtered.filter(s => {
                    const d = s.expectedDate.slice(0, 7);
                    return d === `${year}-${String(month + 1).padStart(2, "0")}`;
                  });
                  if (monthEvts.length === 0) return null;
                  return (
                    <div className="mt-3 pt-3 border-t border-line flex flex-col gap-2">
                      {monthEvts.map(s => {
                        const shares = sharesMap[s.ticker.toUpperCase()] ?? 0;
                        const inc = expectedIncome(s);
                        return (
                          <div key={s.id} className="flex items-center justify-between gap-2 text-[12px]">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-medium"
                                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                              >
                                {s.ticker}
                              </span>
                              <span className="text-dim">
                                {new Date(s.expectedDate + "T00:00:00").getDate()} {MONTHS_SHORT[month]}
                              </span>
                              {shares > 0 && s.perShare && (
                                <span className="text-dim">· {shares} acc.</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {inc !== null && (
                                <span className="text-pos font-medium tabular-nums">
                                  {privacy ? "••••" : COP(inc)}
                                </span>
                              )}
                              <button
                                onClick={() => openEdit(s)}
                                className="text-dim border-none bg-transparent cursor-pointer text-[11px] p-0"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                className="text-neg/70 border-none bg-transparent cursor-pointer text-[11px] p-0"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="border border-line bg-panel rounded-[18px] p-10 flex flex-col items-center gap-3 text-center">
              <div className="text-[13px] text-muted">No hay dividendos programados.</div>
              <button onClick={openAdd} className="px-4 py-2 rounded-xl bg-panel2 border border-line text-[13px] cursor-pointer">
                + Agregar dividendo
              </button>
            </div>
          ) : (
            filtered.map(s => {
              const shares = sharesMap[s.ticker.toUpperCase()] ?? 0;
              const inc = expectedIncome(s);
              const isPast = s.expectedDate.slice(0, 10) < today;
              return (
                <div key={s.id} className="border border-line bg-panel rounded-[18px] p-4 flex items-center gap-4">
                  <div
                    className={[
                      "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-center",
                      isPast ? "bg-panel2" : "bg-accent/10",
                    ].join(" ")}
                  >
                    <span className="text-[10px] text-dim">
                      {MONTHS_SHORT[new Date(s.expectedDate + "T00:00:00").getMonth()]}
                    </span>
                    <span className="text-[16px] font-bold leading-tight" style={{ color: isPast ? "var(--dim)" : "var(--accent)" }}>
                      {new Date(s.expectedDate + "T00:00:00").getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.ticker}</span>
                      {isPast && <span className="text-[11px] text-dim bg-panel2 px-2 py-[1px] rounded-full">Pasado</span>}
                    </div>
                    <div className="text-[12px] text-dim mt-0.5">
                      {s.perShare ? `$${s.perShare}/acción` : "Sin monto por acción"}
                      {shares > 0 ? ` · ${shares} acciones` : ""}
                      {s.note ? ` · ${s.note}` : ""}
                    </div>
                  </div>
                  {inc !== null && (
                    <div className="text-right shrink-0">
                      <div className="text-[16px] font-medium tabular-nums text-pos" style={{ fontFamily: "Spectral, serif" }}>
                        {privacy ? "••••" : COP(inc)}
                      </div>
                      <div className="text-[11px] text-dim">esperado</div>
                    </div>
                  )}
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => openEdit(s)} className="text-[12px] text-muted border border-line rounded-lg px-2.5 py-1.5 bg-transparent cursor-pointer">Editar</button>
                    <button onClick={() => handleDelete(s.id)} className="text-[12px] text-neg border border-neg/30 rounded-lg px-2.5 py-1.5 bg-transparent cursor-pointer">×</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Historical dividends */}
      {historical.length > 0 && (
        <div className="border border-line bg-panel rounded-[18px] p-5">
          <div className="text-[13px] font-medium mb-3">Dividendos recibidos</div>
          <div className="flex flex-col gap-0">
            {historical
              .filter(d => filterTicker === "all" || d.ticker.toUpperCase() === filterTicker.toUpperCase())
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 20)
              .map((d, i, arr) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-panel2 border border-line flex items-center justify-center text-[11px] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {d.ticker.slice(0, 4)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{d.ticker}</div>
                    <div className="text-[12px] text-dim">
                      {new Date(d.date + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                      {d.shares ? ` · ${d.shares} acc.` : ""}
                      {d.perShare ? ` · $${d.perShare}/acc.` : ""}
                    </div>
                  </div>
                  <div className="text-[14px] font-medium tabular-nums text-pos">
                    {privacy ? "••••" : COP(d.amount)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {showModal && (
        <ModalDividendSchedule
          editItem={editItem}
          tickers={allTickers}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

function ModalDividendSchedule({
  editItem,
  tickers,
  onClose,
  onSaved,
}: {
  editItem?: DividendSchedule;
  tickers: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [ticker,   setTicker]   = useState(editItem?.ticker ?? "");
  const [date,     setDate]     = useState(editItem?.expectedDate?.slice(0, 10) ?? "");
  const [perShare, setPerShare] = useState(editItem?.perShare ? String(editItem.perShare) : "");
  const [note,     setNote]     = useState(editItem?.note ?? "");
  const [saving,   setSaving]   = useState(false);

  const canSave = ticker.trim().length > 0 && date.length > 0;

  const save = async () => {
    setSaving(true);
    try {
      const item = {
        ticker:       ticker.trim().toUpperCase(),
        expectedDate: date,
        perShare:     parseFloat(perShare) || undefined,
        note:         note.trim() || undefined,
      };
      if (editItem) await updateDividendSchedule(editItem.id, item);
      else          await addDividendSchedule(item);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={editItem ? "Editar dividendo" : "Programar dividendo"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Ticker</label>
        <input
          list="ticker-list"
          className={fieldClass}
          value={ticker}
          onChange={e => setTicker(e.target.value)}
          placeholder="Ej: PFBCOLOM, ECOPETROL"
          style={{ fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}
        />
        <datalist id="ticker-list">
          {tickers.map(t => <option key={t} value={t} />)}
        </datalist>
      </div>
      <div>
        <label className={labelClass}>Fecha esperada de pago</label>
        <input type="date" className={fieldClass} value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Monto por acción (COP)</label>
        <input
          type="number" step="0.01" min="0"
          className={fieldClass}
          value={perShare}
          onChange={e => setPerShare(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      <div>
        <label className={labelClass}>Nota</label>
        <input className={fieldClass} value={note} onChange={e => setNote(e.target.value)} placeholder="Opcional" />
      </div>
    </ModalShell>
  );
}
