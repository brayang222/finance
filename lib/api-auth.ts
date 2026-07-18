import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveBusinessUser } from "./db";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

// Business profile (mobile): X-Profile: business header → resolves shadow commerce user
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
    let sub: string | undefined;
    try {
      sub = (await jwtVerify(bearer, secret())).payload.sub;
    } catch {
      // invalid signature or expired token → falls through to throw below (401)
    }
    if (!sub) throw new Error("Invalid token");
    return applyProfile(sub, req);
  }
  // Cookie session fallback (web app)
  const { getToken } = await import("next-auth/jwt");
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET! });
  if (!token?.sub) throw new Error("Not authenticated");
  return applyProfile(token.sub, req);
}

export function unauthorized(msg = "Not authenticated") {
  return NextResponse.json({ error: msg }, { status: 401 });
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export function notFound(msg = "Not found") {
  return NextResponse.json({ error: msg }, { status: 404 });
}

export function apiError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Internal error";
  const status = msg.includes("authenticated") || msg.includes("token") || msg.includes("Token") ? 401 : 400;
  return NextResponse.json({ error: msg }, { status });
}
