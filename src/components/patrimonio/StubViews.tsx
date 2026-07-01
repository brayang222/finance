import React from "react";
import { Asset, Account, Transaction, COP, PCT } from "../../data/mock";
import { Bal } from "./utils";

const card: React.CSSProperties = {
  border: "1px solid var(--line)",
  background: "var(--panel)",
  borderRadius: 18,
  padding: 22,
};

const th: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--dim)",
  fontWeight: 500,
  textAlign: "left",
  padding: "0 0 10px",
};

const td: React.CSSProperties = {
  padding: "12px 0",
  borderTop: "1px solid var(--line)",
  fontSize: 13.5,
};

const mono: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

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
      <div style={{ ...card, color: "var(--muted)", fontSize: 13 }}>
        No hay posiciones registradas.
      </div>
    );
  }
  return (
    <div style={card}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr>
              <th style={th}>Activo</th>
              <th style={{ ...th, textAlign: "right" }}>Cantidad</th>
              <th style={{ ...th, textAlign: "right" }}>Precio</th>
              <th style={{ ...th, textAlign: "right" }}>Valor</th>
              <th style={{ ...th, textAlign: "right" }}>P/G</th>
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
                <tr key={a.ticker} onClick={() => onSelect(a.ticker)} style={{ cursor: "pointer" }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: "var(--panel2)", border: "1px solid var(--line)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
                          color: "var(--muted)",
                        }}
                      >
                        {a.mono}
                      </span>
                      <div>
                        <div style={{ ...mono, fontSize: 13 }}>{a.ticker}</div>
                        <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{a.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, ...mono, textAlign: "right" }}>
                    {a.qty % 1 === 0 ? a.qty.toLocaleString("es-CO") : a.qty.toFixed(4)}
                  </td>
                  <td style={{ ...td, ...mono, textAlign: "right" }}>
                    {privacy ? "••••" : COP(a.price)}
                  </td>
                  <td style={{ ...td, ...mono, textAlign: "right" }}>
                    <Bal n={value} privacy={privacy} />
                  </td>
                  <td style={{ ...td, ...mono, textAlign: "right", color: pos ? "var(--pos)" : "var(--neg)" }}>
                    <div>{PCT(plPct)}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <SummaryCard label="Valor del portafolio" value={<Bal n={totalValue} privacy={privacy} />} />
        <SummaryCard label="Costo invertido" value={<Bal n={totalCost} privacy={privacy} />} />
        <SummaryCard
          label="Rendimiento P/G"
          value={
            <span style={{ color: totalPL >= 0 ? "var(--pos)" : "var(--neg)" }}>
              <Bal n={Math.abs(totalPL)} privacy={privacy} />
            </span>
          }
          sub={
            totalCost > 0 ? (
              <span style={{ color: totalPL >= 0 ? "var(--pos)" : "var(--neg)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <SummaryCard label="Valor en cripto" value={<Bal n={totalValue} privacy={privacy} />} />
        <SummaryCard label="Costo invertido" value={<Bal n={totalCost} privacy={privacy} />} />
        <SummaryCard
          label="Rendimiento P/G"
          value={
            <span style={{ color: totalPL >= 0 ? "var(--pos)" : "var(--neg)" }}>
              <Bal n={Math.abs(totalPL)} privacy={privacy} />
            </span>
          }
          sub={
            totalCost > 0 ? (
              <span style={{ color: totalPL >= 0 ? "var(--pos)" : "var(--neg)" }}>
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
        style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: 14 }}
      >
        ← Volver a {selFrom === "inversiones" ? "Inversiones" : "Cripto"}
      </button>
      {asset ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header */}
          <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{
                width: 42, height: 42, borderRadius: 11, background: "var(--panel2)",
                border: "1px solid var(--line)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted)",
              }}>
                {asset.mono}
              </span>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 500 }}>{asset.ticker}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{asset.name}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Spectral, serif", fontSize: 28, fontWeight: 500 }}>
                {privacy ? "••••••" : COP(asset.price)}
              </div>
              <div style={{ fontSize: 13, color: asset.dayPct >= 0 ? "var(--pos)" : "var(--neg)" }}>
                {PCT(asset.dayPct)} hoy
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            <SummaryCard label="Cantidad"       value={<>{asset.qty % 1 === 0 ? asset.qty.toLocaleString("es-CO") : asset.qty.toFixed(4)}</>} />
            <SummaryCard label="Precio actual"  value={<Bal n={asset.price} privacy={privacy} />} />
            <SummaryCard label="Costo promedio" value={<Bal n={asset.avg} privacy={privacy} />} />
            <SummaryCard label="Valor mercado"  value={<Bal n={asset.qty * asset.price} privacy={privacy} />} />
            <SummaryCard
              label="P/G no realizada"
              value={
                <span style={{ color: pl >= 0 ? "var(--pos)" : "var(--neg)" }}>
                  <Bal n={Math.abs(pl)} privacy={privacy} />
                </span>
              }
              sub={<span style={{ color: pl >= 0 ? "var(--pos)" : "var(--neg)" }}>{PCT(plPct)}</span>}
            />
          </div>
        </div>
      ) : (
        <div style={{ ...card, color: "var(--muted)" }}>Activo no encontrado.</div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <SummaryCard label={`Ingresos · ${monthLabel}`}
          value={<span style={{ color: "var(--pos)" }}><Bal n={income} privacy={privacy} /></span>} />
        <SummaryCard label={`Egresos · ${monthLabel}`}
          value={<span style={{ color: "var(--neg)" }}><Bal n={expense} privacy={privacy} /></span>} />
        <SummaryCard label="Balance neto"
          value={<span style={{ color: balance >= 0 ? "var(--pos)" : "var(--neg)" }}><Bal n={Math.abs(balance)} privacy={privacy} /></span>}
          sub={<span style={{ color: "var(--dim)" }}>{balance >= 0 ? "Superávit" : "Déficit"}</span>}
        />
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Movimientos</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["todos", "ingresos", "egresos"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                border: "none", cursor: "pointer", padding: "5px 12px", borderRadius: 8,
                fontSize: 12, fontWeight: 500,
                background: filter === f ? "var(--accent)" : "var(--panel2)",
                color: filter === f ? "var(--accentFg)" : "var(--muted)",
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            {onAdd && (
              <button onClick={onAdd} style={{
                border: "1px solid var(--line)", cursor: "pointer", padding: "5px 12px",
                borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: "var(--panel2)", color: "var(--fg)",
              }}>
                + Registrar
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Descripción</th>
                <th style={th}>Categoría</th>
                <th style={{ ...th, textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const pos = t.type === "ingreso";
                return (
                  <tr key={t.id}>
                    <td style={{ ...td, ...mono, color: "var(--muted)", whiteSpace: "nowrap" }}>{t.dateISO}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{t.desc}</td>
                    <td style={{ ...td, color: "var(--muted)" }}>{t.category}</td>
                    <td style={{ ...td, ...mono, textAlign: "right", color: pos ? "var(--pos)" : "var(--neg)" }}>
                      {privacy ? "••••••" : `${pos ? "+" : "−"}${COP(t.amount)}`}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...td, color: "var(--dim)", textAlign: "center" }}>Sin movimientos</td>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Hero */}
      <div style={{ ...card }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dim)", fontWeight: 500, marginBottom: 6 }}>
          Patrimonio total
        </div>
        <div style={{ fontFamily: "Spectral, serif", fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 16 }}>
          <Bal n={total} privacy={privacy} />
        </div>

        {/* Composition bar */}
        {total > 0 && (
          <>
            <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 12 }}>
              {barParts.map((p) => (
                <div key={p.label} style={{ flex: p.value / total, background: p.color, minWidth: 2 }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {barParts.map((p) => (
                <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                  <span style={{ color: "var(--muted)" }}>{p.label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--fg)" }}>
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
          <div style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 10, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Efectivo y bancos
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {accounts.map((a) => (
              <div key={a.id} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 9, background: "var(--panel2)",
                    border: "1px solid var(--line)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted)",
                  }}>
                    {a.mono}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{a.type}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "Spectral, serif", fontSize: 22, fontWeight: 500 }}>
                  <Bal n={a.balance} privacy={privacy} />
                </div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>{a.kind}</div>
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
    <div style={{ ...card, borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dim)", fontWeight: 500, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: "Spectral, serif", fontSize: 24, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12.5, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
