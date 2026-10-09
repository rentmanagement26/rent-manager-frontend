import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/auth-guard";
import { getSession } from "@/lib/get-session";

export default async function Home() {
  const session = await getSession();
  redirect(session?.backendToken ? HOME_PATH : "/login");
}
