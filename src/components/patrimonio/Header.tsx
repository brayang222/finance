import React from "react";
import { IconEye, IconEyeOff, IconSun, IconMoon } from "./utils";

const iconBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  border: "1px solid var(--line)",
  background: "var(--panel)",
  borderRadius: 10,
  color: "var(--muted)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export default function Header({
  pageTitle,
  pageSub,
  privacy,
  theme,
  onTogglePrivacy,
  onToggleTheme,
  onOpenModal,
}: {
  pageTitle: string;
  pageSub: string;
  privacy: boolean;
  theme: "dark" | "light";
  onTogglePrivacy: () => void;
  onToggleTheme: () => void;
  onOpenModal: () => void;
}) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        background: "color-mix(in srgb, var(--bg) 82%, transparent)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "Spectral, serif",
              fontSize: 22,
              fontWeight: 500,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {pageTitle}
          </h1>
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2 }}>{pageSub}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={iconBtn} onClick={onTogglePrivacy} aria-label="Privacidad" title="Privacidad">
            {privacy ? <IconEyeOff /> : <IconEye />}
          </button>
          <button style={iconBtn} onClick={onToggleTheme} aria-label="Tema" title="Tema">
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>
          <button
            onClick={onOpenModal}
            style={{
              height: 38,
              padding: "0 15px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "var(--accent)",
              color: "var(--accentFg)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Registrar
          </button>
        </div>
      </div>
    </header>
  );
}
