"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { CATS_IN, CATS_OUT } from "../../data/constants";
import { addFinance, updateFinance } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import type { BankAccount, Category, Finance, Budget, BudgetConfig } from "../../types";
import { Period, getPeriodRange } from "./periods";

type TxType = "ingreso" | "egreso";

const OTHER_IN  = "Otro ingreso";
const OTHER_OUT = "Otro gasto";

const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const PERIOD_LABEL: Record<Period, string> = { semanal: "semanal", mensual: "mensual", anual: "anual" };

interface EditInitial {
  type: TxType;
  amount: number;
  desc: string;
  date: string;
  category: string;
  accountId?: string;
}

export default function ModalMovimiento({
  onClose,
  bankAccounts = [],
  categories = [],
  finances = [],
  budgets = [],
  budgetConfigs = [],
  editId,
  editInitial,
}: {
  onClose: () => void;
  bankAccounts?: BankAccount[];
  categories?: Category[];
  finances?: Finance[];
  budgets?: Budget[];
  budgetConfigs?: BudgetConfig[];
  editId?: string;
  editInitial?: EditInitial;
}) {
  const router = useRouter();
  const isEdit = !!editId;

  const buildCats = (t: TxType) => {
    const other = t === "ingreso" ? OTHER_IN : OTHER_OUT;
    const fromDb = categories.filter(c => c.type === t).map(c => c.name);
    if (fromDb.length > 0) {
      if (!fromDb.includes(other)) fromDb.push(other);
      return fromDb;
    }
    // fallback to hardcoded list when categories not loaded
    return t === "ingreso" ? CATS_IN : CATS_OUT;
  };

  const initType = editInitial?.type ?? "egreso";
  const initCats = buildCats(initType);

  const initCatInList = editInitial ? initCats.find(c => c === editInitial.category) ?? null : null;
  const initCategory = initCatInList ?? (initType === "ingreso" ? OTHER_IN : OTHER_OUT);
  const initCustomCat = (!initCatInList && editInitial?.category) ? editInitial.category : "";

  const [type, setType]           = useState<TxType>(initType);
  const [amount, setAmount]       = useState(editInitial ? String(Math.round(editInitial.amount)) : "");
  const [desc, setDesc]           = useState(editInitial?.desc ?? "");
  const [dateISO, setDateISO]     = useState(editInitial?.date ?? today());
  const [accountId, setAccountId] = useState(editInitial?.accountId ?? "");
  const [saving, setSaving]       = useState(false);
  const [customCat, setCustomCat] = useState(initCustomCat);
  const [category, setCategory]   = useState(initCategory);
  const [listening, setListening] = useState(false);
  const [voiceErr, setVoiceErr]   = useState("");
  const catUserPicked = useRef(false);

  // Auto-categorize from history when desc changes
  useEffect(() => {
    if (isEdit || catUserPicked.current || desc.length < 3) return;
    const q = desc.toLowerCase();
    const match = [...finances]
      .filter(f => f.type === type && (f.desc ?? "").toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!match) return;
    const inList = buildCats(type).includes(match.category);
    if (inList) setCategory(match.category);
    else { setCategory(type === "ingreso" ? OTHER_IN : OTHER_OUT); setCustomCat(match.category); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desc, type]);

  const startVoice = () => {
    setVoiceErr("");
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceErr("Tu navegador no soporta voz. Usa Chrome o Edge.");
      return;
    }
    const sr = new SR();
    sr.lang = "es-CO";
    sr.interimResults = false;
    sr.continuous = false;
    setListening(true);
    sr.onresult = (e: any) => {
      const text: string = e.results[0][0].transcript;
      // Try "número descripción" or "descripción número"
      const numMatch = text.match(/(\d[\d.]*)/);
      if (numMatch) {
        setAmount(numMatch[1].replace(/\./g, ""));
        const rest = text.replace(numMatch[1], "").trim();
        if (rest) setDesc(rest);
      } else {
        setDesc(text);
      }
    };
    sr.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed") setVoiceErr("Permiso de micrófono denegado. Revisa la configuración del navegador.");
      else if (e.error === "no-speech") setVoiceErr("No se detectó voz. Intenta de nuevo.");
      else if (e.error === "network") setVoiceErr("El dictado requiere HTTPS. En móvil usa el micrófono del teclado nativo.");
      else setVoiceErr(`Error de dictado: ${e.error}`);
    };
    sr.onend = () => setListening(false);
    sr.start();
  };

  const cats = buildCats(type);
  const isOther = category === OTHER_IN || category === OTHER_OUT;
  const finalCat = isOther ? customCat.trim() || category : category;

  const monto = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canSave = monto > 0 && desc.trim().length > 0 && (!isOther || customCat.trim().length > 0);

  // Non-blocking budget warnings, anchored to the transaction's date
  const budgetWarnings: string[] = [];
  if (type === "egreso" && monto > 0 && dateISO) {
    const anchor = new Date(dateISO + "T00:00:00");
    const catLower = finalCat.trim().toLowerCase();
    for (const p of ["semanal", "mensual", "anual"] as Period[]) {
      const { from, to } = getPeriodRange(p, anchor);
      // exclude the row being edited so its old amount doesn't double-count
      const inPeriod = finances.filter(f => f.type === "egreso" && f.id !== editId && f.date >= from && f.date <= to);

      const total = budgetConfigs.find(c => c.period === p)?.amount ?? 0;
      if (total > 0) {
        const spent = inPeriod.reduce((s, f) => s + f.amount, 0);
        if (spent + monto > total) {
          budgetWarnings.push(`Superarás tu presupuesto ${PERIOD_LABEL[p]} por ${COP(spent + monto - total)}`);
        }
      }

      const catBudget = budgets.find(b => b.period === p && b.category.toLowerCase() === catLower);
      if (catBudget && catBudget.amount > 0) {
        const spentCat = inPeriod.filter(f => f.category.toLowerCase() === catLower).reduce((s, f) => s + f.amount, 0);
        if (spentCat + monto > catBudget.amount) {
          budgetWarnings.push(`Superarás el límite ${PERIOD_LABEL[p]} de "${catBudget.category}" por ${COP(spentCat + monto - catBudget.amount)}`);
        }
      }
    }
  }

  // Duplicate detection: same category + amount within ±3 days, excluding self
  const duplicateWarning = (() => {
    if (!monto || !dateISO || !finalCat) return null;
    const anchor = new Date(dateISO + "T00:00:00").getTime();
    const THREE_DAYS = 3 * 86400000;
    const dup = finances.find(f =>
      f.id !== editId &&
      f.type === type &&
      f.category.toLowerCase() === finalCat.toLowerCase() &&
      Math.abs(f.amount - monto) < 1 &&
      Math.abs(new Date(f.date + "T00:00:00").getTime() - anchor) <= THREE_DAYS
    );
    return dup ? `Posible duplicado: ya registraste ${COP(dup.amount)} en "${dup.category}" el ${dup.date}` : null;
  })();

  const switchType = (t: TxType) => {
    setType(t);
    const newCats = buildCats(t);
    setCategory(newCats[0]);
    setCustomCat("");
  };

  const save = async () => {
    setSaving(true);
    try {
      const acct = bankAccounts.find(b => b.id === accountId);
      const item = {
        type,
        amount: monto,
        desc: desc.trim(),
        category: finalCat,
        date: dateISO,
        accountId: acct?.id,
        accountName: acct?.name,
      };
      if (isEdit) {
        await updateFinance(editId!, item);
      } else {
        await addFinance(item);
      }
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Editar movimiento" : "Registrar movimiento"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      <div className="flex bg-panel2 rounded-xl p-[3px]">
        {(["ingreso", "egreso"] as TxType[]).map(t => (
          <button
            key={t}
            onClick={() => switchType(t)}
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
        <div className="relative">
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Ej. Salario, Mercado…"
            className={fieldClass}
            style={{ paddingRight: "2.5rem" }}
          />
          <button
            type="button"
            onClick={startVoice}
            title="Dictado por voz"
            className={[
              "absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer transition-colors",
              listening ? "bg-neg/20 text-neg" : "bg-panel2 text-dim hover:text-fg",
            ].join(" ")}
          >
            {listening ? (
              <span className="block w-2 h-2 rounded-full bg-neg animate-pulse" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
              </svg>
            )}
          </button>
        </div>
        {voiceErr && <p className="text-[11.5px] text-neg mt-1">{voiceErr}</p>}
      </div>

      <div>
        <label className={labelClass}>Categoría</label>
        <select
          value={category}
          onChange={e => { catUserPicked.current = true; setCategory(e.target.value); setCustomCat(""); }}
          className={fieldClass}
        >
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isOther && (
        <div>
          <label className={labelClass}>Nueva categoría</label>
          <input
            value={customCat}
            onChange={e => setCustomCat(e.target.value)}
            placeholder={type === "ingreso" ? "Ej. Dividendos" : "Ej. Salud"}
            className={fieldClass}
            autoFocus
          />
        </div>
      )}

      <div>
        <label className={labelClass}>Fecha</label>
        <input type="date" value={dateISO} onChange={e => setDateISO(e.target.value)} className={fieldClass} />
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

      {duplicateWarning && (
        <div
          className="rounded-xl border px-3.5 py-2.5 flex flex-col gap-1"
          style={{ borderColor: "#6366f1", background: "color-mix(in srgb, #6366f1 8%, transparent)" }}
        >
          <div className="text-xs font-medium" style={{ color: "#818cf8" }}>⟳ {duplicateWarning}</div>
          <div className="text-[11px] text-dim">Si es diferente, puedes registrarlo igual.</div>
        </div>
      )}

      {budgetWarnings.length > 0 && (
        <div
          className="rounded-xl border px-3.5 py-2.5 flex flex-col gap-1"
          style={{ borderColor: "#f59e0b", background: "color-mix(in srgb, #f59e0b 8%, transparent)" }}
        >
          {budgetWarnings.map(w => (
            <div key={w} className="text-xs font-medium" style={{ color: "#f59e0b" }}>⚠ {w}</div>
          ))}
          <div className="text-[11px] text-dim">Puedes registrarlo de todas formas.</div>
        </div>
      )}
    </ModalShell>
  );
}
