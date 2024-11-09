import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verificar si la organización existe
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          where: { userId: user.id },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    // Verificar si el usuario ya es miembro
    if (organization.users.length > 0) {
      return NextResponse.json(
        { message: "Already a member" },
        { status: 400 },
      );
    }

    // Crear la relación usuario-organización
    await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: id,
        weight: 0, // Peso por defecto
      },
    });

    return NextResponse.json({
      message: "Successfully joined organization",
      organization,
    });
  } catch (error) {
    console.error("Error joining organization:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
