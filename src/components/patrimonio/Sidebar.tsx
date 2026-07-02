import React from "react";
import {
  View,
  IconGrid,
  IconTrending,
  IconCrypto,
  IconArrows,
  IconCard,
} from "./utils";

export const NAV_ITEMS: { id: View; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: "resumen", label: "Resumen", icon: IconGrid },
  { id: "inversiones", label: "Inversiones", icon: IconTrending },
  { id: "cripto", label: "Cripto", icon: IconCrypto },
  { id: "transacciones", label: "Transacciones", icon: IconArrows },
  { id: "cuentas", label: "Cuentas", icon: IconCard },
];

function initials(name?: string | null) {
  if (!name) return "US";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export default function Sidebar({
  view,
  onNav,
  user,
}: {
  view: View;
  onNav: (v: View) => void;
  user?: { name?: string | null; email?: string | null } | null;
}) {
  return (
    <aside className="w-[250px] shrink-0 sticky top-0 h-screen border-r border-line bg-panel flex flex-col px-4 py-[18px]">
      {/* Brand */}
      <div className="flex items-center gap-[10px] px-[6px] pt-1 pb-5">
        <div
          className="w-[30px] h-[30px] rounded-lg bg-accent text-accentFg flex items-center justify-center font-semibold text-[15px]"
          style={{ fontFamily: "Spectral, serif" }}
        >
          P
        </div>
        <span style={{ fontFamily: "Spectral, serif" }} className="text-[18px] font-medium tracking-[-0.01em]">
          Patrimonio
        </span>
      </div>

      {/* Nav */}
      <div className="text-[11px] tracking-[0.08em] uppercase text-dim px-2 pb-2 font-medium">
        General
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = view === id || (id === "inversiones" && view === "detalle");
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={[
                "relative flex items-center gap-[11px] w-full py-[9px] px-[10px] border-none cursor-pointer rounded-[10px] text-left text-[13.5px]",
                active ? "font-medium bg-panel2 text-fg" : "font-normal bg-transparent text-muted",
              ].join(" ")}
            >
              {active && (
                <span className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-[2px] bg-accent" />
              )}
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="mt-auto flex items-center gap-[10px] px-2 pt-3 pb-1 border-t border-line">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-panel2 border border-line flex items-center justify-center text-[12.5px] font-semibold text-muted">
          {initials(user?.name)}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            {user?.name || "Usuario"}
          </div>
          <div className="text-[11.5px] text-dim">Cuenta personal</div>
        </div>
      </div>
    </aside>
  );
}
