"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { switchProfile } from "../../../lib/actions";

export default function ProfileSwitch({ profile }: { profile: "personal" | "business" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const doSwitch = async (p: "personal" | "business") => {
    if (p === profile || busy) return;
    setBusy(true);
    try {
      await switchProfile(p);
      router.push("/summary");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-line bg-panel rounded-[18px] p-[22px] flex flex-col gap-4">
      <div className="text-[11.5px] tracking-[0.08em] uppercase text-dim font-medium">Perfil activo</div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[13.5px] font-medium">
            {profile === "business" ? "Comercio" : "Persona natural"}
          </div>
          <div className="text-[12px] text-muted mt-0.5">
            Finanzas {profile === "business" ? "de tu negocio" : "personales"}, separadas del otro perfil
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-xl border border-line bg-panel2 shrink-0">
          {([["personal", "Personal"], ["business", "Comercio"]] as const).map(([p, label]) => (
            <button
              key={p}
              onClick={() => doSwitch(p)}
              disabled={busy}
              className={[
                "px-3 py-[6px] rounded-lg text-[12px] border-none cursor-pointer font-medium",
                profile === p ? "bg-accent text-accentFg" : "bg-transparent text-muted",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
