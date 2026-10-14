import type { ApiResult } from "@/lib/types";

export async function backendFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`${process.env.BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

// GET a JSON resource and turn every outcome into an ApiResult, so pages can show a friendly state instead of crashing.
export async function getJson<T>(path: string, token: string): Promise<ApiResult<T>> {
  try {
    const response = await backendFetch(path, token, { cache: "no-store" });
    if (response.status === 401) return { status: "expired" };
    if (response.status === 403) return { status: "forbidden" };
    if (!response.ok) return { status: "error" };
    return { status: "ok", data: (await response.json()) as T };
  } catch {
    return { status: "error" };
  }
}
