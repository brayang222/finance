import { STORAGE_KEYS } from "../data/constants";

const ALLORIGINS_PROXY = "https://api.allorigins.win/raw?url=";
const YAHOO_QUOTE_PAGE = ticker => `https://finance.yahoo.com/quote/${ticker}`;

const parsePriceFromYahooHtml = html => {
  const match = html.match(/regularMarketPrice"\s*:\s*\{\s*"raw"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
  if (match) return parseFloat(match[1]);
  const currentMatch = html.match(/currentPrice"\s*:\s*\{\s*"raw"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
  if (currentMatch) return parseFloat(currentMatch[1]);
  return null;
};

const fetchYahooPage = async ticker => {
  try {
    const url = `${ALLORIGINS_PROXY}${encodeURIComponent(YAHOO_QUOTE_PAGE(ticker))}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = await res.text();
    return parsePriceFromYahooHtml(html);
  } catch {
    return null;
  }
};

export const fetchPricesFromAPI = async (sTickers, cTickers) => {
  const results = {};
  const stockTasks = sTickers.map(async ticker => {
    const pageTicker = `${ticker}.BG`;
    const price = await fetchYahooPage(pageTicker);
    if (price != null) results[ticker] = price;
  });
  const cryptoTasks = cTickers.map(async ticker => {
    const pageTicker = `${ticker}-USD`;
    const price = await fetchYahooPage(pageTicker);
    if (price != null) results[`C_${ticker}`] = price;
  });
  await Promise.all([...stockTasks, ...cryptoTasks]);
  return results;
};

export const fetchTRM = async () => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.rates?.COP ? parseFloat(data.rates.COP) : null;
  } catch {
    return null;
  }
};

const getStorage = () => {
  if (typeof window === "undefined") return null;
  if ((window as any).storage && typeof (window as any).storage.get === "function") return (window as any).storage;
  return null;
};

export const load = async (k, fb) => {
  try {
    const storage = getStorage();
    if (storage && typeof storage.get === "function") {
      const r = await storage.get(k);
      return r ? JSON.parse(r.value) : fb;
    }
    const raw = window.localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fb;
  } catch {
    return fb;
  }
};

export const save = async (k, v) => {
  try {
    const storage = getStorage();
    if (storage && typeof storage.set === "function") {
      await storage.set(k, JSON.stringify(v));
      return;
    }
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error(e);
  }
};
