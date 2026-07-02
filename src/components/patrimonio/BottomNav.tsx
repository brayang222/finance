"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, isActive } from "./Sidebar";

export default function BottomNav() {
  const pathname = usePathname() || "";
  const router = useRouter();

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
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={[
              "flex-1 flex flex-col items-center gap-[3px] border-none bg-transparent cursor-pointer py-1 text-[10.5px]",
              active ? "text-fg font-medium" : "text-dim font-normal",
            ].join(" ")}
          >
            <Icon size={20} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
