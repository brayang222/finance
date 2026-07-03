export const COLORS = [
  "#7B4FB5", "#2D9CDB", "#27AE60", "#F39C12", "#E94560",
  "#16A085", "#9B59B6", "#E67E22", "#C0392B", "#2980B9"
];

// Generic categories seeded for new users (no personal ones)
export const GENERIC_CATS_IN = [
  "Salario", "Freelance", "Negocio", "Inversiones", "Dividendos",
  "Ventas", "Regalo", "Otros ingresos",
];

export const GENERIC_CATS_OUT = [
  "Alimentación", "Vivienda", "Transporte", "Salud", "Educación",
  "Entretenimiento", "Suscripciones", "Servicios", "Ropa", "Familia",
  "Ahorro", "Otros gastos",
];

// Legacy — kept for fallback in ModalMovimiento when categories not loaded yet
export const CATS_IN = GENERIC_CATS_IN;
export const CATS_OUT = GENERIC_CATS_OUT;

export const STORAGE_KEYS = {
  STOCKS: "t5-stocks",
  CRYPTO: "t5-crypto",
  FINANCES: "t5-fin",
  HYS: "t5-hys",
  PRICES: "t5-prices",
  TARGETS: "t5-targets",
  CASH: "t5-cash",
  TRM: "t5-trm"
};
