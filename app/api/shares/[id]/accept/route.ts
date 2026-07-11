import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    // Need email for matching invites sent before the guest had an account
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const userEmail = user?.email ?? "";
    const invite = await prisma.shareInvite.findFirst({
      where: { id, status: "pending", OR: [{ guestId: userId }, { guestEmail: userEmail }] },
    });
    if (!invite) return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    const updated = await prisma.shareInvite.update({
      where: { id },
      data: { guestId: userId, status: "accepted" },
    });
    return NextResponse.json(updated);
  } catch (e) { return apiError(e); }
}
