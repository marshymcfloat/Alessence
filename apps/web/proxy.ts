import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("access_token")?.value;

  const isPublicPath = path === "/";

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.sub;

      if (isPublicPath) {
        if (userId && typeof userId === "string") {
          const dashboardUrl = new URL(`/${userId}/dashboard`, req.url);
          return NextResponse.redirect(dashboardUrl);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("JWT Verification failed:", error.message);
      } else {
        console.error("An unexpected error occurred:", error);
      }

      const response = NextResponse.redirect(new URL("/", req.url));
      response.cookies.delete("access_token");
      return response;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
