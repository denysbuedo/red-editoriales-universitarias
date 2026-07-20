export type PublicationImportCommitPlanOperationTypeDto =
  | "createPublicationItem"
  | "linkContributors"
  | "linkPublisher"
  | "linkSubjects"
  | "attachDigitalResource"
  | "recordBatchAudit";

export interface PublicationImportCommitPlanOperationDto {
  readonly type: PublicationImportCommitPlanOperationTypeDto;
  readonly row?: number;
  readonly target: string;
  readonly payload: Readonly<Record<string, string | readonly string[]>>;
}

export interface PublicationImportCommitPlanRiskDto {
  readonly row?: number;
  readonly code: string;
  readonly message: string;
}

export interface PublicationImportCommitPlanDto {
  readonly generatedAt: string;
  readonly source: string;
  readonly sheet: string;
  readonly status: "planned_not_executed" | "blocked";
  readonly summary: {
    readonly candidates: number;
    readonly operations: number;
    readonly risks: number;
  };
  readonly operations: readonly PublicationImportCommitPlanOperationDto[];
  readonly risks: readonly PublicationImportCommitPlanRiskDto[];
}
