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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        organizations: {
          where: { organizationId: id },
        },
      },
    });

    if (!currentUser?.organizations.length) {
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
    const { weight } = await req.json();

    // Validate weight
    if (weight < 0 || weight > 5) {
      return NextResponse.json(
        { message: "Weight must be between 0 and 5" },
        { status: 400 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        createdOrgs: {
          where: { id }, // Solo busca la organización específica
        },
      },
    });

    if (!currentUser?.createdOrgs?.length) {
      return NextResponse.json(
        { message: "Not authorized to add members to this organization" },
        { status: 403 },
      );
    }

    // Verificar si ya existe la relación
    const existingMember = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: currentUser.id,
          organizationId: id,
        },
      },
    });

    if (existingMember) {
      // Si ya existe, actualizar el peso
      const updatedMember = await prisma.userOrganization.update({
        where: {
          userId_organizationId: {
            userId: currentUser.id,
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
        id: updatedMember.userId,
        username: updatedMember.User.username,
        email: updatedMember.User.email,
        isAdmin: updatedMember.User.isAdmin,
        createdAt: updatedMember.User.createdAt.toISOString(),
        updatedAt: updatedMember.User.updatedAt.toISOString(),
        weight: updatedMember.weight,
      });
    }

    // Si no existe, crear nuevo miembro
    const newMember = await prisma.userOrganization.create({
      data: {
        userId: currentUser.id,
        organizationId: id,
        weight: weight || 0,
      },
      include: {
        User: true,
      },
    });

    return NextResponse.json({
      id: newMember.userId,
      username: newMember.User.username,
      email: newMember.User.email,
      isAdmin: newMember.User.isAdmin,
      createdAt: newMember.User.createdAt.toISOString(),
      updatedAt: newMember.User.updatedAt.toISOString(),
      weight: newMember.weight,
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
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        createdOrgs: {
          where: { createdById: Number(session.user.id) },
        },
      },
    });

    if (!currentUser?.createdOrgs?.length) {
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
      isAdmin: member.User.isAdmin,
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
    console.log("🚀 ~ id:", id);
    const searchParams = req.nextUrl.searchParams;
    const userId = parseInt(searchParams.get("memberId") || "");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        createdOrgs: {
          where: { createdById: Number(session.user.id) },
        },
      },
    });
    console.log("🚀 ~ currentUser:", JSON.stringify(currentUser));

    if (!currentUser?.createdOrgs.length) {
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
