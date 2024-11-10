"use server";
import { prisma } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { email } = await req.json(); // Recibe el email del query string

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    // Buscar el usuario asociado al email
    const user = await prisma.user.findUnique({
      where: {
        email: String(email),
      },
      include: {
        otps: {
          where: {
            isUsed: false, // OTP no ha sido usado aun
            expiresAt: {
              gt: new Date(), // Solo obtener OTPs no expirados
            },
          },
          orderBy: {
            createdAt: "desc", // Ordenamos por createdAt en orden descendente
          },
          take: 1, // Solo tomamos el OTP mas reciente
        },
      },
    });

    if (!user || user.otps.length === 0) {
      return NextResponse.json(
        { message: "No valid OTP found for this email" },
        { status: 404 },
      );
    }

    // Obtener el codigo OTP de la primera coincidencia (que sera el mas reciente)
    const otpRecord = user.otps[0];

    return NextResponse.json({ otp: otpRecord.code }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving OTP:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
