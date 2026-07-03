"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "../../../lib/actions";

type Step = "invest" | "modules";

const MODULE_OPTIONS = [
  { key: "showStocks",   label: "Portafolio de acciones",    sub: "Bolsa de valores y BVC" },
  { key: "showCrypto",   label: "Criptomonedas",             sub: "Bitcoin, Ethereum y activos digitales" },
  { key: "showHys",      label: "Alto rendimiento",          sub: "Cuenta de crecimiento con intereses" },
  { key: "showGoals",    label: "Metas de ahorro",           sub: "Objetivos con progreso y fechas límite" },
  { key: "showActivity", label: "Historial de actividad",    sub: "Registro de todas tus acciones en la app" },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("invest");
  const [modules, setModules] = useState({
    showStocks: true,
    showCrypto: true,
    showHys: true,
    showGoals: true,
    showActivity: true,
  });
  const [saving, setSaving] = useState(false);

  const handleInvestChoice = (invests: boolean) => {
    if (!invests) setModules(m => ({ ...m, showStocks: false, showCrypto: false }));
    setStep("modules");
  };

  const handleFinish = async () => {
    setSaving(true);
    await completeOnboarding(modules);
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center p-6">
      {step === "invest" ? (
        <div className="max-w-sm w-full flex flex-col gap-6">
          <div>
            <div className="w-10 h-10 rounded-xl bg-accent text-accentFg flex items-center justify-center font-semibold text-xl mb-4" style={{ fontFamily: "Spectral, serif" }}>P</div>
            <h1 style={{ fontFamily: "Spectral, serif" }} className="text-3xl font-medium">Bienvenido a Patrimonio</h1>
            <p className="text-muted text-sm mt-2">Personalizamos tu experiencia en segundos.</p>
          </div>

          <p className="text-sm font-medium">¿Inviertes o planeas invertir?</p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => handleInvestChoice(true)}
              className="border border-line bg-panel rounded-2xl p-4 text-left hover:border-accent transition-colors cursor-pointer"
            >
              <div className="font-medium text-sm">Sí, ya invierto</div>
              <div className="text-xs text-muted mt-0.5">Activo acciones, cripto y alto rendimiento</div>
            </button>
            <button
              onClick={() => handleInvestChoice(true)}
              className="border border-line bg-panel rounded-2xl p-4 text-left hover:border-accent transition-colors cursor-pointer"
            >
              <div className="font-medium text-sm">Quiero empezar a invertir</div>
              <div className="text-xs text-muted mt-0.5">Te activamos los módulos para cuando estés listo</div>
            </button>
            <button
              onClick={() => handleInvestChoice(false)}
              className="border border-line bg-panel rounded-2xl p-4 text-left hover:border-accent transition-colors cursor-pointer"
            >
              <div className="font-medium text-sm">No, solo quiero gestionar mis finanzas</div>
              <div className="text-xs text-muted mt-0.5">Resumen, transacciones y análisis de gastos</div>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-sm w-full flex flex-col gap-6">
          <div>
            <h2 style={{ fontFamily: "Spectral, serif" }} className="text-2xl font-medium">Personaliza tu menú</h2>
            <p className="text-muted text-xs mt-1">Puedes cambiar esto luego desde tu perfil.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {MODULE_OPTIONS.map(({ key, label, sub }) => (
              <label key={key} className="border border-line bg-panel rounded-2xl p-4 flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modules[key]}
                  onChange={e => setModules(m => ({ ...m, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-accent shrink-0"
                />
                <div>
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-muted mt-0.5">{sub}</div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleFinish}
            disabled={saving}
            className="h-11 bg-accent text-accentFg rounded-xl font-medium text-sm cursor-pointer border-none disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Empezar →"}
          </button>
        </div>
      )}
    </div>
  );
}
