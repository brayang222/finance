"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { filterNavItems } from "./Sidebar";
import type { UserConfig, AllData } from "../../types";

const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const SHORTCUT: Record<string, string> = {
  "/summary":      "g r",
  "/transactions": "g t",
  "/investments":  "g i",
  "/crypto":       "g c",
  "/accounts":     "g u",
  "/analytics":    "g a",
  "/goals":        "g m",
  "/recurrentes":  "g e",
  "/history":      "g h",
  "/profile":      "g p",
};

export default function CommandPalette({
  config,
  finances = [],
  onClose,
  onNavStart,
}: {
  config?: UserConfig | null;
  finances?: AllData["finances"];
  onClose: () => void;
  onNavStart?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const all = filterNavItems(config);
  const q = query.trim().toLowerCase();
  const filtered = q ? all.filter(i => i.label.toLowerCase().includes(q)) : all;

  const txMatches = q.length >= 2
    ? finances
        .filter(f =>
          (f.desc ?? "").toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          String(Math.round(f.amount)).includes(q.replace(/\./g, ""))
        )
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5)
    : [];

  const totalRows = filtered.length + txMatches.length;

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setCursor(0); }, [query]);

  const go = (href: string) => {
    onNavStart?.();
    router.push(href);
    onClose();
  };

  const selectRow = (i: number) => {
    if (i < filtered.length) go(filtered[i].href);
    else go(`/transactions?q=${encodeURIComponent(query.trim())}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, totalRows - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && totalRows > 0) selectRow(cursor);
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[700] flex items-start justify-center"
      style={{ paddingTop: "15vh", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="animate-card w-full rounded-[18px] border border-line overflow-hidden"
        style={{ maxWidth: 480, background: "var(--panel)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-dim shrink-0">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ir a…"
            className="flex-1 bg-transparent border-none outline-none text-fg text-[14px] placeholder:text-dim"
          />
          <kbd className="text-[11px] text-dim border border-line rounded px-1.5 py-0.5 font-mono">Esc</kbd>
        </div>

        {/* Results */}
        <div className="py-1.5 max-h-[340px] overflow-y-auto">
          {totalRows === 0 ? (
            <div className="text-[13px] text-dim px-4 py-3">Sin resultados</div>
          ) : (
            <>
              {filtered.map((item, i) => {
                const Icon = item.icon;
                const active = i === cursor;
                return (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setCursor(i)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-2.5 border-none cursor-pointer text-left transition-colors",
                      active ? "bg-panel2 text-fg" : "bg-transparent text-muted",
                    ].join(" ")}
                  >
                    <Icon size={16} />
                    <span className="flex-1 text-[13.5px]">{item.label}</span>
                    {SHORTCUT[item.href] && (
                      <span className="text-[11px] text-dim font-mono">{SHORTCUT[item.href]}</span>
                    )}
                  </button>
                );
              })}
              {txMatches.length > 0 && (
                <>
                  <div className="text-[11px] tracking-[0.08em] uppercase text-dim px-4 pt-3 pb-1.5 font-medium">
                    Transacciones
                  </div>
                  {txMatches.map((f, j) => {
                    const i = filtered.length + j;
                    const active = i === cursor;
                    const pos = f.type === "ingreso";
                    return (
                      <button
                        key={f.id}
                        onClick={() => selectRow(i)}
                        onMouseEnter={() => setCursor(i)}
                        className={[
                          "w-full flex items-center gap-3 px-4 py-2.5 border-none cursor-pointer text-left transition-colors",
                          active ? "bg-panel2 text-fg" : "bg-transparent text-muted",
                        ].join(" ")}
                      >
                        <span className={`text-[13px] shrink-0 ${pos ? "text-pos" : "text-neg"}`}>{pos ? "↓" : "↑"}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13.5px] truncate">{f.desc}</span>
                          <span className="block text-[11.5px] text-dim">{f.category} · {f.date}</span>
                        </span>
                        <span className={`text-[12.5px] tabular-nums shrink-0 ${pos ? "text-pos" : "text-neg"}`}>
                          {pos ? "+" : "−"}{COP(f.amount)}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        <div className="border-t border-line px-4 py-2 flex gap-4 text-[11px] text-dim">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">↵</kbd> seleccionar</span>
          <span><kbd className="font-mono">g + tecla</kbd> atajo directo</span>
        </div>
      </div>
    </div>
  );
}
