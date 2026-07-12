"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COP } from "../../data/mock";
import type { AllData, Product } from "../../types";
import { usePrivacy } from "./PrivacyContext";
import { addProduct, updateProduct, deleteProduct, registerPurchase } from "../../../lib/actions";
import ModalShell, { CancelSave, fieldClass, labelClass } from "./ModalShell";

const cardBase = "border border-line bg-panel rounded-2xl p-5";
const microLabel = "text-[11px] tracking-[0.08em] uppercase text-dim font-medium";

function num(s: string) {
  return Number(s.replace(/[^\d.]/g, "")) || 0;
}

function ModalProducto({ product, onClose }: { product?: Product; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [cost, setCost] = useState(product ? String(product.cost) : "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [minStock, setMinStock] = useState(product ? String(product.minStock) : "");
  const [saving, setSaving] = useState(false);

  const priceVal = num(price);
  const costVal = num(cost);
  const margen = priceVal > 0 && costVal > 0 ? ((priceVal - costVal) / priceVal) * 100 : null;

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        name: name.trim(), category: category.trim() || undefined,
        cost: costVal, price: priceVal, stock: num(stock), minStock: num(minStock),
      };
      if (product) await updateProduct(product.id, data);
      else await addProduct(data);
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={product ? "Editar producto" : "Nuevo producto"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={name.trim().length > 0 && priceVal > 0} saving={saving} />}
    >
      <div>
        <label className={labelClass}>Nombre</label>
        <input type="text" className={fieldClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Coca-Cola 400ml" autoFocus />
      </div>
      <div>
        <label className={labelClass}>Categoría (opcional)</label>
        <input type="text" className={fieldClass} value={category} onChange={e => setCategory(e.target.value)} placeholder="Ej: Bebidas" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Costo unitario</label>
          <input type="text" inputMode="numeric" className={fieldClass} value={cost} onChange={e => setCost(e.target.value.replace(/[^\d.]/g, ""))} placeholder="$ 0" />
        </div>
        <div>
          <label className={labelClass}>Precio de venta</label>
          <input type="text" inputMode="numeric" className={fieldClass} value={price} onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="$ 0" />
        </div>
      </div>
      {margen !== null && (
        <div className={`text-[12.5px] font-medium ${margen > 0 ? "text-pos" : "text-neg"}`}>
          Margen: {margen.toFixed(1)}% · Ganas {COP(priceVal - costVal)} por unidad
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Stock actual</label>
          <input type="text" inputMode="numeric" className={fieldClass} value={stock} onChange={e => setStock(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Alerta stock mínimo</label>
          <input type="text" inputMode="numeric" className={fieldClass} value={minStock} onChange={e => setMinStock(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
        </div>
      </div>
    </ModalShell>
  );
}

function ModalCompra({
  products,
  suppliers,
  bankAccounts,
  onClose,
}: {
  products: Product[];
  suppliers: { id: string; name: string }[];
  bankAccounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<{ productId: string; qty: string; unitCost: string }[]>([
    { productId: products[0]?.id ?? "", qty: "", unitCost: "" },
  ]);
  const [credit, setCredit] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id ?? "cash");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const items = lines
    .map(l => ({ productId: l.productId, qty: num(l.qty), unitCost: num(l.unitCost) }))
    .filter(i => i.productId && i.qty > 0 && i.unitCost > 0);
  const total = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const canSave = items.length > 0 && (!credit || !!supplierId);

  const save = async () => {
    setSaving(true);
    try {
      await registerPurchase(items, credit
        ? { supplierId, dueDate: dueDate || undefined }
        : { accountId });
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Registrar compra de mercancía"
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave && !saving} saving={saving} saveLabel={`Registrar ${COP(total)}`} />}
    >
      {lines.map((l, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1">
            {i === 0 && <label className={labelClass}>Producto</label>}
            <select className={fieldClass} value={l.productId} onChange={e => setLines(ls => ls.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))}>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="w-[70px]">
            {i === 0 && <label className={labelClass}>Cant.</label>}
            <input type="text" inputMode="numeric" className={fieldClass} value={l.qty} placeholder="0"
              onChange={e => setLines(ls => ls.map((x, j) => (j === i ? { ...x, qty: e.target.value.replace(/[^\d.]/g, "") } : x)))} />
          </div>
          <div className="w-[110px]">
            {i === 0 && <label className={labelClass}>Costo unit.</label>}
            <input type="text" inputMode="numeric" className={fieldClass} value={l.unitCost} placeholder="$ 0"
              onChange={e => setLines(ls => ls.map((x, j) => (j === i ? { ...x, unitCost: e.target.value.replace(/[^\d.]/g, "") } : x)))} />
          </div>
        </div>
      ))}
      <button
        onClick={() => setLines(ls => [...ls, { productId: products[0]?.id ?? "", qty: "", unitCost: "" }])}
        className="self-start text-[12px] text-dim border-none bg-transparent cursor-pointer underline underline-offset-2 p-0"
      >
        + Otro producto
      </button>

      <div>
        <label className={labelClass}>¿Cómo pagas?</label>
        <div className="flex gap-1.5">
          <button onClick={() => setCredit(false)} className={["px-3.5 py-2 rounded-xl text-[12.5px] font-medium border cursor-pointer", !credit ? "bg-accent text-accentFg border-accent" : "bg-transparent text-muted border-line"].join(" ")}>De contado</button>
          <button onClick={() => setCredit(true)} className={["px-3.5 py-2 rounded-xl text-[12.5px] font-medium border cursor-pointer", credit ? "bg-accent text-accentFg border-accent" : "bg-transparent text-muted border-line"].join(" ")}>A crédito</button>
        </div>
      </div>

      {credit ? (
        <>
          <div>
            <label className={labelClass}>Proveedor</label>
            <select className={fieldClass} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Selecciona proveedor...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <div className="text-[11.5px] text-dim mt-1">Primero crea el proveedor en Proveedores</div>
            )}
          </div>
          <div>
            <label className={labelClass}>Vence (opcional)</label>
            <input type="date" className={fieldClass} value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </>
      ) : (
        <div>
          <label className={labelClass}>¿De dónde sale el dinero?</label>
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

export default function ViewProductos({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const { products, customers, bankAccounts } = initialData;
  const [modal, setModal] = useState<{ kind: "new" } | { kind: "edit"; product: Product } | { kind: "compra" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const suppliers = customers.filter(c => c.kind === "supplier");
  const lowStock = products.filter(p => p.active && p.stock <= p.minStock && p.minStock > 0);
  const invValue = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const fmt = (n: number) => (privacy ? "•••" : COP(n));

  const doDelete = async (id: string) => {
    await deleteProduct(id);
    setConfirmDelete(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={`${cardBase} flex items-start justify-between gap-4 flex-wrap`}>
        <div>
          <div className={microLabel + " mb-1"}>Valor del inventario (a costo)</div>
          <div className="text-[32px] font-medium tabular-nums leading-none">{fmt(invValue)}</div>
          <div className="text-[12px] text-muted mt-1.5">
            {products.length} producto{products.length === 1 ? "" : "s"}
            {lowStock.length > 0 && <span className="text-neg"> · {lowStock.length} con stock bajo</span>}
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <button onClick={() => setModal({ kind: "compra" })} disabled={products.length === 0}
            className="h-[36px] px-4 rounded-xl border border-line bg-transparent text-fg text-[13px] font-medium cursor-pointer disabled:opacity-40">
            Entrada de mercancía
          </button>
          <button onClick={() => setModal({ kind: "new" })}
            className="h-[36px] px-4 rounded-xl border-none bg-accent text-accentFg text-[13px] font-medium cursor-pointer">
            + Producto
          </button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className={`${cardBase} border-neg/40`}>
          <div className={microLabel + " mb-2 text-neg"}>Stock bajo — pide mercancía</div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="px-3 py-1.5 rounded-lg border border-line text-[12.5px]">
                {p.name}: <span className="text-neg font-medium">{p.stock}</span> (mín. {p.minStock})
              </span>
            ))}
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className={`${cardBase} text-center py-8 text-muted text-[13.5px]`}>
          Crea tu catálogo de productos: con costo y precio te calculo el margen,
          y cada venta descuenta el inventario automáticamente.
        </div>
      ) : (
        <div className={cardBase}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="text-left text-dim text-[11px] border-b border-line">
                  <th className="pb-2 font-medium pr-4">Producto</th>
                  <th className="pb-2 font-medium pr-4 text-right">Stock</th>
                  <th className="pb-2 font-medium pr-4 text-right">Costo</th>
                  <th className="pb-2 font-medium pr-4 text-right">Precio</th>
                  <th className="pb-2 font-medium pr-4 text-right">Margen</th>
                  <th className="pb-2 font-medium w-24" />
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const margen = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                  const low = p.stock <= p.minStock && p.minStock > 0;
                  return (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium">{p.name}</div>
                        {p.category && <div className="text-[11px] text-dim">{p.category}</div>}
                      </td>
                      <td className={`py-2.5 pr-4 text-right tabular-nums ${low ? "text-neg font-medium" : ""}`}>{p.stock}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-muted">{fmt(p.cost)}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{fmt(p.price)}</td>
                      <td className={`py-2.5 pr-4 text-right tabular-nums ${margen > 0 ? "text-pos" : "text-neg"}`}>
                        {margen.toFixed(0)}%
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setModal({ kind: "edit", product: p })}
                            className="text-[11px] text-dim border border-line rounded-lg px-2 py-0.5 bg-transparent cursor-pointer hover:text-fg">
                            Editar
                          </button>
                          {confirmDelete === p.id ? (
                            <button onClick={() => doDelete(p.id)}
                              className="text-[11px] text-neg border border-neg rounded-lg px-2 py-0.5 bg-transparent cursor-pointer">
                              Confirmar
                            </button>
                          ) : (
                            <button onClick={() => setConfirmDelete(p.id)}
                              className="text-[11px] text-dim border border-line rounded-lg px-2 py-0.5 bg-transparent cursor-pointer hover:text-neg">
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal?.kind === "new" && <ModalProducto onClose={() => setModal(null)} />}
      {modal?.kind === "edit" && <ModalProducto product={modal.product} onClose={() => setModal(null)} />}
      {modal?.kind === "compra" && (
        <ModalCompra products={products} suppliers={suppliers} bankAccounts={bankAccounts} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
