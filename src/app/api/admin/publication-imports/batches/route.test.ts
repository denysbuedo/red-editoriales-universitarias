import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

import { GET } from "./route";

describe("GET /api/admin/publication-imports/batches", () => {
  it("requires a publisherId scope", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/batches", {
          headers: {
            "X-Correlation-Id": "batches-request-1",
            "X-PNPU-Admin-Token": "expected-token",
          },
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-422",
        correlationId: "batches-request-1",
        message: "Publication import publisherId is required.",
      });
      expect(response.status).toBe(422);
    } finally {
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_TOKEN", previousToken);
    }
  });

  it("lists persisted batches for the selected publisher", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousWorkflowDir = process.env.PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR;
    const workflowDir = await mkdtemp(path.join(os.tmpdir(), "pnpu-import-workflow-"));
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    process.env.PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR = workflowDir;

    try {
      await createPublicationImportWorkflowService().record({
        batchLabel: "primer-lote",
        fileName: "publicaciones.xlsx",
        message: "Archivo XLSX cargado por la editorial.",
        publisherId: "editorial-uh",
        relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
        status: "uploaded",
      });

      const response = await GET(
        new Request(
          "https://pnpu.mes.gob.cu/api/admin/publication-imports/batches?publisherId=editorial-uh",
          {
            headers: {
              "X-PNPU-Admin-Token": "expected-token",
            },
          },
        ),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly batches: readonly {
            readonly publisherId: string;
            readonly relativeSourcePath: string;
            readonly status: string;
          }[];
          readonly summary: {
            readonly total: number;
            readonly uploaded: number;
          };
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.summary).toMatchObject({
        total: 1,
        uploaded: 1,
      });
      expect(payload.data.batches).toEqual([
        expect.objectContaining({
          publisherId: "editorial-uh",
          relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
          status: "uploaded",
        }),
      ]);
    } finally {
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_TOKEN", previousToken);
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR", previousWorkflowDir);
      await rm(workflowDir, { force: true, recursive: true });
    }
  });
});

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
  } else {
    process.env[name] = value;
  }
}
