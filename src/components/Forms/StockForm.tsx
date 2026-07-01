import { useState } from "react";
import { Input, Select, Btn } from "../UI/UIComponents";
import { uid, today } from "../../utils/formatters";

export const StockForm = ({ onAdd, saveCash, cash, type = "stock" }: { onAdd: (tx: any) => void; saveCash: (c: any) => void; cash: any; type?: string }) => {
  const [f, setF] = useState({
    date: today(),
    ticker: "",
    qty: "",
    price: "",
    currency: "COP",
    trm: "",
    commission: "",
    source: "banco"
  });

  const submit = () => {
    if (!f.ticker || !f.qty || !f.price) return;
    const price = parseFloat(f.price);
    const qty = parseFloat(f.qty);
    const trm2 = f.currency === "USD" ? parseFloat(f.trm) || 4000 : 1;
    const pCOP = price * trm2;
    const tx = {
      id: uid(),
      date: f.date,
      ticker: f.ticker.toUpperCase(),
      qty,
      price,
      currency: f.currency,
      trm: trm2,
      priceCOP: pCOP,
      commission: parseFloat(f.commission) || 0,
      source: f.source
    };
    onAdd(tx);

    // Debit/credit cash
    const cost = qty * Math.abs(pCOP) + (parseFloat(f.commission) || 0);
    if (price > 0) {
      if (f.source === "banco") saveCash({ ...cash, banco: (cash.banco || 0) - cost });
    } else {
      if (f.source === "banco")
        saveCash({
          ...cash,
          banco: (cash.banco || 0) + qty * Math.abs(pCOP) - (parseFloat(f.commission) || 0)
        });
    }

    setF({
      date: today(),
      ticker: "",
      qty: "",
      price: "",
      currency: "COP",
      trm: "",
      commission: "",
      source: "banco"
    });
  };

  return (
    <div className="flex gap-1.5 flex-wrap items-end mb-2.5">
      <Input
        label="Fecha"
        type="date"
        value={f.date}
        onChange={e => setF({ ...f, date: e.target.value })}
        className="w-[115px]"
      />
      <Input
        label={type === "crypto" ? "Cripto" : "Acción"}
        value={f.ticker}
        onChange={e => setF({ ...f, ticker: e.target.value })}
        placeholder={type === "crypto" ? "BTC" : "NUCO"}
      />
      <Input
        label="Cantidad"
        type="number"
        value={f.qty}
        onChange={e => setF({ ...f, qty: e.target.value })}
        placeholder="10"
      />
      <Select
        label="Moneda"
        options={["COP", "USD"]}
        value={f.currency}
        onChange={e => setF({ ...f, currency: e.target.value })}
      />
      <Input
        label="Precio (+C/-V)"
        type="number"
        value={f.price}
        onChange={e => setF({ ...f, price: e.target.value })}
        placeholder="2340"
      />
      {f.currency === "USD" && (
        <Input
          label="TRM"
          type="number"
          value={f.trm}
          onChange={e => setF({ ...f, trm: e.target.value })}
          placeholder="4200"
        />
      )}
      <Input
        label="Comisión"
        type="number"
        value={f.commission}
        onChange={e => setF({ ...f, commission: e.target.value })}
        placeholder="14875"
      />
      <Select
        label="Fuente $"
        options={["banco", "alto rendimiento"]}
        value={f.source}
        onChange={e => setF({ ...f, source: e.target.value })}
      />
      <Btn onClick={submit}>Agregar</Btn>
    </div>
  );
};
