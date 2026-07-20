import { afterEach, describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@/modules/catalog/application";

import {
  authorizePublicationImportAdminRequest,
  buildPublicationImportAdminCallbackResponse,
  buildPublicationImportAdminLoginResponse,
  buildPublicationImportAdminLogoutResponse,
  publicationImportAdminErrorResponse,
  resetPublicationImportAdminAuthCachesForTests,
} from "./publication-import-admin-http";

describe("publication import admin HTTP helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetPublicationImportAdminAuthCachesForTests();
  });

  it("rejects requests when the admin token is not configured", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousMode = process.env.PNPU_ADMIN_AUTH_MODE;
    delete process.env.PNPU_ADMIN_AUTH_MODE;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await authorizePublicationImportAdminRequest(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/diagnose"),
        "diagnosis",
      );

      expect(response?.status).toBe(503);
      await expect(response?.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import diagnosis endpoint is not configured.",
      });
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
      if (previousMode !== undefined) {
        process.env.PNPU_ADMIN_AUTH_MODE = previousMode;
      }
    }
  });

  it("rejects requests with an invalid admin token", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousMode = process.env.PNPU_ADMIN_AUTH_MODE;
    delete process.env.PNPU_ADMIN_AUTH_MODE;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await authorizePublicationImportAdminRequest(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/diagnose", {
          headers: {
            "X-PNPU-Admin-Token": "wrong-token",
          },
        }),
        "diagnosis",
      );

      expect(response?.status).toBe(403);
      await expect(response?.json()).resolves.toEqual({
        code: "PNPU-403",
        message: "Publication import diagnosis token is invalid.",
      });
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
      if (previousMode !== undefined) {
        process.env.PNPU_ADMIN_AUTH_MODE = previousMode;
      }
    }
  });

  it("accepts the local token when hybrid mode is enabled", async () => {
    const previousMode = process.env.PNPU_ADMIN_AUTH_MODE;
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_ADMIN_AUTH_MODE = "hybrid";
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      await expect(
        authorizePublicationImportAdminRequest(
          new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/history", {
            headers: {
              "X-PNPU-Admin-Token": "expected-token",
            },
          }),
          "history",
        ),
      ).resolves.toBeNull();
    } finally {
      if (previousMode === undefined) {
        delete process.env.PNPU_ADMIN_AUTH_MODE;
      } else {
        process.env.PNPU_ADMIN_AUTH_MODE = previousMode;
      }
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("requires OIDC configuration when oidc mode is enabled", async () => {
    const previousMode = process.env.PNPU_ADMIN_AUTH_MODE;
    const previousIssuer = process.env.PNPU_OIDC_ISSUER;
    const previousAudience = process.env.PNPU_OIDC_AUDIENCE;
    resetPublicationImportAdminAuthCachesForTests();
    process.env.PNPU_ADMIN_AUTH_MODE = "oidc";
    delete process.env.PNPU_OIDC_ISSUER;
    delete process.env.PNPU_OIDC_AUDIENCE;

    try {
      const response = await authorizePublicationImportAdminRequest(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/history", {
          headers: {
            Authorization: "Bearer token",
          },
        }),
        "history",
      );

      expect(response?.status).toBe(503);
      await expect(response?.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import history endpoint is not configured.",
      });
    } finally {
      if (previousMode === undefined) {
        delete process.env.PNPU_ADMIN_AUTH_MODE;
      } else {
        process.env.PNPU_ADMIN_AUTH_MODE = previousMode;
      }
      if (previousIssuer === undefined) {
        delete process.env.PNPU_OIDC_ISSUER;
      } else {
        process.env.PNPU_OIDC_ISSUER = previousIssuer;
      }
      if (previousAudience === undefined) {
        delete process.env.PNPU_OIDC_AUDIENCE;
      } else {
        process.env.PNPU_OIDC_AUDIENCE = previousAudience;
      }
    }
  });

  it("accepts an OIDC bearer token with the required admin role", async () => {
    const previousMode = process.env.PNPU_ADMIN_AUTH_MODE;
    const previousIssuer = process.env.PNPU_OIDC_ISSUER;
    const previousAudience = process.env.PNPU_OIDC_AUDIENCE;
    const previousClientId = process.env.PNPU_OIDC_CLIENT_ID;
    const previousRequiredRole = process.env.PNPU_ADMIN_REQUIRED_ROLE;
    const issuer = "https://keycloak.example.edu/realms/pnpu";
    const audience = "pnpu-portal";
    const keyPair = await crypto.subtle.generateKey(
      {
        hash: "SHA-256",
        modulusLength: 2048,
        name: "RSASSA-PKCS1-v1_5",
        publicExponent: new Uint8Array([1, 0, 1]),
      },
      true,
      ["sign", "verify"],
    );
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const token = await signTestJwt(keyPair.privateKey, {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 300,
      iss: issuer,
      realm_access: {
        roles: ["pnpu-admin"],
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = input instanceof Request ? input.url : input.toString();

        if (url.endsWith("/.well-known/openid-configuration")) {
          return Promise.resolve(
            Response.json({
              issuer,
              jwks_uri: `${issuer}/protocol/openid-connect/certs`,
            }),
          );
        }

        return Promise.resolve(
          Response.json({
            keys: [
              {
                ...publicJwk,
                alg: "RS256",
                kid: "test-key",
                use: "sig",
              },
            ],
          }),
        );
      }),
    );
    process.env.PNPU_ADMIN_AUTH_MODE = "oidc";
    process.env.PNPU_OIDC_ISSUER = issuer;
    process.env.PNPU_OIDC_AUDIENCE = audience;
    process.env.PNPU_OIDC_CLIENT_ID = audience;
    process.env.PNPU_ADMIN_REQUIRED_ROLE = "pnpu-admin";

    try {
      await expect(
        authorizePublicationImportAdminRequest(
          new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/history", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          "history",
        ),
      ).resolves.toBeNull();
    } finally {
      if (previousMode === undefined) {
        delete process.env.PNPU_ADMIN_AUTH_MODE;
      } else {
        process.env.PNPU_ADMIN_AUTH_MODE = previousMode;
      }
      if (previousIssuer === undefined) {
        delete process.env.PNPU_OIDC_ISSUER;
      } else {
        process.env.PNPU_OIDC_ISSUER = previousIssuer;
      }
      if (previousAudience === undefined) {
        delete process.env.PNPU_OIDC_AUDIENCE;
      } else {
        process.env.PNPU_OIDC_AUDIENCE = previousAudience;
      }
      if (previousClientId === undefined) {
        delete process.env.PNPU_OIDC_CLIENT_ID;
      } else {
        process.env.PNPU_OIDC_CLIENT_ID = previousClientId;
      }
      if (previousRequiredRole === undefined) {
        delete process.env.PNPU_ADMIN_REQUIRED_ROLE;
      } else {
        process.env.PNPU_ADMIN_REQUIRED_ROLE = previousRequiredRole;
      }
    }
  });

  it("accepts an OIDC bearer token with the import reader role for read operations", async () => {
    const previousValues = snapshotEnvironment([
      "PNPU_ADMIN_AUTH_MODE",
      "PNPU_ADMIN_IMPORT_READ_ROLE",
      "PNPU_ADMIN_REQUIRED_ROLE",
      "PNPU_OIDC_AUDIENCE",
      "PNPU_OIDC_CLIENT_ID",
      "PNPU_OIDC_ISSUER",
    ]);
    const issuer = "https://keycloak.example.edu/realms/pnpu";
    const audience = "pnpu-portal";
    const context = await buildSignedOidcTestContext({
      audience,
      issuer,
      roles: ["pnpu-import-reader"],
    });
    vi.stubGlobal("fetch", context.fetchMock);
    process.env.PNPU_ADMIN_AUTH_MODE = "oidc";
    process.env.PNPU_ADMIN_REQUIRED_ROLE = "pnpu-admin";
    process.env.PNPU_ADMIN_IMPORT_READ_ROLE = "pnpu-import-reader";
    process.env.PNPU_OIDC_ISSUER = issuer;
    process.env.PNPU_OIDC_AUDIENCE = audience;
    process.env.PNPU_OIDC_CLIENT_ID = audience;

    try {
      await expect(
        authorizePublicationImportAdminRequest(
          new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/diagnose", {
            headers: {
              Authorization: `Bearer ${context.token}`,
            },
          }),
          "diagnosis",
        ),
      ).resolves.toBeNull();
    } finally {
      restoreEnvironmentSnapshot(previousValues);
    }
  });

  it("rejects an OIDC bearer token without the operation role", async () => {
    const previousValues = snapshotEnvironment([
      "PNPU_ADMIN_AUTH_MODE",
      "PNPU_ADMIN_IMPORT_READ_ROLE",
      "PNPU_ADMIN_IMPORT_WRITE_ROLE",
      "PNPU_ADMIN_REQUIRED_ROLE",
      "PNPU_OIDC_AUDIENCE",
      "PNPU_OIDC_CLIENT_ID",
      "PNPU_OIDC_ISSUER",
    ]);
    const issuer = "https://keycloak.example.edu/realms/pnpu";
    const audience = "pnpu-portal";
    const context = await buildSignedOidcTestContext({
      audience,
      issuer,
      roles: ["pnpu-import-reader"],
    });
    vi.stubGlobal("fetch", context.fetchMock);
    process.env.PNPU_ADMIN_AUTH_MODE = "oidc";
    process.env.PNPU_ADMIN_REQUIRED_ROLE = "pnpu-admin";
    process.env.PNPU_ADMIN_IMPORT_READ_ROLE = "pnpu-import-reader";
    process.env.PNPU_ADMIN_IMPORT_WRITE_ROLE = "pnpu-import-writer";
    process.env.PNPU_OIDC_ISSUER = issuer;
    process.env.PNPU_OIDC_AUDIENCE = audience;
    process.env.PNPU_OIDC_CLIENT_ID = audience;

    try {
      const response = await authorizePublicationImportAdminRequest(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/commit", {
          headers: {
            Authorization: `Bearer ${context.token}`,
          },
        }),
        "commit",
      );

      expect(response?.status).toBe(403);
      await expect(response?.json()).resolves.toEqual({
        code: "PNPU-403",
        message: "Publication import commit token is invalid.",
      });
    } finally {
      restoreEnvironmentSnapshot(previousValues);
    }
  });

  it("accepts an OIDC bearer token with the import writer role for commit operations", async () => {
    const previousValues = snapshotEnvironment([
      "PNPU_ADMIN_AUTH_MODE",
      "PNPU_ADMIN_IMPORT_WRITE_ROLE",
      "PNPU_ADMIN_REQUIRED_ROLE",
      "PNPU_OIDC_AUDIENCE",
      "PNPU_OIDC_CLIENT_ID",
      "PNPU_OIDC_ISSUER",
    ]);
    const issuer = "https://keycloak.example.edu/realms/pnpu";
    const audience = "pnpu-portal";
    const context = await buildSignedOidcTestContext({
      audience,
      issuer,
      roles: ["pnpu-import-writer"],
    });
    vi.stubGlobal("fetch", context.fetchMock);
    process.env.PNPU_ADMIN_AUTH_MODE = "oidc";
    process.env.PNPU_ADMIN_REQUIRED_ROLE = "pnpu-admin";
    process.env.PNPU_ADMIN_IMPORT_WRITE_ROLE = "pnpu-import-writer";
    process.env.PNPU_OIDC_ISSUER = issuer;
    process.env.PNPU_OIDC_AUDIENCE = audience;
    process.env.PNPU_OIDC_CLIENT_ID = audience;

    try {
      await expect(
        authorizePublicationImportAdminRequest(
          new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/commit", {
            headers: {
              Authorization: `Bearer ${context.token}`,
            },
          }),
          "commit",
        ),
      ).resolves.toBeNull();
    } finally {
      restoreEnvironmentSnapshot(previousValues);
    }
  });

  it("builds an OIDC login redirect with PKCE cookies", async () => {
    const previousIssuer = process.env.PNPU_OIDC_ISSUER;
    const previousAudience = process.env.PNPU_OIDC_AUDIENCE;
    const previousClientId = process.env.PNPU_OIDC_CLIENT_ID;
    const issuer = "https://keycloak.example.edu/realms/pnpu";
    process.env.PNPU_OIDC_ISSUER = issuer;
    process.env.PNPU_OIDC_AUDIENCE = "pnpu-portal";
    process.env.PNPU_OIDC_CLIENT_ID = "pnpu-portal";
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          Response.json({
            authorization_endpoint: `${issuer}/protocol/openid-connect/auth`,
            issuer,
            jwks_uri: `${issuer}/protocol/openid-connect/certs`,
            token_endpoint: `${issuer}/protocol/openid-connect/token`,
          }),
        ),
      ),
    );

    try {
      const response = await buildPublicationImportAdminLoginResponse(
        new Request(
          "https://pnpu.mes.gob.cu/api/admin/auth/login?returnTo=/admin/importaciones/publicaciones",
        ),
      );
      const location = response.headers.get("Location");
      const cookies = response.headers.get("Set-Cookie") ?? "";

      expect(response.status).toBe(307);
      expect(location).not.toBeNull();
      expect(new URL(location ?? "").origin).toBe("https://keycloak.example.edu");
      expect(new URL(location ?? "").searchParams.get("client_id")).toBe("pnpu-portal");
      expect(new URL(location ?? "").searchParams.get("code_challenge_method")).toBe("S256");
      expect(new URL(location ?? "").searchParams.get("redirect_uri")).toBe(
        "https://pnpu.mes.gob.cu/api/admin/auth/callback",
      );
      expect(cookies).toContain("pnpu_oidc_code_verifier=");
      expect(cookies).toContain("pnpu_oidc_nonce=");
      expect(cookies).toContain("pnpu_oidc_return_to=%2Fadmin%2Fimportaciones%2Fpublicaciones");
      expect(cookies).toContain("pnpu_oidc_state=");
    } finally {
      restoreEnvironmentValue("PNPU_OIDC_ISSUER", previousIssuer);
      restoreEnvironmentValue("PNPU_OIDC_AUDIENCE", previousAudience);
      restoreEnvironmentValue("PNPU_OIDC_CLIENT_ID", previousClientId);
    }
  });

  it("exchanges an OIDC callback for an admin session cookie", async () => {
    const previousIssuer = process.env.PNPU_OIDC_ISSUER;
    const previousAudience = process.env.PNPU_OIDC_AUDIENCE;
    const previousClientId = process.env.PNPU_OIDC_CLIENT_ID;
    const previousRequiredRole = process.env.PNPU_ADMIN_REQUIRED_ROLE;
    const issuer = "https://keycloak.example.edu/realms/pnpu";
    const audience = "pnpu-portal";
    const nonce = "expected-nonce";
    const keyPair = await crypto.subtle.generateKey(
      {
        hash: "SHA-256",
        modulusLength: 2048,
        name: "RSASSA-PKCS1-v1_5",
        publicExponent: new Uint8Array([1, 0, 1]),
      },
      true,
      ["sign", "verify"],
    );
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const idToken = await signTestJwt(keyPair.privateKey, {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 300,
      iss: issuer,
      nonce,
      realm_access: {
        roles: ["pnpu-admin"],
      },
    });
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : input.toString();

      if (url.endsWith("/.well-known/openid-configuration")) {
        return Promise.resolve(
          Response.json({
            authorization_endpoint: `${issuer}/protocol/openid-connect/auth`,
            issuer,
            jwks_uri: `${issuer}/protocol/openid-connect/certs`,
            token_endpoint: `${issuer}/protocol/openid-connect/token`,
          }),
        );
      }

      if (url.endsWith("/protocol/openid-connect/token")) {
        return Promise.resolve(
          Response.json({
            id_token: idToken,
            token_type: "Bearer",
          }),
        );
      }

      return Promise.resolve(
        Response.json({
          keys: [
            {
              ...publicJwk,
              alg: "RS256",
              kid: "test-key",
              use: "sig",
            },
          ],
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    process.env.PNPU_OIDC_ISSUER = issuer;
    process.env.PNPU_OIDC_AUDIENCE = audience;
    process.env.PNPU_OIDC_CLIENT_ID = audience;
    process.env.PNPU_ADMIN_REQUIRED_ROLE = "pnpu-admin";

    try {
      const response = await buildPublicationImportAdminCallbackResponse(
        new Request("https://pnpu.mes.gob.cu/api/admin/auth/callback?code=abc&state=state-1", {
          headers: {
            Cookie:
              "pnpu_oidc_code_verifier=verifier-1; pnpu_oidc_nonce=expected-nonce; pnpu_oidc_return_to=%2Fadmin%2Fimportaciones%2Fpublicaciones; pnpu_oidc_state=state-1",
          },
        }),
      );
      const cookies = response.headers.get("Set-Cookie") ?? "";

      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toBe(
        "https://pnpu.mes.gob.cu/admin/importaciones/publicaciones",
      );
      expect(cookies).toContain("pnpu_admin_session=");
      expect(cookies).toContain("HttpOnly");
    } finally {
      restoreEnvironmentValue("PNPU_OIDC_ISSUER", previousIssuer);
      restoreEnvironmentValue("PNPU_OIDC_AUDIENCE", previousAudience);
      restoreEnvironmentValue("PNPU_OIDC_CLIENT_ID", previousClientId);
      restoreEnvironmentValue("PNPU_ADMIN_REQUIRED_ROLE", previousRequiredRole);
    }
  });

  it("clears the OIDC admin session on logout", () => {
    const response = buildPublicationImportAdminLogoutResponse(
      new Request("https://pnpu.mes.gob.cu/api/admin/auth/logout"),
    );
    const cookies = response.headers.get("Set-Cookie") ?? "";

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("https://pnpu.mes.gob.cu/");
    expect(cookies).toContain("pnpu_admin_session=");
    expect(cookies).toContain("Max-Age=0");
  });

  it("maps application errors to HTTP status codes with correlation ids", async () => {
    const response = publicationImportAdminErrorResponse(
      new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/rollback-plan", {
        headers: {
          "X-Correlation-Id": "rollback-correlation-1",
        },
      }),
      ApplicationError.notFound("Missing audit entry."),
      "Publication import rollback-plan failed.",
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("X-Correlation-Id")).toBe("rollback-correlation-1");
    await expect(response.json()).resolves.toEqual({
      code: "PNPU-404",
      message: "Missing audit entry.",
      correlationId: "rollback-correlation-1",
    });
  });
});

async function signTestJwt(
  privateKey: CryptoKey,
  payload: Readonly<Record<string, unknown>>,
): Promise<string> {
  const header = {
    alg: "RS256",
    kid: "test-key",
    typ: "JWT",
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
  } else {
    process.env[name] = value;
  }
}

function snapshotEnvironment(names: readonly string[]): ReadonlyMap<string, string | undefined> {
  return new Map(names.map((name) => [name, process.env[name]]));
}

function restoreEnvironmentSnapshot(values: ReadonlyMap<string, string | undefined>): void {
  for (const [name, value] of values) {
    restoreEnvironmentValue(name, value);
  }
}

async function buildSignedOidcTestContext(command: {
  readonly audience: string;
  readonly issuer: string;
  readonly roles: readonly string[];
}): Promise<{
  readonly fetchMock: ReturnType<typeof vi.fn>;
  readonly token: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      hash: "SHA-256",
      modulusLength: 2048,
      name: "RSASSA-PKCS1-v1_5",
      publicExponent: new Uint8Array([1, 0, 1]),
    },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const token = await signTestJwt(keyPair.privateKey, {
    aud: command.audience,
    exp: Math.floor(Date.now() / 1000) + 300,
    iss: command.issuer,
    realm_access: {
      roles: command.roles,
    },
  });
  const fetchMock = vi.fn((input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : input.toString();

    if (url.endsWith("/.well-known/openid-configuration")) {
      return Promise.resolve(
        Response.json({
          issuer: command.issuer,
          jwks_uri: `${command.issuer}/protocol/openid-connect/certs`,
        }),
      );
    }

    return Promise.resolve(
      Response.json({
        keys: [
          {
            ...publicJwk,
            alg: "RS256",
            kid: "test-key",
            use: "sig",
          },
        ],
      }),
    );
  });

  return {
    fetchMock,
    token,
  };
}

function base64UrlEncode(value: string | ArrayBuffer): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}
