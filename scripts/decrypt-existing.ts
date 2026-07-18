/**
 * One-time rollback: decrypts all "enc:" values back to plaintext.
 * Run: npx tsx scripts/decrypt-existing.ts
 * Safe to re-run — plaintext values are left untouched.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "../lib/crypto";

const db = new PrismaClient();

const JOBS: Array<{
  label: string;
  fetch: () => Promise<Array<Record<string, unknown>>>;
  update: (id: string, patch: Record<string, string | null>) => Promise<void>;
  fields: string[];
}> = [
  { label: "Finance.desc",         fields: ["desc"],        fetch: () => db.finance.findMany({ where: { desc: { startsWith: "enc:" } } }) as any,        update: (id, p) => db.finance.update({ where: { id }, data: p }) },
  { label: "HysMovement.note",     fields: ["note"],        fetch: () => db.hysMovement.findMany({ where: { note: { startsWith: "enc:" } } }) as any,    update: (id, p) => db.hysMovement.update({ where: { id }, data: p }) },
  { label: "Cash.note",            fields: ["note"],        fetch: () => db.cash.findMany({ where: { note: { startsWith: "enc:" } } }) as any,            update: (id, p) => db.cash.update({ where: { id }, data: p }) },
  { label: "Recurring.desc",       fields: ["desc"],        fetch: () => db.recurring.findMany({ where: { desc: { startsWith: "enc:" } } }) as any,      update: (id, p) => db.recurring.update({ where: { id }, data: p }) },
  { label: "Customer.note",        fields: ["note"],        fetch: () => db.customer.findMany({ where: { note: { startsWith: "enc:" } } }) as any,       update: (id, p) => db.customer.update({ where: { id }, data: p }) },
  { label: "FiadoMovement.note",   fields: ["note"],        fetch: () => db.fiadoMovement.findMany({ where: { note: { startsWith: "enc:" } } }) as any,  update: (id, p) => db.fiadoMovement.update({ where: { id }, data: p }) },
  { label: "Transfer.note",        fields: ["note"],        fetch: () => db.transfer.findMany({ where: { note: { startsWith: "enc:" } } }) as any,       update: (id, p) => db.transfer.update({ where: { id }, data: p }) },
  { label: "CashClose.note",       fields: ["note"],        fetch: () => db.cashClose.findMany({ where: { note: { startsWith: "enc:" } } }) as any,      update: (id, p) => db.cashClose.update({ where: { id }, data: p }) },
  { label: "Sale.note",            fields: ["note"],        fetch: () => db.sale.findMany({ where: { note: { startsWith: "enc:" } } }) as any,           update: (id, p) => db.sale.update({ where: { id }, data: p }) },
  { label: "ActivityLog.description", fields: ["description"], fetch: () => db.activityLog.findMany({ where: { description: { startsWith: "enc:" } } }) as any, update: (id, p) => db.activityLog.update({ where: { id }, data: p }) },
];

async function run() {
  console.log("Starting decryption rollback...\n");
  let total = 0;
  for (const job of JOBS) {
    const rows = await job.fetch();
    let updated = 0;
    for (const row of rows) {
      const patch: Record<string, string | null> = {};
      for (const f of job.fields) {
        const val = row[f] as string | null;
        if (val?.startsWith("enc:")) patch[f] = decrypt(val);
      }
      if (Object.keys(patch).length > 0) {
        await job.update(row.id as string, patch);
        updated++;
      }
    }
    console.log(`${job.label}: ${updated} rows decrypted`);
    total += updated;
  }
  console.log(`\nDone. ${total} rows restored to plaintext.`);
  await db.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
