import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PublicationImportWorkflowService } from "@/modules/publication-import";
import { FilePublicationImportWorkflowRepository } from "@/modules/publication-import/infrastructure";

describe("PublicationImportWorkflowService", () => {
  it("records editorial batch events and submits a diagnosed batch for review", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "pnpu-import-workflow-"));
    const service = new PublicationImportWorkflowService(
      new FilePublicationImportWorkflowRepository(directory),
    );

    try {
      await service.record({
        batchLabel: "primer-lote",
        fileName: "publicaciones.xlsx",
        message: "Archivo XLSX cargado por la editorial.",
        publisherId: "editorial-uh",
        relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
        status: "uploaded",
      });
      await service.record({
        batchLabel: "primer-lote",
        fileName: "publicaciones.xlsx",
        message: "Diagnóstico ejecutado.",
        publisherId: "editorial-uh",
        relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
        sheet: "EDUNIV",
        status: "diagnosed",
      });

      const reviewed = await service.submitForReview({
        relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
      });
      const workflow = await service.list({ publisherId: "editorial-uh" });

      expect(reviewed.batch).toMatchObject({
        batchLabel: "primer-lote",
        fileName: "publicaciones.xlsx",
        publisherId: "editorial-uh",
        relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
        sheet: "EDUNIV",
        status: "ready_for_review",
      });
      expect(reviewed.events.map((event) => event.status)).toEqual([
        "uploaded",
        "diagnosed",
        "ready_for_review",
      ]);
      expect(workflow.summary).toMatchObject({
        readyForReview: 1,
        total: 1,
      });
      expect(workflow.batches).toHaveLength(1);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("does not submit an uploaded-only batch for review", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "pnpu-import-workflow-"));
    const service = new PublicationImportWorkflowService(
      new FilePublicationImportWorkflowRepository(directory),
    );

    try {
      await service.record({
        batchLabel: "primer-lote",
        fileName: "publicaciones.xlsx",
        message: "Archivo XLSX cargado por la editorial.",
        publisherId: "editorial-uh",
        relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
        status: "uploaded",
      });

      await expect(
        service.submitForReview({
          relativeSourcePath: "publishers/editorial-uh/primer-lote/publicaciones.xlsx",
        }),
      ).rejects.toThrow("Publication import batch is not ready for review.");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
