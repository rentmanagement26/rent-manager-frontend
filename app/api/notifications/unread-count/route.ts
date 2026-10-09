import { NextResponse } from "next/server";
import { SessionExpiredError } from "@/lib/api-error";
import { getSession } from "@/lib/get-session";
import { getUnreadNotificationCount } from "@/lib/notifications-api";

export async function GET() {
  const session = await getSession();
  if (!session?.backendToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ count: await getUnreadNotificationCount(session.backendToken) });
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't load notifications." }, { status: 502 });
  }
}
