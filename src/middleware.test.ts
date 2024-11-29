/* eslint-disable @typescript-eslint/ban-ts-comment */

import middleware from "./middleware";
import { NextResponse } from "next/server";
import { NextURL } from "next/dist/server/web/next-url";
import { NextRequestWithAuth } from "next-auth/middleware";

// Consolidated mock for next/server
jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn().mockImplementation((url) => ({ url })),
    next: jest.fn().mockImplementation(() => ({ type: "next" })),
  },
}));

// Mock NextAuth
jest.mock("next-auth/middleware", () => ({
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  withAuth: (fn: any) => fn,
}));

describe("Middleware Organization Access Control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect non-member users trying to access organization", () => {
    // Mock de la request con una URL de organización
    const request = {
      nextUrl: new NextURL(
        "http://localhost:3000/dashboard/organization/123/tasks",
      ),
      nextauth: {
        token: {
          email: "test@test.com",
          id: "1",
          isVerified: true,
          isAdmin: false,
          // No incluimos membresía a la organización
          organizations: [],
        },
      },
    };
    // @ts-ignore
    middleware(request, {});

    // Verificar que se redirige al dashboard
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard/organization"),
    );
  });
});

describe("Middleware - Unauthorized Access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper para crear requests mock
  const createMockRequest = (pathname: string) => {
    return {
      nextUrl: {
        pathname,
        origin: "http://localhost:3000",
        href: `http://localhost:3000${pathname}`,
      },
      nextauth: {
        token: null, // Simula usuario no autenticado
      },
    } as unknown as NextRequestWithAuth;
  };

  test("debería denegar acceso a rutas protegidas", () => {
    const protectedRoutes = [
      "/dashboard/organization",
      "/dashboard/organization/123/tasks",
      "/dashboard/settings",
    ];

    protectedRoutes.forEach((route) => {
      const req = createMockRequest(route);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      middleware(req, {} as any);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        "http://localhost:3000/auth/login",
      );
    });
  });

  test("debería permitir acceso a rutas públicas", () => {
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/register",
      "/api/auth/signin",
    ];

    publicRoutes.forEach((route) => {
      const req = createMockRequest(route);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      middleware(req, {} as any);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  test("debería permitir acceso a rutas públicas", () => {
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/register",
      "/auth/confirm-email",
      "/api/auth/signin",
    ];

    publicRoutes.forEach((route) => {
      const req = createMockRequest(route);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      middleware(req, {} as any);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  test("debería redirigir a login desde rutas protegidas del dashboard", () => {
    const protectedRoutes = [
      "/dashboard/organization",
      "/dashboard/organization/123",
      "/dashboard/organization/123/tasks",
    ];

    protectedRoutes.forEach((route) => {
      const req = createMockRequest(route);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      middleware(req, {} as any);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        "http://localhost:3000/auth/login",
      );
    });
  });

  test("debería permitir acceso a recursos estáticos", () => {
    const staticRoutes = [
      "/_next/static/chunks/main.js",
      "/public/images/logo.png",
      "/favicon.ico",
    ];

    staticRoutes.forEach((route) => {
      const req = createMockRequest(route);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      middleware(req, {} as any);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  test("debería permitir acceso a rutas de API", () => {
    const apiRoutes = ["/api/health", "/api/public/data", "/api/auth/login"];

    apiRoutes.forEach((route) => {
      const req = createMockRequest(route);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      middleware(req, {} as any);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });
});
