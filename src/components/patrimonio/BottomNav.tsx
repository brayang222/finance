"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserConfig } from "../../types";
import { filterNavItems, isActive } from "./Sidebar";

const ProfileIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

export default function BottomNav({
  config,
  profile,
  onNavStart,
}: {
  config?: UserConfig | null;
  profile?: "personal" | "business";
  onNavStart?: () => void;
}) {
  const pathname = usePathname() || "";
  const base = filterNavItems(config, profile);
  const items = [...base, { href: "/profile", label: "Perfil", icon: ProfileIcon }];
  const scrollable = items.length > 4;
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!scrollable) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [pathname, scrollable]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-line overflow-x-auto [&::-webkit-scrollbar]:hidden"
      style={{
        background: "color-mix(in srgb, var(--panel) 95%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "10px 0 calc(10px + env(safe-area-inset-bottom))",
        scrollbarWidth: "none",
      }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            ref={active ? activeRef : undefined}
            onClick={onNavStart}
            className={[
              "flex flex-col items-center gap-1 no-underline px-3 py-1",
              // ponytail: 22vw → shows 4.5 items so the 5th peeks, hinting scroll
              scrollable ? "w-[22vw] shrink-0" : "flex-1 min-w-0",
              active ? "text-fg font-semibold" : "text-dim font-normal",
            ].join(" ")}
          >
            <Icon size={22} />
            <span className="text-[11px] w-full text-center truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
