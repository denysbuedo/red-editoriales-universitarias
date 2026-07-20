export type PublicationImportRollbackPlanStatusDto = "blocked" | "planned_not_executed";

export type PublicationImportRollbackPlanOperationTypeDto =
  "deleteDigitalResourceMedia" | "deletePublicationItem";

export interface PublicationImportRollbackPlanOperationDto {
  readonly type: PublicationImportRollbackPlanOperationTypeDto;
  readonly target: string;
  readonly omekaId: number;
  readonly pnpuUuid: string;
}

export interface PublicationImportRollbackPlanRiskDto {
  readonly code:
    | "missingModificationBaseline"
    | "omekaItemMissing"
    | "omekaMediaMissing"
    | "pnpuUuidMismatch"
    | "resourceModifiedAfterImport";
  readonly message: string;
  readonly omekaId: number;
  readonly pnpuUuid: string;
}

export interface PublicationImportRollbackPlanDto {
  readonly generatedAt: string;
  readonly auditId: string;
  readonly status: PublicationImportRollbackPlanStatusDto;
  readonly summary: {
    readonly items: number;
    readonly media: number;
    readonly operations: number;
    readonly risks: number;
  };
  readonly operations: readonly PublicationImportRollbackPlanOperationDto[];
  readonly risks: readonly PublicationImportRollbackPlanRiskDto[];
}
