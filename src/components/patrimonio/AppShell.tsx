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

type Section = "resumen" | "inversiones" | "cripto" | "transacciones" | "cuentas" | "detalle";

function sectionFromPath(path: string): Section {
  const seg = path.split("/")[1] || "transacciones";
  if (["resumen", "inversiones", "cripto", "transacciones", "cuentas", "detalle"].includes(seg)) {
    return seg as Section;
  }
  return "transacciones";
}

const PAGE_META: Record<Section, { title: string; sub: string }> = {
  resumen:       { title: "Resumen",            sub: "Tu patrimonio de un vistazo" },
  inversiones:   { title: "Inversiones",        sub: "Portafolio en bolsa (BVC)" },
  cripto:        { title: "Cripto",             sub: "Activos digitales" },
  detalle:       { title: "Detalle del activo", sub: "Posición individual" },
  transacciones: { title: "Transacciones",      sub: "Ingresos y egresos" },
  cuentas:       { title: "Cuentas",            sub: "Efectivo y bancos" },
};

// Sections where the "Registrar" button is shown
const REGISTRAR_SECTIONS: Section[] = ["transacciones", "inversiones", "cripto", "cuentas"];

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
      case "transacciones": return <ModalMovimiento onClose={close} />;
      case "inversiones":   return <ModalAccion onClose={close} />;
      case "cripto":        return <ModalCripto onClose={close} />;
      case "cuentas":       return <ModalEfectivo current={data.cash?.banco ?? 0} onClose={close} />;
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
