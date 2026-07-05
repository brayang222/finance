"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AllData } from "../../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import ModalMovimiento from "./ModalMovimiento";
import ModalAccion from "./ModalAccion";
import ModalCripto from "./ModalCripto";
import ModalCuenta from "./ModalCuenta";
import { PrivacyContext } from "./PrivacyContext";
import FloatingCalc from "./FloatingCalc";
import Onboarding from "./Onboarding";
import { switchViewAs, addFinance } from "../../../lib/actions";
import { ToastProvider, useToast } from "./Toast";
import CommandPalette from "./CommandPalette";
import CsvImport from "./CsvImport";

type Section = "summary" | "investments" | "crypto" | "transactions" | "accounts" | "detail" | "history" | "profile" | "savings" | "analytics" | "goals" | "recurrentes";

function sectionFromPath(path: string): Section {
  const seg = path.split("/")[1] || "transactions";
  if (["summary", "investments", "crypto", "transactions", "accounts", "detail", "history", "profile", "savings", "analytics", "goals", "recurrentes"].includes(seg)) {
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
  history:      { title: "Historial",          sub: "Registro de actividad" },
  profile:      { title: "Perfil",             sub: "Tu cuenta y preferencias" },
  savings:      { title: "Alto rendimiento",   sub: "Cuenta de crecimiento" },
  analytics:    { title: "Análisis",           sub: "Presupuesto, categorías y tendencias" },
  goals:        { title: "Metas",              sub: "Objetivos de ahorro" },
  recurrentes:  { title: "Recurrentes",        sub: "Arriendo, salario, suscripciones" },
};

const REGISTRAR_SECTIONS: Section[] = ["transactions", "investments", "crypto", "accounts"];

function AppShellInner({
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
  const toast = useToast();

  const [theme, setTheme]             = useState<"dark" | "light">("dark");
  const [privacy, setPrivacy]         = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [navLoading, setNavLoading]   = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const router = useRouter();
  const prevPath = useRef(pathname);
  const overdueNotified = useRef(false);

  useEffect(() => {
    const dbTheme = data.config?.theme;
    if (dbTheme) { setTheme(dbTheme); return; }
    const stored = localStorage.getItem("gfp-theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, [data.config?.theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("gfp-theme", theme); } catch {}
    document.cookie = `gfp-theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 880);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset loading bar when navigation completes
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setNavLoading(false);
    }
  }, [pathname]);

  // Overdue recurrentes check on mount
  useEffect(() => {
    if (overdueNotified.current || !data.recurrings?.length) return;
    const today = new Date().toISOString().slice(0, 10);
    const overdue = data.recurrings.filter((r) =>
      r.active !== false && r.nextDate && r.nextDate < today
    );
    if (overdue.length === 0) return;
    overdueNotified.current = true;
    toast.info(
      `${overdue.length} recurrente${overdue.length > 1 ? "s" : ""} pendiente${overdue.length > 1 ? "s" : ""} de aplicar`,
      { label: "Ver", fn: () => router.push("/recurrentes") }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SW registration + offline queue flush on reconnect
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => {
        // Warm key routes so they're available offline.
        // SW intercepts these fetches and caches by pathname — same key as navigate requests.
        ["/transactions", "/summary", "/accounts"].forEach(route => {
          fetch(route).catch(() => {});
        });
      }).catch(() => {});
    }
    const flush = async () => {
      // small delay so the connection is stable before hitting the server
      await new Promise(r => setTimeout(r, 1500));
      try {
        const { flushQueue } = await import("../../../lib/offlineQueue");
        const count = await flushQueue(addFinance);
        if (count > 0) {
          toast.success(`${count} movimiento${count > 1 ? "s" : ""} sincronizado${count > 1 ? "s" : ""}`);
          router.refresh();
        }
      } catch {
        toast.error("No se pudo sincronizar offline — se reintentará al reconectar.");
      }
    };
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull-to-refresh on mobile
  useEffect(() => {
    if (!isMobile) return;
    let startY = 0;
    let armed = false;
    const onStart = (e: TouchEvent) => {
      armed = window.scrollY < 5;
      startY = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (!armed) return;
      if (e.touches[0].clientY - startY > 90) {
        armed = false;
        setNavLoading(true);
        router.refresh();
        setTimeout(() => setNavLoading(false), 1200);
      }
    };
    const onEnd = () => { armed = false; };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [isMobile, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const SHORTCUTS: Record<string, string> = {
      r: "/summary",
      t: "/transactions",
      i: "/investments",
      c: "/crypto",
      u: "/accounts",
      a: "/analytics",
      m: "/goals",
      e: "/recurrentes",
      h: "/history",
      p: "/profile",
    };
    let waiting = false;
    let timer: ReturnType<typeof setTimeout>;
    const handler = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "k") {
        ev.preventDefault();
        setShowPalette(p => !p);
        return;
      }
      const tag = (ev.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if ((ev.target as HTMLElement)?.isContentEditable) return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      // n → quick-add movement
      if (ev.key === "n" && !waiting) {
        setShowQuickAdd(true);
        return;
      }
      if (ev.key === "g" && !waiting) {
        waiting = true;
        clearTimeout(timer);
        timer = setTimeout(() => { waiting = false; }, 1000);
        return;
      }
      if (waiting && SHORTCUTS[ev.key]) {
        waiting = false;
        clearTimeout(timer);
        setNavLoading(true);
        router.push(SHORTCUTS[ev.key]);
      } else if (waiting) {
        waiting = false;
        clearTimeout(timer);
      }
    };
    document.addEventListener("keydown", handler);
    return () => { document.removeEventListener("keydown", handler); clearTimeout(timer); };
  }, [router]);

  const meta = PAGE_META[section];
  const isViewingAs = !!data.viewingAs;
  const showRegistrar = REGISTRAR_SECTIONS.includes(section) && !isViewingAs;

  const exitViewAs = async () => {
    await switchViewAs(null);
    router.refresh();
  };

  const allAccounts = useMemo(() => [
    ...data.bankAccounts,
    ...(data.hys ? [{ id: "hys", name: "Alto Rendimiento", type: "otro", balance: 0 }] : []),
  ], [data.bankAccounts, data.hys]);

  const modal = useMemo(() => {
    if (!showModal) return null;
    const close = () => setShowModal(false);
    switch (section) {
      case "transactions": return (
        <ModalMovimiento
          bankAccounts={allAccounts}
          categories={data.categories}
          finances={data.finances}
          budgets={data.budgets}
          budgetConfigs={data.budgetConfigs}
          onClose={close}
        />
      );
      case "investments":  return <ModalAccion bankAccounts={allAccounts} onClose={close} />;
      case "crypto":       return <ModalCripto bankAccounts={allAccounts} onClose={close} />;
      case "accounts":     return <ModalCuenta onClose={close} />;
      default:              return null;
    }
  }, [showModal, section, allAccounts, data.categories, data.finances, data.budgets, data.budgetConfigs]);

  const showOnboarding = !data.config?.onboardingDone;
  const onNavStart = () => setNavLoading(true);

  return (
    <PrivacyContext.Provider value={privacy}>
      {navLoading && (
        <div className="fixed top-0 left-0 right-0 z-[500] h-[2px] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-20" style={{ background: "var(--accent)" }} />
          <div
            className="absolute top-0 bottom-0 w-1/3 rounded-full"
            style={{ background: "var(--accent)", animation: "nav-bar-run 900ms ease-in-out infinite" }}
          />
        </div>
      )}
      <div className="flex min-h-screen bg-bg">
        {!isMobile && (
          <Sidebar
            user={user}
            config={data.config}
            sharesReceived={data.sharesReceived}
            viewingAs={data.viewingAs}
            onNavStart={onNavStart}
          />
        )}

        <main className="flex-1 min-w-0 flex flex-col">
          {isViewingAs && (
            <div className="flex items-center justify-between gap-3 px-5 py-2 text-xs border-b border-amber-500/20 bg-amber-500/8 text-amber-300">
              <span>Viendo finanzas de <strong>{data.viewingAs!.name}</strong> · Solo lectura</span>
              <button
                onClick={exitViewAs}
                className="border border-amber-500/40 rounded-lg px-2.5 py-1 bg-transparent cursor-pointer text-amber-300 hover:bg-amber-500/10"
              >
                Volver a las mías
              </button>
            </div>
          )}
          <Header
            pageTitle={meta.title}
            pageSub={meta.sub}
            privacy={privacy}
            theme={theme}
            showRegistrar={showRegistrar}
            onTogglePrivacy={() => setPrivacy(p => !p)}
            onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
            onOpenModal={() => setShowModal(true)}
            onOpenCsvImport={() => setShowCsvImport(true)}
          />

          <div
            className="vt-page-content max-w-295 mx-auto w-full"
            style={{ padding: isMobile ? "22px 16px 90px" : "26px 28px 40px" }}
          >
            {children}
          </div>
        </main>

        {isMobile && <BottomNav config={data.config} onNavStart={onNavStart} />}

        {modal}

        {/* Global quick-add (n shortcut) */}
        {showQuickAdd && (
          <ModalMovimiento
            bankAccounts={allAccounts}
            categories={data.categories}
            finances={data.finances}
            budgets={data.budgets}
            budgetConfigs={data.budgetConfigs}
            onClose={() => setShowQuickAdd(false)}
          />
        )}

        {showCsvImport && (
          <CsvImport
            categories={data.categories}
            bankAccounts={allAccounts}
            onClose={() => setShowCsvImport(false)}
          />
        )}

        <FloatingCalc trm={data.config?.trm} />
        {showOnboarding && <Onboarding />}
        {showPalette && (
          <CommandPalette
            config={data.config}
            finances={data.finances}
            onClose={() => setShowPalette(false)}
            onNavStart={onNavStart}
          />
        )}
      </div>
    </PrivacyContext.Provider>
  );
}

export default function AppShell(props: {
  data: AllData;
  user?: { name?: string | null; email?: string | null } | null;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AppShellInner {...props} />
    </ToastProvider>
  );
}
