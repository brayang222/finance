"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ModalShell, { CancelSave, fieldClass, labelClass } from "./ModalShell";
import { importFinances } from "../../../lib/actions";
import { useToast } from "./Toast";
import type { BankAccount, Category } from "../../types";

interface Row {
  date: string;
  desc: string;
  amount: number;
  type: "ingreso" | "egreso";
  category: string;
  accountId?: string;
}

const CATS_OUT_DEFAULT = ["Alimentación", "Transporte", "Salud", "Entretenimiento", "Otro gasto"];
const CATS_IN_DEFAULT  = ["Salario", "Freelance", "Otro ingreso"];

function parseCSV(text: string): string[][] {
  return text.trim().split(/\r?\n/).map(line => {
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cells.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

function guessAmount(raw: string): { amount: number; type: "ingreso" | "egreso" } | null {
  const clean = raw.replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  if (isNaN(n) || n === 0) return null;
  return { amount: Math.abs(n), type: n < 0 ? "egreso" : "ingreso" };
}

export default function CsvImport({
  categories = [],
  bankAccounts = [],
  onClose,
}: {
  categories?: Category[];
  bankAccounts?: BankAccount[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [headers, setHeaders]         = useState<string[]>([]);
  const [rawRows, setRawRows]         = useState<string[][]>([]);
  const [colDate, setColDate]         = useState(-1);
  const [colDesc, setColDesc]         = useState(-1);
  const [colAmount, setColAmount]     = useState(-1);
  const [colType, setColType]         = useState(-1);
  const [defaultType, setDefaultType] = useState<"ingreso" | "egreso">("egreso");
  const [defaultCat, setDefaultCat]   = useState("Otro gasto");
  const [accountId, setAccountId]     = useState("");
  const [saving, setSaving]           = useState(false);
  const [fileName, setFileName]       = useState("");

  const cats = [
    ...categories.filter(c => c.type === "egreso").map(c => c.name),
    ...CATS_OUT_DEFAULT,
    ...categories.filter(c => c.type === "ingreso").map(c => c.name),
    ...CATS_IN_DEFAULT,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) return;
    setHeaders(rows[0]);
    setRawRows(rows.slice(1).filter(r => r.some(c => c)));
    // Auto-detect columns by header name
    const h = rows[0].map(s => s.toLowerCase());
    setColDate(h.findIndex(s => s.includes("fecha") || s.includes("date")));
    setColDesc(h.findIndex(s => s.includes("desc") || s.includes("concepto") || s.includes("detail")));
    setColAmount(h.findIndex(s => s.includes("valor") || s.includes("monto") || s.includes("amount") || s.includes("importe")));
    setColType(h.findIndex(s => s.includes("tipo") || s.includes("type") || s.includes("db/cr")));
  };

  const preview: Row[] = rawRows.slice(0, 5).flatMap(r => {
    const raw = colAmount >= 0 ? (r[colAmount] ?? "") : "";
    const parsed = guessAmount(raw);
    if (!parsed && colAmount >= 0) return [];
    const type = colType >= 0
      ? (r[colType]?.toLowerCase().includes("cr") || r[colType]?.toLowerCase().includes("ingreso") ? "ingreso" : "egreso")
      : (parsed?.type ?? defaultType);
    return [{
      date: colDate >= 0 ? (r[colDate] ?? "") : "",
      desc: colDesc >= 0 ? (r[colDesc] ?? "") : r[1] ?? "",
      amount: parsed?.amount ?? 0,
      type,
      category: defaultCat,
    }];
  });

  const canSave = rawRows.length > 0 && colDate >= 0 && colDesc >= 0 && colAmount >= 0;

  const save = async () => {
    setSaving(true);
    try {
      const items: Row[] = rawRows.flatMap(r => {
        const raw = colAmount >= 0 ? (r[colAmount] ?? "") : "";
        const parsed = guessAmount(raw);
        if (!parsed) return [];
        const type = colType >= 0
          ? (r[colType]?.toLowerCase().includes("cr") || r[colType]?.toLowerCase().includes("ingreso") ? "ingreso" : "egreso")
          : (parsed.type ?? defaultType);
        return [{
          date: colDate >= 0 ? (r[colDate] ?? "") : "",
          desc: colDesc >= 0 ? (r[colDesc] ?? "") : r[1] ?? "",
          amount: parsed.amount,
          type,
          category: defaultCat,
          accountId: accountId || undefined,
          accountName: bankAccounts.find(b => b.id === accountId)?.name,
        }];
      });
      await importFinances(items);
      router.refresh();
      toast.success(`${items.length} movimientos importados`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al importar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Importar CSV"
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} saveLabel="Importar" />}
    >
      {/* File picker */}
      <div>
        <label className={labelClass}>Archivo CSV</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`${fieldClass} text-left cursor-pointer`}
        >
          {fileName || "Seleccionar archivo…"}
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={onFile} className="hidden" />
      </div>

      {headers.length > 0 && (
        <>
          <div className="text-[12px] text-dim">{rawRows.length} filas detectadas</div>

          {/* Column mapping */}
          {[
            { label: "Columna fecha",       val: colDate,   set: setColDate },
            { label: "Columna descripción", val: colDesc,   set: setColDesc },
            { label: "Columna monto",       val: colAmount, set: setColAmount },
            { label: "Columna tipo (opcional)", val: colType, set: setColType },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className={labelClass}>{label}</label>
              <select value={val} onChange={e => set(Number(e.target.value))} className={fieldClass}>
                <option value={-1}>— ignorar —</option>
                {headers.map((h, i) => <option key={i} value={i}>{h || `Col ${i + 1}`}</option>)}
              </select>
            </div>
          ))}

          {colType < 0 && (
            <div>
              <label className={labelClass}>Tipo por defecto</label>
              <select value={defaultType} onChange={e => setDefaultType(e.target.value as any)} className={fieldClass}>
                <option value="egreso">Egreso</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Categoría por defecto</label>
            <select value={defaultCat} onChange={e => setDefaultCat(e.target.value)} className={fieldClass}>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div className={labelClass}>Vista previa (primeras {preview.length})</div>
              <div className="rounded-xl border border-line overflow-hidden">
                {preview.map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-line last:border-none text-[12.5px]">
                    <span className="text-dim w-20 shrink-0">{row.date}</span>
                    <span className="flex-1 truncate">{row.desc}</span>
                    <span className={row.type === "ingreso" ? "text-pos" : "text-neg"}>
                      {row.type === "ingreso" ? "+" : "−"}
                      {row.amount.toLocaleString("es-CO")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}
