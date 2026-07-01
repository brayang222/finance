"use server";

import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function registerUser({ name, identifier, password }: { name: string; identifier: string; password: string }) {
  const isPhone = /^\d+$/.test(identifier.trim());
  const data = {
    name,
    password: await bcrypt.hash(password, 12),
    ...(isPhone
      ? { phone: identifier.trim() }
      : { email: identifier.trim().toLowerCase() }),
  };

  const existing = await prisma.user.findFirst({
    // @ts-ignore
    where: isPhone ? { phone: data.phone } : { email: data.email },
  });

  if (existing) return { error: "Ya existe una cuenta con ese correo o celular" };

  await prisma.user.create({ data });
  return { ok: true };
}
