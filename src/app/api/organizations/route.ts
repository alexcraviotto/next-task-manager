import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log("🚀 ~ POST ~ session:", JSON.stringify(session));

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, weight, effortLimit }: { name: string; weight?: number, effortLimit: number } =
      await req.json();


    if (weight !== undefined && (weight < 0 || weight > 5)) {
      return NextResponse.json(
        { message: "Weight must be between 0 and 5" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 },
      );
    }
    const existingUser = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
    });
    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const existingOrganization = await prisma.organization.findUnique({
      where: { name },
    });

    if (existingOrganization) {
      return NextResponse.json({ message: "Name exists" }, { status: 400 });
    }

    const newOrganization = await prisma.organization.create({
      data: { name, createdById: existingUser.id, effort_limit: effortLimit },
    });
    await prisma.userOrganization.create({
      data: {
        userId: existingUser.id,
        organizationId: newOrganization.id,
        weight: weight ?? 0,
      
      },
    });

    return NextResponse.json(
      { message: "Success", organization: newOrganization },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (id) {
      const organization = await prisma.organization.findFirst({
        where: {
          id,
          users: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          tasks: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
              taskRatings: {
                where: {
                  userId: user.id,
                },
                select: {
                  clientSatisfaction: true,
                  clientWeight: true,
                  effort: true,
                },
              },
              dependencies: true,
              dependentOn: true,
            },
          },
          users: {
            include: {
              User: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!organization) {
        return NextResponse.json(
          { message: "Organization not found" },
          { status: 404 },
        );
      }

      // Cálculo del progreso total
      let totalProgress = 0;
      const tasks = organization.tasks;

      if (tasks.length > 0) {
        // Suma todos los progresos y divide por el número total de tareas
        totalProgress =
          tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length;
      }

      // Crear un objeto con la información de la organización y el progreso total
      const organizationWithProgress = {
        ...organization,
        totalProgress: parseFloat(totalProgress.toFixed(2)), // Redondear a 2 decimales
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task) => task.progress === 100).length,
        inProgressTasks: tasks.filter(
          (task) => task.progress > 0 && task.progress < 100,
        ).length,
        pendingTasks: tasks.filter((task) => task.progress === 0).length,
      };

      return NextResponse.json(organizationWithProgress);
    } else {
      const organizations = await prisma.organization.findMany({
        where: {
          users: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          tasks: true, // Incluir tareas para calcular el progreso
        },
      });

      // Calcular el progreso para cada organización
      const organizationsWithProgress = organizations.map((org) => {
        let totalProgress = 0;
        if (org.tasks.length > 0) {
          console.log(org.tasks);
          totalProgress =
            org.tasks.reduce((sum, task) => sum + task.progress, 0) /
            org.tasks.length;
          console.log(totalProgress);
        }

        return {
          ...org,
          totalProgress: parseFloat(totalProgress.toFixed(2)),
          totalTasks: org.tasks.length,
          completedTasks: org.tasks.filter((task) => task.progress === 100)
            .length,
          inProgressTasks: org.tasks.filter(
            (task) => task.progress > 0 && task.progress < 100,
          ).length,
          pendingTasks: org.tasks.filter((task) => task.progress === 0).length,
        };
      });

      return NextResponse.json(organizationsWithProgress);
    }
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
