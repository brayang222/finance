import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) {
      return NextResponse.json({ error: "Credenciales requeridas" }, { status: 400 });
    }

    const isPhone = /^\d+$/.test(identifier.trim());
    const user = await prisma.user.findFirst({
      where: isPhone ? { phone: identifier.trim() } : { email: identifier.trim().toLowerCase() },
    });

    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await signToken(user.id, user.email);
    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
