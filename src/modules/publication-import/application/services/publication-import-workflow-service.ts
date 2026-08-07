import { ApplicationError } from "@/modules/catalog/application";

import {
  PublicationImportWorkflowBatchDetailDto,
  PublicationImportWorkflowBatchDto,
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

    return buildListDto(batches, command?.publisherId);
  }

  public async listReviewQueue(): Promise<PublicationImportWorkflowListDto> {
    const batches = await this.repository.list();

    return buildListDto(
      batches.filter((batch) => batch.status === "ready_for_review"),
      undefined,
    );
  }

  public async assertApprovedForCommit(command: {
    readonly relativeSourcePath: string;
  }): Promise<void> {
    const current = await this.get(command);

    if (current.batch.status !== "approved") {
      throw ApplicationError.validation("Publication import batch must be approved before commit.");
    }
  }

  public async get(command: {
    readonly relativeSourcePath: string;
  }): Promise<PublicationImportWorkflowBatchDetailDto> {
    const current = await this.repository.read(command);

    if (current === null) {
      throw ApplicationError.notFound("Publication import batch was not found.");
    }

    return current;
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

  public async review(command: {
    readonly decision: "approved" | "rejected";
    readonly message?: string;
    readonly relativeSourcePath: string;
  }): Promise<PublicationImportWorkflowBatchDetailDto> {
    const current = await this.repository.read({
      relativeSourcePath: command.relativeSourcePath,
    });

    if (current === null) {
      throw ApplicationError.notFound("Publication import batch was not found.");
    }

    if (current.batch.status !== "ready_for_review") {
      throw ApplicationError.validation("Publication import batch is not pending national review.");
    }

    const customMessage = command.message?.trim();
    const defaultMessage =
      command.decision === "approved"
        ? "Lote aprobado para preparación de commit."
        : "Lote rechazado en revisión nacional.";
    const reviewMessage =
      customMessage !== undefined && customMessage.length > 0 ? customMessage : defaultMessage;

    return this.repository.record({
      batchLabel: current.batch.batchLabel,
      fileName: current.batch.fileName,
      message: reviewMessage,
      publisherId: current.batch.publisherId,
      relativeSourcePath: current.batch.relativeSourcePath,
      sheet: current.batch.sheet,
      status: command.decision,
    });
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

function buildListDto(
  batches: readonly PublicationImportWorkflowBatchDto[],
  publisherId: string | undefined,
): PublicationImportWorkflowListDto {
  return {
    batches,
    generatedAt: new Date().toISOString(),
    publisherId,
    summary: {
      approved: batches.filter((batch) => batch.status === "approved").length,
      diagnosed: batches.filter((batch) => batch.status === "diagnosed").length,
      imported: batches.filter((batch) => batch.status === "imported").length,
      needsCorrection: batches.filter((batch) => batch.status === "needs_correction").length,
      readyForReview: batches.filter((batch) => batch.status === "ready_for_review").length,
      rejected: batches.filter((batch) => batch.status === "rejected").length,
      total: batches.length,
      uploaded: batches.filter((batch) => batch.status === "uploaded").length,
    },
  };
}

function canSubmitForReview(status: PublicationImportWorkflowStatus): boolean {
  return status === "diagnosed" || status === "dry_run_completed" || status === "previewed";
}
