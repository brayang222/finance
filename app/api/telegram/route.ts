import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

const CATS_OUT = ["Alimentación", "Vivienda", "Transporte", "Salud", "Educación", "Entretenimiento", "Suscripciones", "Servicios", "Ropa", "Familia", "Ahorro", "Otros gastos"];
const CATS_IN  = ["Salario", "Freelance", "Negocio", "Inversiones", "Dividendos", "Ventas", "Regalo", "Otros ingresos"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Parse "35000 almuerzo" or "+100000 salario" or "egreso 50000 taxi"
function parse(text: string): { amount: number; desc: string; type: "ingreso" | "egreso"; category: string } | null {
  const t = text.trim();
  const forceIngreso = t.startsWith("+") || /^ingreso\b/i.test(t);
  const clean = t.replace(/^\+/, "").replace(/^(ingreso|egreso)\s*/i, "").trim();

  const numMatch = clean.match(/^(\d[\d.,]*)[\s,]+(.+)$/) || clean.match(/^(.+?)[\s,]+(\d[\d.,]*)$/);
  if (!numMatch) return null;

  let amount: number, desc: string;
  if (/^\d/.test(numMatch[1])) {
    amount = parseFloat(numMatch[1].replace(/\./g, "").replace(",", "."));
    desc = numMatch[2].trim();
  } else {
    desc = numMatch[1].trim();
    amount = parseFloat(numMatch[2].replace(/\./g, "").replace(",", "."));
  }
  if (isNaN(amount) || amount <= 0) return null;

  const type = forceIngreso ? "ingreso" : "egreso";
  const cats = type === "ingreso" ? CATS_IN : CATS_OUT;
  const q = desc.toLowerCase();
  const category = cats.find(c => c.toLowerCase().includes(q) || q.includes(c.toLowerCase().split(" ")[0])) ??
    (type === "ingreso" ? "Otros ingresos" : "Otros gastos");

  return { amount, desc, type, category };
}

async function reply(chatId: number, text: string) {
  if (!TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  if (SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const msg = body?.message;
  if (!msg?.text || !msg.from?.id) return NextResponse.json({ ok: true });

  const telegramId = String(msg.from.id);
  const chatId: number = msg.chat.id;
  const text: string = msg.text;

  // Find user by telegram_id stored in UserConfig
  const config = await prisma.userConfig.findFirst({ where: { telegramId } });
  if (!config) {
    await reply(chatId, "No vinculé tu cuenta aún. Ingresa a la app → Perfil → vincula tu Telegram.");
    return NextResponse.json({ ok: true });
  }

  if (text === "/start" || text === "/help") {
    await reply(chatId, "Registra un movimiento así:\n35000 almuerzo\n+2500000 salario\negreso 80000 taxi\n\nUsa /saldo para ver tu balance.");
    return NextResponse.json({ ok: true });
  }

  if (text === "/saldo") {
    const finances = await prisma.finance.findMany({ where: { userId: config.userId } });
    const saldo = finances.reduce((s, f) => s + (f.type === "ingreso" ? f.amount : -f.amount), 0);
    await reply(chatId, `Saldo neto: $${Math.round(saldo).toLocaleString("es-CO")}`);
    return NextResponse.json({ ok: true });
  }

  const parsed = parse(text);
  if (!parsed) {
    await reply(chatId, "No entendí. Ejemplo: 35000 almuerzo\n+2500000 salario");
    return NextResponse.json({ ok: true });
  }

  await prisma.finance.create({
    data: {
      id: crypto.randomUUID(),
      userId: config.userId,
      type: parsed.type,
      amount: parsed.amount,
      desc: parsed.desc,
      category: parsed.category,
      date: today(),
    },
  });

  const sign = parsed.type === "ingreso" ? "+" : "−";
  await reply(chatId, `✅ ${parsed.desc} · ${sign}$${Math.round(parsed.amount).toLocaleString("es-CO")} (${parsed.category})`);
  return NextResponse.json({ ok: true });
}
