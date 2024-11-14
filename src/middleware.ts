import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

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
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const { origin } = request.nextUrl;
    const token = request.nextauth.token;

    // Permitir acceso a recursos estáticos y API
    if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/public") ||
      publicFileExtensions.some((ext) => pathname.includes(ext)) ||
      pathname.includes("api")
    ) {
      return NextResponse.next();
    }

    // Redirigir desde páginas de auth al dashboard si está autenticado
    if (pathname.startsWith("/auth/") && token) {
      return NextResponse.redirect(`${origin}/dashboard/organization`);
    }

    // Redirigir usuarios no autenticados al login
    if (pathname.startsWith("/dashboard") && !token) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    // Corregir la redirección de la ruta base de una organización a /tasks usando URL absoluta
    if (
      pathname.match(/^\/dashboard\/organization\/[^/]+$/) &&
      !pathname.endsWith("/tasks")
    ) {
      const url = new URL(pathname + "/tasks", origin);
      return NextResponse.redirect(url);
    }

    // Corregir redirección de usuarios no admin usando URL absoluta
    if (
      !token?.isAdmin &&
      pathname.includes("/dashboard/organization/") &&
      (pathname.includes("/members") ||
        pathname.includes("/gantt") ||
        pathname.includes("/versions"))
    ) {
      const orgId = pathname.split("/")[3];
      const url = new URL(`/dashboard/organization/${orgId}/tasks`, origin);
      return NextResponse.redirect(url);
    }

    // Permitir el resto de las rutas
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Permitir rutas públicas
        if (
          pathname.startsWith("/public") ||
          publicPaths.includes(pathname) ||
          pathname.startsWith("/_next/")
        ) {
          return true;
        }

        // Requerir autenticación para rutas del dashboard
        if (pathname.startsWith("/dashboard")) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: "/auth/login",
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
