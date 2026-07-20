import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/admin/publication-imports/history", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/history"),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import history endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("returns an empty audit log when there are no committed import manifests", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousAuditDir = process.env.PNPU_PUBLICATION_IMPORT_AUDIT_DIR;
    const auditDir = await mkdtemp(path.join(os.tmpdir(), "pnpu-import-audit-"));
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    process.env.PNPU_PUBLICATION_IMPORT_AUDIT_DIR = auditDir;

    try {
      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/history", {
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
        }),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly summary: {
            readonly entries: number;
            readonly createdItems: number;
            readonly createdMedia: number;
          };
          readonly entries: readonly unknown[];
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.summary).toEqual({
        entries: 0,
        createdItems: 0,
        createdMedia: 0,
      });
      expect(payload.data.entries).toEqual([]);
    } finally {
      await rm(auditDir, { force: true, recursive: true });
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
      if (previousAuditDir === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_AUDIT_DIR;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_AUDIT_DIR = previousAuditDir;
      }
    }
  });
});
