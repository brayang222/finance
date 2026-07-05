import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const [given, received] = await Promise.all([
      prisma.shareInvite.findMany({
        where: { ownerId: userId },
        include: { guest: { select: { name: true, email: true } } },
      }),
      prisma.shareInvite.findMany({
        where: { guestId: userId },
        include: { owner: { select: { name: true, email: true } } },
      }),
    ]);
    return NextResponse.json({ given, received });
  } catch (e) { return apiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { guestEmail, role = "viewer" } = await req.json();
    const guestUser = await prisma.user.findUnique({ where: { email: guestEmail }, select: { id: true } });
    const invite = await prisma.shareInvite.upsert({
      where: { ownerId_guestEmail: { ownerId: userId, guestEmail } },
      create: { ownerId: userId, guestEmail, guestId: guestUser?.id ?? null, role, status: "pending" },
      update: { status: "pending", role, guestId: guestUser?.id ?? undefined },
    });
    return NextResponse.json(invite, { status: 201 });
  } catch (e) { return apiError(e); }
}
