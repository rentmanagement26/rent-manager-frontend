import { backendUrl } from "@/lib/env";
export async function backendFetch(
  path: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${backendUrl()}${path}`, {
    // Give up after 30 seconds so a hung backend shows an error instead of an endless spinner.
    signal: AbortSignal.timeout(30_000),
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}