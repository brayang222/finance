import React from "react";
import { Asset, Account, Transaction, COP, PCT } from "../../data/mock";
import { Bal } from "./utils";

// ponytail: shared style objects replaced with className strings
const cardClass = "border border-line bg-panel rounded-[18px] p-[22px]";

const thClass =
  "text-[11.5px] tracking-[0.04em] uppercase text-dim font-medium text-left pb-[10px]";

const tdClass = "py-3 border-t border-line text-[13.5px]";

const monoStyle = { fontFamily: "'IBM Plex Mono', monospace" };

function AssetTable({
  assets,
  privacy,
  onSelect,
}: {
  assets: Asset[];
  privacy: boolean;
  onSelect: (t: string) => void;
}) {
  if (assets.length === 0) {
    return (
      <div className={`${cardClass} text-muted text-[13px]`}>
        No hay posiciones registradas.
      </div>
    );
  }
  return (
    <div className={cardClass}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[560px]">
          <thead>
            <tr>
              <th className={thClass}>Activo</th>
              <th className={`${thClass} text-right`}>Cantidad</th>
              <th className={`${thClass} text-right`}>Precio</th>
              <th className={`${thClass} text-right`}>Valor</th>
              <th className={`${thClass} text-right`}>P/G</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => {
              const value = a.qty * a.price;
              const cost  = a.qty * a.avg;
              const pl    = value - cost;
              const plPct = cost > 0 ? pl / cost : 0;
              const pos   = pl >= 0;
              return (
                <tr key={a.ticker} onClick={() => onSelect(a.ticker)} className="cursor-pointer">
                  <td className={tdClass}>
                    <div className="flex items-center gap-[10px]">
                      <span
                        className="w-[30px] h-[30px] rounded-lg bg-panel2 border border-line flex items-center justify-center text-[11px] text-muted"
                        style={monoStyle}
                      >
                        {a.mono}
                      </span>
                      <div>
                        <div className="text-[13px]" style={monoStyle}>{a.ticker}</div>
                        <div className="text-[11.5px] text-dim">{a.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                    {a.qty % 1 === 0 ? a.qty.toLocaleString("es-CO") : a.qty.toFixed(4)}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                    {privacy ? "••••" : COP(a.price)}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`} style={monoStyle}>
                    <Bal n={value} privacy={privacy} />
                  </td>
                  <td className={`${tdClass} text-right tabular-nums ${pos ? "text-pos" : "text-neg"}`} style={monoStyle}>
                    <div>{PCT(plPct)}</div>
                    <div className="text-[12px] opacity-80">
                      {privacy ? "••••" : `${pos ? "+" : "−"}${COP(Math.abs(pl))}`}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ViewInversiones({
  privacy,
  assets,
  onSelect,
}: {
  privacy: boolean;
  assets: Asset[];
  onSelect: (t: string) => void;
}) {
  const totalValue = assets.reduce((s, a) => s + a.qty * a.price, 0);
  const totalCost  = assets.reduce((s, a) => s + a.qty * a.avg, 0);
  const totalPL    = totalValue - totalCost;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <SummaryCard label="Valor del portafolio" value={<Bal n={totalValue} privacy={privacy} />} />
        <SummaryCard label="Costo invertido" value={<Bal n={totalCost} privacy={privacy} />} />
        <SummaryCard
          label="Rendimiento P/G"
          value={
            <span className={totalPL >= 0 ? "text-pos" : "text-neg"}>
              <Bal n={Math.abs(totalPL)} privacy={privacy} />
            </span>
          }
          sub={
            totalCost > 0 ? (
              <span className={totalPL >= 0 ? "text-pos" : "text-neg"}>
                {PCT(totalPL / totalCost)}
              </span>
            ) : undefined
          }
        />
      </div>
      <AssetTable assets={assets} privacy={privacy} onSelect={onSelect} />
    </div>
  );
}

export function ViewCripto({
  privacy,
  assets,
  onSelect,
}: {
  privacy: boolean;
  assets: Asset[];
  onSelect: (t: string) => void;
}) {
  const totalValue = assets.reduce((s, a) => s + a.qty * a.price, 0);
  const totalCost  = assets.reduce((s, a) => s + a.qty * a.avg, 0);
  const totalPL    = totalValue - totalCost;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <SummaryCard label="Valor en cripto" value={<Bal n={totalValue} privacy={privacy} />} />
        <SummaryCard label="Costo invertido" value={<Bal n={totalCost} privacy={privacy} />} />
        <SummaryCard
          label="Rendimiento P/G"
          value={
            <span className={totalPL >= 0 ? "text-pos" : "text-neg"}>
              <Bal n={Math.abs(totalPL)} privacy={privacy} />
            </span>
          }
          sub={
            totalCost > 0 ? (
              <span className={totalPL >= 0 ? "text-pos" : "text-neg"}>
                {PCT(totalPL / totalCost)}
              </span>
            ) : undefined
          }
        />
      </div>
      <AssetTable assets={assets} privacy={privacy} onSelect={onSelect} />
    </div>
  );
}

export function ViewDetalle({
  privacy,
  selected,
  selFrom,
  holdings,
  cryptoAssets,
  onBack,
}: {
  privacy: boolean;
  selected: string;
  selFrom: "inversiones" | "cripto";
  holdings: Asset[];
  cryptoAssets: Asset[];
  onBack: () => void;
}) {
  const asset = [...holdings, ...cryptoAssets].find((a) => a.ticker === selected);
  const pl = asset ? asset.qty * asset.price - asset.qty * asset.avg : 0;
  const plPct = asset && asset.avg > 0 ? pl / (asset.qty * asset.avg) : 0;

  return (
    <div>
      <button
        onClick={onBack}
        className="bg-transparent border-none text-muted cursor-pointer text-[13px] mb-3.5"
      >
        ← Volver a {selFrom === "inversiones" ? "Inversiones" : "Cripto"}
      </button>
      {asset ? (
        <div className="flex flex-col gap-3.5">
          {/* Header */}
          <div className={`${cardClass} flex items-center justify-between flex-wrap gap-4`}>
            <div className="flex items-center gap-[14px]">
              <span
                className="w-[42px] h-[42px] rounded-[11px] bg-panel2 border border-line flex items-center justify-center text-[14px] text-muted"
                style={monoStyle}
              >
                {asset.mono}
              </span>
              <div>
                <div className="text-[15px] font-medium" style={monoStyle}>{asset.ticker}</div>
                <div className="text-muted text-[13px]">{asset.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
                {privacy ? "••••••" : COP(asset.price)}
              </div>
              <div className={`text-[13px] ${asset.dayPct >= 0 ? "text-pos" : "text-neg"}`}>
                {PCT(asset.dayPct)} hoy
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <SummaryCard label="Cantidad"       value={<>{asset.qty % 1 === 0 ? asset.qty.toLocaleString("es-CO") : asset.qty.toFixed(4)}</>} />
            <SummaryCard label="Precio actual"  value={<Bal n={asset.price} privacy={privacy} />} />
            <SummaryCard label="Costo promedio" value={<Bal n={asset.avg} privacy={privacy} />} />
            <SummaryCard label="Valor mercado"  value={<Bal n={asset.qty * asset.price} privacy={privacy} />} />
            <SummaryCard
              label="P/G no realizada"
              value={
                <span className={pl >= 0 ? "text-pos" : "text-neg"}>
                  <Bal n={Math.abs(pl)} privacy={privacy} />
                </span>
              }
              sub={<span className={pl >= 0 ? "text-pos" : "text-neg"}>{PCT(plPct)}</span>}
            />
          </div>
        </div>
      ) : (
        <div className={`${cardClass} text-muted`}>Activo no encontrado.</div>
      )}
    </div>
  );
}

export function ViewTransacciones({
  privacy,
  transactions,
  onAdd,
}: {
  privacy: boolean;
  transactions: Transaction[];
  onAdd?: () => void;
}) {
  const nowYM = new Date().toISOString().slice(0, 7);
  const monthTx = transactions.filter((t) => t.dateISO.startsWith(nowYM));
  const income  = monthTx.filter((t) => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "egreso").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const monthLabel = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  const [filter, setFilter] = React.useState<"todos" | "ingresos" | "egresos">("todos");
  const filtered = transactions.filter((t) =>
    filter === "todos" ? true : filter === "ingresos" ? t.type === "ingreso" : t.type === "egreso"
  );

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <SummaryCard label={`Ingresos · ${monthLabel}`}
          value={<span className="text-pos"><Bal n={income} privacy={privacy} /></span>} />
        <SummaryCard label={`Egresos · ${monthLabel}`}
          value={<span className="text-neg"><Bal n={expense} privacy={privacy} /></span>} />
        <SummaryCard label="Balance neto"
          value={<span className={balance >= 0 ? "text-pos" : "text-neg"}><Bal n={Math.abs(balance)} privacy={privacy} /></span>}
          sub={<span className="text-dim">{balance >= 0 ? "Superávit" : "Déficit"}</span>}
        />
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-[10px]">
          <div className="text-[14px] font-medium">Movimientos</div>
          <div className="flex gap-2">
            {(["todos", "ingresos", "egresos"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={[
                "border-none cursor-pointer px-3 py-[5px] rounded-lg text-[12px] font-medium",
                filter === f ? "bg-accent text-accentFg" : "bg-panel2 text-muted",
              ].join(" ")}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            {onAdd && (
              <button onClick={onAdd} className="border border-line cursor-pointer px-3 py-[5px] rounded-lg text-[12px] font-medium bg-panel2 text-fg">
                + Registrar
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[480px]">
            <thead>
              <tr>
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Descripción</th>
                <th className={thClass}>Categoría</th>
                <th className={`${thClass} text-right`}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const pos = t.type === "ingreso";
                return (
                  <tr key={t.id}>
                    <td className={`${tdClass} text-muted whitespace-nowrap`} style={monoStyle}>{t.dateISO}</td>
                    <td className={`${tdClass} font-medium`}>{t.desc}</td>
                    <td className={`${tdClass} text-muted`}>{t.category}</td>
                    <td className={`${tdClass} text-right tabular-nums ${pos ? "text-pos" : "text-neg"}`} style={monoStyle}>
                      {privacy ? "••••••" : `${pos ? "+" : "−"}${COP(t.amount)}`}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className={`${tdClass} text-dim text-center`}>Sin movimientos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ViewCuentas({
  privacy,
  accounts,
  holdings,
  cryptoAssets,
}: {
  privacy: boolean;
  accounts: Account[];
  holdings: Asset[];
  cryptoAssets: Asset[];
}) {
  const cashTotal  = accounts.reduce((s, a) => s + a.balance, 0);
  const stockTotal = holdings.reduce((s, a) => s + a.qty * a.price, 0);
  const cryptoTotal = cryptoAssets.reduce((s, a) => s + a.qty * a.price, 0);
  const total      = cashTotal + stockTotal + cryptoTotal;

  const barParts = [
    { label: "Bolsa",   value: stockTotal,  color: "var(--accent)" },
    { label: "Cripto",  value: cryptoTotal, color: "#8a8f98" },
    { label: "Efectivo",value: cashTotal,   color: "var(--dim)" },
  ].filter((p) => p.value > 0);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Hero */}
      <div className={cardClass}>
        <div className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-1.5">
          Patrimonio total
        </div>
        <div className="text-[38px] font-medium tracking-[-0.02em] mb-4" style={{ fontFamily: "Spectral, serif" }}>
          <Bal n={total} privacy={privacy} />
        </div>

        {/* Composition bar */}
        {total > 0 && (
          <>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
              {barParts.map((p) => (
                <div key={p.label} className="min-w-[2px]" style={{ flex: p.value / total, background: p.color }} />
              ))}
            </div>
            <div className="flex gap-5 flex-wrap">
              {barParts.map((p) => (
                <div key={p.label} className="flex items-center gap-1.5 text-[12px]">
                  <span className="w-2 h-2 rounded-[2px]" style={{ background: p.color }} />
                  <span className="text-muted">{p.label}</span>
                  <span className="text-fg" style={monoStyle}>
                    {privacy ? "••••" : COP(p.value)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Account cards */}
      {accounts.length > 0 && (
        <div>
          <div className="text-[11.5px] text-dim mb-[10px] font-medium tracking-[0.04em] uppercase">
            Efectivo y bancos
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {accounts.map((a) => (
              <div key={a.id} className={cardClass}>
                <div className="flex items-center gap-[10px] mb-3.5">
                  <span
                    className="w-[34px] h-[34px] rounded-[9px] bg-panel2 border border-line flex items-center justify-center text-[12px] text-muted"
                    style={monoStyle}
                  >
                    {a.mono}
                  </span>
                  <div>
                    <div className="text-[14px] font-medium">{a.name}</div>
                    <div className="text-[11.5px] text-dim">{a.type}</div>
                  </div>
                </div>
                <div className="text-[22px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
                  <Bal n={a.balance} privacy={privacy} />
                </div>
                <div className="text-[11.5px] text-dim mt-1">{a.kind}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────
function SummaryCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="border border-line bg-panel rounded-2xl px-5 py-[18px]">
      <div className="text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-2.5">
        {label}
      </div>
      <div className="text-[24px] font-medium tabular-nums" style={{ fontFamily: "Spectral, serif" }}>
        {value}
      </div>
      {sub && <div className="text-[12.5px] mt-1.5">{sub}</div>}
    </div>
  );
}
