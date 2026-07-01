import React from "react";
import { View } from "./utils";
import { NAV_ITEMS } from "./Sidebar";

export default function BottomNav({
  view,
  onNav,
}: {
  view: View;
  onNav: (v: View) => void;
}) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: "flex",
        background: "color-mix(in srgb, var(--panel) 92%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderTop: "1px solid var(--line)",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = view === id || (id === "inversiones" && view === "detalle");
        return (
          <button
            key={id}
            onClick={() => onNav(id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "4px 0",
              color: active ? "var(--fg)" : "var(--dim)",
              fontSize: 10.5,
              fontWeight: active ? 500 : 400,
            }}
          >
            <Icon size={20} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
