import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/admin/publication-imports/rollback-plan", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/rollback-plan", {
          method: "POST",
          body: JSON.stringify({ auditId: "audit-1" }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import rollback-plan endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("validates auditId before configuration-dependent work", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/rollback-plan", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
            "X-Correlation-Id": "rollback-plan-request-1",
          },
          body: JSON.stringify({ auditId: 123 }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-422",
        message: "Publication import auditId is required.",
        correlationId: "rollback-plan-request-1",
      });
      expect(response.status).toBe(422);
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });
});
