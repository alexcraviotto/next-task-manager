import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { z } from "zod";

const updateTaskSchema = z.object({
  organizationId: z.string(),
  effort: z.number().min(0).max(5).int().optional(),
  clientWeight: z.number().min(0).max(5).int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const body = await req.json();
    const {
      organizationId,
      effort,
      clientWeight: newClientWeight,
    } = updateTaskSchema.parse(body);
    const taskId = parseInt(params.taskId);

    if (!effort && !newClientWeight) {
      return NextResponse.json(
        {
          error: "At least one field (effort or clientWeight) must be provided",
        },
        { status: 400 },
      );
    }

    // Si se actualiza el esfuerzo
    if (effort !== undefined) {
      await prisma.taskRating.updateMany({
        where: {
          taskId,
          task: {
            organizationId: organizationId,
          },
        },
        data: { effort },
      });
    }

    // Si se actualiza la valoración
    if (newClientWeight !== undefined) {
      // 1. Obtener la valoración y satisfacción previas
      const previousRating = await prisma.taskRating.findFirst({
        where: {
          taskId,
          task: {
            organizationId: organizationId,
          },
        },
        select: {
          clientWeight: true,
          clientSatisfaction: true,
        },
      });

      if (!previousRating) {
        return NextResponse.json(
          { error: "Task rating not found" },
          { status: 404 },
        );
      }

      // 2. Calcular nueva satisfacción
      if (
        previousRating.clientSatisfaction === null ||
        previousRating.clientWeight === null
      ) {
        return NextResponse.json(
          { error: "Invalid rating values: satisfaction or weight is null" },
          { status: 400 },
        );
      }

      let newSatisfaction = Math.round(
        (previousRating.clientSatisfaction / previousRating.clientWeight) *
          newClientWeight,
      );

      // 3. Normalizar el resultado entre 0 y 5
      newSatisfaction = Math.min(5, Math.max(0, newSatisfaction));

      // 4. Actualizar valoración y satisfacción
      await prisma.taskRating.updateMany({
        where: {
          taskId,
          task: {
            organizationId: organizationId,
          },
        },
        data: {
          clientWeight: newClientWeight,
          clientSatisfaction: newSatisfaction,
        },
      });
    }

    return NextResponse.json(
      { message: "Task updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
