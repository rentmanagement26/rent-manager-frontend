// Reads and checks the environment variables the app cannot run without, so a missing or unsafe value fails with a clear message
// instead of a confusing "undefined/api/..." request. Checked when first used (not at import) so `next build` does not need them.
// Messages name the variable but never print its value.

const MIN_SECRET_LENGTH = 32;

// "http://localhost:5156" is allowed in development only; production must use https.
export function checkBackendUrl(value: string | undefined, production: boolean): string {
  if (!value) {
    throw new Error("BACKEND_API_URL is not set. Copy .env.example to .env.local and fill it in.");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("BACKEND_API_URL is not a valid URL (it should look like https://api.example.com).");
  }
  if (production && url.protocol !== "https:") {
    throw new Error("BACKEND_API_URL must use https in production.");
  }
  // No trailing slash, because callers add "/api/v1/...".
  return value.replace(/\/+$/, "");
}

// The secret signs session cookies, so production needs a long, non-placeholder value.
export function checkSessionSecret(value: string | undefined, production: boolean): string {
  if (!value) {
    throw new Error("SESSION_SECRET is not set. Copy .env.example to .env.local and fill it in.");
  }
  if (production && (value.length < MIN_SECRET_LENGTH || /change.?me|secret|password/i.test(value))) {
    throw new Error(`SESSION_SECRET is too weak for production: use a random value of at least ${MIN_SECRET_LENGTH} characters.`);
  }
  return value;
}

const production = () => process.env.NODE_ENV === "production";

export function backendUrl(): string {
  return checkBackendUrl(process.env.BACKEND_API_URL, production());
}

export function sessionSecret(): string {
  return checkSessionSecret(process.env.SESSION_SECRET, production());
}
