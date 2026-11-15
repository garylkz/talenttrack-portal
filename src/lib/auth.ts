import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "tt_admin_session";

function getAdminPassword(): string {
  const configured = process.env.ADMIN_PASSWORD;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }
  return "admin123";
}

function computeSessionToken(password: string): string {
  return crypto
    .createHmac("sha256", `talenttrack-admin-v1:${password}`)
    .update("authenticated-admin-session")
    .digest("hex");
}

export function verifyAdminPassword(candidatePassword: string): boolean {
  const expected = getAdminPassword();
  const a = Buffer.from(candidatePassword);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function createAdminSessionToken(): string {
  return computeSessionToken(getAdminPassword());
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) {
    return false;
  }
  const expectedToken = createAdminSessionToken();
  const a = Buffer.from(cookie.value);
  const b = Buffer.from(expectedToken);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
