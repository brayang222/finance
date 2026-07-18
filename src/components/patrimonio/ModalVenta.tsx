"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COP } from "../../data/mock";
import type { Product, Customer, BankAccount } from "../../types";
import { registerSale } from "../../../lib/actions";
import ModalShell, { CancelSave, fieldClass, labelClass } from "./ModalShell";

type CartLine = { productId?: string; name: string; qty: number; price: number; cost: number };

export default function ModalVenta({
  products,
  customers,
  bankAccounts,
  onClose,
}: {
  products: Product[];
  customers: Customer[];
  bankAccounts: BankAccount[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [payMethod, setPayMethod] = useState<string>("cash");
  const [customerId, setCustomerId] = useState("");
  const [freeName, setFreeName] = useState("");
  const [freePrice, setFreePrice] = useState("");
  const [saving, setSaving] = useState(false);

  const clientes = customers.filter(c => c.kind === "customer");
  const activos = useMemo(
    () => products.filter(p => p.active && p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );
  const total = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const canSave = cart.length > 0 && total > 0 && (payMethod !== "fiado" || !!customerId);

  const addProduct = (p: Product) => {
    setCart(prev => {
      const i = prev.findIndex(l => l.productId === p.id);
      if (i >= 0) return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { productId: p.id, name: p.name, qty: 1, price: p.price, cost: p.cost }];
    });
  };

  const addFree = () => {
    const price = Number(freePrice.replace(/\D/g, "")) || 0;
    if (!freeName.trim() || price <= 0) return;
    setCart(prev => [...prev, { name: freeName.trim(), qty: 1, price, cost: 0 }]);
    setFreeName("");
    setFreePrice("");
  };

  const setQty = (idx: number, qty: number) => {
    setCart(prev => (qty <= 0 ? prev.filter((_, i) => i !== idx) : prev.map((l, i) => (i === idx ? { ...l, qty } : l))));
  };

  const save = async () => {
    setSaving(true);
    try {
      await registerSale(cart, payMethod, payMethod === "fiado" ? customerId : undefined);
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Registrar venta"
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave && !saving} saving={saving} saveLabel={`Cobrar ${COP(total)}`} />}
    >
      {/* Buscador de productos */}
      {products.length > 0 && (
        <div>
          <label className={labelClass}>Productos</label>
          <input
            type="text"
            className={fieldClass}
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5 mt-2 max-h-[120px] overflow-y-auto">
            {activos.slice(0, 30).map(p => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="px-3 py-1.5 rounded-lg border border-line bg-panel2 text-fg text-[12.5px] cursor-pointer hover:border-accent"
              >
                {p.name} · {COP(p.price)}
                {p.stock <= p.minStock && <span className="text-neg ml-1">⚠</span>}
              </button>
            ))}
            {activos.length === 0 && <span className="text-[12px] text-dim">Sin resultados</span>}
          </div>
        </div>
      )}

      {/* Ítem libre */}
      <div>
        <label className={labelClass}>{products.length > 0 ? "O ítem libre" : "Ítem"}</label>
        <div className="flex gap-2">
          <input
            type="text"
            className={fieldClass + " flex-1"}
            placeholder="Descripción"
            value={freeName}
            onChange={e => setFreeName(e.target.value)}
          />
          <input
            type="text"
            inputMode="numeric"
            className={fieldClass + " w-[110px]"}
            placeholder="$ precio"
            value={freePrice}
            onChange={e => setFreePrice(e.target.value.replace(/[^\d.]/g, ""))}
            onKeyDown={e => e.key === "Enter" && addFree()}
          />
          <button
            onClick={addFree}
            className="h-[42px] px-3 rounded-xl border border-line bg-panel2 text-fg text-[13px] cursor-pointer shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Carrito */}
      {cart.length > 0 && (
        <div className="border border-line rounded-xl p-3 flex flex-col gap-2">
          {cart.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <span className="flex-1 truncate">{l.name}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setQty(i, l.qty - 1)} className="w-6 h-6 rounded-md border border-line bg-transparent cursor-pointer text-fg">−</button>
                <input
                  key={`${i}:${l.qty}`}
                  type="text"
                  inputMode="decimal"
                  defaultValue={l.qty}
                  onFocus={e => e.target.select()}
                  onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
                  onBlur={e => {
                    const v = Number(e.target.value.replace(/[^\d.]/g, ""));
                    if (v > 0 && v !== l.qty) setQty(i, v);
                    else e.target.value = String(l.qty);
                  }}
                  className="w-10 h-6 text-center tabular-nums rounded-md border border-line bg-transparent text-fg"
                />
                <button onClick={() => setQty(i, l.qty + 1)} className="w-6 h-6 rounded-md border border-line bg-transparent cursor-pointer text-fg">+</button>
              </div>
              <span className="w-[90px] text-right tabular-nums">{COP(l.qty * l.price)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-line pt-2 text-[14px] font-medium">
            <span>Total</span>
            <span className="tabular-nums">{COP(total)}</span>
          </div>
        </div>
      )}

      {/* Método de pago */}
      <div>
        <label className={labelClass}>¿Cómo pagan?</label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "cash", name: "Efectivo" },
            ...bankAccounts.map(a => ({ id: a.id, name: a.name })),
            { id: "fiado", name: "Fiado" },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setPayMethod(m.id)}
              className={[
                "px-3.5 py-2 rounded-xl text-[12.5px] font-medium border cursor-pointer",
                payMethod === m.id ? "bg-accent text-accentFg border-accent" : "bg-transparent text-muted border-line",
              ].join(" ")}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {payMethod === "fiado" && (
        <div>
          <label className={labelClass}>Cliente que fía</label>
          <select className={fieldClass} value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="">Selecciona cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {clientes.length === 0 && (
            <div className="text-[11.5px] text-dim mt-1">Primero crea el cliente en Clientes y fiado</div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
