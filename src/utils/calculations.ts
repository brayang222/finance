export const computePPA = (txs, ticker) => {
  const buys = txs.filter(t => t.ticker === ticker && t.priceCOP > 0);
  const sells = txs.filter(t => t.ticker === ticker && t.priceCOP < 0);
  const qB = buys.reduce((s, t) => s + t.qty, 0);
  const qS = sells.reduce((s, t) => s + t.qty, 0);
  const cost = buys.reduce((s, t) => s + t.qty * t.priceCOP, 0);
  const comm = txs.filter(t => t.ticker === ticker).reduce((s, t) => s + (t.commission || 0), 0);
  const ppa = qB > 0 ? cost / qB : 0;
  const hold = qB - qS;
  const inv = hold * ppa;
  return { ticker, qtyBought: qB, qtySold: qS, holding: hold, ppa, invested: inv, totalComm: comm };
};

export const computeStockMetrics = (stocks: any[], prices: Record<string, number>, targets: Record<string, number>) => {
  const uniqueTickers = [...new Set(stocks.map(t => t.ticker))] as string[];
  return uniqueTickers.map(tk => {
    const m = computePPA(stocks, tk);
    const cur = prices[tk] || 0;
    const tgt = targets[tk] || 0;
    const mv = cur ? m.holding * cur : m.invested;
    const gain = cur ? (cur - m.ppa) * m.holding : 0;
    const ret = m.ppa > 0 && cur ? (cur - m.ppa) / m.ppa : 0;
    const tv = tgt ? m.holding * tgt : 0;
    const tg = tgt ? (tgt - m.ppa) * m.holding : 0;
    const tr = m.ppa > 0 && tgt ? (tgt - m.ppa) / m.ppa : 0;
    return {
      ...m,
      current: cur,
      target: tgt,
      marketVal: mv,
      gain,
      ret,
      targetVal: tv,
      targetGain: tg,
      targetRet: tr
    };
  });
};

export const computeCryptoMetrics = (crypto, prices) => {
  const uniqueTickers = [...new Set(crypto.map(t => t.ticker))];
  return uniqueTickers.map(tk => {
    const m = computePPA(crypto, tk);
    const cur = prices["C_" + tk] || 0;
    const mv = cur ? m.holding * cur : m.invested;
    const gain = cur ? (cur - m.ppa) * m.holding : 0;
    const ret = m.ppa > 0 && cur ? (cur - m.ppa) / m.ppa : 0;
    return { ...m, current: cur, marketVal: mv, gain, ret };
  });
};

export const computeHysBalance = (hys) => {
  const dailyRate = Math.pow(1 + (hys.rate / 100), 1 / 365) - 1;
  if (!hys.movements.length) return { balance: 0, daysSince: 0, dailyRate };

  const sorted = [...hys.movements].sort((a, b) => a.date.localeCompare(b.date));
  let ai = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].type === "SALDO" || sorted[i].type === "APERTURA") {
      ai = i;
      break;
    }
  }

  if (ai === -1) {
    return {
      balance: sorted.reduce((s, m) => s + (m.type === "RETIRO" ? -m.amount : m.amount), 0),
      daysSince: 0,
      dailyRate
    };
  }

  let base = sorted[ai].balance != null ? sorted[ai].balance : sorted[ai].amount;
  for (let i = ai + 1; i < sorted.length; i++) {
    const m = sorted[i];
    if (m.type === "INGRESO") base += m.amount;
    else if (m.type === "RETIRO") base -= m.amount;
    else if (m.type === "SALDO" && m.balance != null) base = m.balance;
  }

  const last = sorted[sorted.length - 1].date;
  const ds = Math.max(0, Math.floor((new Date().getTime() - new Date(last).getTime()) / 86400000));
  const balance = base * Math.pow(1 + dailyRate, ds);

  return { balance, base, daysSince: ds, dailyRate };
};

export const computeHysProjection = (hysBalance: number, dailyRate: number) => {
  const hysPj: { mes: number; inicio: number; interes: number; fin: number }[] = [];
  let bal = hysBalance;
  for (let m = 0; m < 12; m++) {
    const d = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m % 12];
    const i2 = bal * (Math.pow(1 + dailyRate, d) - 1);
    const e = bal + i2;
    hysPj.push({ mes: m + 1, inicio: Math.round(bal), interes: Math.round(i2), fin: Math.round(e) });
    bal = e;
  }
  return hysPj;
};

export const computeMonthlyFinances = (finances: any[]) => {
  const ms: Record<string, { month: string; ingresos: number; egresos: number }> = {};
  finances.forEach(f => {
    const m = f.date?.slice(0, 7) || "?";
    if (!ms[m]) ms[m] = { month: m, ingresos: 0, egresos: 0 };
    if (f.type === "ingreso") ms[m].ingresos += f.amount;
    else ms[m].egresos += f.amount;
  });
  return Object.values(ms).sort((a, b) => a.month.localeCompare(b.month)).slice(-8);
};

export const computeExpenseByCategory = (finances: any[]) => {
  const cs: Record<string, number> = {};
  finances.filter(f => f.type === "egreso").forEach(f => {
    cs[f.category] = (cs[f.category] || 0) + f.amount;
  });
  return Object.entries(cs)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number));
};
