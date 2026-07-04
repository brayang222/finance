"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type Kind = "success" | "error" | "info";
type Action = { label: string; fn: () => void };
type ToastItem = { id: number; msg: string; kind: Kind; action?: Action };

const Ctx = createContext<(msg: string, kind?: Kind, action?: Action) => void>(() => {});

export function useToast() {
  const show = useContext(Ctx);
  return {
    success: (msg: string, action?: Action) => show(msg, "success", action),
    error:   (msg: string, action?: Action) => show(msg, "error", action),
    info:    (msg: string, action?: Action) => show(msg, "info", action),
  };
}

const ICON:  Record<Kind, string> = { success: "✓", error: "✕", info: "·" };
const COLOR: Record<Kind, string> = { success: "var(--pos)", error: "var(--neg)", info: "var(--muted)" };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((msg: string, kind: Kind = "info", action?: Action) => {
    const id = Date.now() + Math.random();
    setItems(prev => [...prev, { id, msg, kind, action }]);
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const dismiss = (id: number) => setItems(prev => prev.filter(t => t.id !== id));

  return (
    <Ctx.Provider value={show}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[800] flex flex-col-reverse gap-2 pointer-events-none"
        aria-live="polite"
      >
        {items.map(t => (
          <div
            key={t.id}
            className="animate-card flex items-center gap-3 px-4 py-3 rounded-[14px] border border-line pointer-events-auto"
            style={{ background: "var(--panel)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", minWidth: 260, maxWidth: 360 }}
          >
            <span className="text-[13px] shrink-0 font-medium" style={{ color: COLOR[t.kind] }}>{ICON[t.kind]}</span>
            <span className="text-[13.5px] flex-1 leading-snug">{t.msg}</span>
            {t.action && (
              <button
                onClick={() => { t.action!.fn(); dismiss(t.id); }}
                className="text-[12.5px] font-semibold text-accent bg-transparent border-none cursor-pointer shrink-0 whitespace-nowrap"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="text-dim text-[16px] bg-transparent border-none cursor-pointer leading-none shrink-0"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
