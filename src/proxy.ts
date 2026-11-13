import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!authed && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (authed && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
