import { PriceInput } from "../UI/PriceInput";

export const PriceEditor = ({ metrics, prefix = "", prices, setPrices, save }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
    {metrics.map(m => (
      <div key={m.ticker} style={{ display: "flex", gap: 3, alignItems: "center" }}>
        <span style={{ color: "#aaa", fontSize: 11, fontWeight: 600 }}>
          {m.ticker}
        </span>
        <PriceInput
          value={prices[prefix + m.ticker] || ""}
          placeholder="Precio"
          onChange={n => {
            const v = { ...prices, [prefix + m.ticker]: n };
            setPrices(v);
            save("t5-prices", v);
          }}
        />
      </div>
    ))}
  </div>
);
