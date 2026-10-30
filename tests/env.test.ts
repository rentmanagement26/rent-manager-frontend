// Checks for lib/env.ts: missing, malformed and unsafe configuration must fail with a clear message that never contains the value.
import { describe, expect, it } from "vitest";
import { checkBackendUrl, checkSessionSecret } from "@/lib/env";

describe("checkBackendUrl", () => {
  it("fails when missing", () => {
    expect(() => checkBackendUrl(undefined, false)).toThrow("BACKEND_API_URL is not set");
  });
  it("fails when not a URL", () => {
    expect(() => checkBackendUrl("not a url", false)).toThrow("not a valid URL");
  });
  it("allows http in development and strips a trailing slash", () => {
    expect(checkBackendUrl("http://localhost:5156/", false)).toBe("http://localhost:5156");
  });
  it("requires https in production", () => {
    expect(() => checkBackendUrl("http://api.example.com", true)).toThrow("https");
    expect(checkBackendUrl("https://api.example.com", true)).toBe("https://api.example.com");
  });
});

describe("checkSessionSecret", () => {
  it("fails when missing", () => {
    expect(() => checkSessionSecret("", false)).toThrow("SESSION_SECRET is not set");
  });
  it("rejects short or placeholder secrets in production, without printing them", () => {
    expect(() => checkSessionSecret("short-value", true)).toThrow("too weak");
    expect(() => checkSessionSecret("short-value", true)).not.toThrow(/short-value/);
    expect(() => checkSessionSecret("changeme".repeat(6), true)).toThrow("too weak");
  });
  it("accepts a long random secret in production and anything in development", () => {
    expect(checkSessionSecret("x7Qp9Lm2Vd8Rk4Wz1Nc6Hs3Ty5Bf0JaGe9UoXi2", true)).toHaveLength(39);
    expect(checkSessionSecret("dev", false)).toBe("dev");
  });
});
