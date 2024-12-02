import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const updateRatingsSchema = z.object({
  organizationId: z.string(),
  newWeight: z.number().min(0).int(),
  userId: z.number(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // First check if body has required fields before validation
    if (!body.organizationId || !body.newWeight || !body.userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check user exists first
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      include: {
        taskRatings: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Finally validate the input data
    const { organizationId, newWeight, userId } =
      updateRatingsSchema.parse(body);

    // Obtenemos las diferentes filas del usuario en la tabla userOrganization
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organizationId,
        },
      },
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: "User not found in organization" },
        { status: 404 },
      );
    }
    // Si el peso del usuario ha cambiado, entonces cambia la satistfacion de las taskRating
    // Obtenemos el peso anterior del usuario
    const previousWeight = userOrg.weight;

    const updatedRatings = await Promise.all(
      user.taskRatings.map(async (rating) => {
        // Verificamos que la taskRating pertenezca a la organizacion
        if (rating.task.organizationId !== organizationId) {
          return null;
        }

        // Verificamos que los valores no sean null
        const currentSatisfaction = rating.clientSatisfaction ?? 0;
        const currentWeight = rating.clientWeight ?? 0;

        // Solo actualizamos si hay un peso actual
        if (currentWeight === 0) {
          return null;
        }

        let newSatisfaction =
          currentSatisfaction - previousWeight * currentWeight;
        newSatisfaction = newSatisfaction + newWeight * currentWeight;

        return prisma.taskRating.update({
          where: {
            id: rating.id,
          },
          data: {
            clientSatisfaction: newSatisfaction,
          },
          select: {
            id: true,
            taskId: true,
            clientSatisfaction: true,
            clientWeight: true,
          },
        });
      }),
    );

    // Filtramos los valores nulos
    const filteredRatings = updatedRatings.filter(
      (rating): rating is Exclude<typeof rating, null> => rating !== null,
    );

    // Actualizamos el peso del usuario en la organizacion
    await prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      data: { weight: newWeight },
    });

    return NextResponse.json(
      {
        message: "User weight and ratings updated successfully",
        weight: newWeight,
        updatedRatings: filteredRatings,
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
    console.error("Error updating ratings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
