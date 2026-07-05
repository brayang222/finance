"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbError = error.message?.includes("reach database") || error.message?.includes("PrismaClient");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-semibold text-fg m-0">
        {isDbError ? "Sin conexión a la base de datos" : "Algo salió mal"}
      </h2>
      <p className="text-sm text-muted m-0 max-w-sm">
        {isDbError
          ? "La base de datos no responde. Puede estar en pausa — intenta de nuevo en unos segundos."
          : error.message || "Error inesperado."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-accent text-accentFg text-sm font-medium border-none cursor-pointer"
      >
        Reintentar
      </button>
    </div>
  );
}
