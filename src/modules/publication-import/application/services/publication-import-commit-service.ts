import { randomUUID } from "node:crypto";

import { PublicationImportCommitDto } from "../dtos";
import { PublicationImportAuditRepository } from "../ports/publication-import-audit-repository";
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
    private readonly auditRepository?: PublicationImportAuditRepository,
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
    const generatedAt = (this.options.now?.() ?? new Date()).toISOString();
    const auditId = randomUUID();
    const summary = {
      candidates: importPackage.candidates.length,
      createdItems: created.length,
      createdMedia: created.filter((resource) => resource.omekaMediaId !== undefined).length,
    };

    await this.auditRepository?.append({
      id: auditId,
      committedAt: generatedAt,
      source: importPackage.manifest.source,
      sheet: importPackage.manifest.sheet,
      status: "committed",
      summary,
      created,
    });

    return {
      auditId,
      generatedAt,
      source: importPackage.manifest.source,
      sheet: importPackage.manifest.sheet,
      status: "committed",
      summary,
      created,
    };
  }
}
