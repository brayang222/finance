"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { AllData } from "../../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import ModalMovimiento from "./ModalMovimiento";
import ModalAccion from "./ModalAccion";
import ModalCripto from "./ModalCripto";
import ModalEfectivo from "./ModalEfectivo";
import { PrivacyContext } from "./PrivacyContext";

type Section = "summary" | "investments" | "crypto" | "transactions" | "accounts" | "detail";

function sectionFromPath(path: string): Section {
  const seg = path.split("/")[1] || "transactions";
  if (["summary", "investments", "crypto", "transactions", "accounts", "detail"].includes(seg)) {
    return seg as Section;
  }
  return "transactions";
}

const PAGE_META: Record<Section, { title: string; sub: string }> = {
  summary:      { title: "Resumen",            sub: "Tu patrimonio de un vistazo" },
  investments:  { title: "Inversiones",        sub: "Portafolio en bolsa (BVC)" },
  crypto:       { title: "Cripto",             sub: "Activos digitales" },
  detail:       { title: "Detalle del activo", sub: "Posición individual" },
  transactions: { title: "Transacciones",      sub: "Ingresos y egresos" },
  accounts:     { title: "Cuentas",            sub: "Efectivo y bancos" },
};

// Sections where the "Registrar" button is shown
const REGISTRAR_SECTIONS: Section[] = ["transactions", "investments", "crypto", "accounts"];

export default function AppShell({
  data,
  user,
  children,
}: {
  data: AllData;
  user?: { name?: string | null; email?: string | null } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/transactions";
  const section = sectionFromPath(pathname);

  const [theme, setTheme]       = useState<"dark" | "light">("dark");
  const [privacy, setPrivacy]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Theme: prefer DB config, fall back to localStorage
  useEffect(() => {
    const dbTheme = data.config?.theme;
    if (dbTheme) {
      setTheme(dbTheme);
      return;
    }
    const stored = localStorage.getItem("gfp-theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, [data.config?.theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("gfp-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 880);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const meta = PAGE_META[section];
  const showRegistrar = REGISTRAR_SECTIONS.includes(section);

  const modal = useMemo(() => {
    if (!showModal) return null;
    const close = () => setShowModal(false);
    switch (section) {
      case "transactions": return <ModalMovimiento onClose={close} />;
      case "investments":  return <ModalAccion onClose={close} />;
      case "crypto":       return <ModalCripto onClose={close} />;
      case "accounts":     return <ModalEfectivo current={data.cash?.banco ?? 0} onClose={close} />;
      default:              return null;
    }
  }, [showModal, section, data.cash?.banco]);

  return (
    <PrivacyContext.Provider value={privacy}>
      <div className="flex min-h-screen bg-bg">
        {!isMobile && <Sidebar user={user} />}

        <main className="flex-1 min-w-0 flex flex-col">
          <Header
            pageTitle={meta.title}
            pageSub={meta.sub}
            privacy={privacy}
            theme={theme}
            showRegistrar={showRegistrar}
            onTogglePrivacy={() => setPrivacy((p) => !p)}
            onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            onOpenModal={() => setShowModal(true)}
          />

          <div
            className="max-w-[1180px] mx-auto w-full"
            style={{ padding: isMobile ? "22px 16px 90px" : "26px 28px 40px" }}
          >
            {children}
          </div>
        </main>

        {isMobile && <BottomNav />}

        {modal}
      </div>
    </PrivacyContext.Provider>
  );
}
