import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = parseInt(params.id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    // Obtener la tarea y su organización
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { organization: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Obtener todos los miembros de la organización con sus pesos
    const organizationMembers = await prisma.userOrganization.findMany({
      where: { organizationId: task.organizationId },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Obtener todos los ratings para esta tarea
    const taskRatings = await prisma.taskRating.findMany({
      where: { taskId },
    });

    // Calcular la satisfacción total del requisito
    let totalSatisfaction = 0;
    organizationMembers.forEach((member) => {
      const rating = taskRatings.find((r) => r.userId === member.userId);
      if (rating) {
        totalSatisfaction += member.weight * (rating.clientWeight ?? 0);
      }
    });

    // Preparar la respuesta con la información completa
    const formattedResponse = {
      taskId,
      totalSatisfaction,
      ratings: organizationMembers.map((member) => ({
        userId: member.userId,
        username: member.User.username,
        email: member.User.email,
        organizationWeight: member.weight,
        rating: taskRatings.find((r) => r.userId === member.userId) || {
          clientWeight: 0,
          clientSatisfaction: 0,
        },
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching task ratings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
