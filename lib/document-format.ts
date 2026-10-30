// Plain words and colours for document statuses, and the browser-side upload of a file to the address the backend gives.
import type { LeaseDocument } from "@/lib/document-types";

// "AwaitingTenants" -> label and the pill colours (our existing Tailwind tokens).
export const STATUS_LABELS: Record<LeaseDocument["status"], { label: string; className: string }> = {
  Draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  AwaitingLandlord: { label: "Waiting for your signature", className: "bg-accent-tint text-accent-dark" },
  AwaitingTenants: { label: "Waiting for tenants", className: "bg-amber-50 text-amber-700" },
  Completed: { label: "Fully signed", className: "bg-green-50 text-green-700" },
  Declined: { label: "Declined", className: "bg-red-50 text-red-700" },
  Withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-600" },
  Expired: { label: "Expired", className: "bg-red-50 text-red-700" },
};

// Whether the lease can still be signed or changed: not finished, declined, withdrawn or expired.
export function isOpen(status: LeaseDocument["status"]): boolean {
  return status === "Draft" || status === "AwaitingLandlord" || status === "AwaitingTenants";
}

// Browser-side: puts the file at the temporary address the backend made. Throws a message safe to show.
export async function putToStorage(uploadUrl: string, file: File): Promise<void> {
  // Give up after 90 seconds so a stalled connection shows a message instead of "Uploading…" forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": file.type || "application/pdf" },
      body: file,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("The file could not be uploaded. Try again.");
  } catch (err) {
    if (controller.signal.aborted) throw new Error("The upload took too long. Check your connection and try again.");
    throw err instanceof Error ? err : new Error("The file could not be uploaded. Try again.");
  } finally {
    clearTimeout(timer);
  }
}
