import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

import { POST } from "./route";

describe("POST /api/admin/publication-imports/review-decision", () => {
  it("approves a batch pending national review", async () => {
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

      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/review-decision", {
          body: JSON.stringify({
            decision: "approved",
            message: "Aprobado para piloto.",
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
            readonly status: string;
          };
          readonly events: readonly {
            readonly at: string;
            readonly message: string;
            readonly status: string;
          }[];
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.batch.status).toBe("approved");
      const lastEvent = payload.data.events.at(-1);

      expect(typeof lastEvent?.at).toBe("string");
      expect(lastEvent).toMatchObject({
        message: "Aprobado para piloto.",
        status: "approved",
      });
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
