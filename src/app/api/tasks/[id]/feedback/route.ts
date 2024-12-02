import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const updateTaskSchema = z.object({
  organizationId: z.string(),
  clientWeight: z.number().min(0).int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    console.log("🏆🏆body🏆🏆", body);

    const { organizationId, clientWeight: newClientWeight } =
      updateTaskSchema.parse(body);

    const taskId = parseInt(params.id, 10);
    console.log("🏆🏆taskId convertido🏆🏆", taskId);

    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    if (newClientWeight === undefined) {
      return NextResponse.json(
        {
          error: "At least one field (effort or clientWeight) must be provided",
        },
        { status: 400 },
      );
    }

    const userId = user.id;
    let updatedRating;

    // Si se actualiza la valoración
    if (newClientWeight !== undefined) {
      let existsRating = await prisma.taskRating.findFirst({
        where: {
          taskId: taskId,
          task: {
            organizationId: organizationId,
          },
        },
        select: {
          clientWeight: true,
          clientSatisfaction: true,
        },
      });

      if (!existsRating) {
        existsRating = await prisma.taskRating.create({
          data: {
            taskId: taskId,
            userId: userId,
            clientWeight: 0,
            clientSatisfaction: 0,
          },
          select: {
            clientWeight: true,
            clientSatisfaction: true,
          },
        });
      }

      if (
        existsRating.clientSatisfaction === null ||
        existsRating.clientWeight === null
      ) {
        return NextResponse.json(
          {
            error: "Invalid rating values: satisfaction or weight is null",
          },
          { status: 400 },
        );
      }

      let newSatisfaction = 0;
      console.log("🚀 ~ newClientWeight:", newClientWeight);

      if (newClientWeight !== 0) {
        if (existsRating.clientWeight === 0) {
          const organizationMembers = await prisma.userOrganization.findMany({
            where: {
              organizationId: organizationId,
            },
            select: {
              weight: true,
            },
          });

          let totalScore = 0;
          organizationMembers.forEach((member) => {
            totalScore += member.weight * newClientWeight;
          });
          newSatisfaction = totalScore;
          console.log("🚀 ~ newSatisfaction 1:", newSatisfaction);
        } else {
          newSatisfaction = Math.round(
            (existsRating.clientSatisfaction / existsRating.clientWeight) *
              newClientWeight,
          );
          console.log("🚀 ~ newSatisfaction 2:", newSatisfaction);
        }
      }

      updatedRating = await prisma.taskRating.upsert({
        where: {
          taskId_userId: {
            taskId: taskId,
            userId: userId,
          },
        },
        update: {
          clientWeight: newClientWeight,
          clientSatisfaction: newSatisfaction,
        },
        create: {
          taskId: taskId,
          userId: userId,
          clientWeight: newClientWeight,
          clientSatisfaction: newSatisfaction,
        },
        select: {
          clientWeight: true,
          clientSatisfaction: true,
        },
      });
    }

    // Devolver los valores actualizados
    return NextResponse.json(
      {
        message: "Task updated successfully",
        rating: {
          clientWeight: updatedRating?.clientWeight,
          clientSatisfaction: updatedRating?.clientSatisfaction,
        },
      },
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
