"use server";
import { prisma } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    console.log("Iniciando solicitud GET para verificación de email");
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.log("No hay sesión o email del usuario");
      return NextResponse.json(
        { message: "User is not authenticated or email is missing" },
        { status: 401 },
      );
    }

    const email = session.user.email;
    console.log("Email del usuario:", email);

    // Verificamos si el usuario existe y su estado
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("Usuario no encontrado");
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    if (user.isVerified) {
      console.log("Usuario ya verificado");
      return NextResponse.json(
        { verified: true },
        { status: 200 },
      );
    }

    // Si no está verificado, generamos nuevo OTP sin importar si hay anteriores
    console.log("Usuario no verificado, generando nuevo código");
    const confirmationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Marcar todos los OTPs anteriores como usados
    await prisma.oTP.updateMany({
      where: {
        email,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Crear nuevo OTP
    const newOtp = await prisma.oTP.create({
      data: {
        code: confirmationCode,
        email,
        isUsed: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    });
    console.log("Nuevo OTP creado:", JSON.stringify(newOtp));

    // Configurar el transporter para nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nexttaskmanager@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Configurar el contenido del correo
    const mailOptions = {
      from: "nexttaskmanager@gmail.com",
      to: email,
      subject: "Confirmación de Email",
      text: `Hola ${user.username}, tu código de confirmación es: ${confirmationCode}`,
    };

    // Enviar el correo
    try {
      await transporter.sendMail(mailOptions);
      console.log("Correo enviado exitosamente");
    } catch (error) {
      console.error("Error al enviar correo:", error);
      return NextResponse.json(
        { message: "Error sending email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { verified: false, otp: confirmationCode },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error retrieving OTP:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Iniciando solicitud POST para verificación de email");
    const { email, otpCode } = await req.json();
    console.log("Email:", email, "OTP Code:", otpCode);

    if (!email || !otpCode) {
      console.log("Faltan email u OTP code");
      return NextResponse.json(
        { message: "Email and OTP code are required" },
        { status: 400 },
      );
    }

    // Buscar el último OTP no usado del usuario
    const latestOtp = await prisma.oTP.findFirst({
      where: {
        email,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: "desc"
      },
    });

    console.log("Último OTP encontrado:", JSON.stringify(latestOtp));

    if (!latestOtp || latestOtp.code !== otpCode) {
      console.log("OTP inválido o no encontrado");
      return NextResponse.json(
        { message: "Invalid OTP or user not found" },
        { status: 400 },
      );
    }

    // Marcar el OTP como usado y actualizar el usuario en una transacción
    await prisma.$transaction([
      prisma.oTP.update({
        where: { id: latestOtp.id },
        data: { isUsed: true }
      }),
      prisma.user.update({
        where: { email },
        data: { isVerified: true },
      })
    ]);

    console.log("Email verificado exitosamente");
    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
