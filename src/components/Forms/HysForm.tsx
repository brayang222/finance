import { useState } from "react";
import { Input, Select, Btn } from "../UI/UIComponents";
import { uid, today } from "../../utils/formatters";

export const HysForm = ({ saveHys, hys, saveCash, cash }) => {
  const [f, setF] = useState({
    date: today(),
    type: "INGRESO",
    amount: "",
    balance: "",
    note: ""
  });

  const submit = () => {
    if (!f.amount && !f.balance) return;
    const mv = {
      id: uid(),
      date: f.date,
      type: f.type,
      amount: parseFloat(f.amount) || 0,
      balance: f.balance ? parseFloat(f.balance) : null,
      note: f.note,
      rate: hys.rate
    };
    saveHys({ ...hys, movements: [...hys.movements, mv] });

    // If ingreso to HYS, debit banco
    if (f.type === "INGRESO" && f.amount)
      saveCash({ ...cash, banco: (cash.banco || 0) - parseFloat(f.amount) });
    if (f.type === "RETIRO" && f.amount)
      saveCash({ ...cash, banco: (cash.banco || 0) + parseFloat(f.amount) });

    setF({ date: today(), type: "INGRESO", amount: "", balance: "", note: "" });
  };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
      <Input
        label="Fecha"
        type="date"
        value={f.date}
        onChange={e => setF({ ...f, date: e.target.value })}
      />
      <Select
        label="Tipo"
        options={["APERTURA", "INGRESO", "RETIRO", "SALDO"]}
        value={f.type}
        onChange={e => setF({ ...f, type: e.target.value })}
      />
      <Input
        label="Monto"
        type="number"
        value={f.amount}
        onChange={e => setF({ ...f, amount: e.target.value })}
        placeholder="500000"
      />
      <Input
        label="Saldo real (opcional)"
        type="number"
        value={f.balance}
        onChange={e => setF({ ...f, balance: e.target.value })}
      />
      <Input
        label="Nota"
        value={f.note}
        onChange={e => setF({ ...f, note: e.target.value })}
      />
      <Btn onClick={submit} color="#16A085">
        Agregar
      </Btn>
    </div>
  );
};
