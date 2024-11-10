import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/database";

export async function DELETE() {
  try {
    // Verificamos la autenticación del usuario
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Desactivamos la cuenta del usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    await prisma.user.update({
      where: { id: user!.id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json(
      { message: "Account deactivated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deactivating account:", error);
    return NextResponse.json(
      { error: "Failed to deactivate account" },
      { status: 500 },
    );
  }
}
