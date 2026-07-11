import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/api-auth";

// Verifica un ID token de Google llamando al endpoint público tokeninfo.
// Devuelve el JWT propio de la app (Bearer).
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "Falta idToken" }, { status: 400 });

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) return NextResponse.json({ error: "Token de Google inválido" }, { status: 401 });
    const info = await res.json() as {
      aud?: string; email?: string; email_verified?: string | boolean;
      name?: string; picture?: string; sub?: string;
    };

    const validAuds = [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_MOBILE_CLIENT_ID].filter(Boolean);
    if (!validAuds.includes(info.aud)) {
      return NextResponse.json({ error: "Audiencia inválida" }, { status: 401 });
    }
    if (String(info.email_verified) !== "true") {
      return NextResponse.json({ error: "Email no verificado" }, { status: 401 });
    }
    if (!info.email) {
      return NextResponse.json({ error: "Sin email en el token" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { email: info.email },
      update: { name: info.name, image: info.picture },
      create: { email: info.email, name: info.name, image: info.picture },
    });

    const token = await signToken(user.id, user.email);
    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
