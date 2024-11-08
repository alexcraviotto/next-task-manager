import { prisma } from "@/lib/database";
import { Prisma } from "@prisma/client";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Tipos
interface UpdateProfileRequest {
  username: string;
  email: string;
  password: string;
}

interface UpdateProfileResponse {
  message: string;
  user: {
    username: string;
    email: string;
  };
}

// Validaciones
const validateProfileData = async (
  data: UpdateProfileRequest,
  userId: number,
) => {
  const errors: string[] = [];

  // Validar formato de datos
  if (!data.username || data.username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("Invalid email format");
  }

  if (data.password && data.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // Validar unicidad de username y email
  try {
    const [existingUsername, existingEmail] = await Promise.all([
      prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: {
            id: userId,
          },
        },
      }),
      prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: {
            id: userId,
          },
        },
      }),
    ]);

    if (existingUsername) {
      errors.push("Username already taken");
    }

    if (existingEmail) {
      errors.push("Email already in use");
    }
  } catch (err: Error | unknown) {
    if (err instanceof Error) {
      console.error("Error checking username and email availability:", err);
      errors.push(
        `Error checking username and email availability: ${err.message}`,
      );
    } else {
      errors.push("Error checking username and email availability");
    }
  }

  return errors;
};

export async function PUT(request: NextRequest) {
  try {
    // Obtener el userId de la sesión actual
    const userId = 1; // Esto debería venir de tu sistema de autenticación

    // 1. Extraer datos del body
    const data: UpdateProfileRequest = await request.json();

    // 2. Validar datos
    const validationErrors = await validateProfileData(data, userId);
    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    // 3. Preparar datos para actualización. Inicialmente vacío para evitar errores de tipo
    // Prisma define su propia interfaz (tipo) para validar y suele ser muy estricto
    const updateData: Prisma.UserUpdateInput = {};

    // Añadir solo los campos que existen
    if (data.username) {
      updateData.username = data.username;
    }

    if (data.email) {
      updateData.email = data.email;
    }

    if (data.password) {
      updateData.password = await hash(data.password, 12);
    }

    // 4. Actualizar usuario en la base de datos
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        username: true,
        email: true,
        updatedAt: true,
      },
    });

    // 5. Devolver respuesta exitosa
    return NextResponse.json<UpdateProfileResponse>(
      {
        message: "Profile updated successfully",
        user: {
          username: updatedUser.username,
          email: updatedUser.email,
        },
      },
      { status: 200 },
    );
  } catch (err: Error | unknown) {
    if (err instanceof Error) {
      console.error("Profile update error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    } else {
      console.error("Profile update error");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  }
}
