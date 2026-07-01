import React, { useState } from "react";
import { ACCOUNTS, CATEGORIES, Transaction, TxType, today } from "../../data/mock";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid var(--line)",
  background: "var(--panel2)",
  color: "var(--fg)",
  fontSize: 14,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--dim)",
  fontWeight: 500,
  marginBottom: 6,
  display: "block",
};

export default function ModalRegistrar({
  initialType,
  onClose,
  onSave,
}: {
  initialType: TxType;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id">) => void;
}) {
  const [type, setType] = useState<TxType>(initialType);
  const [amount, setAmount] = useState<string>("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(CATEGORIES[initialType][0]);
  const [account, setAccount] = useState(ACCOUNTS[0].name);
  const [dateISO, setDateISO] = useState(today());

  const monto = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canSave = monto > 0 && desc.trim().length > 0;

  const switchType = (t: TxType) => {
    setType(t);
    setCategory(CATEGORIES[t][0]);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, 94vw)",
          background: "var(--panel)",
          borderRadius: 20,
          padding: 24,
          border: "1px solid var(--line)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Spectral, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>
            Registrar movimiento
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Type toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--panel2)",
            borderRadius: 12,
            padding: 3,
            marginBottom: 16,
          }}
        >
          {(["ingreso", "egreso"] as TxType[]).map((t) => (
            <button
              key={t}
              onClick={() => switchType(t)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                textTransform: "capitalize",
                background: type === t ? "var(--accent)" : "transparent",
                color: type === t ? "var(--accentFg)" : "var(--muted)",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Monto</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--dim)",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                $
              </span>
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, "");
                  setAmount(digits ? Number(digits).toLocaleString("es-CO") : "");
                }}
                placeholder="0"
                style={{
                  ...fieldStyle,
                  paddingLeft: 26,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descripción</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej. Salario, Mercado…"
              style={fieldStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={fieldStyle}>
                {CATEGORIES[type].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cuenta</label>
              <select value={account} onChange={(e) => setAccount(e.target.value)} style={fieldStyle}>
                {ACCOUNTS.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Fecha</label>
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 12,
              border: "1px solid var(--line)",
              background: "var(--panel)",
              color: "var(--fg)",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!canSave}
            onClick={() =>
              onSave({ type, amount: monto, desc: desc.trim(), category, account, dateISO })
            }
            style={{
              flex: 1,
              height: 42,
              borderRadius: 12,
              border: "none",
              background: "var(--accent)",
              color: "var(--accentFg)",
              cursor: canSave ? "pointer" : "not-allowed",
              opacity: canSave ? 1 : 0.45,
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
