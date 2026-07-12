/**
 * Demo seed — creates a test user with full data for both personal and commerce profiles.
 * Run: npx tsx prisma/seed-demo.ts
 * Login: demo@test.com / demo1234
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@test.com";
const DEMO_PASS = "demo1234";

const cuid = () => "c" + randomBytes(12).toString("hex");

function date(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function main() {
  // Clean existing demo user
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    // Delete shadow business user first
    await prisma.user.deleteMany({ where: { businessOwnerId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const password = await bcrypt.hash(DEMO_PASS, 12);

  // ── Create demo user ──
  const user = await prisma.user.create({
    data: {
      name: "Usuario Demo",
      email: DEMO_EMAIL,
      password,
    },
  });

  const uid = user.id;

  // ── Config ──
  await prisma.userConfig.create({
    data: {
      userId: uid,
      theme: "dark",
      onboardingDone: true,
      showStocks: true,
      showCrypto: true,
      showHys: true,
      showActivity: true,
      showGoals: true,
      showCommerce: true,
      baseCurrency: "COP",
      trm: 4200,
      trmUpdatedAt: new Date(),
    },
  });

  // ── Bank Accounts ──
  const bancolombia = await prisma.bankAccount.create({
    data: { userId: uid, name: "Bancolombia", bank: "Bancolombia", type: "ahorros", balance: 3_500_000, color: "#FBBF24" },
  });
  const nequi = await prisma.bankAccount.create({
    data: { userId: uid, name: "Nequi", bank: "Nequi", type: "digital", balance: 850_000, color: "#A78BFA" },
  });
  const davivienda = await prisma.bankAccount.create({
    data: { userId: uid, name: "Davivienda", bank: "Davivienda", type: "corriente", balance: 1_200_000, color: "#F87171" },
  });

  // ── Cash ──
  await prisma.cash.create({ data: { userId: uid, banco: 420_000 } });

  // ── Categories ──
  const cats = [
    { name: "Salario", type: "ingreso" },
    { name: "Freelance", type: "ingreso" },
    { name: "Dividendos", type: "ingreso" },
    { name: "Ventas", type: "ingreso" },
    { name: "Arriendo", type: "egreso" },
    { name: "Servicios", type: "egreso" },
    { name: "Mercado", type: "egreso" },
    { name: "Transporte", type: "egreso" },
    { name: "Restaurantes", type: "egreso" },
    { name: "Entretenimiento", type: "egreso" },
    { name: "Salud", type: "egreso" },
    { name: "Educación", type: "egreso" },
    { name: "Ropa", type: "egreso" },
    { name: "Mascotas", type: "egreso" },
  ];
  for (const c of cats) {
    await prisma.category.create({ data: { userId: uid, name: c.name, type: c.type } });
  }

  // ── Finances (personal) ──
  const finances = [
    // Ingresos
    { date: date(1),   type: "ingreso", category: "Salario",    amount: 5_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(30),  type: "ingreso", category: "Salario",    amount: 5_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(60),  type: "ingreso", category: "Salario",    amount: 5_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(90),  type: "ingreso", category: "Salario",    amount: 5_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(120), type: "ingreso", category: "Salario",    amount: 5_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(150), type: "ingreso", category: "Salario",    amount: 5_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(15),  type: "ingreso", category: "Freelance",  amount: 2_400_000, accountId: nequi.id, accountName: "Nequi" },
    { date: date(45),  type: "ingreso", category: "Freelance",  amount: 1_800_000, accountId: nequi.id, accountName: "Nequi" },
    { date: date(75),  type: "ingreso", category: "Freelance",  amount: 3_200_000, accountId: nequi.id, accountName: "Nequi" },
    { date: date(10),  type: "ingreso", category: "Dividendos", amount: 350_000,   accountId: bancolombia.id, accountName: "Bancolombia" },
    // Egresos
    { date: date(2),   type: "egreso", category: "Arriendo",       amount: 1_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(32),  type: "egreso", category: "Arriendo",       amount: 1_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(62),  type: "egreso", category: "Arriendo",       amount: 1_800_000, accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(3),   type: "egreso", category: "Servicios",      amount: 380_000,   accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(33),  type: "egreso", category: "Servicios",      amount: 350_000,   accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(5),   type: "egreso", category: "Mercado",        amount: 650_000,   accountId: nequi.id, accountName: "Nequi" },
    { date: date(12),  type: "egreso", category: "Mercado",        amount: 420_000,   accountId: "cash", accountName: "Efectivo" },
    { date: date(35),  type: "egreso", category: "Mercado",        amount: 580_000,   accountId: nequi.id, accountName: "Nequi" },
    { date: date(7),   type: "egreso", category: "Transporte",     amount: 180_000,   accountId: nequi.id, accountName: "Nequi" },
    { date: date(37),  type: "egreso", category: "Transporte",     amount: 160_000,   accountId: nequi.id, accountName: "Nequi" },
    { date: date(8),   type: "egreso", category: "Restaurantes",   amount: 95_000,    accountId: nequi.id, accountName: "Nequi" },
    { date: date(14),  type: "egreso", category: "Restaurantes",   amount: 72_000,    accountId: "cash", accountName: "Efectivo" },
    { date: date(20),  type: "egreso", category: "Entretenimiento",amount: 120_000,   accountId: nequi.id, accountName: "Nequi" },
    { date: date(25),  type: "egreso", category: "Salud",          amount: 250_000,   accountId: davivienda.id, accountName: "Davivienda" },
    { date: date(40),  type: "egreso", category: "Educación",      amount: 480_000,   accountId: bancolombia.id, accountName: "Bancolombia" },
    { date: date(50),  type: "egreso", category: "Ropa",           amount: 320_000,   accountId: nequi.id, accountName: "Nequi" },
    { date: date(55),  type: "egreso", category: "Mascotas",       amount: 150_000,   accountId: "cash", accountName: "Efectivo" },
  ];
  for (const f of finances) {
    await prisma.finance.create({ data: { id: cuid(), userId: uid, ...f } });
  }

  // ── Stocks ──
  const stocks = [
    { ticker: "ECOPETROL", qty: 200, price: 2150, currency: "COP", trm: 1, priceCOP: 2150, commission: 15_000, date: date(90) },
    { ticker: "ISA",       qty: 50,  price: 18_500, currency: "COP", trm: 1, priceCOP: 18_500, commission: 12_000, date: date(120) },
    { ticker: "AAPL",      qty: 5,   price: 195, currency: "USD", trm: 4200, priceCOP: 819_000, commission: 5_000, date: date(180) },
    { ticker: "MSFT",      qty: 3,   price: 420, currency: "USD", trm: 4200, priceCOP: 1_764_000, commission: 5_000, date: date(150) },
  ];
  for (const s of stocks) {
    await prisma.stock.create({ data: { id: cuid(), userId: uid, ...s } });
  }

  // ── Crypto ──
  const cryptos = [
    { ticker: "BTC",  qty: 0.015,  price: 67_000, currency: "USD", trm: 4200, priceCOP: 281_400_000 * 0.015, commission: 8_000, date: date(200) },
    { ticker: "ETH",  qty: 0.5,    price: 3_500,  currency: "USD", trm: 4200, priceCOP: 14_700_000 * 0.5, commission: 5_000, date: date(160) },
    { ticker: "SOL",  qty: 10,     price: 145,    currency: "USD", trm: 4200, priceCOP: 609_000 * 10, commission: 3_000, date: date(100) },
  ];
  for (const c of cryptos) {
    await prisma.crypto.create({ data: { id: cuid(), userId: uid, ...c } });
  }

  // ── Prices (market prices) ──
  const prices = [
    { ticker: "stock:ECOPETROL", value: 2_300 },
    { ticker: "stock:ISA",       value: 19_800 },
    { ticker: "stock:AAPL",      value: 210 },
    { ticker: "stock:MSFT",      value: 445 },
    { ticker: "crypto:BTC",      value: 71_000 },
    { ticker: "crypto:ETH",      value: 3_800 },
    { ticker: "crypto:SOL",      value: 165 },
  ];
  for (const p of prices) {
    await prisma.price.create({ data: { userId: uid, ...p } });
  }

  // ── HYS (Alto Rendimiento) ──
  const hys = await prisma.hys.create({
    data: { userId: uid, name: "Nu", currency: "COP", rate: 11.5, openedAt: date(180) },
  });
  const hysMoves = [
    { date: date(180), type: "deposito",  amount: 2_000_000, balance: 2_000_000, rate: 11.5 },
    { date: date(150), type: "deposito",  amount: 1_500_000, balance: 3_500_000, rate: 11.5 },
    { date: date(120), type: "interes",   amount: 33_500,    balance: 3_533_500, rate: 11.5 },
    { date: date(90),  type: "deposito",  amount: 1_000_000, balance: 4_533_500, rate: 11.5 },
    { date: date(60),  type: "interes",   amount: 43_200,    balance: 4_576_700, rate: 11.5 },
    { date: date(30),  type: "retiro",    amount: -500_000,  balance: 4_076_700, rate: 11.5 },
    { date: date(1),   type: "interes",   amount: 38_900,    balance: 4_115_600, rate: 11.5 },
  ];
  for (const m of hysMoves) {
    await prisma.hysMovement.create({ data: { id: cuid(), userId: uid, hysId: hys.id, ...m } });
  }

  // ── Goals ──
  await prisma.goal.create({ data: { userId: uid, name: "Fondo de emergencia", target: 15_000_000, saved: 8_500_000, deadline: date(-180), color: "#34D399" } });
  await prisma.goal.create({ data: { userId: uid, name: "Viaje a Europa", target: 12_000_000, saved: 4_200_000, deadline: date(-365), color: "#60A5FA" } });
  await prisma.goal.create({ data: { userId: uid, name: "Laptop nueva", target: 5_000_000, saved: 3_800_000, deadline: date(-90), color: "#FBBF24" } });

  // ── Budgets ──
  await prisma.budget.create({ data: { userId: uid, category: "Mercado", amount: 1_200_000, period: "mensual" } });
  await prisma.budget.create({ data: { userId: uid, category: "Restaurantes", amount: 400_000, period: "mensual" } });
  await prisma.budget.create({ data: { userId: uid, category: "Transporte", amount: 300_000, period: "mensual" } });

  // ── Transfers ──
  const transfers = [
    { date: date(5),  fromAccountId: bancolombia.id, fromAccountName: "Bancolombia", toAccountId: nequi.id, toAccountName: "Nequi", amount: 1_000_000, note: "Para gastos del mes" },
    { date: date(28), fromAccountId: bancolombia.id, fromAccountName: "Bancolombia", toAccountId: "hys", toAccountName: "Alto Rendimiento", amount: 1_500_000, note: "Ahorro mensual" },
    { date: date(35), fromAccountId: nequi.id, fromAccountName: "Nequi", toAccountId: "cash", toAccountName: "Efectivo", amount: 200_000 },
    { date: date(58), fromAccountId: bancolombia.id, fromAccountName: "Bancolombia", toAccountId: "hys", toAccountName: "Alto Rendimiento", amount: 1_000_000 },
    { date: date(90), fromAccountId: davivienda.id, fromAccountName: "Davivienda", toAccountId: bancolombia.id, toAccountName: "Bancolombia", amount: 500_000, note: "Consolidar cuentas" },
  ];
  for (const t of transfers) {
    await prisma.transfer.create({ data: { userId: uid, ...t } });
  }

  // ── Recurrings ──
  await prisma.recurring.create({ data: { userId: uid, type: "egreso", category: "Arriendo", desc: "Arriendo apto", amount: 1_800_000, frequency: "mensual", nextDate: date(-1), active: true, accountId: bancolombia.id, accountName: "Bancolombia" } });
  await prisma.recurring.create({ data: { userId: uid, type: "egreso", category: "Servicios", desc: "Netflix + Spotify", amount: 55_000, frequency: "mensual", nextDate: date(-5), active: true, accountId: nequi.id, accountName: "Nequi" } });
  await prisma.recurring.create({ data: { userId: uid, type: "ingreso", category: "Salario", desc: "Nómina", amount: 5_800_000, frequency: "mensual", nextDate: date(-1), active: true, accountId: bancolombia.id, accountName: "Bancolombia" } });

  // ════════════════════════════════════════════
  // COMMERCE PROFILE (shadow user)
  // ════════════════════════════════════════════

  const bizUser = await prisma.user.create({
    data: { name: "Demo Negocio", businessOwnerId: uid },
  });
  const bizId = bizUser.id;

  // Business config
  await prisma.userConfig.create({
    data: { userId: bizId, theme: "dark", onboardingDone: true, baseCurrency: "COP", salesGoal: 8_000_000 },
  });

  // Business cash
  await prisma.cash.create({ data: { userId: bizId, banco: 350_000 } });

  // Business bank accounts
  const bizBank = await prisma.bankAccount.create({
    data: { userId: bizId, name: "Bancolombia Negocio", bank: "Bancolombia", type: "corriente", balance: 4_200_000, color: "#FBBF24" },
  });

  // Business categories
  const bizCats = [
    { name: "Ventas", type: "ingreso" },
    { name: "Otros ingresos", type: "ingreso" },
    { name: "Mercancía", type: "egreso" },
    { name: "Arriendo local", type: "egreso" },
    { name: "Servicios", type: "egreso" },
    { name: "Nómina", type: "egreso" },
    { name: "Publicidad", type: "egreso" },
    { name: "Envíos", type: "egreso" },
  ];
  for (const c of bizCats) {
    await prisma.category.create({ data: { userId: bizId, name: c.name, type: c.type } });
  }

  // Products
  const products = [
    { name: "Camiseta básica", category: "Ropa", cost: 18_000, price: 45_000, stock: 35, minStock: 10 },
    { name: "Camiseta premium", category: "Ropa", cost: 28_000, price: 75_000, stock: 20, minStock: 5 },
    { name: "Hoodie", category: "Ropa", cost: 35_000, price: 95_000, stock: 15, minStock: 5 },
    { name: "Gorra bordada", category: "Accesorios", cost: 12_000, price: 35_000, stock: 40, minStock: 15 },
    { name: "Tote bag", category: "Accesorios", cost: 8_000, price: 28_000, stock: 50, minStock: 20 },
    { name: "Medias pack x3", category: "Ropa", cost: 9_000, price: 25_000, stock: 60, minStock: 20 },
    { name: "Stickers pack", category: "Merch", cost: 2_000, price: 8_000, stock: 100, minStock: 30 },
    { name: "Botella térmica", category: "Accesorios", cost: 22_000, price: 55_000, stock: 12, minStock: 5 },
    { name: "Funda celular", category: "Accesorios", cost: 7_000, price: 22_000, stock: 0, minStock: 10 },
    { name: "Llavero personalizado", category: "Merch", cost: 3_500, price: 12_000, stock: 0, minStock: 15 },
  ];
  const createdProducts: Record<string, string> = {};
  for (const p of products) {
    const created = await prisma.product.create({ data: { userId: bizId, ...p, active: true } });
    createdProducts[p.name] = created.id;
  }

  // Customers
  const customers = [
    { name: "Laura Martínez", phone: "3101234567", kind: "customer" },
    { name: "Carlos Rodríguez", phone: "3209876543", kind: "customer" },
    { name: "María Gómez", kind: "customer" },
    { name: "Andrés López", phone: "3154567890", kind: "customer" },
    { name: "Valentina Torres", kind: "customer" },
    { name: "Distribuciones ABC", phone: "6012345678", kind: "supplier", note: "Proveedor de telas" },
    { name: "Estampados JR", phone: "3187654321", kind: "supplier", note: "Serigrafía y bordado" },
  ];
  const createdCustomers: Record<string, string> = {};
  for (const c of customers) {
    const created = await prisma.customer.create({ data: { userId: bizId, ...c } });
    createdCustomers[c.name] = created.id;
  }

  // Sales
  const salesData = [
    { date: date(1), items: [{ name: "Camiseta básica", qty: 2, price: 45_000, cost: 18_000 }, { name: "Gorra bordada", qty: 1, price: 35_000, cost: 12_000 }], payMethod: "cash" },
    { date: date(2), items: [{ name: "Hoodie", qty: 1, price: 95_000, cost: 35_000 }], payMethod: bizBank.id, customerId: createdCustomers["Laura Martínez"] },
    { date: date(3), items: [{ name: "Tote bag", qty: 3, price: 28_000, cost: 8_000 }, { name: "Stickers pack", qty: 5, price: 8_000, cost: 2_000 }], payMethod: "cash" },
    { date: date(5), items: [{ name: "Camiseta premium", qty: 1, price: 75_000, cost: 28_000 }, { name: "Medias pack x3", qty: 2, price: 25_000, cost: 9_000 }], payMethod: bizBank.id },
    { date: date(7), items: [{ name: "Botella térmica", qty: 2, price: 55_000, cost: 22_000 }], payMethod: "cash", customerId: createdCustomers["Carlos Rodríguez"] },
    { date: date(10), items: [{ name: "Camiseta básica", qty: 5, price: 45_000, cost: 18_000 }], payMethod: bizBank.id, customerId: createdCustomers["Andrés López"] },
    { date: date(12), items: [{ name: "Gorra bordada", qty: 3, price: 35_000, cost: 12_000 }, { name: "Tote bag", qty: 2, price: 28_000, cost: 8_000 }], payMethod: "fiado", customerId: createdCustomers["María Gómez"] },
    { date: date(15), items: [{ name: "Hoodie", qty: 2, price: 95_000, cost: 35_000 }], payMethod: bizBank.id },
    { date: date(18), items: [{ name: "Camiseta premium", qty: 3, price: 75_000, cost: 28_000 }], payMethod: "cash" },
    { date: date(20), items: [{ name: "Medias pack x3", qty: 4, price: 25_000, cost: 9_000 }, { name: "Stickers pack", qty: 10, price: 8_000, cost: 2_000 }], payMethod: bizBank.id },
    { date: date(22), items: [{ name: "Camiseta básica", qty: 3, price: 45_000, cost: 18_000 }], payMethod: "cash", customerId: createdCustomers["Valentina Torres"] },
    { date: date(25), items: [{ name: "Botella térmica", qty: 1, price: 55_000, cost: 22_000 }, { name: "Gorra bordada", qty: 2, price: 35_000, cost: 12_000 }], payMethod: bizBank.id },
  ];

  for (const s of salesData) {
    const total = s.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const cost = s.items.reduce((sum, i) => sum + i.qty * i.cost, 0);
    const sale = await prisma.sale.create({
      data: {
        userId: bizId,
        date: s.date,
        total,
        cost,
        payMethod: s.payMethod,
        customerId: s.customerId,
      },
    });
    for (const item of s.items) {
      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: createdProducts[item.name],
          name: item.name,
          qty: item.qty,
          price: item.price,
          cost: item.cost,
        },
      });
    }
  }

  // Business finances (gastos operativos)
  const bizFinances = [
    { date: date(3),  type: "egreso", category: "Arriendo local", amount: 2_200_000, accountId: bizBank.id, accountName: "Bancolombia Negocio" },
    { date: date(5),  type: "egreso", category: "Servicios",      amount: 280_000,   accountId: bizBank.id, accountName: "Bancolombia Negocio" },
    { date: date(10), type: "egreso", category: "Mercancía",      amount: 1_500_000, accountId: bizBank.id, accountName: "Bancolombia Negocio" },
    { date: date(15), type: "egreso", category: "Nómina",         amount: 3_200_000, accountId: bizBank.id, accountName: "Bancolombia Negocio" },
    { date: date(20), type: "egreso", category: "Publicidad",     amount: 350_000,   accountId: bizBank.id, accountName: "Bancolombia Negocio" },
    { date: date(25), type: "egreso", category: "Envíos",         amount: 180_000,   accountId: "cash", accountName: "Efectivo" },
  ];
  for (const f of bizFinances) {
    await prisma.finance.create({ data: { id: cuid(), userId: bizId, ...f } });
  }

  // Fiado movements (María Gómez has fiado from sale above)
  const mariaId = createdCustomers["María Gómez"];
  await prisma.fiadoMovement.create({
    data: { userId: bizId, customerId: mariaId, date: date(12), type: "fiado", amount: 161_000, note: "Venta gorras + tote bags" },
  });
  await prisma.fiadoMovement.create({
    data: { userId: bizId, customerId: mariaId, date: date(8), type: "abono", amount: 80_000, note: "Abono parcial" },
  });

  // Cash closes
  await prisma.cashClose.create({
    data: {
      userId: bizId,
      date: date(1),
      expectedCash: 450_000,
      countedCash: 445_000,
      diff: -5_000,
      note: "Faltante menor",
      summary: JSON.stringify({ byMethod: { cash: 235_000, [bizBank.id]: 285_000 }, gastos: 180_000, ventas: 520_000 }),
    },
  });

  console.log(`
Demo user created successfully!

  Email:    ${DEMO_EMAIL}
  Password: ${DEMO_PASS}

  Personal: 6 months of salary, freelance income, investments, crypto, HYS, goals, budgets, transfers
  Commerce: 12 sales, 10 products (2 sin stock), 5 customers, 2 suppliers, fiado, cash close
`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
