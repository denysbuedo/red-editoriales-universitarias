import { ApplicationError } from "@/modules/catalog/application";

import {
  PublicationImportWorkflowBatchDetailDto,
  PublicationImportWorkflowListDto,
  PublicationImportWorkflowStatus,
} from "../dtos";
import { PublicationImportWorkflowRepository } from "../ports/publication-import-workflow-repository";

export class PublicationImportWorkflowService {
  public constructor(private readonly repository: PublicationImportWorkflowRepository) {}

  public async list(command?: {
    readonly publisherId?: string;
  }): Promise<PublicationImportWorkflowListDto> {
    const batches = await this.repository.list(command);

    return {
      batches,
      generatedAt: new Date().toISOString(),
      publisherId: command?.publisherId,
      summary: {
        diagnosed: batches.filter((batch) => batch.status === "diagnosed").length,
        imported: batches.filter((batch) => batch.status === "imported").length,
        needsCorrection: batches.filter((batch) => batch.status === "needs_correction").length,
        readyForReview: batches.filter((batch) => batch.status === "ready_for_review").length,
        total: batches.length,
        uploaded: batches.filter((batch) => batch.status === "uploaded").length,
      },
    };
  }

  public async record(command: {
    readonly batchLabel: string;
    readonly fileName: string;
    readonly message: string;
    readonly publisherId: string;
    readonly relativeSourcePath: string;
    readonly sheet?: string;
    readonly status: PublicationImportWorkflowStatus;
  }): Promise<PublicationImportWorkflowBatchDetailDto> {
    return this.repository.record(command);
  }

  public async submitForReview(command: {
    readonly relativeSourcePath: string;
  }): Promise<PublicationImportWorkflowBatchDetailDto> {
    const current = await this.repository.read(command);

    if (current === null) {
      throw ApplicationError.notFound("Publication import batch was not found.");
    }

    if (!canSubmitForReview(current.batch.status)) {
      throw ApplicationError.validation("Publication import batch is not ready for review.");
    }

    return this.repository.record({
      batchLabel: current.batch.batchLabel,
      fileName: current.batch.fileName,
      message: "Lote enviado a revisión nacional.",
      publisherId: current.batch.publisherId,
      relativeSourcePath: current.batch.relativeSourcePath,
      sheet: current.batch.sheet,
      status: "ready_for_review",
    });
  }
}

function canSubmitForReview(status: PublicationImportWorkflowStatus): boolean {
  return status === "diagnosed" || status === "dry_run_completed" || status === "previewed";
}
