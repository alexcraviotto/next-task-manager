import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

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

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        if (!token) {
          return false;
        }

        const expiration = token.exp as number;
        if (expiration && Date.now() / 1000 > expiration) {
          if (pathname.includes("/dashboard")) {
            console.log("Token expirado o inexistente.");
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
