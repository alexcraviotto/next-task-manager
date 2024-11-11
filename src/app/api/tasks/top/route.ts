import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get tasks with their ratings and calculate relevance
    const tasks = await prisma.task.findMany({
      where: { organizationId },
      include: {
        taskRatings: {
          include: {
            user: {
              include: {
                organizations: {
                  where: { organizationId },
                },
              },
            },
          },
        },
      },
    });

    if (!tasks.length) {
      return NextResponse.json({ error: "No tasks found" }, { status: 404 });
    }

    // Calculate relevance score for each task
    const tasksWithScore = tasks.map((task) => {
      const relevanceScore = task.taskRatings.reduce((score, rating) => {
        const clientWeight = rating.user.organizations[0]?.weight || 0;
        const satisfaction = rating.clientSatisfaction || 0;
        const effort = rating.effort || 1;

        // Formula: (client_weight * satisfaction) / effort
        return score + (clientWeight * satisfaction) / effort;
      }, 0);

      return {
        id: task.id,
        name: task.name,
        description: task.description,
        progress: task.progress,
        type: task.type,
        startDate: task.startDate,
        endDate: task.endDate,
        relevanceScore,
      };
    });

    // Sort by relevance score and get top 3
    const topTasks = tasksWithScore
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    return NextResponse.json(topTasks);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
