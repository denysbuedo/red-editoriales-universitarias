import {
  PublicationImportCommitCreatedResourceDto,
  PublicationImportDryRunCandidateDto,
} from "../dtos";

export interface PublicationImportCommitWriter {
  commit(
    candidates: readonly PublicationImportDryRunCandidateDto[],
  ): Promise<readonly PublicationImportCommitCreatedResourceDto[]>;
}
