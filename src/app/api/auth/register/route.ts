"use server";
import { prisma } from "@/lib/database";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password } = await req.json();

    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { message: "Parametros inválidos" },
        { status: 400 },
      );
    }

    let existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El email ya existe" },
        { status: 400 },
      );
    }

    existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El username ya existe" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea el usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword,
      },
    });

    // Genera un codigo de confirmacion
    const confirmationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // Almacena el codigo OTP en la base de datos
    await prisma.oTP.create({
      data: {
        code: confirmationCode,
        email,
        isUsed: false,
        expiresAt: new Date("2025-02-01T00:00:00Z"), // Establece una fecha predeterminada para cumplir con el esquema
        userId: user.id,
      },
    });

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
      to: email,
      subject: "Confirmación de Registro",
      text: `Hola ${username}, tu codigo de confirmación es: ${confirmationCode}`,
    };

    // Enviar el correo
    try {
      await transporter.sendMail(mailOptions);
      console.log("Correo enviado con exito");
    } catch (error) {
      console.error("Error al enviar correo:", error);
    }

    return NextResponse.json(
      { message: "Created, welcome :)" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
