"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const fieldClass =
  "w-full h-[42px] px-3 rounded-xl border border-line bg-panel2 text-fg text-[14px] outline-none";
export const labelClass =
  "text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-1.5 block";

/** Backdrop + card. Card uses inline var(--panel) so the backdrop's blur/filter
 *  context can't leave it transparent. */
export default function ModalShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      <div
        onClick={onClose}
        className="modal-backdrop-enter absolute inset-0"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="modal-card-enter rounded-[20px] p-6 pointer-events-auto relative"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            width: "min(480px, 94vw)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          }}
        >
          <div className="flex items-center justify-between mb-[18px]">
            <h2 className="text-[20px] font-medium m-0" style={{ fontFamily: "Spectral, serif" }}>
              {title}
            </h2>
            <button onClick={onClose} className="bg-transparent border-none text-muted cursor-pointer text-[20px] leading-none" aria-label="Cerrar">
              ×
            </button>
          </div>
          <div className="flex flex-col gap-3.5">{children}</div>
          <div className="flex gap-2.5 mt-[22px]">{footer}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Formatted money input — displays thousands separator, stores raw number string */
export function MoneyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  prefix,
}: {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
  prefix?: React.ReactNode;
}) {
  const fmt = (raw: string) => {
    const digits = raw.replace(/\./g, "").replace(/,/g, "").replace(/[^\d]/g, "");
    if (!digits) return "";
    return parseInt(digits, 10).toLocaleString("es-CO");
  };

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px] pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        inputMode="numeric"
        value={fmt(value)}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/\./g, "").replace(/,/g, "").replace(/[^\d]/g, "");
          onChange(digits);
        }}
        className={className ?? `${fieldClass} ${prefix ? "pl-[26px]" : ""} tabular-nums`}
      />
    </div>
  );
}

export function CancelSave({
  onClose,
  onSave,
  canSave,
  saving,
  saveLabel = "Guardar",
}: {
  onClose: () => void;
  onSave: () => void;
  canSave: boolean;
  saving?: boolean;
  saveLabel?: string;
}) {
  return (
    <>
      <button
        onClick={onClose}
        className="flex-1 h-[42px] rounded-xl border border-line bg-panel text-fg cursor-pointer text-[13.5px] font-medium"
      >
        Cancelar
      </button>
      <button
        disabled={!canSave || saving}
        onClick={onSave}
        className={[
          "flex-1 h-[42px] rounded-xl border-none bg-accent text-accentFg text-[13.5px] font-medium",
          canSave && !saving ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-[0.45]",
        ].join(" ")}
      >
        {saving ? "Guardando…" : saveLabel}
      </button>
    </>
  );
}
