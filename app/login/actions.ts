"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // TODO: replace with a real backend call once it exists.
  if (email !== "admin@example.com" || password !== "password") {
    redirect("/login?error=1");
  }

  const user: SessionUser = {
    id: "1",
    email,
    name: "Alex Landlord",
    role: "admin",
  };

  const token = createSession(user);
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  redirect("/admin");
}