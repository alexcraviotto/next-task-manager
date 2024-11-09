"use server";
import { prisma } from "@/lib/database";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Invalid parameters" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea el usuario en la base de datos
    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // Genera un codigo de confirmación
    const confirmationCode = Math.floor(100000 + Math.random() * 900000);

    // Configura el transporter para nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nexttaskmanager@gmail.com", // El correo del remitente
        pass: process.env.GMAIL_APP_PASSWORD, // contrasena de aplicacion de Gmail
      },
    });

    // Configura el contenido del correo
    const mailOptions = {
      from: "nexttaskmanager@gmail.com", // El remitente
      to: email, // El correo del usuario registrado
      subject: "Confirmación de Registro",
      text: `Hola ${username}, tu código de confirmación es: ${confirmationCode}`,
    };

    // Enviar el correo
    try {
      await transporter.sendMail(mailOptions);
      console.log("Correo enviado con éxito");
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
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
