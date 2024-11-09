import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const version = await prisma.version.findUnique({
      where: { id: parseInt(id) },
    });
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    await prisma.version.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Version deleted successfully" });
  } catch (error) {
    console.error("Error deleting version:", error);
    return NextResponse.json(
      { error: "Error deleting version" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const version = await prisma.version.findUnique({
      where: { id: parseInt(id) },
      include: {
        versionTasks: {
          include: {
            Task: true,
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const tasksToApply = version.versionTasks.map(
      (versionTask) => versionTask.Task,
    );

    const organization = await prisma.organization.findUnique({
      where: { id: version.organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const transactionTasks = tasksToApply.map((task) => {
      return prisma.task.updateMany({
        where: { id: task.id, organizationId: undefined },
        data: { organizationId: organization.id },
      });
    });

    await prisma.$transaction(transactionTasks);

    return NextResponse.json({ message: "Version applied successfully" });
  } catch (error) {
    console.error("Error applying version:", error);
    return NextResponse.json(
      { error: "Error applying version" },
      { status: 500 },
    );
  }
}
