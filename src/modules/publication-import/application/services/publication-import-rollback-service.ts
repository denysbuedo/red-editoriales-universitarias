import { randomUUID } from "node:crypto";

import { PublicationImportRollbackDto } from "../dtos";
import { PublicationImportAuditRepository } from "../ports/publication-import-audit-repository";
import { PublicationImportRollbackExecutor } from "../ports/publication-import-rollback-executor";
import {
  PublicationImportRollbackPlanCommand,
  PublicationImportRollbackPlanService,
} from "./publication-import-rollback-plan-service";

import { ApplicationError } from "@/modules/catalog/application";

export class PublicationImportRollbackService {
  public constructor(
    private readonly planService: PublicationImportRollbackPlanService,
    private readonly executor: PublicationImportRollbackExecutor,
    private readonly auditRepository: PublicationImportAuditRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async rollback(
    command: PublicationImportRollbackPlanCommand,
  ): Promise<PublicationImportRollbackDto> {
    const plan = await this.planService.plan(command);

    if (plan.status === "blocked") {
      throw ApplicationError.validation("Publication import rollback plan is blocked.");
    }

    const deleted = await this.executor.execute(plan.operations);
    const result: PublicationImportRollbackDto = {
      rollbackId: randomUUID(),
      auditId: plan.auditId,
      rolledBackAt: this.now().toISOString(),
      status: "rolled_back",
      summary: {
        deletedItems: deleted.filter((resource) => resource.type === "item").length,
        deletedMedia: deleted.filter((resource) => resource.type === "media").length,
      },
      deleted,
    };

    await this.auditRepository.appendRollback(result);

    return result;
  }
}
