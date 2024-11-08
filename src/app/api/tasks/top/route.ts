"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizationId = parseInt(searchParams.get("organizationId") || "0");

  // Verifica si organizationId es valido
  if (!organizationId) {
    return NextResponse.json(
      { error: "Invalid organization ID" },
      { status: 400 },
    );
  }

  // Obtener la sesión actual
  const session = await getServerSession(authOptions);

  // Verifica si la sesión es valida y si tiene el userId
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 },
    );
  }

  const userId = parseInt(session.user.id);

  // Verificar si el usuario es administrador
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Paso 1: Calcular el promedio de client_satisfaction por tarea
    const taskRatings = await prisma.taskRating.groupBy({
      by: ["taskId"],
      where: { task: { organizationId } },
      _avg: {
        clientSatisfaction: true,
      },
      orderBy: {
        _avg: {
          clientSatisfaction: "desc",
        },
      },
      take: 3,
    });

    // Paso 2: Obtener las tareas completas utilizando los IDs de las tareas obtenidas en el paso 1
    const taskIds = taskRatings.map((rating) => rating.taskId);
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: {
        taskRatings: true, // Opcional, incluiye la relacion completa de TaskRating
      },
    });

    // Si no se encuentran tareas
    if (tasks.length === 0) {
      return NextResponse.json({ error: "No tasks found" }, { status: 404 });
    }

    // Retornar las tareas con sus valoraciones
    return NextResponse.json(tasks, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
