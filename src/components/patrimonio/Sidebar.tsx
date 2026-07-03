"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UserConfig } from "../../types";
import {
  IconGrid,
  IconTrending,
  IconCrypto,
  IconArrows,
  IconCard,
  IconClock,
  IconBank,
  IconChart,
  IconTarget,
  IconRepeat,
} from "./utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.FC<{ size?: number }>;
  module?: keyof Pick<UserConfig, "showStocks" | "showCrypto" | "showHys" | "showActivity" | "showGoals">;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/summary",      label: "Resumen",          icon: IconGrid },
  { href: "/investments",  label: "Inversiones",      icon: IconTrending, module: "showStocks" },
  { href: "/crypto",       label: "Cripto",           icon: IconCrypto,   module: "showCrypto" },
  { href: "/transactions", label: "Transacciones",    icon: IconArrows },
  { href: "/accounts",     label: "Cuentas",          icon: IconCard },
  { href: "/savings",      label: "Alto Rendimiento", icon: IconBank,     module: "showHys" },
  { href: "/analytics",    label: "Análisis",         icon: IconChart },
  { href: "/goals",        label: "Metas",            icon: IconTarget,   module: "showGoals" },
  { href: "/recurrentes",  label: "Recurrentes",      icon: IconRepeat },
  { href: "/history",      label: "Historial",        icon: IconClock,    module: "showActivity" },
];

export function filterNavItems(config?: UserConfig | null) {
  return NAV_ITEMS.filter(item => !item.module || !config || config[item.module]);
}

export function isActive(pathname: string, href: string) {
  if (pathname.startsWith(href)) return true;
  if (href === "/investments" && pathname.startsWith("/detail")) return true;
  return false;
}

function initials(name?: string | null) {
  if (!name) return "US";
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("");
}

export default function Sidebar({
  user,
  config,
}: {
  user?: { name?: string | null; email?: string | null } | null;
  config?: UserConfig | null;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const items = filterNavItems(config);

  return (
    <aside className="w-[250px] shrink-0 sticky top-0 h-screen border-r border-line bg-panel flex flex-col px-4 py-[18px]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-1.5 pt-1 pb-5">
        <div
          className="w-7.5 h-7.5 rounded-lg bg-accent text-accentFg flex items-center justify-center font-semibold text-[15px]"
          style={{ fontFamily: "Spectral, serif" }}
        >
          P
        </div>
        <span style={{ fontFamily: "Spectral, serif" }} className="text-[18px] font-medium tracking-[-0.01em]">
          Patrimonio
        </span>
      </div>

      <div className="text-[11px] tracking-[0.08em] uppercase text-dim px-2 pb-2 font-medium">General</div>

      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
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
      <button
        onClick={() => router.push("/profile")}
        className="mt-auto flex items-center gap-2.5 px-2 pt-3 pb-1 border-t border-line bg-transparent border-x-0 border-b-0 cursor-pointer w-full text-left hover:opacity-75 transition-opacity"
      >
        <div className="w-[34px] h-[34px] rounded-[10px] bg-panel2 border border-line flex items-center justify-center text-[12.5px] font-semibold text-muted shrink-0">
          {initials(user?.name)}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis text-fg">
            {user?.name || "Usuario"}
          </div>
          <div className="text-[11.5px] text-dim">Ver perfil →</div>
        </div>
      </button>
    </aside>
  );
}
