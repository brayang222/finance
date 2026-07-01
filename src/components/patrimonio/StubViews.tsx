import React from "react";
import { ACCOUNTS, HOLDINGS, CRYPTO, Asset, Transaction, COP, PCT } from "../../data/mock";
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

function Construccion({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 14 }}>{label} · Vista en construcción</div>
  );
}

function AssetTable({
  assets,
  privacy,
  onSelect,
}: {
  assets: Asset[];
  privacy: boolean;
  onSelect: (t: string) => void;
}) {
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
              <th style={{ ...th, textAlign: "right" }}>Día</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => {
              const value = a.qty * a.price;
              const pos = a.dayPct >= 0;
              return (
                <tr key={a.ticker} onClick={() => onSelect(a.ticker)} style={{ cursor: "pointer" }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "var(--panel2)",
                          border: "1px solid var(--line)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontFamily: "'IBM Plex Mono', monospace",
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
                  <td style={{ ...td, ...mono, textAlign: "right" }}>{a.qty}</td>
                  <td style={{ ...td, ...mono, textAlign: "right" }}>{privacy ? "••••" : COP(a.price)}</td>
                  <td style={{ ...td, ...mono, textAlign: "right" }}>
                    <Bal n={value} privacy={privacy} />
                  </td>
                  <td style={{ ...td, ...mono, textAlign: "right", color: pos ? "var(--pos)" : "var(--neg)" }}>
                    {PCT(a.dayPct)}
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
  onSelect,
}: {
  privacy: boolean;
  onSelect: (t: string) => void;
}) {
  return (
    <div>
      <Construccion label="Inversiones · bolsa (BVC)" />
      <AssetTable assets={HOLDINGS} privacy={privacy} onSelect={onSelect} />
    </div>
  );
}

export function ViewCripto({
  privacy,
  onSelect,
}: {
  privacy: boolean;
  onSelect: (t: string) => void;
}) {
  return (
    <div>
      <Construccion label="Cripto" />
      <AssetTable assets={CRYPTO} privacy={privacy} onSelect={onSelect} />
    </div>
  );
}

export function ViewDetalle({
  privacy,
  selected,
  onBack,
}: {
  privacy: boolean;
  selected: string;
  selFrom: "inversiones" | "cripto";
  onBack: () => void;
}) {
  const asset = [...HOLDINGS, ...CRYPTO].find((a) => a.ticker === selected);
  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: 14 }}
      >
        ← Volver
      </button>
      <div style={card}>
        <div style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 8 }}>Detalle del activo · Vista en construcción</div>
        {asset ? (
          <div>
            <div style={{ fontFamily: "Spectral, serif", fontSize: 26, fontWeight: 500 }}>{asset.ticker}</div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>{asset.name}</div>
            <div style={{ ...mono, fontSize: 15 }}>
              Valor: <Bal n={asset.qty * asset.price} privacy={privacy} />
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--muted)" }}>Activo no encontrado.</div>
        )}
      </div>
    </div>
  );
}

export function ViewTransacciones({
  privacy,
  transactions,
}: {
  privacy: boolean;
  transactions: Transaction[];
  onAdd?: () => void;
}) {
  return (
    <div>
      <Construccion label="Transacciones" />
      <div style={card}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Descripción</th>
                <th style={th}>Categoría</th>
                <th style={th}>Cuenta</th>
                <th style={{ ...th, textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const pos = t.type === "ingreso";
                return (
                  <tr key={t.id}>
                    <td style={{ ...td, ...mono, color: "var(--muted)" }}>{t.dateISO}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{t.desc}</td>
                    <td style={{ ...td, color: "var(--muted)" }}>{t.category}</td>
                    <td style={{ ...td, color: "var(--muted)" }}>{t.account}</td>
                    <td style={{ ...td, ...mono, textAlign: "right", color: pos ? "var(--pos)" : "var(--neg)" }}>
                      {privacy ? "••••••" : `${pos ? "+" : "−"}${COP(t.amount)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ViewCuentas({ privacy }: { privacy: boolean }) {
  return (
    <div>
      <Construccion label="Cuentas" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {ACCOUNTS.map((a) => (
          <div key={a.id} style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: "var(--panel2)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "var(--muted)",
                }}
              >
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
  );
}
