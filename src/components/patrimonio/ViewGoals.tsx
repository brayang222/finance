"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { AllData, Goal } from "../../types";
import { addGoal, updateGoal, deleteGoal, contributeGoal } from "../../../lib/actions";
import { COLORS } from "../../data/constants";
import { usePrivacy } from "./PrivacyContext";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import { spawnConfetti } from "./confetti";

const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const num = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

function monthsUntil(deadline: string) {
  const now = new Date();
  const end = new Date(deadline + "T00:00:00");
  return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
}

function GoalModal({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? String(Math.round(goal.target)) : "");
  const [saved, setSaved] = useState(goal ? String(Math.round(goal.saved)) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [color, setColor] = useState(goal?.color ?? COLORS[0]);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && num(target) > 0;

  const save = async () => {
    setSaving(true);
    try {
      const item = {
        name: name.trim(),
        target: num(target),
        saved: num(saved),
        deadline: deadline || undefined,
        color,
      };
      if (goal) {
        await updateGoal(goal.id, item);
        toast.success("Meta actualizada");
      } else {
        await addGoal(item);
        toast.success("Meta creada");
      }
      router.refresh();
      onClose();
    } catch {
      toast.error("Error al guardar la meta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={goal ? "Editar meta" : "Nueva meta"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Nombre</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej. Fondo de emergencia"
          className={fieldClass}
          autoFocus
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Meta</label>
          <MoneyInput value={target} onChange={setTarget} prefix="$" />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Ahorrado (opcional)</label>
          <MoneyInput value={saved} onChange={setSaved} prefix="$" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Fecha límite (opcional)</label>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={fieldClass} />
      </div>

      <div>
        <label className={labelClass}>Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.slice(0, 8).map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={[
                "w-7 h-7 rounded-lg cursor-pointer",
                color === c ? "border-2 border-fg" : "border border-line",
              ].join(" ")}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function ContributeModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const monto = num(amount);

  const save = async () => {
    setSaving(true);
    try {
      const willComplete = goal.saved + monto >= goal.target;
      await contributeGoal(goal.id, monto);
      router.refresh();
      onClose();
      if (willComplete) {
        spawnConfetti();
        toast.success(`¡Meta "${goal.name}" completada!`);
      } else {
        toast.success(`Abono de ${COP(monto)} registrado`);
      }
    } catch {
      toast.error("Error al guardar el abono");
    } finally {
      setSaving(false);
    }
  };

  const remaining = Math.max(0, goal.target - goal.saved);

  return (
    <ModalShell
      title={`Abonar a "${goal.name}"`}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={monto > 0} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Monto</label>
        <MoneyInput value={amount} onChange={setAmount} prefix="$" />
      </div>
      <div className="text-xs text-muted">
        Te faltan {COP(remaining)} para completar la meta.
      </div>
    </ModalShell>
  );
}

export default function ViewGoals({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const toast = useToast();
  const goals = initialData.goals;

  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [contribGoal, setContribGoal] = useState<Goal | null>(null);

  const handleDelete = (g: Goal) => {
    const tid = setTimeout(async () => {
      await deleteGoal(g.id);
      router.refresh();
    }, 4500);
    toast.info(`Meta "${g.name}" eliminada`, {
      label: "Deshacer",
      fn: () => clearTimeout(tid),
    });
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-muted">
          {goals.length === 0
            ? "Define objetivos de ahorro y sigue tu progreso."
            : `${goals.filter(g => g.saved >= g.target).length} de ${goals.length} completada${goals.length !== 1 ? "s" : ""}`}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="h-9 px-4 bg-accent text-accentFg rounded-[10px] text-[13px] font-medium border-none cursor-pointer"
        >
          + Nueva meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="border border-line bg-panel rounded-[18px] p-10 text-center">
          <div className="text-[15px] font-medium mb-1" style={{ fontFamily: "Spectral, serif" }}>
            Sin metas todavía
          </div>
          <div className="text-[13px] text-muted">
            Crea tu primera meta: un fondo de emergencia, un viaje, la cuota inicial de tu casa…
          </div>
        </div>
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {goals.map((g, i) => {
            const pct = g.target > 0 ? Math.min(1, g.saved / g.target) : 0;
            const done = g.saved >= g.target;
            const months = g.deadline ? monthsUntil(g.deadline) : null;
            const monthlyNeeded = months !== null && months > 0 && !done
              ? (g.target - g.saved) / months
              : null;
            const color = g.color ?? COLORS[0];

            return (
              <div
                key={g.id}
                className="animate-card border border-line bg-panel rounded-[18px] p-5 flex flex-col gap-3"
                style={{ animationDelay: `${i * 60}ms`, viewTransitionName: `goal-${g.id}` } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <div className="text-[14.5px] font-medium truncate" style={{ fontFamily: "Spectral, serif" }}>
                      {g.name}
                    </div>
                  </div>
                  {done && (
                    <span className="text-[10.5px] font-medium text-pos bg-panel2 rounded-md px-2 py-0.5 shrink-0">
                      ✓ Completada
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-[12.5px] mb-1.5">
                    <span className="tabular-nums font-medium">{privacy ? "••••" : COP(g.saved)}</span>
                    <span className="text-muted tabular-nums">{privacy ? "••••" : COP(g.target)}</span>
                  </div>
                  <div className="h-2 bg-panel2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all animate-bar"
                      style={{ width: `${pct * 100}%`, background: done ? "var(--pos)" : color }}
                    />
                  </div>
                  <div className="flex justify-between text-[11.5px] text-dim mt-1.5">
                    <span>{(pct * 100).toFixed(0)}%</span>
                    {g.deadline && (
                      <span>
                        {months !== null && months < 0
                          ? "Vencida"
                          : new Date(g.deadline + "T00:00:00").toLocaleDateString("es-CO", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {monthlyNeeded !== null && (
                  <div className="text-[12px] text-muted bg-panel2 rounded-lg px-3 py-2">
                    Ahorra <span className="font-medium text-fg">{privacy ? "••••" : COP(monthlyNeeded)}</span>/mes para lograrla
                  </div>
                )}

                <div className="flex gap-2 mt-auto">
                  {!done && (
                    <button
                      onClick={() => setContribGoal(g)}
                      className="flex-1 h-8 bg-accent text-accentFg rounded-lg text-xs font-medium border-none cursor-pointer"
                    >
                      Abonar
                    </button>
                  )}
                  <button
                    onClick={() => setEditGoal(g)}
                    className="flex-1 h-8 border border-line bg-panel2 text-muted rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(g)}
                    className="h-8 px-3 border border-line bg-panel2 text-neg rounded-lg text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <GoalModal onClose={() => setShowAdd(false)} />}
      {editGoal && <GoalModal goal={editGoal} onClose={() => setEditGoal(null)} />}
      {contribGoal && <ContributeModal goal={contribGoal} onClose={() => setContribGoal(null)} />}
    </div>
  );
}
