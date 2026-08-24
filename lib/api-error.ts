export async function extractErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return "Something went wrong. Please try again.";
  }

  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.join(" ");
    }
    if (data.errors) {
      return Object.values(data.errors).flat().join(" ");
    }
  } catch {
    // Not JSON — the backend also sends plain-text errors (e.g. login's
    // "Invalid email or password."), which are already human-readable,
    // so show them as-is instead of a generic fallback.
    return text;
  }

  return "Something went wrong. Please try again.";
}