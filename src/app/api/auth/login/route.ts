import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL    = "edwinsyah23032003@gmail.com";
const ADMIN_PASSWORD = "Ootsukikaguya23";
const AUTH_COOKIE    = "norra_admin_auth";
const AUTH_TOKEN     = "norra_admin_authenticated_v1";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, AUTH_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
