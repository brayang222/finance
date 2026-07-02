import React, { useState } from "react";
import { ACCOUNTS, CATEGORIES, Transaction, TxType, today } from "../../data/mock";

const fieldClass =
  "w-full h-[42px] px-3 rounded-xl border border-line bg-panel2 text-fg text-[14px] outline-none";

const labelClass =
  "text-[11px] tracking-[0.08em] uppercase text-dim font-medium mb-1.5 block";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-panel rounded-[20px] p-6 border border-line"
        style={{
          width: "min(460px, 94vw)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex items-center justify-between mb-[18px]">
          <h2
            className="text-[20px] font-medium m-0"
            style={{ fontFamily: "Spectral, serif" }}
          >
            Registrar movimiento
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-muted cursor-pointer text-[20px] leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex bg-panel2 rounded-xl p-[3px] mb-4">
          {(["ingreso", "egreso"] as TxType[]).map((t) => (
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

        <div className="flex flex-col gap-3.5">
          <div>
            <label className={labelClass}>Monto</label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dim"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
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
                className={`${fieldClass} pl-[26px] tabular-nums`}
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Descripción</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej. Salario, Mercado…"
              className={fieldClass}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                {CATEGORIES[type].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className={labelClass}>Cuenta</label>
              <select value={account} onChange={(e) => setAccount(e.target.value)} className={fieldClass}>
                {ACCOUNTS.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Fecha</label>
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className={fieldClass} />
          </div>
        </div>

        <div className="flex gap-2.5 mt-[22px]">
          <button
            onClick={onClose}
            className="flex-1 h-[42px] rounded-xl border border-line bg-panel text-fg cursor-pointer text-[13.5px] font-medium"
          >
            Cancelar
          </button>
          <button
            disabled={!canSave}
            onClick={() =>
              onSave({ type, amount: monto, desc: desc.trim(), category, account, dateISO })
            }
            className={[
              "flex-1 h-[42px] rounded-xl border-none bg-accent text-accentFg text-[13.5px] font-medium",
              canSave ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-[0.45]",
            ].join(" ")}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
