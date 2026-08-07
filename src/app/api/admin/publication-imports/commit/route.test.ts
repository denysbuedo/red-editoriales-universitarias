import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

import { POST } from "./route";

describe("POST /api/admin/publication-imports/commit", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/commit", {
          method: "POST",
          body: JSON.stringify({ packageJson: "{}" }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import commit endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("validates package JSON before configuration-dependent work", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/commit", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
            "X-Correlation-Id": "commit-request-1",
          },
          body: JSON.stringify({ packageJson: 123 }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-422",
        message: "Publication import packageJson is required.",
        correlationId: "commit-request-1",
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

  it("requires national workflow approval before writing to Omeka", async () => {
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
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/commit", {
          body: JSON.stringify({
            packageJson: JSON.stringify(buildReadyPackage()),
          }),
          headers: {
            "Content-Type": "application/json",
            "X-Correlation-Id": "commit-request-2",
            "X-PNPU-Admin-Token": "expected-token",
          },
          method: "POST",
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-422",
        correlationId: "commit-request-2",
        message: "Publication import batch must be approved before commit.",
      });
      expect(response.status).toBe(422);
    } finally {
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_TOKEN", previousToken);
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR", previousWorkflowDir);
      await rm(workflowDir, { force: true, recursive: true });
    }
  });
});

function buildReadyPackage(): {
  readonly candidates: readonly Readonly<Record<string, unknown>>[];
  readonly manifest: {
    readonly sheet: string;
    readonly source: string;
    readonly status: string;
  };
} {
  return {
    candidates: [
      {
        contributorAuthorityIds: ["contributor-1"],
        decision: "ready",
        digitalResourceUrl: "https://example.edu/libro.pdf",
        doi: "",
        formats: ["pdf"],
        isbn: "9789590000997",
        language: "es",
        license: "CC BY",
        pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
        publicationDate: "2026-07-19",
        publisher: "Editorial Universitaria",
        publisherAuthorityId: "publisher-1",
        reasons: [],
        row: 2,
        subjects: ["37.01"],
        title: "Libro listo",
        typeOrGenre: "book",
      },
    ],
    manifest: {
      sheet: "EDUNIV",
      source: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
      status: "validated_not_imported",
    },
  };
}

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
  } else {
    process.env[name] = value;
  }
}
