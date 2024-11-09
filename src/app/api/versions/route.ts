"use server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user === undefined) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { organizationId, versionNumber } = await req.json();

  if (!organizationId || !versionNumber) {
    return NextResponse.json(
      { message: "Invalid parameters" },
      { status: 400 },
    );
  }

  const userId = Number(session.user.id);

  const userInOrg = await prisma.userOrganization.findFirst({
    where: { userId, organizationId },
  });

  if (!userInOrg) {
    return NextResponse.json(
      { message: "Forbidden: User does not belong to this organization" },
      { status: 403 },
    );
  }

  try {
    const newVersion = await prisma.version.create({
      data: {
        organizationId,
        versionNumber,
      },
    });

    const tasks = await prisma.task.findMany({
      where: { organizationId },
    });

    const versionTasks = tasks.map((task) => ({
      versionId: newVersion.id,
      taskId: task.id,
    }));

    await prisma.versionTask.createMany({
      data: versionTasks,
    });

    return NextResponse.json({ version: newVersion }, { status: 200 });
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { message: "Error creating version" },
      { status: 400 },
    );
  }
}
