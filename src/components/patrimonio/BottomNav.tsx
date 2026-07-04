"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserConfig } from "../../types";
import { filterNavItems, isActive } from "./Sidebar";

export default function BottomNav({
  config,
  onNavStart,
}: {
  config?: UserConfig | null;
  onNavStart?: () => void;
}) {
  const pathname = usePathname() || "";
  const items = filterNavItems(config);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-line"
      style={{
        background: "color-mix(in srgb, var(--panel) 92%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavStart}
            className={[
              "flex-1 flex flex-col items-center gap-[3px] no-underline py-1 text-[10.5px]",
              active ? "text-fg font-medium" : "text-dim font-normal",
            ].join(" ")}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
