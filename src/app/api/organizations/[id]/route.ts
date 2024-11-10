import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: { createdBy: true },
    });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    if (organization.createdById !== user?.id) {
      return NextResponse.json(
        { error: "No permission to delete" },
        { status: 403 },
      );
    }

    await prisma.organization.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Organization deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
