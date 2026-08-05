export interface PublicationImportAdminSessionSummary {
  readonly displayName: string;
  readonly email?: string;
}

interface AdminJwtPayload {
  readonly email?: unknown;
  readonly name?: unknown;
  readonly preferred_username?: unknown;
}

export const PUBLICATION_IMPORT_ADMIN_SESSION_COOKIE = "pnpu_admin_session";

export function readPublicationImportAdminSessionSummary(
  token: string | undefined,
): PublicationImportAdminSessionSummary | null {
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  const payload = readJwtPayload(token);

  if (payload === null) {
    return null;
  }

  const displayName =
    readStringClaim(payload.name) ??
    readStringClaim(payload.preferred_username) ??
    readStringClaim(payload.email);

  if (displayName === undefined) {
    return null;
  }

  return {
    displayName,
    email: readStringClaim(payload.email),
  };
}

function readJwtPayload(token: string): AdminJwtPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const payload = parts[1] ?? "";

  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as AdminJwtPayload;
  } catch {
    return null;
  }
}

function readStringClaim(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
