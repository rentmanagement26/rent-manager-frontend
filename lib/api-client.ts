export async function backendFetch(
  path: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${process.env.BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}