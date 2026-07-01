import { useState, useEffect } from "react";

export const PriceInput = ({
  value,
  onChange,
  placeholder,
  color,
  width = 100
}: {
  value?: number | string;
  onChange: (n: number) => void;
  placeholder?: string;
  color?: string;
  width?: number;
}) => {
  const [local, setLocal] = useState<string | number>(value || "");

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
        const n = parseFloat(String(local)) || 0;
        if (n !== value) onChange(n);
      }}
      onKeyDown={e => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 6,
        padding: "6px 8px",
        color: "#f0f0f0",
        fontSize: 12,
        width,
        outline: "none"
      }}
    />
  );
};
