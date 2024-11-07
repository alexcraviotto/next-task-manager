import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

// Mock de proyectos
const availableProjects = [
  {
    id: "b5afb04a-dc30-4443-b9e6-0ba3f3fe4412",
    title: "Meta Inc.",
  },
  {
    id: "4e1daa8a-7a1f-45fc-ae75-ea50cc5a7497",
    title: "Universidad De Almería",
  },
];

export default withAuth(
  async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
      pathname.includes(".png") ||
      pathname.includes(".xml") ||
      pathname.includes(".jpg") ||
      pathname.includes(".jpeg") ||
      pathname.includes(".svg") ||
      pathname.includes(".gif") ||
      pathname.includes(".webp") ||
      pathname.includes(".ico") ||
      pathname.includes(".mp3") ||
      pathname.includes("api")
    ) {
      return NextResponse.next();
    }

    const projectId = pathname.split("/")[3];

    if (pathname === "/dashboard/projects" && !projectId) {
      const defaultProjectId = availableProjects[0].id;
      return NextResponse.redirect(
        new URL(`/dashboard/projects/${defaultProjectId}`, request.url),
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        if (!token) return false;

        const expiration = token.exp as number;
        if (expiration && Date.now() / 1000 > expiration) {
          if (pathname.includes("/dashboard")) {
            return false;
          }
        }
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next).*)"],
};
