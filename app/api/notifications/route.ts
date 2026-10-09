import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SessionExpiredError } from "@/lib/api-error";
import { getSession } from "@/lib/get-session";
import { getMyNotifications } from "@/lib/notifications-api";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.backendToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadOnly = request.nextUrl.searchParams.get("unreadOnly") === "true";

  try {
    return NextResponse.json(await getMyNotifications(session.backendToken, unreadOnly));
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't load notifications." }, { status: 502 });
  }
}
