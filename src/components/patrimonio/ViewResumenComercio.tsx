"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COP, today } from "../../data/mock";
import type { AllData, Sale } from "../../types";
import { usePrivacy } from "./PrivacyContext";
import { deleteSale, setSalesGoal } from "../../../lib/actions";
import ModalMovimiento from "./ModalMovimiento";
import ModalVenta from "./ModalVenta";

const cardBase = "border border-line bg-panel rounded-2xl p-5";
const microLabel = "text-[11px] tracking-[0.08em] uppercase text-dim font-medium";

function addDays(date: string, n: number): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function Ring({ pct, size = 52, stroke = 5, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(1, Math.max(0, pct / 100));
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" />
    </svg>
  );
}

export default function ViewResumenComercio({ initialData }: { initialData: AllData }) {
  const privacy = usePrivacy();
  const router = useRouter();
  const [modal, setModal] = useState<"venta" | "gasto" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState(false);
  const [goalRaw, setGoalRaw] = useState("");

  const { finances, bankAccounts, customers, categories, budgets, budgetConfigs, sales, products, config, cash } = initialData;
  const todayStr = today();
  const monthPrefix = todayStr.slice(0, 7);
  const prevMonthPrefix = useMemo(() => {
    const d = new Date(todayStr + "T12:00:00");
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, [todayStr]);

  const stats = useMemo(() => {
    let ventasHoy = 0, ventasMes = 0, costoMes = 0, ventasMesAnterior = 0;
    let numVentasHoy = 0, numVentasMes = 0;
    const topProductos: Record<string, { qty: number; total: number }> = {};
    const topClientes: Record<string, number> = {};
    const porDiaSemana = Array.from({ length: 7 }, () => ({ total: 0, dias: new Set<string>() }));
    const desde8Semanas = addDays(todayStr, -56);
    const porMetodoPago: Record<string, number> = {};
    const productosVendidosMes = new Set<string>();
    const porCategoria: Record<string, number> = {};

    for (const s of sales) {
      if (s.date === todayStr) { ventasHoy += s.total; numVentasHoy++; }
      if (s.date.startsWith(monthPrefix)) {
        ventasMes += s.total;
        costoMes += s.cost;
        numVentasMes++;
        const metodo = s.payMethod === "cash" ? "Efectivo" : s.payMethod === "fiado" ? "Fiado" : "Transferencia";
        porMetodoPago[metodo] = (porMetodoPago[metodo] ?? 0) + s.total;
        for (const i of s.items) {
          const t = (topProductos[i.name] ??= { qty: 0, total: 0 });
          t.qty += i.qty;
          t.total += i.qty * i.price;
          if (i.productId) productosVendidosMes.add(i.productId);
          const prod = products.find(p => p.id === i.productId);
          if (prod?.category) porCategoria[prod.category] = (porCategoria[prod.category] ?? 0) + i.qty * i.price;
        }
        if (s.customerId) topClientes[s.customerId] = (topClientes[s.customerId] ?? 0) + s.total;
      }
      if (s.date.startsWith(prevMonthPrefix)) ventasMesAnterior += s.total;
      if (s.date >= desde8Semanas) {
        const dow = new Date(s.date + "T12:00:00").getDay();
        porDiaSemana[dow].total += s.total;
        porDiaSemana[dow].dias.add(s.date);
      }
    }

    let otrosHoy = 0, otrosMes = 0, gastosHoy = 0, gastosMes = 0, gastosOperativosMes = 0;
    const gastosPorCat: Record<string, number> = {};
    for (const f of finances) {
      if (f.type === "ingreso" && !f.saleId) {
        if (f.date === todayStr) otrosHoy += f.amount;
        if (f.date.startsWith(monthPrefix)) otrosMes += f.amount;
      }
      if (f.type === "egreso") {
        if (f.date === todayStr) gastosHoy += f.amount;
        if (f.date.startsWith(monthPrefix)) {
          gastosMes += f.amount;
          if (f.category !== "Mercancía") gastosOperativosMes += f.amount;
          const cat = f.category || "Sin categoría";
          gastosPorCat[cat] = (gastosPorCat[cat] ?? 0) + f.amount;
        }
      }
    }

    const prods = Object.entries(topProductos).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
    const clientes = Object.entries(topClientes).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const semana = porDiaSemana.map((d, i) => ({
      label: WEEKDAYS[i],
      promedio: d.dias.size > 0 ? d.total / d.dias.size : 0,
    }));
    const totalIngresosMes = ventasMes + otrosMes;
    const ticketPromedioMes = numVentasMes > 0 ? totalIngresosMes / numVentasMes : 0;
    const margenPct = totalIngresosMes > 0 ? ((totalIngresosMes - costoMes) / totalIngresosMes) * 100 : 0;
    const sinMovimiento = products.filter(p => p.active && !productosVendidosMes.has(p.id));
    const topGastos = Object.entries(gastosPorCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCategorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      ventasHoy: ventasHoy + otrosHoy, gastosHoy,
      ventasMes: totalIngresosMes, costoMes, gastosMes, gastosOperativosMes,
      ventasMesAnterior,
      margenBruto: totalIngresosMes - costoMes,
      numVentasHoy, numVentasMes, ticketPromedioMes, margenPct,
      porMetodoPago, sinMovimiento, topGastos, topCategorias,
      topProductos: prods, topClientes: clientes, semana,
    };
  }, [sales, finances, products, todayStr, monthPrefix, prevMonthPrefix]);

  const utilidadMes = stats.margenBruto - stats.gastosOperativosMes;
  const fiadoPendiente = useMemo(
    () => customers.filter(c => c.kind !== "supplier").reduce((total, c) =>
      total + c.movements.reduce((s, m) => s + (m.type === "fiado" ? m.amount : -m.amount), 0), 0),
    [customers],
  );
  const deudaProveedores = useMemo(
    () => customers.filter(c => c.kind === "supplier").reduce((total, c) =>
      total + c.movements.reduce((s, m) => s + (m.type === "fiado" ? m.amount : -m.amount), 0), 0),
    [customers],
  );
  const vencimientos = useMemo(() => {
    const limite = addDays(todayStr, 7);
    const out: { name: string; dueDate: string }[] = [];
    for (const c of customers) {
      if (c.kind !== "supplier") continue;
      const debt = c.movements.reduce((s, m) => s + (m.type === "fiado" ? m.amount : -m.amount), 0);
      if (debt <= 0) continue;
      for (const m of c.movements) {
        if (m.type === "fiado" && m.dueDate && m.dueDate <= limite) {
          out.push({ name: c.name, dueDate: m.dueDate });
          break;
        }
      }
    }
    return out;
  }, [customers, todayStr]);

  const lowStock = products.filter(p => p.active && p.minStock > 0 && p.stock <= p.minStock);
  const saldoCuentas = bankAccounts.reduce((s, a) => s + a.balance, 0) + (cash?.banco ?? 0);
  const inventarioCosto = products.filter(p => p.active).reduce((s, p) => s + p.cost * p.stock, 0);
  const inventarioVenta = products.filter(p => p.active).reduce((s, p) => s + p.price * p.stock, 0);
  const capitalTrabajo = saldoCuentas + fiadoPendiente - deudaProveedores;
  const totalFiado = useMemo(() => {
    let dado = 0, cobrado = 0;
    for (const c of customers) {
      if (c.kind === "supplier") continue;
      for (const m of c.movements) {
        if (m.type === "fiado") dado += m.amount;
        else cobrado += m.amount;
      }
    }
    return { dado, cobrado, tasa: dado > 0 ? (cobrado / dado) * 100 : 0 };
  }, [customers]);
  const goal = config?.salesGoal ?? null;
  const cambioMes = stats.ventasMesAnterior > 0
    ? ((stats.ventasMes - stats.ventasMesAnterior) / stats.ventasMesAnterior) * 100
    : null;

  const chart = useMemo(() => {
    const days: { date: string; ventas: number; gastos: number }[] = [];
    for (let i = 13; i >= 0; i--) days.push({ date: addDays(todayStr, -i), ventas: 0, gastos: 0 });
    const idx = Object.fromEntries(days.map((d, i) => [d.date, i]));
    for (const s of sales) {
      const i = idx[s.date];
      if (i !== undefined) days[i].ventas += s.total;
    }
    for (const f of finances) {
      const i = idx[f.date];
      if (i === undefined) continue;
      if (f.type === "ingreso" && !f.saleId) days[i].ventas += f.amount;
      if (f.type === "egreso") days[i].gastos += f.amount;
    }
    const max = Math.max(1, ...days.map(d => Math.max(d.ventas, d.gastos)));
    return { days, max };
  }, [sales, finances, todayStr]);

  const recentSales = sales.slice(0, 8);
  const fmt = (n: number) => (privacy ? "•••" : COP(n));
  const customerName = (id?: string) => customers.find(c => c.id === id)?.name;

  const doDeleteSale = async (id: string) => {
    await deleteSale(id);
    setConfirmDelete(null);
    router.refresh();
  };

  const shareReceipt = (s: Sale) => {
    const lines = [
      "🧾 *Recibo de venta*",
      s.date,
      "",
      ...s.items.map(i => `${i.qty} x ${i.name} — ${COP(i.qty * i.price)}`),
      "",
      `*Total: ${COP(s.total)}*`,
      s.payMethod === "fiado" ? "Pago: Fiado" : s.payMethod === "cash" ? "Pago: Efectivo" : "Pago: Transferencia",
      "",
      "¡Gracias por su compra!",
    ];
    const phone = customers.find(c => c.id === s.customerId)?.phone?.replace(/\D/g, "");
    const url = `https://wa.me/${phone ? `57${phone}` : ""}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank");
  };

  const saveGoal = async () => {
    const val = Number(goalRaw.replace(/\D/g, "")) || 0;
    await setSalesGoal(val > 0 ? val : null);
    setEditGoal(false);
    router.refresh();
  };

  const isEmpty = sales.length === 0 && finances.length === 0 && customers.length === 0 && products.length === 0;
  const goalPct = goal ? Math.min(100, (stats.ventasMes / goal) * 100) : 0;
  const metodos = Object.entries(stats.porMetodoPago).sort((a, b) => b[1] - a[1]);
  const metodoTotal = metodos.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="flex flex-col gap-5">
      {isEmpty && (
        <div className={`${cardBase} text-center py-8`}>
          <div className="text-[22px] font-medium mb-2" style={{ fontFamily: "Spectral, serif" }}>
            Bienvenido al perfil de tu negocio
          </div>
          <p className="text-[13.5px] text-muted m-0 max-w-[520px] mx-auto">
            Empieza creando tus <Link href="/productos" className="text-fg">productos</Link> para vender con inventario y margen,
            o registra tu primera venta con el botón de abajo. También puedes llevar el
            <Link href="/clientes" className="text-fg"> fiado de clientes</Link> y tus <Link href="/proveedores" className="text-fg">proveedores</Link>.
          </p>
        </div>
      )}

      {/* ── Hero: utilidad + rings ── */}
      <div className={cardBase}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className={microLabel + " mb-1"}>Utilidad del mes</div>
            <div className={`text-[36px] font-medium tabular-nums leading-none ${utilidadMes >= 0 ? "text-pos" : "text-neg"}`}>
              {privacy ? "•••" : `${utilidadMes >= 0 ? "+" : ""}${COP(utilidadMes)}`}
            </div>
            <div className="flex gap-4 mt-2 text-[13px] flex-wrap">
              <span className="text-muted">Ventas: <span className="text-pos">{fmt(stats.ventasMes)}</span></span>
              <span className="text-muted">Costo: <span className="text-fg">{fmt(stats.costoMes)}</span></span>
              <span className="text-muted">Gastos op: <span className="text-neg">{fmt(stats.gastosOperativosMes)}</span></span>
              {cambioMes !== null && (
                <span className={cambioMes >= 0 ? "text-pos" : "text-neg"}>
                  {cambioMes >= 0 ? "▲" : "▼"} {Math.abs(cambioMes).toFixed(1)}% vs mes pasado
                </span>
              )}
            </div>
          </div>
          {/* Ring gauges for margen + meta */}
          <div className="flex gap-5 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <Ring pct={stats.margenPct} color="var(--accent)" />
                <span className="absolute inset-0 flex items-center justify-center text-[12px] font-medium tabular-nums rotate-0">
                  {privacy ? "•" : `${stats.margenPct.toFixed(0)}%`}
                </span>
              </div>
              <span className="text-[10px] text-dim">Margen</span>
            </div>
            {goal ? (
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Ring pct={goalPct} color={goalPct >= 100 ? "var(--pos)" : "var(--accent)"} />
                  <span className="absolute inset-0 flex items-center justify-center text-[12px] font-medium tabular-nums">
                    {privacy ? "•" : `${goalPct.toFixed(0)}%`}
                  </span>
                </div>
                <span className="text-[10px] text-dim">Meta</span>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setModal("venta")}
                className="h-[34px] px-4 rounded-xl border-none bg-accent text-accentFg text-[13px] font-medium cursor-pointer"
              >
                + Venta
              </button>
              <button
                onClick={() => setModal("gasto")}
                className="h-[34px] px-4 rounded-xl border border-line bg-transparent text-fg text-[13px] font-medium cursor-pointer"
              >
                + Gasto
              </button>
            </div>
          </div>
        </div>

        {/* Meta inline */}
        <div className="mt-4 pt-3 border-t border-line">
          {editGoal ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                className="w-[160px] h-[34px] px-3 rounded-lg border border-line bg-panel2 text-fg text-[13px] outline-none tabular-nums"
                value={goalRaw}
                onChange={e => setGoalRaw(e.target.value.replace(/\D/g, "") ? Number(e.target.value.replace(/\D/g, "")).toLocaleString("es-CO") : "")}
                placeholder="Meta mensual $"
                onKeyDown={e => e.key === "Enter" && saveGoal()}
              />
              <button onClick={saveGoal} className="h-[34px] px-3 rounded-lg border-none bg-accent text-accentFg text-[12px] font-medium cursor-pointer">OK</button>
              <button onClick={() => setEditGoal(false)} className="h-[34px] px-3 rounded-lg border border-line bg-transparent text-muted text-[12px] cursor-pointer">Cancelar</button>
            </div>
          ) : goal ? (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">Meta: {fmt(goal)}</span>
              <span>
                <span className={goalPct >= 100 ? "text-pos font-medium" : "text-muted"}>{fmt(stats.ventasMes)} vendido</span>
                <button onClick={() => { setGoalRaw(String(Math.round(goal)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")); setEditGoal(true); }} className="ml-2 text-dim border-none bg-transparent cursor-pointer underline underline-offset-2 p-0 text-[11px]">editar</button>
              </span>
            </div>
          ) : (
            <button onClick={() => setEditGoal(true)} className="text-[12px] text-dim border-none bg-transparent cursor-pointer underline underline-offset-2 p-0">
              + Ponte una meta de ventas mensual
            </button>
          )}
        </div>
      </div>

      {/* ── Alertas ── */}
      {(lowStock.length > 0 || vencimientos.length > 0) && (
        <div className="flex flex-col gap-2">
          {lowStock.length > 0 && (
            <Link href="/productos" className="no-underline text-fg flex items-center gap-3 rounded-xl px-4 py-2.5 border border-line bg-panel" style={{ borderColor: "color-mix(in srgb, var(--neg), transparent 60%)" }}>
              <span className="text-neg text-[15px]">⚠</span>
              <span className="text-[13px]">
                <span className="font-medium">{lowStock.length} producto{lowStock.length === 1 ? "" : "s"} con stock bajo:</span>{" "}
                <span className="text-muted">{lowStock.slice(0, 4).map(p => p.name).join(", ")}{lowStock.length > 4 ? "…" : ""}</span>
              </span>
            </Link>
          )}
          {vencimientos.map(v => (
            <Link key={v.name + v.dueDate} href="/proveedores" className="no-underline text-fg flex items-center gap-3 rounded-xl px-4 py-2.5 border border-line bg-panel" style={{ borderColor: "color-mix(in srgb, var(--neg), transparent 60%)" }}>
              <span className="text-neg text-[15px]">⏰</span>
              <span className="text-[13px]">
                <span className="font-medium">Pago a {v.name}</span>{" "}
                <span className="text-muted">vence {v.dueDate <= todayStr ? "¡ya!" : v.dueDate}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Strip: hoy ── no individual borders, one shared container */}
      <div className={cardBase}>
        <div className={microLabel + " mb-3"}>Hoy</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4">
          <div>
            <div className="text-[22px] font-medium tabular-nums text-pos leading-tight">{fmt(stats.ventasHoy)}</div>
            <div className="text-[12px] text-muted">{stats.numVentasHoy} venta{stats.numVentasHoy !== 1 ? "s" : ""}</div>
          </div>
          <div>
            <div className="text-[22px] font-medium tabular-nums text-neg leading-tight">{fmt(stats.gastosHoy)}</div>
            <div className="text-[12px] text-muted">gastos</div>
          </div>
          <div>
            <div className={`text-[22px] font-medium tabular-nums leading-tight ${stats.ventasHoy - stats.gastosHoy >= 0 ? "text-pos" : "text-neg"}`}>
              {fmt(stats.ventasHoy - stats.gastosHoy)}
            </div>
            <div className="text-[12px] text-muted">balance del día</div>
          </div>
          <div>
            <div className="text-[22px] font-medium tabular-nums leading-tight">{fmt(stats.ticketPromedioMes)}</div>
            <div className="text-[12px] text-muted">ticket promedio</div>
          </div>
        </div>
      </div>

      {/* ── Dinero: caja, cuentas, capital, inventario — horizontal strip con separadores ── */}
      <div className={`${cardBase} flex flex-wrap`}>
        {([
          { label: "Caja", value: cash?.banco ?? 0, href: "/caja" as string | undefined, sub: "cerrar caja →", color: "" },
          { label: "Cuentas", value: saldoCuentas, href: "/accounts" as string | undefined, sub: "", color: "" },
          { label: "Capital de trabajo", value: capitalTrabajo, href: undefined, sub: "cuentas + fiado − deudas", color: capitalTrabajo >= 0 ? "text-pos" : "text-neg" },
          { label: "Inventario", value: inventarioVenta, href: "/productos" as string | undefined, sub: `costo: ${fmt(inventarioCosto)}`, color: "" },
        ]).map((item, i) => {
          const inner = (
            <>
              <div className="text-[11px] text-dim uppercase tracking-wider">{item.label}</div>
              <div className={`text-[20px] font-medium tabular-nums leading-tight mt-0.5 ${item.color}`}>{fmt(item.value)}</div>
              {item.sub && <div className="text-[11px] text-dim mt-0.5">{item.sub}</div>}
            </>
          );
          const cls = `flex-1 min-w-[140px] py-1 ${i > 0 ? "sm:border-l sm:border-line sm:pl-5" : ""}`;
          return item.href ? (
            <Link key={item.label} href={item.href} className={`${cls} no-underline text-fg hover:opacity-80 transition-opacity`}>{inner}</Link>
          ) : (
            <div key={item.label} className={cls}>{inner}</div>
          );
        })}
      </div>

      {/* ── Fiado + proveedores: mixed layout ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/clientes" className="no-underline text-fg hover:opacity-80 transition-opacity border border-line bg-panel rounded-2xl p-5 flex items-center gap-4">
          <Ring pct={totalFiado.tasa} size={48} stroke={4} color="var(--accent)" />
          <div>
            <div className="text-[18px] font-medium tabular-nums">{fmt(fiadoPendiente)}</div>
            <div className="text-[12px] text-muted">te deben · recaudo {privacy ? "•" : `${totalFiado.tasa.toFixed(0)}%`}</div>
          </div>
        </Link>
        <Link href="/proveedores" className="no-underline text-fg hover:opacity-80 transition-opacity border border-line bg-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-line flex items-center justify-center text-[18px] shrink-0">📦</div>
          <div>
            <div className="text-[18px] font-medium tabular-nums">{fmt(deudaProveedores)}</div>
            <div className="text-[12px] text-muted">debes a proveedores</div>
          </div>
        </Link>
        <div className="border border-line bg-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="text-[28px] leading-none">{stats.numVentasMes}</div>
          <div>
            <div className="text-[13px] font-medium">ventas este mes</div>
            <div className="text-[12px] text-muted">{fmt(stats.ventasMes)} total</div>
          </div>
        </div>
      </div>

      {/* ── Chart: 14 días ── */}
      {(sales.length > 0 || finances.length > 0) && (
        <div className={cardBase}>
          <div className={microLabel + " mb-3"}>Últimos 14 días</div>
          <svg viewBox="0 0 700 160" className="w-full" style={{ height: 160 }}>
            {chart.days.map((d, i) => {
              const bw = 700 / 14;
              const x = i * bw;
              const hv = (d.ventas / chart.max) * 130;
              const hg = (d.gastos / chart.max) * 130;
              return (
                <g key={d.date}>
                  <rect x={x + bw * 0.18} y={140 - hv} width={bw * 0.28} height={Math.max(hv, d.ventas > 0 ? 2 : 0)} rx="2" fill="var(--pos)" opacity="0.85" />
                  <rect x={x + bw * 0.54} y={140 - hg} width={bw * 0.28} height={Math.max(hg, d.gastos > 0 ? 2 : 0)} rx="2" fill="var(--neg)" opacity="0.7" />
                  <text x={x + bw / 2} y={155} textAnchor="middle" fontSize="9" fill="var(--dim)">{d.date.slice(8)}</text>
                </g>
              );
            })}
          </svg>
          <div className="flex gap-4 mt-2 text-[11px] text-muted">
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1.5" style={{ background: "var(--pos)" }} />Ventas</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1.5" style={{ background: "var(--neg)" }} />Gastos</span>
          </div>
        </div>
      )}

      {/* ── Método de pago: stacked horizontal bar (no card border) ── */}
      {metodos.length > 0 && (
        <div className={cardBase}>
          <div className={microLabel + " mb-3"}>Ventas por método de pago</div>
          <div className="h-5 rounded-full overflow-hidden flex">
            {metodos.map(([m, v]) => (
              <div key={m} style={{
                width: `${(v / metodoTotal) * 100}%`,
                background: m === "Efectivo" ? "var(--pos)" : m === "Fiado" ? "var(--neg)" : "var(--accent)",
                opacity: 0.85,
              }} />
            ))}
          </div>
          <div className="flex gap-4 mt-2 flex-wrap">
            {metodos.map(([m, v]) => (
              <span key={m} className="text-[12px] text-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{
                  background: m === "Efectivo" ? "var(--pos)" : m === "Fiado" ? "var(--neg)" : "var(--accent)",
                }} />
                {m}: {fmt(v)} ({(v / metodoTotal * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Últimas ventas */}
        {recentSales.length > 0 && (
          <div className={cardBase}>
            <div className={microLabel + " mb-3"}>Últimas ventas</div>
            <div className="flex flex-col">
              {recentSales.map((s, idx) => (
                <div key={s.id} className={`flex items-center justify-between gap-3 text-[13px] py-2.5 ${idx > 0 ? "border-t border-line" : ""}`}>
                  <div className="min-w-0">
                    <div className="truncate">
                      {s.items.map(i => `${i.qty}x ${i.name}`).join(", ")}
                    </div>
                    <div className="text-[11px] text-dim">
                      {s.date} · {s.payMethod === "cash" ? "Efectivo" : s.payMethod === "fiado" ? `Fiado${customerName(s.customerId) ? ` · ${customerName(s.customerId)}` : ""}` : bankAccounts.find(a => a.id === s.payMethod)?.name ?? "Cuenta"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="tabular-nums text-pos font-medium">{fmt(s.total)}</span>
                    <button onClick={() => shareReceipt(s)} title="Enviar recibo por WhatsApp"
                      className="text-[11px] text-dim border border-line rounded-lg px-2 py-0.5 bg-transparent cursor-pointer hover:text-fg">
                      Recibo
                    </button>
                    {confirmDelete === s.id ? (
                      <button onClick={() => doDeleteSale(s.id)}
                        className="text-[11px] text-neg border border-neg rounded-lg px-2 py-0.5 bg-transparent cursor-pointer">
                        Sí, borrar
                      </button>
                    ) : (
                      <button onClick={() => setConfirmDelete(s.id)} title="Eliminar venta (devuelve stock y dinero)"
                        className="text-[11px] text-dim border-none bg-transparent cursor-pointer hover:text-neg p-0">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top productos */}
        {stats.topProductos.length > 0 && (
          <div className={cardBase}>
            <div className={microLabel + " mb-3"}>Más vendidos este mes</div>
            <div className="flex flex-col gap-2.5">
              {stats.topProductos.map(([name, t], idx) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-[18px] font-medium text-dim w-6 text-center tabular-nums">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[13px]">
                      <span className="truncate">{name} <span className="text-dim">× {t.qty}</span></span>
                      <span className="tabular-nums text-muted shrink-0 ml-2">{fmt(t.total)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-panel2 overflow-hidden mt-1">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (t.total / (stats.topProductos[0][1].total || 1)) * 100)}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venta por día de semana: mini bar chart with values */}
        {sales.length > 0 && (
          <div className={cardBase}>
            <div className={microLabel + " mb-3"}>Promedio por día de semana</div>
            <div className="flex items-end gap-1.5 h-[100px]">
              {(() => {
                const max = Math.max(1, ...stats.semana.map(x => x.promedio));
                return stats.semana.map(d => (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] tabular-nums text-muted">{d.promedio > 0 && !privacy ? COP(d.promedio) : ""}</span>
                    <div className="w-full rounded-t-md transition-all" style={{
                      height: `${Math.max(3, (d.promedio / max) * 65)}px`,
                      background: "var(--accent)",
                      opacity: d.promedio > 0 ? 0.85 : 0.12,
                    }} />
                    <span className="text-[10px] text-dim">{d.label}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Mejores clientes */}
        {stats.topClientes.length > 0 && (
          <div className={cardBase}>
            <div className={microLabel + " mb-3"}>Mejores clientes</div>
            <div className="flex flex-col">
              {stats.topClientes.map(([id, total], idx) => (
                <div key={id} className={`flex items-center gap-3 py-2 ${idx > 0 ? "border-t border-line" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-panel2 flex items-center justify-center text-[12px] font-medium text-muted shrink-0">
                    {(customerName(id) ?? "C")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 flex justify-between text-[13px]">
                    <span className="truncate">{customerName(id) ?? "Cliente"}</span>
                    <span className="tabular-nums text-muted">{fmt(total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ventas por categoría */}
        {stats.topCategorias.length > 0 && (
          <div className={cardBase}>
            <div className={microLabel + " mb-3"}>Ventas por categoría</div>
            <div className="flex flex-col gap-2">
              {stats.topCategorias.map(([cat, total]) => {
                const pct = stats.ventasMes > 0 ? (total / stats.ventasMes) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[13px]">
                        <span className="truncate">{cat}</span>
                        <span className="tabular-nums text-muted shrink-0 ml-2">{fmt(total)} <span className="text-dim">({pct.toFixed(0)}%)</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gastos por categoría */}
        {stats.topGastos.length > 0 && (
          <div className={cardBase}>
            <div className={microLabel + " mb-3"}>Gastos por categoría</div>
            <div className="flex flex-col gap-2">
              {stats.topGastos.map(([cat, total]) => (
                <div key={cat}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="truncate">{cat}</span>
                    <span className="tabular-nums text-muted">{fmt(total)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-panel2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (total / (stats.topGastos[0][1] || 1)) * 100)}%`, background: "var(--neg)", opacity: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos sin movimiento */}
        {stats.sinMovimiento.length > 0 && (
          <div className={cardBase}>
            <div className={microLabel + " mb-3"}>Sin ventas este mes · {stats.sinMovimiento.length} producto{stats.sinMovimiento.length !== 1 ? "s" : ""}</div>
            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto">
              {stats.sinMovimiento.map(p => (
                <span key={p.id} className="text-[12px] px-2.5 py-1 rounded-lg bg-panel2 text-muted">
                  {p.name} <span className="text-dim">({p.stock})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {modal === "venta" && (
        <ModalVenta products={products} customers={customers} bankAccounts={bankAccounts} onClose={() => setModal(null)} />
      )}
      {modal === "gasto" && (
        <ModalMovimiento
          onClose={() => setModal(null)}
          bankAccounts={bankAccounts}
          categories={categories}
          finances={finances}
          budgets={budgets}
          budgetConfigs={budgetConfigs}
          editInitial={{ type: "egreso", amount: 0, desc: "", date: todayStr, category: "Compras" }}
        />
      )}
    </div>
  );
}
