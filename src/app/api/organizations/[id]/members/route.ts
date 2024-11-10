// route.ts
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET - Obtener todos los miembros de una organización
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    // Verificar si el usuario es miembro de la organización
    const membership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: Number(session.user.id),
          organizationId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ message: "Not a member" }, { status: 403 });
    }

    const members = await prisma.userOrganization.findMany({
      where: { organizationId: id },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const formattedMembers = members.map((member) => ({
      id: member.userId,
      username: member.User.username,
      email: member.User.email,
      isAdmin: member.weight >= 5,
      createdAt: member.User.createdAt.toISOString(),
      updatedAt: member.User.updatedAt.toISOString(),
      weight: member.weight,
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST - Añadir un nuevo miembro
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { email, weight } = await req.json();

    // Validate weight first
    if (weight < 0 || weight > 5) {
      return NextResponse.json(
        { message: "Weight must be between 0 and 5" },
        { status: 400 },
      );
    }

    // Verificar si el usuario actual es admin
    const membership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: Number(session.user.id),
          organizationId: id,
        },
      },
    });

    if (!membership || membership.weight < 5) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const existingMember = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: userToAdd.id,
          organizationId: id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { message: "Already a member" },
        { status: 400 },
      );
    }

    const member = await prisma.userOrganization.create({
      data: {
        userId: userToAdd.id,
        organizationId: id,
        weight: weight || 0,
      },
      include: {
        User: true,
      },
    });

    return NextResponse.json({
      id: member.userId,
      username: member.User.username,
      email: member.User.email,
      isAdmin: member.weight >= 5,
      createdAt: member.User.createdAt.toISOString(),
      updatedAt: member.User.updatedAt.toISOString(),
      weight: member.weight,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH - Actualizar un miembro
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { id: userId, weight } = await req.json();

    // Validate weight first
    if (weight < 0 || weight > 5) {
      return NextResponse.json(
        { message: "Weight must be between 0 and 5" },
        { status: 400 },
      );
    }

    // Verificar si el usuario actual es admin
    const membership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: Number(session.user.id),
          organizationId: id,
        },
      },
    });

    if (!membership || membership.weight < 5) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const member = await prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId: id,
        },
      },
      data: {
        weight,
      },
      include: {
        User: true,
      },
    });

    return NextResponse.json({
      id: member.userId,
      username: member.User.username,
      email: member.User.email,
      isAdmin: member.weight >= 5,
      createdAt: member.User.createdAt.toISOString(),
      updatedAt: member.User.updatedAt.toISOString(),
      weight: member.weight,
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar un miembro
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const searchParams = req.nextUrl.searchParams;
    const userId = parseInt(searchParams.get("memberId") || "");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }

    // Verificar si el usuario actual es admin
    const membership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: Number(session.user.id),
          organizationId: id,
        },
      },
    });

    if (!membership || membership.weight < 5) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    await prisma.userOrganization.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId: id,
        },
      },
    });

    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
