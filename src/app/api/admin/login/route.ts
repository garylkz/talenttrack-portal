import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" ||
      request.nextUrl.protocol === "https:";
    const token = createAdminSessionToken();
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Failed to process sign-in request." },
      { status: 500 }
    );
  }
}
