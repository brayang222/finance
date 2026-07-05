import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await params;
    await prisma.shareInvite.updateMany({
      where: { id, OR: [{ ownerId: userId }, { guestId: userId }] },
      data: { status: "revoked" },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return apiError(e); }
}
