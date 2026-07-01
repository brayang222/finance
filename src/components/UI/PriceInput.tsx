import { useState, useEffect } from "react";

export const PriceInput = ({ value, onChange, placeholder, color, width = 100 }: {
  value?: number | string;
  onChange: (n: number) => void;
  placeholder?: string;
  color?: string;
  width?: number;
}) => {
  const [local, setLocal] = useState<string | number>(value || "");
  useEffect(() => { setLocal(value || ""); }, [value]);

  return (
    <input
      type="number"
      placeholder={placeholder}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { const n = parseFloat(String(local)) || 0; if (n !== value) onChange(n); }}
      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className="bg-surface border border-border rounded-md px-2 py-1.5 text-text text-[12px] outline-none"
      style={{ width, color: color || undefined }}
    />
  );
};
