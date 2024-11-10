import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { z } from "zod";

const updateMemberSchema = z.object({
  weight: z.number().min(0).max(5).int(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { organizationId: string; userId: string } },
) {
  try {
    const userId = parseInt(params.userId);
    const body = await req.json();
    const { weight: newWeight } = updateMemberSchema.parse(body);

    // 1. Obtener el peso previo del usuario
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: params.organizationId,
        },
      },
      select: { weight: true },
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: "User not found in organization" },
        { status: 404 },
      );
    }

    const previousWeight = userOrg.weight;

    // 2. Obtener todas las tareas del proyecto con sus valoraciones
    const taskRatings = await prisma.taskRating.findMany({
      where: {
        task: {
          organizationId: params.organizationId,
        },
        userId,
      },
      select: {
        taskId: true,
        clientWeight: true,
        clientSatisfaction: true,
      },
    });

    // 3. Actualizar la satisfacción de cada tarea
    await Promise.all(
      taskRatings.map(
        async (task: {
          clientSatisfaction: number | null;
          clientWeight: number | null;
          taskId: number | null;
        }) => {
          // Solo procesar si todos los valores necesarios no son null
          if (
            task.clientSatisfaction !== null &&
            task.clientWeight !== null &&
            task.taskId !== null
          ) {
            // Restar la contribución del peso anterior
            let newSatisfaction =
              task.clientSatisfaction - previousWeight * task.clientWeight;
            // Sumar la contribución del nuevo peso
            newSatisfaction = newSatisfaction + newWeight * task.clientWeight;
            // Normalizar el resultado entre 0 y 5
            newSatisfaction = Math.min(
              5,
              Math.max(0, Math.round(newSatisfaction)),
            );

            return prisma.taskRating.updateMany({
              where: { taskId: task.taskId },
              data: { clientSatisfaction: newSatisfaction },
            });
          }
          // Si alguno es null, mantener los valores actuales
          return Promise.resolve();
        },
      ),
    );
    // 4. Actualizar el peso del usuario
    await prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId: params.organizationId,
        },
      },
      data: { weight: newWeight },
    });

    return NextResponse.json(
      { message: "Member weight updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error updating member weight:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
