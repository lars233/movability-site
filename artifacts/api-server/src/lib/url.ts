/**
 * Makes an externally-published link safe to use as an href.
 *
 * A link pasted as "zagdaily.com/people/…" — without https:// — is a *relative*
 * URL to a browser, so it resolves against our own domain. Anything that is not
 * already absolute gets https:// put in front of it. Anything that looks like a
 * script URL is rejected outright.
 */
export function toAbsoluteUrl(value: string): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  if (/^(javascript|data|vbscript):/i.test(trimmed)) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;

  // Site-relative links (/reports) are left alone; a bare host gets a scheme.
  if (trimmed.startsWith("/")) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}
