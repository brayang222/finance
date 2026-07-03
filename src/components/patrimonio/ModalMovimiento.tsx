"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { CATS_IN, CATS_OUT } from "../../data/constants";
import { addFinance, updateFinance } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import type { BankAccount, Category } from "../../types";

type TxType = "ingreso" | "egreso";

const OTHER_IN  = "Otro ingreso";
const OTHER_OUT = "Otro gasto";

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
  editId,
  editInitial,
}: {
  onClose: () => void;
  bankAccounts?: BankAccount[];
  categories?: Category[];
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

  const cats = buildCats(type);
  const isOther = category === OTHER_IN || category === OTHER_OUT;
  const finalCat = isOther ? customCat.trim() || category : category;

  const monto = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canSave = monto > 0 && desc.trim().length > 0 && (!isOther || customCat.trim().length > 0);

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
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Ej. Salario, Mercado…"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>Categoría</label>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setCustomCat(""); }}
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
    </ModalShell>
  );
}
