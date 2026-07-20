import { afterEach, describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@/modules/catalog/application";

import {
  authorizePublicationImportAdminRequest,
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

function base64UrlEncode(value: string | ArrayBuffer): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}
