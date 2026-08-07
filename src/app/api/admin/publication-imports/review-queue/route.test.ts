import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

import { GET } from "./route";

describe("GET /api/admin/publication-imports/review-queue", () => {
  it("lists only batches pending national review", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousWorkflowDir = process.env.PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR;
    const workflowDir = await mkdtemp(path.join(os.tmpdir(), "pnpu-import-workflow-"));
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    process.env.PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR = workflowDir;

    try {
      await createPublicationImportWorkflowService().record({
        batchLabel: "primer-lote",
        fileName: "publicaciones.xlsx",
        message: "Lote enviado a revisión nacional.",
        publisherId: "editorial-uh",
        relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
        status: "ready_for_review",
      });
      await createPublicationImportWorkflowService().record({
        batchLabel: "segundo-lote",
        fileName: "publicaciones.xlsx",
        message: "Archivo XLSX cargado por la editorial.",
        publisherId: "editorial-uclv",
        relativeSourcePath: "publishers/editorial-uclv/segundo-lote/publicaciones.xlsx",
        status: "uploaded",
      });

      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/review-queue", {
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
        }),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly batches: readonly {
            readonly publisherId: string;
            readonly status: string;
          }[];
          readonly summary: {
            readonly readyForReview: number;
            readonly total: number;
          };
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.summary).toMatchObject({
        readyForReview: 1,
        total: 1,
      });
      expect(payload.data.batches).toEqual([
        expect.objectContaining({
          publisherId: "editorial-uh",
          status: "ready_for_review",
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
