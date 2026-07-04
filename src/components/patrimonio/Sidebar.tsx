"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserConfig, ShareInfo } from "../../types";
import { switchViewAs } from "../../../lib/actions";
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
  sharesReceived = [],
  viewingAs = null,
  onNavStart,
}: {
  user?: { name?: string | null; email?: string | null } | null;
  config?: UserConfig | null;
  sharesReceived?: ShareInfo[];
  viewingAs?: { userId: string; name: string } | null;
  onNavStart?: () => void;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const items = filterNavItems(config);

  const acceptedShares = sharesReceived.filter(s => s.status === "accepted");

  const doSwitch = async (targetId: string | null) => {
    await switchViewAs(targetId);
    router.refresh();
  };

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

      {acceptedShares.length > 0 && (
        <div className="mb-3 flex flex-col gap-0.5">
          <div className="text-[11px] tracking-[0.08em] uppercase text-dim px-2 pb-1.5 font-medium">Cuenta</div>
          <button
            onClick={() => doSwitch(null)}
            className={[
              "flex items-center gap-2 w-full py-[7px] px-[10px] rounded-[10px] border-none cursor-pointer text-left text-[13px]",
              !viewingAs ? "bg-panel2 font-medium text-fg" : "bg-transparent text-muted font-normal",
            ].join(" ")}
          >
            <span className="w-4 text-center text-[10px]">{!viewingAs ? "●" : "○"}</span>
            {user?.name?.split(" ")[0] ?? "Mis finanzas"}
          </button>
          {acceptedShares.map(s => {
            const active = viewingAs?.userId === s.ownerId;
            return (
              <button
                key={s.id}
                onClick={() => doSwitch(s.ownerId)}
                className={[
                  "flex items-center gap-2 w-full py-[7px] px-[10px] rounded-[10px] border-none cursor-pointer text-left text-[13px]",
                  active ? "bg-panel2 font-medium text-fg" : "bg-transparent text-muted font-normal",
                ].join(" ")}
              >
                <span className="w-4 text-center text-[10px]">{active ? "●" : "○"}</span>
                {s.ownerName ?? s.guestEmail}
              </button>
            );
          })}
          <div className="border-t border-line mt-1.5" />
        </div>
      )}

      <div className="text-[11px] tracking-[0.08em] uppercase text-dim px-2 pb-2 font-medium">General</div>

      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavStart}
              className={[
                "relative flex items-center gap-[11px] w-full py-[9px] px-[10px] rounded-[10px] no-underline text-[13.5px]",
                active ? "font-medium bg-panel2 text-fg" : "font-normal bg-transparent text-muted",
              ].join(" ")}
            >
              {active && (
                <span className="vt-nav-pill absolute left-[-16px] top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-[2px] bg-accent" />
              )}
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <Link
        href="/profile"
        onClick={onNavStart}
        className="mt-auto flex items-center gap-2.5 px-2 pt-3 pb-1 border-t border-line w-full no-underline hover:opacity-75 transition-opacity"
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
      </Link>
    </aside>
  );
}
