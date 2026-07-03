export type Period = "semanal" | "mensual" | "anual";

// Full calendar ranges (week Mon–Sun, whole month, whole year) so
// transactions dated "tomorrow" by timezone shift still count in the period
export function getPeriodRange(period: Period, now: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "semanal") {
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: fmt(monday), to: fmt(sunday) };
  }
  if (period === "anual") return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: fmt(lastDay) };
}
