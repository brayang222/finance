import { useState, useEffect } from "react";

export const PriceInput = ({
  value,
  onChange,
  placeholder,
  color = "#2D9CDB",
  width = 100
}) => {
  const [local, setLocal] = useState(value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  return (
    <input
      type="number"
      placeholder={placeholder}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const n = parseFloat(local) || 0;
        if (n !== value) onChange(n);
      }}
      onKeyDown={e => {
        if (e.key === "Enter") e.target.blur();
      }}
      style={{
        background: "#1a1a3e",
        border: "1px solid #444",
        borderRadius: 4,
        padding: "4px 7px",
        color,
        fontSize: 11,
        width
      }}
    />
  );
};
