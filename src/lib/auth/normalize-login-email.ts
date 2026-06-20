const LOGIN_EMAIL_DOMAIN = "@mida.com";

export function normalizeLoginEmail(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}${LOGIN_EMAIL_DOMAIN}`;
}

export function toLoginId(email: string): string {
  if (email.endsWith(LOGIN_EMAIL_DOMAIN)) {
    return email.slice(0, -LOGIN_EMAIL_DOMAIN.length);
  }

  return email;
}
