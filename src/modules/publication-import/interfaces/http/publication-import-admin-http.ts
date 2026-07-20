import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type AdminAuthMode = "hybrid" | "oidc" | "token";
type PublicationImportAdminOperation =
  | "admin page"
  | "authorities"
  | "commit"
  | "commit-plan"
  | "diagnosis"
  | "dry-run"
  | "history"
  | "mapping preview"
  | "rollback"
  | "rollback-plan";

interface AdminAuthEnvironment {
  readonly [key: string]: string | undefined;
  readonly PNPU_ADMIN_AUTH_MODE?: string;
  readonly PNPU_ADMIN_IMPORT_READ_ROLE?: string;
  readonly PNPU_ADMIN_IMPORT_ROLLBACK_ROLE?: string;
  readonly PNPU_ADMIN_IMPORT_WRITE_ROLE?: string;
  readonly PNPU_ADMIN_REQUIRED_ROLE?: string;
  readonly PNPU_OIDC_AUDIENCE?: string;
  readonly PNPU_OIDC_CLIENT_ID?: string;
  readonly PNPU_OIDC_CLIENT_SECRET?: string;
  readonly PNPU_OIDC_ISSUER?: string;
  readonly PNPU_OIDC_SCOPES?: string;
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
  readonly nonce?: string;
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
  readonly authorization_endpoint?: string;
  readonly jwks_uri?: string;
  readonly issuer?: string;
  readonly token_endpoint?: string;
}

interface OidcTokenResponse {
  readonly access_token?: string;
  readonly id_token?: string;
  readonly token_type?: string;
}

const oidcDiscoveryCache = new Map<string, OidcDiscoveryDocument>();
const jwksCache = new Map<string, JwksDocument>();
const ADMIN_SESSION_COOKIE = "pnpu_admin_session";
const OIDC_CODE_VERIFIER_COOKIE = "pnpu_oidc_code_verifier";
const OIDC_NONCE_COOKIE = "pnpu_oidc_nonce";
const OIDC_RETURN_TO_COOKIE = "pnpu_oidc_return_to";
const OIDC_STATE_COOKIE = "pnpu_oidc_state";

export async function authorizePublicationImportAdminRequest(
  request: Request,
  operation: PublicationImportAdminOperation,
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

export async function buildPublicationImportAdminLoginResponse(
  request: Request,
): Promise<NextResponse> {
  const config = readOidcAdminConfig(process.env);

  if (config === null) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: "Publication import admin login endpoint is not configured.",
      },
      { status: 503 },
    );
  }

  const discovery = await readOidcDiscovery(config.issuer, fetch);

  if (discovery.authorization_endpoint === undefined) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: "Publication import admin login endpoint is not configured.",
      },
      { status: 503 },
    );
  }

  const requestUrl = new URL(request.url);
  const state = randomBase64Url(32);
  const nonce = randomBase64Url(32);
  const codeVerifier = randomBase64Url(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const authorizationUrl = new URL(discovery.authorization_endpoint);

  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("redirect_uri", `${requestUrl.origin}/api/admin/auth/callback`);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scopes);
  authorizationUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    maxAge: 600,
    path: "/api/admin/auth",
    sameSite: "lax" as const,
    secure: requestUrl.protocol === "https:",
  };

  response.cookies.set(OIDC_CODE_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  response.cookies.set(OIDC_NONCE_COOKIE, nonce, cookieOptions);
  response.cookies.set(OIDC_RETURN_TO_COOKIE, readSafeReturnTo(requestUrl), cookieOptions);
  response.cookies.set(OIDC_STATE_COOKIE, state, cookieOptions);

  return response;
}

export async function buildPublicationImportAdminCallbackResponse(
  request: Request,
): Promise<NextResponse> {
  const config = readOidcAdminConfig(process.env);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookies = readCookieMap(request.headers.get("Cookie"));
  const expectedState = cookies.get(OIDC_STATE_COOKIE);
  const codeVerifier = cookies.get(OIDC_CODE_VERIFIER_COOKIE);
  const nonce = cookies.get(OIDC_NONCE_COOKIE);
  const returnTo = cookies.get(OIDC_RETURN_TO_COOKIE) ?? "/admin/importaciones/publicaciones";

  if (
    config === null ||
    code === null ||
    state === null ||
    expectedState === undefined ||
    codeVerifier === undefined ||
    nonce === undefined ||
    state !== expectedState
  ) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: "Publication import admin login callback is invalid.",
      },
      { status: 403 },
    );
  }

  const discovery = await readOidcDiscovery(config.issuer, fetch);

  if (discovery.token_endpoint === undefined) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: "Publication import admin login endpoint is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    const tokenResponse = await exchangeAuthorizationCode({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      codeVerifier,
      redirectUri: `${requestUrl.origin}/api/admin/auth/callback`,
      tokenEndpoint: discovery.token_endpoint,
    });
    const sessionToken = tokenResponse.access_token ?? tokenResponse.id_token;

    if (sessionToken === undefined) {
      throw new Error("OIDC token response does not include a session token.");
    }

    const payload = await verifyOidcJwt(sessionToken, config, fetch);

    if (sessionToken === tokenResponse.id_token && payload.nonce !== nonce) {
      throw new Error("OIDC ID token nonce is invalid.");
    }

    if (!hasAnyRequiredRole(payload, readAllowedRoles(config, "admin page"), config.clientId)) {
      throw new Error("OIDC token does not include the required role.");
    }

    const response = NextResponse.redirect(new URL(readSafeReturnToValue(returnTo), requestUrl));

    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax",
      secure: requestUrl.protocol === "https:",
    });
    clearOidcTemporaryCookies(response);

    return response;
  } catch {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: "Publication import admin login callback is invalid.",
      },
      { status: 403 },
    );
  }
}

export function buildPublicationImportAdminLogoutResponse(request: Request): NextResponse {
  const requestUrl = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", requestUrl));

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
  });
  clearOidcTemporaryCookies(response);

  return response;
}

function authorizeWithStaticToken(
  request: Request,
  operation: PublicationImportAdminOperation,
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
  operation: PublicationImportAdminOperation,
  environment: AdminAuthEnvironment,
  fetchFn: FetchLike,
): Promise<NextResponse | null> {
  const bearerToken =
    readBearerToken(request) ??
    readCookieMap(request.headers.get("Cookie")).get(ADMIN_SESSION_COOKIE) ??
    null;

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

    if (!hasAnyRequiredRole(payload, readAllowedRoles(config, operation), config.clientId)) {
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
  readonly clientSecret?: string;
  readonly importReadRole: string;
  readonly importRollbackRole: string;
  readonly importWriteRole: string;
  readonly issuer: string;
  readonly requiredRole: string;
  readonly scopes: string;
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
    clientSecret: environment.PNPU_OIDC_CLIENT_SECRET?.trim(),
    importReadRole: readRole(environment.PNPU_ADMIN_IMPORT_READ_ROLE, "pnpu-import-reader"),
    importRollbackRole: readRole(
      environment.PNPU_ADMIN_IMPORT_ROLLBACK_ROLE,
      "pnpu-import-rollback",
    ),
    importWriteRole: readRole(environment.PNPU_ADMIN_IMPORT_WRITE_ROLE, "pnpu-import-writer"),
    requiredRole,
    scopes: readOidcScopes(environment),
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

function readOidcScopes(environment: AdminAuthEnvironment): string {
  const scopes = environment.PNPU_OIDC_SCOPES?.trim();

  return scopes !== undefined && scopes.length > 0 ? scopes : "openid profile email";
}

function readRole(value: string | undefined, fallback: string): string {
  const role = value?.trim();

  return role !== undefined && role.length > 0 ? role : fallback;
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

function readAllowedRoles(
  config: {
    readonly importReadRole: string;
    readonly importRollbackRole: string;
    readonly importWriteRole: string;
    readonly requiredRole: string;
  },
  operation: PublicationImportAdminOperation,
): readonly string[] {
  if (operation === "admin page") {
    return [
      config.requiredRole,
      config.importReadRole,
      config.importWriteRole,
      config.importRollbackRole,
    ];
  }

  if (operation === "commit" || operation === "commit-plan") {
    return [config.requiredRole, config.importWriteRole];
  }

  if (operation === "rollback" || operation === "rollback-plan") {
    return [config.requiredRole, config.importRollbackRole];
  }

  return [config.requiredRole, config.importReadRole];
}

function hasAnyRequiredRole(
  payload: JwtPayload,
  requiredRoles: readonly string[],
  clientId: string,
): boolean {
  const realmRoles = payload.realm_access?.roles ?? [];
  const clientRoles = payload.resource_access?.[clientId]?.roles ?? [];
  const groups = payload.groups ?? [];

  return requiredRoles.some(
    (requiredRole) =>
      realmRoles.includes(requiredRole) ||
      clientRoles.includes(requiredRole) ||
      groups.includes(requiredRole),
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

async function exchangeAuthorizationCode(command: {
  readonly clientId: string;
  readonly clientSecret?: string;
  readonly code: string;
  readonly codeVerifier: string;
  readonly redirectUri: string;
  readonly tokenEndpoint: string;
}): Promise<OidcTokenResponse> {
  const body = new URLSearchParams({
    client_id: command.clientId,
    code: command.code,
    code_verifier: command.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: command.redirectUri,
  });

  if (command.clientSecret !== undefined && command.clientSecret.length > 0) {
    body.set("client_secret", command.clientSecret);
  }

  const response = await fetch(command.tokenEndpoint, {
    body,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("OIDC token exchange failed.");
  }

  const payload = (await response.json()) as unknown;

  if (!isOidcTokenResponse(payload)) {
    throw new Error("OIDC token response is invalid.");
  }

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

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  return base64UrlEncode(bytes);
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

  return base64UrlEncode(new Uint8Array(digest));
}

function readCookieMap(header: string | null): ReadonlyMap<string, string> {
  const values = new Map<string, string>();

  if (header === null || header.trim().length === 0) {
    return values;
  }

  for (const part of header.split(";")) {
    const [name, ...rawValue] = part.trim().split("=");

    if (name.length > 0) {
      values.set(name, decodeURIComponent(rawValue.join("=")));
    }
  }

  return values;
}

function readSafeReturnTo(requestUrl: URL): string {
  return readSafeReturnToValue(
    requestUrl.searchParams.get("returnTo") ?? "/admin/importaciones/publicaciones",
  );
}

function readSafeReturnToValue(value: string): string {
  return value.startsWith("/admin/") && !value.startsWith("//")
    ? value
    : "/admin/importaciones/publicaciones";
}

function clearOidcTemporaryCookies(response: NextResponse): void {
  for (const name of [
    OIDC_CODE_VERIFIER_COOKIE,
    OIDC_NONCE_COOKIE,
    OIDC_RETURN_TO_COOKIE,
    OIDC_STATE_COOKIE,
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/api/admin/auth",
      sameSite: "lax",
    });
  }
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

function isOidcTokenResponse(value: unknown): value is OidcTokenResponse {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
