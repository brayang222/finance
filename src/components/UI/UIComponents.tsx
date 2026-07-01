import type { ReactNode, CSSProperties } from "react";

export const Tab = ({ active, label, onClick }: { active?: boolean; label?: string; onClick?: () => void; color?: string }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      border: "none",
      borderBottom: active ? "2px solid #f0f0f0" : "2px solid transparent",
      background: "none",
      color: active ? "#f0f0f0" : "#444",
      fontWeight: active ? 500 : 400,
      fontSize: 13,
      cursor: "pointer",
      letterSpacing: 0.2
    }}
  >
    {label}
  </button>
);

export const Card = ({ title, value, sub }: { title?: string; value?: ReactNode; color?: string; sub?: string }) => (
  <div
    style={{
      background: "#111",
      border: "1px solid #1e1e1e",
      borderRadius: 8,
      padding: "16px 20px",
      minWidth: 130,
      flex: 1
    }}
  >
    <div style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {title}
    </div>
    <div style={{ fontSize: 22, fontWeight: 600, color: "#f0f0f0" }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
        {sub}
      </div>
    )}
  </div>
);

export const Input = ({ label, style, ...p }: { label?: string; style?: CSSProperties; [key: string]: any }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
    {label && <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.05em" }}>{label}</label>}
    <input
      {...p}
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 6,
        padding: "8px 10px",
        color: "#f0f0f0",
        fontSize: 13,
        outline: "none",
        ...(style || {})
      }}
    />
  </div>
);

export const Select = ({ label, options, ...p }: { label?: string; options: string[]; [key: string]: any }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
    {label && <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.05em" }}>{label}</label>}
    <select
      {...p}
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 6,
        padding: "8px 10px",
        color: "#f0f0f0",
        fontSize: 13,
        outline: "none"
      }}
    >
      {options.map(o => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

export const Btn = ({ children, onClick, color = "", small, disabled, type = "button" }: {
  children?: ReactNode;
  onClick?: () => void;
  color?: string;
  small?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) => {
  const isGreen = color && (color.toLowerCase().includes("27ae60") || color.toLowerCase().includes("4ade80") || color === "#27AE60");
  const isBlue = color && (color.toLowerCase().includes("2d9cdb") || color.toLowerCase().includes("60a5fa") || color === "#2D9CDB");
  const accentColor = isGreen ? "#4ade80" : isBlue ? "#60a5fa" : null;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#0e0e0e" : "#1a1a1a",
        border: `1px solid ${disabled ? "#1a1a1a" : accentColor ? accentColor : "#2a2a2a"}`,
        borderRadius: 6,
        padding: small ? "4px 10px" : "7px 14px",
        color: disabled ? "#333" : accentColor ? accentColor : "#ccc",
        fontWeight: 400,
        fontSize: small ? 11 : 12,
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: 0.2
      }}
    >
      {children}
    </button>
  );
};

export const Modal = ({ open, title, onClose, children }: { open?: boolean; title?: string; onClose?: () => void; children?: ReactNode }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: 12
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 10,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #1e1e1e"
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: "#f0f0f0" }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#444",
              cursor: "pointer",
              fontSize: 16
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
};

export const Section = ({ title, children }: { title?: string; children?: ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    {title && (
      <div
        style={{
          fontSize: 10,
          color: "#333",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em"
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);
