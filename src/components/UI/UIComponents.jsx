export const Tab = ({ active, label, onClick, color }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 14px",
      border: "none",
      borderBottom: active ? `3px solid ${color || "#7B4FB5"}` : "3px solid transparent",
      background: "none",
      color: active ? "#fff" : "#8888aa",
      fontWeight: active ? 700 : 400,
      fontSize: 12,
      cursor: "pointer"
    }}
  >
    {label}
  </button>
);

export const Card = ({ title, value, color = "#7B4FB5", sub }) => (
  <div
    style={{
      background: color,
      borderRadius: 10,
      padding: "12px 16px",
      minWidth: 130,
      flex: 1
    }}
  >
    <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", marginBottom: 3 }}>
      {title}
    </div>
    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
        {sub}
      </div>
    )}
  </div>
);

export const Input = ({ label, ...p }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
    {label && <label style={{ fontSize: 10, color: "#aaa" }}>{label}</label>}
    <input
      {...p}
      style={{
        background: "#1a1a3e",
        border: "1px solid #333",
        borderRadius: 6,
        padding: "6px 9px",
        color: "#fff",
        fontSize: 12,
        ...(p.style || {})
      }}
    />
  </div>
);

export const Select = ({ label, options, ...p }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
    {label && <label style={{ fontSize: 10, color: "#aaa" }}>{label}</label>}
    <select
      {...p}
      style={{
        background: "#1a1a3e",
        border: "1px solid #333",
        borderRadius: 6,
        padding: "6px 9px",
        color: "#fff",
        fontSize: 12
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

export const Btn = ({ children, onClick, color = "#7B4FB5", small, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? "#555" : color,
      border: "none",
      borderRadius: 6,
      padding: small ? "5px 10px" : "8px 16px",
      color: "#fff",
      fontWeight: 600,
      fontSize: small ? 11 : 12,
      cursor: disabled ? "not-allowed" : "pointer"
    }}
  >
    {children}
  </button>
);

export const Section = ({ title, children }) => (
  <div style={{ marginBottom: 18 }}>
    <h3
      style={{
        margin: "0 0 8px",
        fontSize: 13,
        color: "#ccc",
        borderBottom: "1px solid #2d2d6b",
        paddingBottom: 5
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);
