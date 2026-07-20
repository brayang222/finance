// Valores legales vigentes — actualizar una vez al año.
export const AÑO = 2026;
export const SMMLV = 1_750_905; // Decreto 1469 de 2025
export const AUX_TRANSPORTE = 249_095; // Decreto 1470 de 2025 (aplica hasta 2 SMMLV)

export const fmtCOP = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");
