"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserConfig, ShareInfo } from "../../types";
import { switchViewAs, switchProfile } from "../../../lib/actions";
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
  IconUsers,
  IconStore,
  IconTruck,
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

export const BUSINESS_NAV_ITEMS: NavItem[] = [
  { href: "/summary",      label: "Resumen",          icon: IconGrid },
  { href: "/productos",    label: "Productos",        icon: IconStore },
  { href: "/transactions", label: "Ventas y gastos",  icon: IconArrows },
  { href: "/clientes",     label: "Clientes y fiado", icon: IconUsers },
  { href: "/proveedores",  label: "Proveedores",      icon: IconTruck },
  { href: "/caja",         label: "Caja",             icon: IconBank },
  { href: "/accounts",     label: "Cuentas",          icon: IconCard },
  { href: "/analytics",    label: "Análisis",         icon: IconChart },
  { href: "/recurrentes",  label: "Recurrentes",      icon: IconRepeat },
  { href: "/history",      label: "Historial",        icon: IconClock },
];

export function filterNavItems(config?: UserConfig | null, profile?: "personal" | "business") {
  if (profile === "business") return BUSINESS_NAV_ITEMS;
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
  profile = "personal",
  onNavStart,
}: {
  user?: { name?: string | null; email?: string | null } | null;
  config?: UserConfig | null;
  sharesReceived?: ShareInfo[];
  viewingAs?: { userId: string; name: string } | null;
  profile?: "personal" | "business";
  onNavStart?: () => void;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const items = filterNavItems(config, profile);
  const isBusiness = profile === "business";

  const acceptedShares = sharesReceived.filter(s => s.status === "accepted");

  const doSwitch = async (targetId: string | null) => {
    await switchViewAs(targetId);
    router.refresh();
  };

  const doProfileSwitch = async (p: "personal" | "business") => {
    if (p === profile) return;
    await switchProfile(p);
    router.push("/summary");
    router.refresh();
  };

  return (
    <aside className="w-[250px] shrink-0 sticky top-0 h-screen border-r border-line bg-panel flex flex-col px-4 py-[18px]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-1.5 pt-1 pb-5">
        <div
          className="w-7.5 h-7.5 rounded-lg flex items-center justify-center "
          style={{ fontFamily: "Spectral, serif" }}
        >
          
        <img src="/favicon-96x96.png" alt="" className="w-full h-full" />
        </div>
        <span style={{ fontFamily: "Spectral, serif" }} className="text-[18px] font-medium tracking-[-0.01em]">
          {isBusiness ? "Mi Negocio" : "Patrimonio"}
        </span>
      </div>

      {/* Switch de perfil: Personal ⇄ Comercio */}
      <div className="flex gap-1 p-1 mb-4 rounded-xl border border-line bg-panel2">
        {([["personal", "Personal"], ["business", "Comercio"]] as const).map(([p, label]) => (
          <button
            key={p}
            onClick={() => doProfileSwitch(p)}
            className={[
              "flex-1 py-[6px] rounded-lg text-[12px] border-none cursor-pointer font-medium",
              profile === p ? "bg-accent text-accentFg" : "bg-transparent text-muted",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {!isBusiness && acceptedShares.length > 0 && (
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

      <div className="text-[11px] tracking-[0.08em] uppercase text-dim px-2 pb-2 font-medium">
        {isBusiness ? "Negocio" : "General"}
      </div>

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

      {/* Help + User */}
      <div className="mt-auto flex flex-col">
        <Link
          href="/help"
          onClick={onNavStart}
          className={
            "flex items-center gap-3 w-full py-2 px-2.5 rounded-xl no-underline text-sm mb-1 " +
            (isActive(pathname, "/help") ? "bg-panel2 text-fg font-medium" : "text-muted")
          }
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Ayuda
        </Link>
        <Link
          href="/profile"
          onClick={onNavStart}
          className="flex items-center gap-2.5 px-2 pt-3 pb-1 border-t border-line w-full no-underline hover:opacity-75 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-panel2 border border-line flex items-center justify-center text-xs font-semibold text-muted shrink-0">
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate text-fg">
              {user?.name || "Usuario"}
            </div>
            <div className="text-xs text-dim">{"Ver perfil →"}</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
