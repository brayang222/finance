"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { AllData, Recurring, BankAccount } from "../../types";
import { addRecurring, updateRecurring, deleteRecurring, applyRecurring } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { today } from "../../data/mock";

const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const FREQ_LABELS: Record<string, string> = {
  diario: "Diario", semanal: "Semanal", quincenal: "Quincenal",
  mensual: "Mensual", anual: "Anual",
};

const FREQS = Object.keys(FREQ_LABELS) as Recurring["frequency"][];

function daysUntil(date: string) {
  const diff = new Date(date + "T00:00:00").getTime() - new Date(today() + "T00:00:00").getTime();
  return Math.ceil(diff / 86400000);
}

function RecurringModal({
  item, bankAccounts, categories, onClose,
}: {
  item?: Recurring;
  bankAccounts: BankAccount[];
  categories: AllData["categories"];
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!item;

  const [type, setType]           = useState<"ingreso" | "egreso">(item?.type ?? "egreso");
  const [amount, setAmount]       = useState(item ? String(Math.round(item.amount)) : "");
  const [desc, setDesc]           = useState(item?.desc ?? "");
  const [category, setCategory]   = useState(item?.category ?? "");
  const [frequency, setFrequency] = useState<Recurring["frequency"]>(item?.frequency ?? "mensual");
  const [nextDate, setNextDate]   = useState(item?.nextDate ?? today());
  const [accountId, setAccountId] = useState(item?.accountId ?? "");
  const [active, setActive]       = useState(item?.active ?? true);
  const [saving, setSaving]       = useState(false);

  const cats = categories.filter(c => c.type === type).map(c => c.name);
  const monto = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canSave = monto > 0 && desc.trim().length > 0 && category.trim().length > 0;

  const save = async () => {
    setSaving(true);
    try {
      const acct = bankAccounts.find(b => b.id === accountId);
      const payload = {
        type, category: category.trim(), desc: desc.trim(), amount: monto, frequency, nextDate,
        accountId: acct?.id, accountName: acct?.name, active,
      };
      if (isEdit) {
        await updateRecurring(item.id, payload);
      } else {
        await addRecurring(payload);
      }
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Editar recurrente" : "Nueva transacción recurrente"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div className="flex bg-panel2 rounded-xl p-[3px]">
        {(["ingreso", "egreso"] as const).map(t => (
          <button
            key={t}
            onClick={() => { setType(t); setCategory(""); }}
            className={[
              "flex-1 h-[34px] rounded-[9px] border-none cursor-pointer text-[13px] font-medium capitalize",
              type === t ? "bg-accent text-accentFg" : "bg-transparent text-muted",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className={labelClass}>Monto</label>
        <MoneyInput value={amount} onChange={setAmount} prefix="$" />
      </div>

      <div>
        <label className={labelClass}>Descripción</label>
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Ej. Arriendo, Salario, Netflix…"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>Categoría</label>
        {cats.length > 0 ? (
          <select value={category} onChange={e => setCategory(e.target.value)} className={fieldClass}>
            <option value="">— Selecciona —</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : (
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Ej. Vivienda"
            className={fieldClass}
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Frecuencia</label>
        <select value={frequency} onChange={e => setFrequency(e.target.value as Recurring["frequency"])} className={fieldClass}>
          {FREQS.map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Próxima fecha</label>
        <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className={fieldClass} />
      </div>

      {bankAccounts.length > 0 && (
        <div>
          <label className={labelClass}>Cuenta (opcional)</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} className={fieldClass}>
            <option value="">— Sin cuenta —</option>
            {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={e => setActive(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
          Activo
        </label>
      )}
    </ModalShell>
  );
}

export default function ViewRecurrentes({ initialData }: { initialData: AllData }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Recurring | undefined>(undefined);
  const [applying, setApplying]   = useState<string | null>(null);

  const { recurrings, bankAccounts, categories } = initialData;

  const active   = recurrings.filter(r => r.active);
  const inactive = recurrings.filter(r => !r.active);

  const apply = async (r: Recurring) => {
    setApplying(r.id);
    try {
      await applyRecurring(r.id);
      router.refresh();
    } finally {
      setApplying(null);
    }
  };

  const remove = async (r: Recurring) => {
    if (!confirm(`¿Eliminar "${r.desc}"?`)) return;
    await deleteRecurring(r.id);
    router.refresh();
  };

  const openEdit = (r: Recurring) => { setEditing(r); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(undefined); };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Recurrentes</h2>
          <p className="text-sm text-muted">Arriendo, salario, suscripciones — regístralos con un tap</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-accent text-accentFg text-sm font-medium border-none cursor-pointer"
        >
          + Nuevo
        </button>
      </div>

      {recurrings.length === 0 && (
        <div className="bg-panel rounded-2xl p-8 text-center text-muted text-sm">
          <div className="text-3xl mb-3">🔁</div>
          <p className="font-medium text-text mb-1">Sin transacciones recurrentes</p>
          <p>Agrega arriendo, salario, Netflix… y regístralos con un solo tap cuando llegue la fecha.</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="flex flex-col gap-3">
          {active.map((r, i) => {
            const days = daysUntil(r.nextDate);
            const overdue = days < 0;
            const soon = days >= 0 && days <= 3;
            return (
              <div key={r.id} className="animate-item bg-panel rounded-2xl p-4 flex items-center gap-4" style={{ animationDelay: `${i * 55}ms` }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: r.type === "ingreso" ? "color-mix(in srgb, #10b981 15%, transparent)" : "color-mix(in srgb, #ef4444 15%, transparent)" }}
                >
                  {r.type === "ingreso" ? "↓" : "↑"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text truncate">{r.desc}</span>
                    <span className="text-xs text-dim bg-panel2 rounded-full px-2 py-0.5 shrink-0">{FREQ_LABELS[r.frequency]}</span>
                  </div>
                  <div className="text-sm text-muted mt-0.5">{r.category}</div>
                  <div className={["text-xs mt-0.5", overdue ? "text-red-400 font-medium" : soon ? "text-amber-400" : "text-dim"].join(" ")}>
                    {overdue
                      ? `Vencido hace ${-days} día${days < -1 ? "s" : ""}`
                      : days === 0
                        ? "Vence hoy"
                        : `Próxima: ${r.nextDate} (${days} días)`
                    }
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={["font-semibold tabular-nums", r.type === "ingreso" ? "text-emerald-400" : "text-red-400"].join(" ")}>
                    {r.type === "egreso" ? "−" : "+"}{COP(r.amount)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => apply(r)}
                      disabled={applying === r.id}
                      className="px-3 py-1 rounded-lg bg-accent text-accentFg text-xs font-medium border-none cursor-pointer disabled:opacity-50"
                    >
                      {applying === r.id ? "…" : "Registrar"}
                    </button>
                    <button
                      onClick={() => openEdit(r)}
                      className="px-2 py-1 rounded-lg text-xs text-muted border border-border bg-transparent cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(r)}
                      className="px-2 py-1 rounded-lg text-xs text-red-400 border border-border bg-transparent cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs text-dim mb-2 uppercase tracking-wide">Inactivos</p>
          <div className="flex flex-col gap-2">
            {inactive.map(r => (
              <div key={r.id} className="bg-panel rounded-2xl p-3 flex items-center gap-3 opacity-50">
                <span className="text-muted text-sm flex-1 truncate">{r.desc}</span>
                <span className="text-dim text-xs">{COP(r.amount)}</span>
                <button onClick={() => openEdit(r)} className="text-xs text-muted border border-border rounded-lg px-2 py-1 bg-transparent cursor-pointer">Editar</button>
                <button onClick={() => remove(r)} className="text-xs text-red-400 border border-border rounded-lg px-2 py-1 bg-transparent cursor-pointer">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <RecurringModal
          item={editing}
          bankAccounts={bankAccounts}
          categories={categories}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
