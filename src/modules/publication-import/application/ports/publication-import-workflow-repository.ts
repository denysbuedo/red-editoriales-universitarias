import {
  PublicationImportWorkflowBatchDetailDto,
  PublicationImportWorkflowBatchDto,
  PublicationImportWorkflowStatus,
} from "../dtos";

export interface PublicationImportWorkflowRecordCommand {
  readonly batchLabel: string;
  readonly fileName: string;
  readonly message: string;
  readonly publisherId: string;
  readonly relativeSourcePath: string;
  readonly sheet?: string;
  readonly status: PublicationImportWorkflowStatus;
}

export interface PublicationImportWorkflowRepository {
  list(command?: {
    readonly publisherId?: string;
  }): Promise<readonly PublicationImportWorkflowBatchDto[]>;
  read(command: {
    readonly relativeSourcePath: string;
  }): Promise<PublicationImportWorkflowBatchDetailDto | null>;
  record(
    command: PublicationImportWorkflowRecordCommand,
  ): Promise<PublicationImportWorkflowBatchDetailDto>;
}
