import { PriceInput } from "../UI/PriceInput";

export const PriceEditor = ({ metrics, prefix = "", prices, setPrices, save }) => (
  <div className="flex gap-1.5 flex-wrap mb-2.5">
    {metrics.map(m => (
      <div key={m.ticker} className="flex gap-0.5 items-center">
        <span className="text-muted text-[11px] font-semibold">{m.ticker}</span>
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
