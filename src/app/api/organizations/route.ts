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

  const { name }: { name: string } = await req.json();

  if (!name) {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }
  const existingUser = await prisma.user.findUnique({
    where: {
      email: session.user.email!,
    },
  });
  if (!existingUser) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Check if organization name already exists
  const existingOrganization = await prisma.organization.findUnique({
    where: { name },
  });

  if (existingOrganization) {
    return NextResponse.json({ message: "Name exists" }, { status: 400 });
  }

  // Create new organization
  const newOrganization = await prisma.organization.create({
    data: { name, createdById: existingUser.id },
  });

  return NextResponse.json(
    { message: "Success", organization: newOrganization },
    { status: 200 },
  );
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
      // Get specific organization with its tasks
      const organization = await prisma.organization.findFirst({
        where: {
          id: parseInt(id),
          users: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          tasks: {
            include: {
              taskRatings: true,
              dependencies: true,
              dependentOn: true,
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

      return NextResponse.json(organization);
    } else {
      // Get all organizations for this user
      const organizations = await prisma.organization.findMany({
        where: {
          users: {
            some: {
              userId: user.id,
            },
          },
        },
      });
      return NextResponse.json(organizations);
    }
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
