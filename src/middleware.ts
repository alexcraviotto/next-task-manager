import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

// Definir rutas públicas
const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/signin",
  "/api/auth/signin",
];

// Definir extensiones de archivos públicos
const publicFileExtensions = [
  ".png",
  ".xml",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".ico",
  ".mp3",
];

export default withAuth(
  async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log("🚀 ~ middleware ~ pathname:", pathname);

    // Permitir acceso a rutas de optimización de imágenes de Next.js
    if (pathname.startsWith("/_next/image")) {
      return NextResponse.next();
    }

    // Permitir acceso a la carpeta public y archivos estáticos
    if (
      pathname.startsWith("/public") ||
      publicFileExtensions.some((ext) => pathname.includes(ext)) ||
      pathname.includes("api")
    ) {
      return NextResponse.next();
    }

    // Permitir rutas públicas
    if (publicPaths.includes(pathname)) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Permitir acceso a carpeta public y rutas públicas sin token
        if (pathname.startsWith("/public") || publicPaths.includes(pathname)) {
          return true;
        }

        if (!token) return false;

        const expiration = token.exp as number;
        if (expiration && Date.now() / 1000 > expiration) {
          if (pathname.includes("/dashboard")) {
            return false;
          }
        }

        // Redirigir si el usuario no es administrador y está en /dashboard/organizations/[uuid]
        if (
          !token.isAdmin &&
          /^\/dashboard\/organizations\/[^/]+$/.test(pathname)
        ) {
          return false;
        }

        return true;
      },
    },
    pages: {
      signIn: "/auth/login", // Redirigir a tu página de login personalizada
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
