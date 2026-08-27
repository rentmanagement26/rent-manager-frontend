import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, getSessionUser } from "@/lib/session";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  return (await getSessionUser(token)) ?? null;
}