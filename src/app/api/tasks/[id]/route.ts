import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updates: {
      name?: string;
      description?: string;
      type?: string;
      progress?: number;
      startDate?: string;
      endDate?: string;
      deselected?: boolean;
      effort?: number;
    } = await req.json();

    // Validar progress primero si está presente
    if (
      updates.progress !== undefined &&
      (updates.progress < 0 || updates.progress > 100)
    ) {
      return NextResponse.json(
        { error: "Progress must be between 0 and 100" },
        { status: 400 },
      );
    }

    // Actualización especial para deselected
    if (Object.keys(updates).length === 1 && "deselected" in updates) {
      const updatedTask = await prisma.task.update({
        where: { id: parseInt(id) },
        data: { deselected: updates.deselected },
      });
      return NextResponse.json({ task: updatedTask }, { status: 201 });
    }

    // Validaciones para actualización completa
    if (
      !updates.name ||
      !updates.type ||
      !updates.startDate ||
      !updates.endDate
    ) {
      return NextResponse.json(
        { error: "Required fields missing (name, type, startDate, endDate)" },
        { status: 400 },
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        name: updates.name,
        description: updates.description,
        type: updates.type,
        progress: updates.progress,
        startDate: new Date(updates.startDate),
        endDate: new Date(updates.endDate),
        deselected: updates.deselected ?? false,
        effort: updates.effort,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Error updating task" }, { status: 500 });
  }
}

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
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    const userId = parseInt(session.user.id);

    if (task.createdById !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Error deleting task" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const taskId = parseInt(id);

    if (task.createdById !== taskId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error retrieving task:", error);
    return NextResponse.json(
      { error: "Error retrieving task" },
      { status: 500 },
    );
  }
}
