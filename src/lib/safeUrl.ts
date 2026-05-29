/**
 * Returns the URL only if it uses a safe protocol (http/https/mailto/tel).
 * Returns null for javascript:, data:, vbscript: and other unsafe schemes
 * to prevent stored XSS via user-controlled href attributes.
 */
export const safeUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  try {
    // Treat protocol-relative and relative URLs as http for parsing
    const parsed = new URL(trimmed, "https://placeholder.invalid");
    const allowed = ["http:", "https:", "mailto:", "tel:"];
    if (!allowed.includes(parsed.protocol)) return null;
    // Reject URLs that don't have an explicit scheme in the original string
    // for http/https (we only want absolute external links here)
    if ((parsed.protocol === "http:" || parsed.protocol === "https:") &&
        !/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed.replace(/^\/+/, "")}`;
    }
    return trimmed;
  } catch {
    return null;
  }
};
