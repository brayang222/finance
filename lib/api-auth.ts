import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveBusinessUser } from "./db";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

// Perfil comercio (móvil): header X-Profile: business → usuario sombra del comercio
async function applyProfile(userId: string, req: NextRequest): Promise<string> {
  if (req.headers.get("x-profile") !== "business") return userId;
  return (await resolveBusinessUser(userId)).id;
}

export async function signToken(userId: string, email: string | null): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());
}

export async function getUserIdFromRequest(req: NextRequest): Promise<string> {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (bearer) {
    const { payload } = await jwtVerify(bearer, secret());
    if (!payload.sub) throw new Error("Token inválido");
    return applyProfile(payload.sub, req);
  }
  // Cookie session fallback (web app)
  const { getToken } = await import("next-auth/jwt");
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET! });
  if (!token?.sub) throw new Error("No autenticado");
  return applyProfile(token.sub, req);
}

export function unauthorized(msg = "No autenticado") {
  return NextResponse.json({ error: msg }, { status: 401 });
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export function notFound(msg = "No encontrado") {
  return NextResponse.json({ error: msg }, { status: 404 });
}

export function apiError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Error interno";
  const status = msg.includes("autenticado") || msg.includes("Token") ? 401 : 400;
  return NextResponse.json({ error: msg }, { status });
}
