import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type AdminAuthMode = "hybrid" | "oidc" | "token";

interface AdminAuthEnvironment {
  readonly [key: string]: string | undefined;
  readonly PNPU_ADMIN_AUTH_MODE?: string;
  readonly PNPU_ADMIN_REQUIRED_ROLE?: string;
  readonly PNPU_OIDC_AUDIENCE?: string;
  readonly PNPU_OIDC_CLIENT_ID?: string;
  readonly PNPU_OIDC_ISSUER?: string;
  readonly PNPU_PUBLICATION_IMPORT_TOKEN?: string;
}

interface JwtHeader {
  readonly alg: string;
  readonly kid?: string;
  readonly typ?: string;
}

interface JwtPayload {
  readonly aud?: string | readonly string[];
  readonly exp?: number;
  readonly groups?: readonly string[];
  readonly iss?: string;
  readonly nbf?: number;
  readonly realm_access?: {
    readonly roles?: readonly string[];
  };
  readonly resource_access?: Record<
    string,
    {
      readonly roles?: readonly string[];
    }
  >;
}

interface JwksDocument {
  readonly keys: readonly OidcJsonWebKey[];
}

interface OidcJsonWebKey extends JsonWebKey {
  readonly kid?: string;
}

interface OidcDiscoveryDocument {
  readonly jwks_uri?: string;
  readonly issuer?: string;
}

const oidcDiscoveryCache = new Map<string, OidcDiscoveryDocument>();
const jwksCache = new Map<string, JwksDocument>();

export async function authorizePublicationImportAdminRequest(
  request: Request,
  operation: string,
): Promise<NextResponse | null> {
  const mode = readAdminAuthMode(process.env);

  if (mode === "token") {
    return authorizeWithStaticToken(request, operation, process.env, mode);
  }

  if (mode === "hybrid") {
    const tokenResponse = authorizeWithStaticToken(request, operation, process.env, mode);

    if (tokenResponse === null) {
      return null;
    }

    const oidcResponse = await authorizeWithOidcBearer(request, operation, process.env, fetch);

    if (oidcResponse === null) {
      return null;
    }

    return NextResponse.json(
      {
        code: "PNPU-403",
        message: `Publication import ${operation} token is invalid.`,
      },
      { status: 403 },
    );
  }

  return authorizeWithOidcBearer(request, operation, process.env, fetch);
}

export function resetPublicationImportAdminAuthCachesForTests(): void {
  oidcDiscoveryCache.clear();
  jwksCache.clear();
}

function authorizeWithStaticToken(
  request: Request,
  operation: string,
  environment: AdminAuthEnvironment,
  mode: AdminAuthMode,
): NextResponse | null {
  const configuredToken = environment.PNPU_PUBLICATION_IMPORT_TOKEN;

  if (configuredToken === undefined || configuredToken.trim().length === 0) {
    if (mode === "hybrid") {
      return NextResponse.json(
        {
          code: "PNPU-403",
          message: `Publication import ${operation} token is invalid.`,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        code: "PNPU-503",
        message: `Publication import ${operation} endpoint is not configured.`,
      },
      { status: 503 },
    );
  }

  if (request.headers.get("X-PNPU-Admin-Token") !== configuredToken) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: `Publication import ${operation} token is invalid.`,
      },
      { status: 403 },
    );
  }

  return null;
}

async function authorizeWithOidcBearer(
  request: Request,
  operation: string,
  environment: AdminAuthEnvironment,
  fetchFn: FetchLike,
): Promise<NextResponse | null> {
  const bearerToken = readBearerToken(request);

  if (bearerToken === null) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: `Publication import ${operation} token is invalid.`,
      },
      { status: 403 },
    );
  }

  const config = readOidcAdminConfig(environment);

  if (config === null) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: `Publication import ${operation} endpoint is not configured.`,
      },
      { status: 503 },
    );
  }

  try {
    const payload = await verifyOidcJwt(bearerToken, config, fetchFn);

    if (!hasRequiredRole(payload, config.requiredRole, config.clientId)) {
      return NextResponse.json(
        {
          code: "PNPU-403",
          message: `Publication import ${operation} token is invalid.`,
        },
        { status: 403 },
      );
    }

    return null;
  } catch {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: `Publication import ${operation} token is invalid.`,
      },
      { status: 403 },
    );
  }
}

export function publicationImportAdminErrorResponse(
  request: Request,
  error: unknown,
  fallbackMessage: string,
): NextResponse {
  const correlationId = resolveCorrelationId(request.headers);
  const response =
    error instanceof ApplicationError
      ? NextResponse.json(
          {
            code: error.code,
            message: error.message,
            correlationId,
          },
          { status: statusForApplicationError(error) },
        )
      : NextResponse.json(
          {
            code: "PNPU-503",
            message: fallbackMessage,
            correlationId,
          },
          { status: 503 },
        );

  response.headers.set(getCorrelationIdHeaderName(), correlationId);
  return response;
}

function statusForApplicationError(error: ApplicationError): number {
  if (error.code === "PNPU-404") {
    return 404;
  }

  if (error.code === "PNPU-422") {
    return 422;
  }

  return 503;
}

function readAdminAuthMode(environment: AdminAuthEnvironment): AdminAuthMode {
  const value = environment.PNPU_ADMIN_AUTH_MODE?.trim().toLowerCase();

  if (value === "oidc" || value === "hybrid") {
    return value;
  }

  return "token";
}

function readOidcAdminConfig(environment: AdminAuthEnvironment): {
  readonly audience: string;
  readonly clientId: string;
  readonly issuer: string;
  readonly requiredRole: string;
} | null {
  const issuer = environment.PNPU_OIDC_ISSUER?.trim();
  const audience = environment.PNPU_OIDC_AUDIENCE?.trim();
  const clientId = environment.PNPU_OIDC_CLIENT_ID?.trim() ?? audience;
  const requiredRole = environment.PNPU_ADMIN_REQUIRED_ROLE?.trim() ?? "pnpu-admin";

  if (
    issuer === undefined ||
    audience === undefined ||
    clientId === undefined ||
    issuer.length === 0 ||
    audience.length === 0 ||
    clientId.length === 0 ||
    requiredRole.length === 0
  ) {
    return null;
  }

  return {
    issuer: new URL(issuer).toString().replace(/\/$/, ""),
    audience,
    clientId,
    requiredRole,
  };
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");

  if (header === null) {
    return null;
  }

  const parts = header.split(/\s+/u);
  const scheme = parts[0] ?? "";
  const token = parts[1] ?? "";

  return scheme.toLowerCase() === "bearer" && token.length > 0 ? token : null;
}

async function verifyOidcJwt(
  token: string,
  config: {
    readonly audience: string;
    readonly issuer: string;
  },
  fetchFn: FetchLike,
): Promise<JwtPayload> {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT.");
  }

  const header = readJwtHeader(parts[0] ?? "");
  const payload = readJwtPayload(parts[1] ?? "");

  assertJwtHeader(header);
  assertJwtPayload(payload, config);

  const jwks = await readJwks(config.issuer, fetchFn);
  const key = jwks.keys.find((candidate) => candidate.kid === header.kid);

  if (key === undefined) {
    throw new Error("OIDC signing key was not found.");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    key,
    {
      hash: "SHA-256",
      name: "RSASSA-PKCS1-v1_5",
    },
    false,
    ["verify"],
  );
  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    toArrayBuffer(base64UrlToBytes(parts[2] ?? "")),
    toArrayBuffer(new TextEncoder().encode(`${parts[0]}.${parts[1]}`)),
  );

  if (!isValid) {
    throw new Error("Invalid JWT signature.");
  }

  return payload;
}

function assertJwtHeader(header: JwtHeader): void {
  if (header.alg !== "RS256") {
    throw new Error("Unsupported JWT algorithm.");
  }
}

function assertJwtPayload(
  payload: JwtPayload,
  config: {
    readonly audience: string;
    readonly issuer: string;
  },
): void {
  const nowEpochSeconds = Math.floor(Date.now() / 1000);

  if (payload.iss !== config.issuer) {
    throw new Error("Invalid JWT issuer.");
  }

  if (!matchesAudience(payload.aud, config.audience)) {
    throw new Error("Invalid JWT audience.");
  }

  if (typeof payload.exp !== "number" || payload.exp <= nowEpochSeconds) {
    throw new Error("Expired JWT.");
  }

  if (typeof payload.nbf === "number" && payload.nbf > nowEpochSeconds) {
    throw new Error("JWT is not active yet.");
  }
}

function matchesAudience(
  audience: string | readonly string[] | undefined,
  expected: string,
): boolean {
  if (typeof audience === "string") {
    return audience === expected;
  }

  return Array.isArray(audience) && audience.includes(expected);
}

function hasRequiredRole(payload: JwtPayload, requiredRole: string, clientId: string): boolean {
  const realmRoles = payload.realm_access?.roles ?? [];
  const clientRoles = payload.resource_access?.[clientId]?.roles ?? [];
  const groups = payload.groups ?? [];

  return (
    realmRoles.includes(requiredRole) ||
    clientRoles.includes(requiredRole) ||
    groups.includes(requiredRole)
  );
}

async function readJwks(issuer: string, fetchFn: FetchLike): Promise<JwksDocument> {
  const discovery = await readOidcDiscovery(issuer, fetchFn);
  const jwksUri = discovery.jwks_uri;

  if (jwksUri === undefined || jwksUri.trim().length === 0) {
    throw new Error("OIDC discovery does not expose jwks_uri.");
  }

  const cached = jwksCache.get(jwksUri);

  if (cached !== undefined) {
    return cached;
  }

  const response = await fetchFn(jwksUri, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("OIDC JWKS lookup failed.");
  }

  const payload = (await response.json()) as unknown;

  if (!isJwksDocument(payload)) {
    throw new Error("OIDC JWKS payload is invalid.");
  }

  jwksCache.set(jwksUri, payload);
  return payload;
}

async function readOidcDiscovery(
  issuer: string,
  fetchFn: FetchLike,
): Promise<OidcDiscoveryDocument> {
  const cached = oidcDiscoveryCache.get(issuer);

  if (cached !== undefined) {
    return cached;
  }

  const response = await fetchFn(`${issuer}/.well-known/openid-configuration`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("OIDC discovery lookup failed.");
  }

  const payload = (await response.json()) as unknown;

  if (!isOidcDiscoveryDocument(payload)) {
    throw new Error("OIDC discovery payload is invalid.");
  }

  oidcDiscoveryCache.set(issuer, payload);
  return payload;
}

function readJwtHeader(part: string): JwtHeader {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part))) as JwtHeader;
}

function readJwtPayload(part: string): JwtPayload {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part))) as JwtPayload;
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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
}

function isOidcDiscoveryDocument(value: unknown): value is OidcDiscoveryDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJwksDocument(value: unknown): value is JwksDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "keys" in value &&
    Array.isArray(value.keys)
  );
}
