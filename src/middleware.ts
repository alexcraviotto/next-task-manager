import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Definir rutas públicas
const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/confirm-email",
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

    // First check: API routes and static resources
    if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/public") ||
      pathname.startsWith("/api/") ||
      (publicFileExtensions.some((ext) => pathname.includes(ext)) && !token)
    ) {
      return NextResponse.next();
    }

    // Second check: Auth redirects
    if (token?.isVerified) {
      // Redirect from auth pages to dashboard if verified
      if (pathname.startsWith("/auth/")) {
        return NextResponse.redirect(`${origin}/dashboard/organization`);
      }
    }

    // Third check: Dashboard access protection
    if (pathname.startsWith("/dashboard") && !token) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    // Corregir la redirección de la ruta base de una organización a /tasks usando URL absoluta
    if (
      pathname.match(/^\/dashboard\/organization\/[^/]+$/) &&
      !pathname.endsWith("/tasks") &&
      !token?.isAdmin
    ) {
      const url = new URL(pathname + "/tasks", origin);
      return NextResponse.redirect(url);
    }

    // Verificar acceso a organización
    if (pathname.includes("/dashboard/organization/")) {
      const organizationId = pathname.split("/")[3];

      // Solo verificar acceso si no es una ruta de unirse o API
      if (!pathname.includes("/join") && !pathname.startsWith("/api")) {
        const userOrganizations = (token?.organizations || []) as {
          id: string;
        }[];
        const isMember = userOrganizations.some(
          (org) => org.id === organizationId,
        );

        if (!isMember && !token?.isAdmin) {
          return NextResponse.redirect(`${origin}/dashboard/organization`);
        }
      }
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
