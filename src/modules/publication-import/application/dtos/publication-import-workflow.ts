export type PublicationImportWorkflowStatus =
  | "approved"
  | "diagnosed"
  | "dry_run_completed"
  | "imported"
  | "needs_correction"
  | "previewed"
  | "ready_for_review"
  | "rejected"
  | "uploaded";

export interface PublicationImportWorkflowBatchDto {
  readonly batchLabel: string;
  readonly createdAt: string;
  readonly fileName: string;
  readonly lastEventAt: string;
  readonly publisherId: string;
  readonly relativeSourcePath: string;
  readonly sheet?: string;
  readonly status: PublicationImportWorkflowStatus;
  readonly updatedAt: string;
}

export interface PublicationImportWorkflowEventDto {
  readonly at: string;
  readonly message: string;
  readonly status: PublicationImportWorkflowStatus;
}

export interface PublicationImportWorkflowBatchDetailDto {
  readonly batch: PublicationImportWorkflowBatchDto;
  readonly events: readonly PublicationImportWorkflowEventDto[];
}

export interface PublicationImportWorkflowListDto {
  readonly generatedAt: string;
  readonly publisherId?: string;
  readonly summary: {
    readonly total: number;
    readonly uploaded: number;
    readonly diagnosed: number;
    readonly readyForReview: number;
    readonly imported: number;
    readonly needsCorrection: number;
  };
  readonly batches: readonly PublicationImportWorkflowBatchDto[];
}
