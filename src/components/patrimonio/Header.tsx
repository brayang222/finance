import React from "react";
import { IconEye, IconEyeOff, IconSun, IconMoon } from "./utils";

const iconBtnClass =
  "w-[38px] h-[38px] border border-line bg-panel rounded-[10px] text-muted flex items-center justify-center cursor-pointer";

export default function Header({
  pageTitle,
  pageSub,
  privacy,
  theme,
  showRegistrar = true,
  onTogglePrivacy,
  onToggleTheme,
  onOpenModal,
}: {
  pageTitle: string;
  pageSub: string;
  privacy: boolean;
  theme: "dark" | "light";
  showRegistrar?: boolean;
  onTogglePrivacy: () => void;
  onToggleTheme: () => void;
  onOpenModal: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-[5] border-b border-line"
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        background: "color-mix(in srgb, var(--bg) 82%, transparent)",
      }}
    >
      <div className="max-w-[1180px] mx-auto px-7 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1
            className="text-[22px] font-medium m-0 tracking-[-0.01em]"
            style={{ fontFamily: "Spectral, serif" }}
          >
            {pageTitle}
          </h1>
          <div className="text-[12.5px] text-dim mt-0.5">{pageSub}</div>
        </div>

        <div className="flex items-center gap-2">
          <button className={iconBtnClass} onClick={onTogglePrivacy} aria-label="Privacidad" title="Privacidad">
            {privacy ? <IconEyeOff /> : <IconEye />}
          </button>
          <button className={iconBtnClass} onClick={onToggleTheme} aria-label="Tema" title="Tema">
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>
          {showRegistrar && (
            <button
              onClick={onOpenModal}
              className="h-[38px] px-[15px] rounded-[10px] border-none cursor-pointer bg-accent text-accentFg text-[13px] font-medium"
            >
              Registrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
