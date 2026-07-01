import { useEffect, useState } from "react";
import { Input, Select, Btn } from "../UI/UIComponents";
import { uid, today } from "../../utils/formatters";
import { CATS_IN, CATS_OUT } from "../../data/constants";

export const FinForm = ({ saveFinances, finances, editingItem, onCancel, onSave }: { saveFinances?: any; finances?: any; editingItem?: any; onCancel?: () => void; onSave?: (entry: any) => void }) => {
  const getInitial = (item) => ({
    date: item?.date || today(),
    type: item?.type || "egreso",
    category: item?.category || (item?.type === "ingreso" ? CATS_IN[0] : CATS_OUT[0]),
    amount: item?.amount ?? "",
    desc: item?.desc || ""
  });

  const [f, setF] = useState(getInitial(editingItem));

  useEffect(() => {
    setF(getInitial(editingItem));
  }, [editingItem]);

  const cats = f.type === "ingreso" ? CATS_IN : CATS_OUT;

  const submit = () => {
    if (!f.amount) return;

    const payload = {
      id: editingItem?.id || uid(),
      date: f.date,
      type: f.type,
      category: f.category,
      amount: parseFloat(f.amount),
      desc: f.desc
    };

    if (onSave) {
      onSave(payload);
    } else {
      saveFinances([...finances, payload]);
    }

    if (!editingItem) {
      setF({
        date: today(),
        type: f.type,
        category: cats[0],
        amount: "",
        desc: ""
      });
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="flex gap-1.5 flex-wrap items-end mb-2.5">
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
        {editingItem ? "Guardar cambios" : "Agregar"}
      </Btn>
      {editingItem && (
        <Btn onClick={onCancel} color="#555">
          Cancelar
        </Btn>
      )}
    </div>
  );
};
