export const COP = (v) => v == null ? "$0" : "$" + Math.round(v).toLocaleString("es-CO");

export const PCT = (v) => v == null ? "—" : (v * 100).toFixed(1) + "%";

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const today = () => new Date().toISOString().slice(0, 10);

export const uniqueTickers = (txs) => [...new Set(txs.map(t => t.ticker))];
