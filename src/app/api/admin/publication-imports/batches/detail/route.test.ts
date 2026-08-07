import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

import { GET } from "./route";

describe("GET /api/admin/publication-imports/batches/detail", () => {
  it("returns batch detail and event history", async () => {
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
          "https://pnpu.mes.gob.cu/api/admin/publication-imports/batches/detail?sourcePath=publishers%2Feditorial-uh%2Fprimer-lote%2Fpublicaciones.xlsx",
          {
            headers: {
              "X-PNPU-Admin-Token": "expected-token",
            },
          },
        ),
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
        status: "uploaded",
      });
      expect(payload.data.events.map((event) => event.status)).toEqual(["uploaded"]);
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
