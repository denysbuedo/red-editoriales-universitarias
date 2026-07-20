import { PublicationImportCommitDto } from "../dtos";
import { PublicationImportCommitWriter } from "../ports/publication-import-commit-writer";
import {
  PublicationImportCommitPlanService,
  readReadyPublicationImportPackage,
} from "./publication-import-commit-plan-service";
import { PublicationImportDiagnosisServiceOptions } from "./publication-import-diagnosis-service";

import { ApplicationError } from "@/modules/catalog/application";

export interface PublicationImportCommitCommand {
  readonly packageJson: string;
}

export class PublicationImportCommitService {
  public constructor(
    private readonly planService: PublicationImportCommitPlanService,
    private readonly writer: PublicationImportCommitWriter,
    private readonly options: PublicationImportDiagnosisServiceOptions,
  ) {}

  public async commit(
    command: PublicationImportCommitCommand,
  ): Promise<PublicationImportCommitDto> {
    const plan = await this.planService.plan(command);

    if (plan.status === "blocked") {
      throw ApplicationError.validation("Publication import commit plan is blocked.");
    }

    const importPackage = readReadyPublicationImportPackage(command.packageJson);
    const created = await this.writer.commit(importPackage.candidates);

    return {
      generatedAt: (this.options.now?.() ?? new Date()).toISOString(),
      source: importPackage.manifest.source,
      sheet: importPackage.manifest.sheet,
      status: "committed",
      summary: {
        candidates: importPackage.candidates.length,
        createdItems: created.length,
        createdMedia: created.filter((resource) => resource.omekaMediaId !== undefined).length,
      },
      created,
    };
  }
}
