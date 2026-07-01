import { useState } from "react";

export const Table = ({ cols, rows, onDelete, max = 999 }: { cols: any[]; rows: any[]; onDelete?: (id: any) => void; max?: number }) => {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  const toggleSort = (ci) => {
    if (sortCol === ci) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(ci);
      setSortDir("asc");
    }
  };

  let sorted = [...rows];
  if (sortCol !== null) {
    const c = cols[sortCol];
    sorted.sort((a, b) => {
      const av = c.sortKey ? c.sortKey(a) : c.render ? c.render(a) : a[c.key];
      const bv = c.sortKey ? c.sortKey(b) : c.render ? c.render(b) : b[c.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      const r =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? r : -r;
    });
  } else {
    sorted = sorted.slice(-max).reverse();
  }

  return (
    <div style={{ overflowX: "auto", marginBottom: 14 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th
                key={i}
                onClick={c.noSort ? undefined : () => toggleSort(i)}
                style={{
                  padding: "6px 10px",
                  background: "#0c0c0c",
                  color: sortCol === i ? "#e8e8e8" : "#444",
                  textAlign: c.align || "left",
                  borderBottom: "1px solid #1a1a1a",
                  whiteSpace: "nowrap",
                  cursor: c.noSort ? "default" : "pointer",
                  userSelect: "none",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.05em"
                }}
              >
                {c.label}
                {sortCol === i ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
            {onDelete && (
              <th style={{ padding: "5px", background: "#0c0c0c", borderBottom: "1px solid #1a1a1a" }}></th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, ri) => (
            <tr key={ri} style={{ background: "transparent" }}>
              {cols.map((c, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "6px 10px",
                    color: c.color ? c.color(r) : "#ccc",
                    borderBottom: "1px solid #111",
                    whiteSpace: "nowrap",
                    textAlign: c.align || "left"
                  }}
                >
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
              {onDelete && (
                <td style={{ padding: "4px 8px", borderBottom: "1px solid #111" }}>
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(r.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#333",
                      cursor: "pointer",
                      fontSize: 13
                    }}
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length > 0 && (
        <div style={{ fontSize: 10, color: "#333", marginTop: 4 }}>
          {sorted.length} registros
          {sortCol !== null ? ` (ordenado por ${cols[sortCol].label})` : ""}
        </div>
      )}
    </div>
  );
};
