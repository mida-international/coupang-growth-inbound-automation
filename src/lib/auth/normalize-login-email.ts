const LOGIN_EMAIL_DOMAIN = "@mida.com";

export function normalizeLoginEmail(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}${LOGIN_EMAIL_DOMAIN}`;
}
