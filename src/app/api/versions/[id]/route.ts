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
      include: {
        versionTasks: true,
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.versionTask.deleteMany({
        where: {
          versionId: version.id,
        },
      });

      await tx.version.delete({
        where: {
          id: version.id,
        },
      });
    });

    return NextResponse.json({
      message: "Version and related records deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting version:", error);
    return NextResponse.json(
      { error: "Error deleting version and related records" },
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

    // Obtener todas las versiones de la organización
    const allVersions = await prisma.version.findMany({
      where: {
        organizationId: version.organizationId,
      },
      include: {
        versionTasks: true,
      },
    });

    const targetVersionTaskCount = version.versionTasks.length;

    // Identificar versiones a eliminar (las que tienen más tareas)
    const versionsToDelete = allVersions.filter(
      (v) => v.versionTasks.length > targetVersionTaskCount,
    );

    const currentTasks = await prisma.task.findMany({
      where: {
        organizationId: version.organizationId,
      },
      include: {
        dependencies: true,
        dependentOn: true,
        versionTasks: true,
        taskRatings: true,
      },
    });

    await prisma.$transaction(async (tx) => {
      // Primero eliminar las versiones con más tareas
      for (const versionToDelete of versionsToDelete) {
        await tx.versionTask.deleteMany({
          where: {
            versionId: versionToDelete.id,
          },
        });

        await tx.version.delete({
          where: {
            id: versionToDelete.id,
          },
        });
      }

      const tasksToDelete = currentTasks.filter((task) => {
        const existsInTargetVersion = version.versionTasks.some(
          (vt) => vt.taskId === task.id,
        );
        return !existsInTargetVersion;
      });

      if (tasksToDelete.length > 0) {
        for (const task of tasksToDelete) {
          if (task.taskRatings.length > 0) {
            await tx.taskRating.deleteMany({
              where: {
                taskId: task.id,
              },
            });
          }

          if (task.versionTasks.length > 0) {
            await tx.versionTask.deleteMany({
              where: {
                taskId: task.id,
              },
            });
          }

          await tx.task.update({
            where: { id: task.id },
            data: {
              dependencies: {
                set: [],
              },
              dependentOn: {
                set: [],
              },
            },
          });
        }

        await tx.task.deleteMany({
          where: {
            id: {
              in: tasksToDelete.map((t) => t.id),
            },
          },
        });
      }

      const tasksToUpdate = currentTasks.filter((currentTask) => {
        const versionTask = version.versionTasks.find(
          (vt) => vt.taskId === currentTask.id,
        )?.Task;

        if (!versionTask) return false;

        return (
          currentTask.name !== versionTask.name ||
          currentTask.description !== versionTask.description ||
          currentTask.type !== versionTask.type ||
          currentTask.startDate.getTime() !==
            new Date(versionTask.startDate).getTime() ||
          currentTask.endDate.getTime() !==
            new Date(versionTask.endDate).getTime() ||
          currentTask.progress !== versionTask.progress
        );
      });

      for (const task of tasksToUpdate) {
        const versionTask = version.versionTasks.find(
          (vt) => vt.taskId === task.id,
        )!.Task;

        await tx.task.update({
          where: { id: task.id },
          data: {
            name: versionTask.name,
            description: versionTask.description,
            type: versionTask.type,
            startDate: versionTask.startDate,
            endDate: versionTask.endDate,
            progress: versionTask.progress,
          },
        });
      }

      const existingTaskIds = new Set(currentTasks.map((t) => t.id));
      const tasksToCreate = version.versionTasks
        .filter((vt) => !existingTaskIds.has(vt.taskId))
        .map((vt) => vt.Task);

      for (const task of tasksToCreate) {
        const newTask = await tx.task.create({
          data: {
            name: task.name,
            description: task.description,
            type: task.type,
            startDate: task.startDate,
            endDate: task.endDate,
            progress: task.progress,
            createdById: task.createdById,
            organizationId: version.organizationId,
          },
        });

        await tx.versionTask.create({
          data: {
            versionId: version.id,
            taskId: newTask.id,
          },
        });
      }

      // Eliminar la versión que se está aplicando
      await tx.versionTask.deleteMany({
        where: {
          versionId: version.id,
        },
      });

      await tx.version.delete({
        where: {
          id: version.id,
        },
      });
    });

    return NextResponse.json({
      message: "Version rollback completed successfully and versions deleted",
    });
  } catch (error) {
    console.error(error);
    console.error("Error applying version rollback:", error);
    return NextResponse.json(
      { error: "Error applying version rollback" },
      { status: 500 },
    );
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
    const versions = await prisma.version.findMany({
      where: {
        organizationId: id,
      },
      include: {
        versionTasks: {
          include: {
            Task: {
              select: {
                id: true,
                name: true,
                description: true,
                progress: true,
                type: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      versions: versions.map((version) => ({
        id: version.id,
        versionName: version.versionName,
        organizationId: version.organizationId,
        organizationName: version.organization.name,
        createdAt: version.createdAt,
        versionTasks: version.versionTasks.map((vt) => ({
          taskId: vt.taskId,
          Task: vt.Task,
        })),
      })),
    });
  } catch (error) {
    console.error("Error getting versions:", error);
    return NextResponse.json(
      { error: "Error getting versions" },
      { status: 500 },
    );
  }
}
