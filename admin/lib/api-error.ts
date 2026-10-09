export async function extractErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return "Something went wrong. Try again.";
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
    // The backend also sends plain-text errors that are already readable.
    return text;
  }

  return "Something went wrong. Try again.";
}
