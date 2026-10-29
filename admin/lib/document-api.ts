// Backend calls for the Documents page (SuperAdmin only): where lease documents may be signed online, by province.
import { backendFetch, getJson } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";

const BASE = "/api/v1/admin/documents/provinces";

// One province or territory with its online-signing switch. A province that was never changed has no updatedAt.
export interface ProvinceSetting {
  code: string;
  name: string;
  onlineSigningEnabled: boolean;
  note: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

// All 13 provinces and territories, each with its switch.
export function getProvinceSettings(token: string) {
  return getJson<ProvinceSetting[]>(BASE, token);
}

// Switches online signing on or off for one province. The note is optional and at most 500 characters.
// Switching off takes effect at once, also for documents already sent. Throws with a message that is safe to show.
export async function setProvinceOnlineSigning(token: string, code: string, enabled: boolean, note: string): Promise<ProvinceSetting> {
  const response = await backendFetch(`${BASE}/${encodeURIComponent(code)}`, token, {
    method: "PUT",
    body: JSON.stringify({ Enabled: enabled, Note: note.trim() === "" ? null : note.trim() }),
  });
  if (response.ok) return response.json();
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 403) throw new Error("Your role can't change online signing.");

  // The backend answers { code, message } for the cases it explains (unknown province, note too long).
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) throw new Error(body.message);
  } catch (err) {
    if (err instanceof Error && err.message) throw err;
  }
  throw new Error("Couldn't save the change. Try again.");
}
