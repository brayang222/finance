import { PrismaClient } from "@prisma/client";

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

export const prisma = client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
