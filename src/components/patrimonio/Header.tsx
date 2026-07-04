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
  onOpenCsvImport,
}: {
  pageTitle: string;
  pageSub: string;
  privacy: boolean;
  theme: "dark" | "light";
  showRegistrar?: boolean;
  onTogglePrivacy: () => void;
  onToggleTheme: () => void;
  onOpenModal: () => void;
  onOpenCsvImport?: () => void;
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
            className="vt-page-title text-[22px] font-medium m-0 tracking-[-0.01em]"
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
          {showRegistrar && onOpenCsvImport && (
            <button
              onClick={onOpenCsvImport}
              title="Importar CSV"
              className={iconBtnClass}
              aria-label="Importar CSV"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
          )}
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
