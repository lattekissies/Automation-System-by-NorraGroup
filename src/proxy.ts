import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "norra_admin_auth";
const AUTH_TOKEN  = "norra_admin_authenticated_v1";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: login page, auth API, static assets, webhook
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/webhook/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token !== AUTH_TOKEN) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
