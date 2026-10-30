// Streams a lease file to the signed-in landlord or tenant, so the in-page viewer and Download links never need the storage address.
// Why a proxy: the backend gives short-lived storage addresses, and reading them straight from the browser would depend on the storage
// account's cross-origin settings. Fetching here, on the server, avoids that and keeps the address private.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SessionExpiredError } from "@/lib/api-error";
import { getDownloads } from "@/lib/document-api";
import { getSession } from "@/lib/get-session";

// The type to serve, decided by our own rule from the file name, never from what the uploader's browser said. A tenant or landlord can
// upload a file and the other party opens it, so serving a stored "text/html" would run it on our site. Unknown types are only ever downloaded.
function safeType(fileName: string): { type: string; inlineOk: boolean } {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return { type: "application/pdf", inlineOk: true };
  if (extension === "jpg" || extension === "jpeg") return { type: "image/jpeg", inlineOk: true };
  if (extension === "png") return { type: "image/png", inlineOk: true };
  return { type: "application/octet-stream", inlineOk: false };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.backendToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const documentId = Number(id);
  if (!Number.isInteger(documentId) || documentId <= 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Which file: Original (default), PrintCopy, FinalCopy, LandlordSignedCopy or TenantSignedCopy (with copyId).
  const kind = request.nextUrl.searchParams.get("kind") ?? "Original";
  const copyId = request.nextUrl.searchParams.get("copyId");

  try {
    const downloads = await getDownloads(session.backendToken, documentId);
    const file = downloads.find((d) => d.kind === kind && (copyId === null || String(d.copyId) === copyId));
    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const upstream = await fetch(file.url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Couldn't open the file." }, { status: 502 });
    }

    const { type, inlineOk } = safeType(file.fileName);
    const inline = inlineOk && request.nextUrl.searchParams.get("download") !== "1";
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "X-Content-Type-Options": "nosniff",
        // Images and downloads get a locked-down policy. A PDF is left without one on purpose: a sandbox policy stops the browser's own
        // PDF viewer from opening it. A PDF served as application/pdf with nosniff cannot run as a web page.
        ...(type === "application/pdf" ? {} : { "Content-Security-Policy": "sandbox; default-src 'none'" }),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't open the file." }, { status: 502 });
  }
}
