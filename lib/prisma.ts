import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "./crypto";

// Fields encrypted per model.
// Only free-text fields the user types (desc, note, description).
// Structured fields used in WHERE/GROUP BY (category, accountName, name)
// are intentionally excluded to avoid breaking queries.
const ENCRYPTED_FIELDS: Partial<Record<string, string[]>> = {
  Finance:       ["desc"],
  HysMovement:   ["note"],
  Cash:          ["note"],
  Recurring:     ["desc"],
  Customer:      ["note"],
  FiadoMovement: ["note"],
  Transfer:      ["note"],
  CashClose:     ["note"],
  Sale:          ["note"],
  ActivityLog:   ["description"],
};

function encryptFields(model: string | undefined, data: Record<string, unknown> | null | undefined) {
  if (!data || !model) return;
  const fields = ENCRYPTED_FIELDS[model];
  if (!fields) return;
  for (const f of fields) {
    if (typeof data[f] === "string") data[f] = encrypt(data[f] as string);
  }
}

function decryptFields(model: string | undefined, result: unknown) {
  if (!result || !model) return;
  const fields = ENCRYPTED_FIELDS[model];
  if (!fields) return;
  if (Array.isArray(result)) {
    for (const row of result) decryptFields(model, row);
  } else if (typeof result === "object" && result !== null) {
    const row = result as Record<string, unknown>;
    for (const f of fields) {
      if (typeof row[f] === "string") row[f] = decrypt(row[f] as string);
    }
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function dbUrl() {
  const base = process.env.DATABASE_URL ?? "";
  if (!base) return base;
  const params: string[] = [];
  if (!base.includes("sslmode"))         params.push("sslmode=require");
  if (!base.includes("connect_timeout")) params.push("connect_timeout=30");
  return params.length ? base + (base.includes("?") ? "&" : "?") + params.join("&") : base;
}

const client = globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: dbUrl() } } });

// Encrypt on write, decrypt on read
client.$use(async (params, next) => {
  const model = params.model;

  if (params.action === "create" || params.action === "update") {
    encryptFields(model, params.args?.data as Record<string, unknown>);
  }
  if (params.action === "upsert") {
    encryptFields(model, params.args?.create as Record<string, unknown>);
    encryptFields(model, params.args?.update as Record<string, unknown>);
  }
  if (params.action === "createMany" || params.action === "updateMany") {
    const data = params.args?.data;
    if (Array.isArray(data)) data.forEach((d) => encryptFields(model, d as Record<string, unknown>));
    else encryptFields(model, data as Record<string, unknown>);
  }

  const result = await next(params);
  decryptFields(model, result);
  return result;
});

export const prisma = client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
