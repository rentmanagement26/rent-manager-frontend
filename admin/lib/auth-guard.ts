import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import type { SessionUser } from "@/lib/types";

export const HOME_PATH = "/overview";

// Call in layouts, pages and server actions of the signed-in area.
export async function requireAdmin(): Promise<SessionUser & { backendToken: string }> {
  const session = await getSession();
  if (!session?.backendToken) {
    redirect("/login");
  }
  return session as SessionUser & { backendToken: string };
}
