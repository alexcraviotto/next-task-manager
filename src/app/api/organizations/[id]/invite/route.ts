import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.email || !session.user.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(req.url).searchParams;
  const username = searchParams.get("username");
  const organizationId = req.url.split("/")[4];

  if (!username || !organizationId) {
    return NextResponse.json(
      { message: "Username and organizationId are required" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: { username },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error searching user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email || !session.user.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, organizationId } = await req.json();

    if (!userId || !organizationId) {
      return NextResponse.json(
        { message: "Invalid parameters" },
        { status: 400 },
      );
    }

    const existingUserOrganization = await prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });

    if (existingUserOrganization) {
      return NextResponse.json(
        { message: "User is already a member of this organization" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nexttaskmanager@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: "nexttaskmanager@gmail.com",
      to: user.email,
      subject: `Invitación a unirte a la organización ${organization.name}`,
      text: `Hola ${user.username},\n\nTe hemos invitado a unirte a la organización "${organization.name}". Por favor, revisa tu cuenta para ver más detalles.`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Correo de invitación enviado con éxito");

    return NextResponse.json(
      { message: "User invited successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
