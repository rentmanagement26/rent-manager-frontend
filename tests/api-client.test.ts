// Checks for lib/api-client.ts: the shared helper builds the URL from the validated setting, sends the token and has a timeout.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/lib/api-client";

describe("backendFetch", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_API_URL", "http://localhost:5156/");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls the backend with the bearer token and a timeout signal", async () => {
    await backendFetch("/api/v1/properties", "abc");
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://localhost:5156/api/v1/properties");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer abc");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("fails clearly when BACKEND_API_URL is missing", async () => {
    vi.stubEnv("BACKEND_API_URL", "");
    await expect(backendFetch("/x", "t")).rejects.toThrow("BACKEND_API_URL is not set");
  });
});
