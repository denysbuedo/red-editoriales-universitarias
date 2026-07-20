import {
  PublicationImportRollbackDeletedResourceDto,
  PublicationImportRollbackPlanOperationDto,
} from "../dtos";

export interface PublicationImportRollbackExecutor {
  execute(
    operations: readonly PublicationImportRollbackPlanOperationDto[],
  ): Promise<readonly PublicationImportRollbackDeletedResourceDto[]>;
}
