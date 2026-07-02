"use client";

import React from "react";
import { saveConfig } from "../../../lib/actions";

export default function ThemeSelector({ current }: { current: "dark" | "light" }) {
  return (
    <select
      name="theme"
      defaultValue={current}
      className="h-[36px] px-3 rounded-xl border border-line bg-panel2 text-fg text-[13px] outline-none cursor-pointer"
      onChange={async (e) => {
        await saveConfig(e.target.value);
        document.documentElement.setAttribute("data-theme", e.target.value);
      }}
    >
      <option value="dark">Oscuro</option>
      <option value="light">Claro</option>
    </select>
  );
}
