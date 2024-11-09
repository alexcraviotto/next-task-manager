"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  //const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const session = await getServerSession(authOptions);
  console.log(session);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user === undefined) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, description, type, startDate, endDate, organizationId } =
    await req.json();
  if (
    !name ||
    !description ||
    !type ||
    !startDate ||
    !endDate ||
    !organizationId
  ) {
    console.log(name, description, type, startDate, endDate, organizationId);
    console.log("Invalid parameters");
    return NextResponse.json(
      { message: "Invalid parameters" },
      { status: 400 },
    );
  }
  const userId = Number(session.user.id);

  if (session.user.isAdmin === false) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        name,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        organizationId,
        createdById: userId,
        progress: 0,
      },
    });
    return NextResponse.json({ task: newTask }, { status: 200 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ message: "Invalid data" }, { status: 400 });
  }
}
