"use server";
import { prisma } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: "User is not authenticated or email is missing" },
        { status: 401 },
      );
    }

    const email = session.user.email;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        otps: {
          where: {
            isUsed: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verificar si el usuario ha confirmado su correo
    if (!user.isVerified) {
      return NextResponse.json(
        { verified: false, otp: user.otps[0]?.code },
        { status: 200 },
      );
    }

    return NextResponse.json({ verified: true }, { status: 200 });
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
    // Extraer el email y el código OTP desde el cuerpo de la solicitud
    const { email, otpCode } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json(
        { message: "Email and OTP code are required" },
        { status: 400 },
      );
    }

    // Buscar al usuario por email e incluir sus OTPs
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        otps: {
          where: {
            code: otpCode,
            isUsed: false, // Verificar que el OTP no ha sido utilizado
            expiresAt: { gt: new Date() }, // Verificar que el OTP no ha expirado
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || user.otps.length === 0) {
      return NextResponse.json(
        { message: "Invalid OTP or user not found" },
        { status: 400 },
      );
    }

    // Actualizar el estado del usuario a verificado
    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

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
