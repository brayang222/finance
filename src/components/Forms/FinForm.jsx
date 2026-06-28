import { useState } from "react";
import { Input, Select, Btn } from "../UI/UIComponents";
import { uid, today } from "../../utils/formatters";
import { CATS_IN, CATS_OUT } from "../../data/constants";

export const FinForm = ({ saveFinances, finances }) => {
  const [f, setF] = useState({
    date: today(),
    type: "egreso",
    category: CATS_OUT[0],
    amount: "",
    desc: ""
  });

  const cats = f.type === "ingreso" ? CATS_IN : CATS_OUT;

  const submit = () => {
    if (!f.amount) return;
    saveFinances([
      ...finances,
      {
        id: uid(),
        date: f.date,
        type: f.type,
        category: f.category,
        amount: parseFloat(f.amount),
        desc: f.desc
      }
    ]);
    setF({
      date: today(),
      type: f.type,
      category: cats[0],
      amount: "",
      desc: ""
    });
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
        options={["ingreso", "egreso"]}
        value={f.type}
        onChange={e =>
          setF({
            ...f,
            type: e.target.value,
            category: (e.target.value === "ingreso" ? CATS_IN : CATS_OUT)[0]
          })
        }
      />
      <Select
        label="Categoría"
        options={cats}
        value={f.category}
        onChange={e => setF({ ...f, category: e.target.value })}
      />
      <Input
        label="Monto"
        type="number"
        value={f.amount}
        onChange={e => setF({ ...f, amount: e.target.value })}
        placeholder="50000"
      />
      <Input
        label="Descripción"
        value={f.desc}
        onChange={e => setF({ ...f, desc: e.target.value })}
        placeholder="Opcional"
      />
      <Btn
        onClick={submit}
        color={f.type === "ingreso" ? "#27AE60" : "#E94560"}
      >
        Agregar
      </Btn>
    </div>
  );
};
