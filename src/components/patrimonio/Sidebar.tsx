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
    <aside
      style={{
        width: 250,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: "1px solid var(--line)",
        background: "var(--panel)",
        display: "flex",
        flexDirection: "column",
        padding: "18px 16px",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px 20px" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accentFg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 15,
            fontFamily: "Spectral, serif",
          }}
        >
          P
        </div>
        <span style={{ fontFamily: "Spectral, serif", fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}>
          Patrimonio
        </span>
      </div>

      {/* Nav */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--dim)",
          padding: "0 8px 8px",
          fontWeight: 500,
        }}
      >
        General
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = view === id || (id === "inversiones" && view === "detalle");
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 11,
                width: "100%",
                padding: "9px 10px",
                border: "none",
                cursor: "pointer",
                borderRadius: 10,
                textAlign: "left",
                fontSize: 13.5,
                fontWeight: active ? 500 : 400,
                background: active ? "var(--panel2)" : "transparent",
                color: active ? "var(--fg)" : "var(--muted)",
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: -16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 2.5,
                    height: 20,
                    borderRadius: 2,
                    background: "var(--accent)",
                  }}
                />
              )}
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 8px 4px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--muted)",
          }}
        >
          {initials(user?.name)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name || "Usuario"}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--dim)" }}>Cuenta personal</div>
        </div>
      </div>
    </aside>
  );
}
