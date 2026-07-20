import { describe, expect, it } from "vitest";

import { ApplicationError } from "@/modules/catalog/application";

import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "./publication-import-admin-http";

describe("publication import admin HTTP helpers", () => {
  it("rejects requests when the admin token is not configured", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = authorizePublicationImportAdminRequest(
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
    }
  });

  it("rejects requests with an invalid admin token", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = authorizePublicationImportAdminRequest(
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
