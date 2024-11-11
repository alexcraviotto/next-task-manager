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

    const taskRating = await prisma.taskRating.findFirst({
      where: {
        taskId: taskId,
      },
      select: {
        effort: true,
        clientWeight: true,
        clientSatisfaction: true,
      },
    });

    return NextResponse.json(
      taskRating || {
        effort: 0,
        clientWeight: 0,
        clientSatisfaction: 0,
      },
    );
  } catch (error) {
    console.error("Error fetching task rating:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
