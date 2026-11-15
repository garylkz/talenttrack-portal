import { ADMIN_COOKIE_NAME } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
