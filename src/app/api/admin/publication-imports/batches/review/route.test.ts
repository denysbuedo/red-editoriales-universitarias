import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

import { POST } from "./route";

describe("POST /api/admin/publication-imports/batches/review", () => {
  it("submits a diagnosed batch for national review", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousWorkflowDir = process.env.PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR;
    const workflowDir = await mkdtemp(path.join(os.tmpdir(), "pnpu-import-workflow-"));
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    process.env.PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR = workflowDir;

    try {
      await createPublicationImportWorkflowService().record({
        batchLabel: "primer-lote",
        fileName: "publicaciones.xlsx",
        message: "Diagnóstico ejecutado.",
        publisherId: "editorial-uh",
        relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
        sheet: "EDUNIV",
        status: "diagnosed",
      });

      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/batches/review", {
          body: JSON.stringify({
            sourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
          }),
          headers: {
            "Content-Type": "application/json",
            "X-PNPU-Admin-Token": "expected-token",
          },
          method: "POST",
        }),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly batch: {
            readonly publisherId: string;
            readonly status: string;
          };
          readonly events: readonly {
            readonly status: string;
          }[];
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.batch).toMatchObject({
        publisherId: "editorial-uh",
        status: "ready_for_review",
      });
      expect(payload.data.events.map((event) => event.status)).toEqual([
        "diagnosed",
        "ready_for_review",
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
