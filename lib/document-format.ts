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

// The label for a lease document. "Waiting for your signature" only fits until the landlord has signed; after that the lease is ready to send.
// landlordSigned is true when the landlord's own signature is recorded (for a list row: at least one signature while it is still unsent).
export function statusFor(status: LeaseDocument["status"], landlordSigned: boolean): { label: string; className: string } {
  if (status === "AwaitingLandlord" && landlordSigned) return { label: "Ready to send", className: "bg-green-50 text-green-700" };
  return STATUS_LABELS[status];
}

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

// Plain words for each file the backend offers for a document (GET /documents/{id}/downloads). Landlord and tenant see different subsets.
const DOWNLOAD_LABELS: Record<string, string> = {
  Original: "The lease (original PDF)",
  PrintCopy: "Print copy with page stamps (for signing on paper)",
  FinalCopy: "Final signed PDF with the signing record",
  LandlordSignedCopy: "The landlord's signed copy (scan)",
  TenantSignedCopy: "A tenant's signed copy (scan)",
};

export function downloadLabel(kind: string): string {
  return DOWNLOAD_LABELS[kind] ?? kind;
}

// Our file route address for one download. The route fetches the file with the signed-in person's access, so no storage address is exposed.
export function downloadHref(documentId: number, kind: string, copyId: number | null): string {
  return `/api/documents/${documentId}/file?kind=${encodeURIComponent(kind)}${copyId !== null ? `&copyId=${copyId}` : ""}&download=1`;
}
