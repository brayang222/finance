import { STORAGE_KEYS } from "../data/constants";

export const fetchPricesFromAPI = async (sTickers, cTickers) => {
  const results = {};
  const all = [
    ...sTickers.map(t => t + " (acción BVC COP)"),
    ...cTickers.map(t => t + " (cripto USD)")
  ];
  if (!all.length) return results;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Busca precio ACTUAL de: ${all.join(", ")}. Responde SOLO JSON: {"TICKER":precio,...}. Cripto con prefijo C_: {"C_BTC":60000,"ECOPETROL":2450}. Solo el JSON.`
        }]
      })
    });
    const d = await r.json();
    const txt = d.content?.map(b => b.type === "text" ? b.text : "").join("") || "";
    const m = txt.replace(/```json|```/g, "").trim().match(/\{[^}]+\}/);
    if (m) Object.assign(results, JSON.parse(m[0]));
  } catch (e) {
    console.error(e);
  }
  return results;
};

export const fetchTRM = async () => {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: "TRM Colombia hoy. Responde SOLO el número. Ej: 4185.32"
        }]
      })
    });
    const d = await r.json();
    const txt = d.content?.map(b => b.type === "text" ? b.text : "").join("") || "";
    const n = parseFloat(txt.replace(/[^0-9.]/g, ""));
    return n > 1000 ? n : null;
  } catch {
    return null;
  }
};

export const load = async (k, fb) => {
  try {
    const r = await window.storage.get(k);
    return r ? JSON.parse(r.value) : fb;
  } catch {
    return fb;
  }
};

export const save = async (k, v) => {
  try {
    await window.storage.set(k, JSON.stringify(v));
  } catch (e) {
    console.error(e);
  }
};
