"use client";

import React, { useEffect, useState } from "react";
import { TRANSACTIONS, Transaction, TxType } from "../../data/mock";
import { View } from "./utils";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import ModalRegistrar from "./ModalRegistrar";
import ViewResumen from "./ViewResumen";
import {
  ViewInversiones,
  ViewCripto,
  ViewDetalle,
  ViewTransacciones,
  ViewCuentas,
} from "./StubViews";

const PAGE_META: Record<View, { title: string; sub: string }> = {
  resumen: { title: "Resumen", sub: "Tu patrimonio de un vistazo" },
  inversiones: { title: "Inversiones", sub: "Portafolio en bolsa (BVC)" },
  cripto: { title: "Cripto", sub: "Activos digitales" },
  detalle: { title: "Detalle del activo", sub: "Posición individual" },
  transacciones: { title: "Transacciones", sub: "Ingresos y egresos" },
  cuentas: { title: "Cuentas", sub: "Efectivo y bancos" },
};

export default function Layout({
  user,
}: {
  user?: { name?: string | null; email?: string | null } | null;
}) {
  const [view, setView] = useState<View>("resumen");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [privacy, setPrivacy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [selFrom, setSelFrom] = useState<"inversiones" | "cripto">("inversiones");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<TxType>("egreso");
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS);

  // Theme init + persistence
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("gfp-theme")) as
      | "dark"
      | "light"
      | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("gfp-theme", theme);
    } catch {}
  }, [theme]);

  // Responsive
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 880);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const openDetail = (ticker: string, from: "inversiones" | "cripto") => {
    setSelected(ticker);
    setSelFrom(from);
    setView("detalle");
  };

  const meta = PAGE_META[view];

  const addTransaction = (tx: Omit<Transaction, "id">) => {
    setTransactions((prev) => [
      { ...tx, id: Math.max(0, ...prev.map((p) => p.id)) + 1 },
      ...prev,
    ].sort((a, b) => b.dateISO.localeCompare(a.dateISO)));
    setShowModal(false);
  };

  return (
    <div data-theme={theme} style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {!isMobile && <Sidebar view={view} onNav={setView} user={user} />}

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Header
          pageTitle={meta.title}
          pageSub={meta.sub}
          privacy={privacy}
          theme={theme}
          onTogglePrivacy={() => setPrivacy((p) => !p)}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onOpenModal={() => {
            setModalType("egreso");
            setShowModal(true);
          }}
        />

        <div
          style={{
            padding: isMobile ? "22px 16px 90px" : "26px 28px 40px",
            maxWidth: 1180,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {view === "resumen" && (
            <ViewResumen privacy={privacy} onNav={setView} transactions={transactions} />
          )}
          {view === "inversiones" && (
            <ViewInversiones privacy={privacy} onSelect={(t) => openDetail(t, "inversiones")} />
          )}
          {view === "cripto" && (
            <ViewCripto privacy={privacy} onSelect={(t) => openDetail(t, "cripto")} />
          )}
          {view === "detalle" && (
            <ViewDetalle
              privacy={privacy}
              selected={selected}
              selFrom={selFrom}
              onBack={() => setView(selFrom)}
            />
          )}
          {view === "transacciones" && (
            <ViewTransacciones
              privacy={privacy}
              transactions={transactions}
              onAdd={() => setShowModal(true)}
            />
          )}
          {view === "cuentas" && <ViewCuentas privacy={privacy} />}
        </div>
      </main>

      {isMobile && <BottomNav view={view} onNav={setView} />}

      {showModal && (
        <ModalRegistrar
          initialType={modalType}
          onClose={() => setShowModal(false)}
          onSave={addTransaction}
        />
      )}
    </div>
  );
}
