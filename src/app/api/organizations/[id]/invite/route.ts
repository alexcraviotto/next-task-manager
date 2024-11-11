import { prisma } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Añadir el método GET para búsqueda de usuarios
export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const username = searchParams.get("username");
  const organizationId = req.url.split("/")[4]; // Esto asume que la URL es algo como /api/organizations/{organizationId}/invite

  if (!username || !organizationId) {
    return NextResponse.json(
      { message: "Username and organizationId are required" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: { username: username },
      select: {
        id: true,
        email: true,
        username: true,
      },
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

// Mantener el método POST existente sin cambios
export async function POST(req: NextRequest) {
  try {
    const { userId, organizationId /*weight = 0 */ } = await req.json();

    if (!userId || !organizationId) {
      return NextResponse.json(
        { message: "Invalid parameters" },
        { status: 400 },
      );
    }

    // Verifica si el usuario ya está asociado con la organización
    const existingUserOrganization = await prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });

    if (existingUserOrganization) {
      return NextResponse.json(
        { message: "User is already a member of this organization" },
        { status: 400 },
      );
    }

    /*// Crea la relación de usuario con la organización
    const userOrganization = await prisma.userOrganization.create({
      data: {
        userId,
        organizationId,
        weight,
      },
    });*/

    // Obtiene el usuario para enviarle la invitación
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Obtén el nombre de la organización
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    // Configura el transporter para nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nexttaskmanager@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Configura el contenido del correo
    const mailOptions = {
      from: "nexttaskmanager@gmail.com",
      to: user.email,
      subject: `Invitación a unirte a la organización ${organization.name}`,
      text: `Hola ${user.username},\n\nTe hemos invitado a unirte a la organización "${organization.name}". Por favor, revisa tu cuenta para ver más detalles.`,
    };

    // Enviar el correo
    try {
      await transporter.sendMail(mailOptions);
      console.log("Correo de invitación enviado con éxito");
    } catch (error) {
      console.error("Error al enviar correo de invitación:", error);
    }

    // Respuesta con éxito y código 200
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
