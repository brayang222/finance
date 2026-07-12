"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COP } from "../../data/mock";
import type { AllData, Customer } from "../../types";
import { usePrivacy } from "./PrivacyContext";
import { addCustomer, deleteCustomer, addFiadoMovement, deleteFiadoMovement } from "../../../lib/actions";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";

const cardBase = "border border-line bg-panel rounded-2xl p-5";
const microLabel = "text-[11px] tracking-[0.08em] uppercase text-dim font-medium";

type Kind = "customer" | "supplier";

function balance(c: Customer) {
  return c.movements.reduce((s, m) => s + (m.type === "fiado" ? m.amount : -m.amount), 0);
}

function ModalCliente({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const isSupplier = kind === "supplier";

  const save = async () => {
    setSaving(true);
    try {
      await addCustomer(name.trim(), phone.trim() || undefined, undefined, kind);
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={isSupplier ? "Nuevo proveedor" : "Nuevo cliente"} onClose={onClose} footer={<CancelSave onClose={onClose} onSave={save} canSave={name.trim().length > 0} saving={saving} />}>
      <div>
        <label className={labelClass}>Nombre</label>
        <input type="text" className={fieldClass} value={name} onChange={e => setName(e.target.value)} placeholder={isSupplier ? "Ej: Distribuidora El Sol" : "Ej: Doña Marta"} autoFocus />
      </div>
      <div>
        <label className={labelClass}>Teléfono (opcional)</label>
        <input type="tel" className={fieldClass} value={phone} onChange={e => setPhone(e.target.value)} placeholder="300 123 4567" />
      </div>
    </ModalShell>
  );
}

function ModalFiado({
  customer,
  type,
  kind,
  bankAccounts,
  onClose,
}: {
  customer: Customer;
  type: "fiado" | "abono";
  kind: Kind;
  bankAccounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id ?? "cash");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const amountVal = Number(amount.replace(/\./g, "")) || 0;
  const debt = balance(customer);
  const isSupplier = kind === "supplier";

  const titles = isSupplier
    ? { fiado: `Anotar deuda con ${customer.name}`, abono: `Pago a ${customer.name}` }
    : { fiado: `Fiar a ${customer.name}`, abono: `Abono de ${customer.name}` };

  const save = async () => {
    setSaving(true);
    try {
      await addFiadoMovement(
        customer.id, type, amountVal, note || undefined,
        type === "abono" ? accountId : undefined,
        type === "fiado" && isSupplier && dueDate ? dueDate : undefined,
      );
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={titles[type]} onClose={onClose} footer={<CancelSave onClose={onClose} onSave={save} canSave={amountVal > 0} saving={saving} />}>
      <div>
        <label className={labelClass}>Monto</label>
        <MoneyInput value={amount} onChange={setAmount} prefix="$" />
        {type === "abono" && amountVal > debt && (
          <div className="text-[12px] text-neg mt-1">El pago supera la deuda ({COP(debt)})</div>
        )}
      </div>
      <div>
        <label className={labelClass}>Nota (opcional)</label>
        <input type="text" className={fieldClass} value={note} onChange={e => setNote(e.target.value)} placeholder={type === "fiado" ? (isSupplier ? "Qué compraste..." : "Qué llevó...") : "Descripción..."} />
      </div>
      {type === "fiado" && isSupplier && (
        <div>
          <label className={labelClass}>Vence (opcional)</label>
          <input type="date" className={fieldClass} value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      )}
      {type === "abono" && (
        <div>
          <label className={labelClass}>{isSupplier ? "¿De dónde sale el dinero?" : "¿A dónde entra el dinero?"}</label>
          <select className={fieldClass} value={accountId} onChange={e => setAccountId(e.target.value)}>
            {bankAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
            {!bankAccounts.some(a => a.name.toLowerCase().includes("efectivo")) && (
              <option value="cash">Efectivo</option>
            )}
          </select>
        </div>
      )}
    </ModalShell>
  );
}

export default function ViewClientes({ initialData, kind = "customer" }: { initialData: AllData; kind?: Kind }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const { bankAccounts } = initialData;
  const isSupplier = kind === "supplier";
  const customers = initialData.customers.filter(c => (c.kind ?? "customer") === kind);
  const [openId, setOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState<
    | { kind: "new" }
    | { kind: "fiado" | "abono"; customer: Customer }
    | null
  >(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const total = useMemo(() => customers.reduce((s, c) => s + balance(c), 0), [customers]);
  const fmt = (n: number) => (privacy ? "•••" : COP(n));

  const doDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    setConfirmDelete(null);
    setOpenId(null);
    router.refresh();
  };

  const doDeleteMovement = async (id: string) => {
    await deleteFiadoMovement(id);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className={`${cardBase} flex items-start justify-between gap-4 flex-wrap`}>
        <div>
          <div className={microLabel + " mb-1"}>{isSupplier ? "Debes a proveedores" : "Fiado pendiente total"}</div>
          <div className="text-[32px] font-medium tabular-nums leading-none">{fmt(total)}</div>
          <div className="text-[12px] text-muted mt-1.5">
            {customers.length} {isSupplier ? "proveedor" : "cliente"}{customers.length === 1 ? "" : (isSupplier ? "es" : "s")}
          </div>
        </div>
        <button
          onClick={() => setModal({ kind: "new" })}
          className="h-[36px] px-4 rounded-xl border-none bg-accent text-accentFg text-[13px] font-medium cursor-pointer mt-1"
        >
          {isSupplier ? "+ Proveedor" : "+ Cliente"}
        </button>
      </div>

      {customers.length === 0 && (
        <div className={`${cardBase} text-center py-8 text-muted text-[13.5px]`}>
          {isSupplier
            ? "Registra tus proveedores para controlar cuánto les debes y cuándo vence."
            : "Registra tus clientes para llevar el control del fiado: cuánto deben y sus abonos."}
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {customers.map(c => {
          const debt = balance(c);
          const open = openId === c.id;
          const sorted = [...c.movements].reverse();
          const nextDue = c.movements.filter(m => m.type === "fiado" && m.dueDate).map(m => m.dueDate!).sort()[0];
          return (
            <div key={c.id} className={cardBase}>
              <button
                onClick={() => setOpenId(open ? null : c.id)}
                className="w-full flex items-center justify-between gap-3 border-none bg-transparent cursor-pointer p-0 text-left text-fg"
              >
                <div className="min-w-0">
                  <div className="text-[15px] font-medium truncate">{c.name}</div>
                  <div className="text-[12px] text-dim">
                    {c.phone ? `${c.phone} · ` : ""}{c.movements.length} movimiento{c.movements.length === 1 ? "" : "s"}
                    {isSupplier && nextDue && debt > 0 && <span className="text-neg"> · vence {nextDue}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[17px] font-medium tabular-nums ${debt > 0 ? "text-neg" : "text-pos"}`}>
                    {fmt(debt)}
                  </div>
                  <div className="text-[11px] text-dim">{debt > 0 ? (isSupplier ? "les debes" : "debe") : "al día"}</div>
                </div>
              </button>

              {open && (
                <div className="mt-4 pt-4 border-t border-line flex flex-col gap-3">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setModal({ kind: "fiado", customer: c })}
                      className="h-[32px] px-3.5 rounded-xl border-none bg-accent text-accentFg text-[12.5px] font-medium cursor-pointer"
                    >
                      {isSupplier ? "Anotar deuda" : "Fiar"}
                    </button>
                    <button
                      onClick={() => setModal({ kind: "abono", customer: c })}
                      className="h-[32px] px-3.5 rounded-xl border border-line bg-transparent text-fg text-[12.5px] font-medium cursor-pointer"
                    >
                      {isSupplier ? "Pagar" : "Abonar"}
                    </button>
                    {confirmDelete === c.id ? (
                      <button
                        onClick={() => doDeleteCustomer(c.id)}
                        className="h-[32px] px-3.5 rounded-xl border border-neg bg-transparent text-neg text-[12.5px] cursor-pointer ml-auto"
                      >
                        Confirmar eliminación
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="h-[32px] px-3.5 rounded-xl border border-line bg-transparent text-dim text-[12.5px] cursor-pointer ml-auto hover:text-neg"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  {sorted.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {sorted.map(m => (
                        <div key={m.id} className="flex items-center justify-between gap-3 text-[13px]">
                          <div className="min-w-0">
                            <span className="text-muted">{m.date}</span>
                            <span className="mx-2">
                              {m.type === "fiado" ? (isSupplier ? "Deuda" : "Fió") : (isSupplier ? "Pagaste" : "Abonó")}
                            </span>
                            {m.dueDate && <span className="text-dim">vence {m.dueDate} </span>}
                            {m.note && <span className="text-dim truncate">· {m.note}</span>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`tabular-nums ${m.type === "fiado" ? "text-neg" : "text-pos"}`}>
                              {m.type === "fiado" ? "+" : "-"}{fmt(m.amount)}
                            </span>
                            <button
                              onClick={() => doDeleteMovement(m.id)}
                              className="text-[11px] text-dim border-none bg-transparent cursor-pointer hover:text-neg p-0"
                              title="Eliminar movimiento"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal?.kind === "new" && <ModalCliente kind={kind} onClose={() => setModal(null)} />}
      {(modal?.kind === "fiado" || modal?.kind === "abono") && (
        <ModalFiado customer={modal.customer} type={modal.kind} kind={kind} bankAccounts={bankAccounts} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
