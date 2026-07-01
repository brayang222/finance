import { useState } from "react";

export const Table = ({ cols, rows, onDelete, max = 999 }: { cols: any[]; rows: any[]; onDelete?: (id: any) => void; max?: number }) => {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState("desc");

  const toggleSort = (ci: number) => {
    if (sortCol === ci) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(ci); setSortDir("asc"); }
  };

  let sorted = [...rows];
  if (sortCol !== null) {
    const c = cols[sortCol];
    sorted.sort((a, b) => {
      const av = c.sortKey ? c.sortKey(a) : c.render ? c.render(a) : a[c.key];
      const bv = c.sortKey ? c.sortKey(b) : c.render ? c.render(b) : b[c.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      const r = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? r : -r;
    });
  } else {
    sorted = sorted.slice(-max).reverse();
  }

  return (
    <div className="overflow-x-auto mb-3.5">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th
                key={i}
                onClick={c.noSort ? undefined : () => toggleSort(i)}
                className={`px-2.5 py-1.5 bg-bg border-b border-border text-[11px] font-medium tracking-[0.05em] whitespace-nowrap select-none text-${c.align === "right" ? "right" : "left"} ${c.noSort ? "cursor-default" : "cursor-pointer"} ${sortCol === i ? "text-text" : "text-muted"}`}
              >
                {c.label}{sortCol === i ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
            {onDelete && <th className="p-1.5 bg-bg border-b border-border" />}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, ri) => (
            <tr key={ri}>
              {cols.map((c, ci) => (
                <td
                  key={ci}
                  className={`px-2.5 py-1.5 border-b border-surface whitespace-nowrap text-${c.align === "right" ? "right" : "left"}`}
                  style={{ color: c.color ? c.color(r) : undefined }}
                >
                  <span className={c.color ? "" : "text-text/80"}>{c.render ? c.render(r) : r[c.key]}</span>
                </td>
              ))}
              {onDelete && (
                <td className="px-2 py-1 border-b border-surface">
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(r.id); }}
                    className="bg-transparent border-none text-dim cursor-pointer text-[13px] hover:text-muted"
                  >✕</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length > 0 && (
        <div className="text-[10px] text-dim mt-1">
          {sorted.length} registros{sortCol !== null ? ` (ordenado por ${cols[sortCol].label})` : ""}
        </div>
      )}
    </div>
  );
};
