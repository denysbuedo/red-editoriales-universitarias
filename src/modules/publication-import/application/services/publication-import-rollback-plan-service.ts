import {
  PublicationImportAuditEntryDto,
  PublicationImportRollbackPlanDto,
  PublicationImportRollbackPlanOperationDto,
  PublicationImportRollbackPlanRiskDto,
} from "../dtos";
import { PublicationImportAuditRepository } from "../ports/publication-import-audit-repository";
import {
  PublicationImportRollbackVerifiedResource,
  PublicationImportRollbackVerifier,
} from "../ports/publication-import-rollback-verifier";
import { PublicationImportDiagnosisServiceOptions } from "./publication-import-diagnosis-service";

import { ApplicationError } from "@/modules/catalog/application";

export interface PublicationImportRollbackPlanCommand {
  readonly auditId: string;
}

export class PublicationImportRollbackPlanService {
  public constructor(
    private readonly auditRepository: PublicationImportAuditRepository,
    private readonly verifier: PublicationImportRollbackVerifier,
    private readonly options: PublicationImportDiagnosisServiceOptions,
  ) {}

  public async plan(
    command: PublicationImportRollbackPlanCommand,
  ): Promise<PublicationImportRollbackPlanDto> {
    const auditId = command.auditId.trim();

    if (auditId.length === 0) {
      throw ApplicationError.validation("Publication import auditId is required.");
    }

    const auditEntry = await this.auditRepository.get(auditId);

    if (auditEntry === null) {
      throw ApplicationError.notFound("Publication import audit entry was not found.");
    }

    const verifiedResources = await this.verifier.verify(auditEntry.created);
    const risks = buildRollbackRisks(auditEntry, verifiedResources);
    const operations = risks.length === 0 ? buildRollbackOperations(auditEntry) : [];

    return {
      generatedAt: (this.options.now?.() ?? new Date()).toISOString(),
      auditId,
      status: risks.length === 0 ? "planned_not_executed" : "blocked",
      summary: {
        items: auditEntry.summary.createdItems,
        media: auditEntry.summary.createdMedia,
        operations: operations.length,
        risks: risks.length,
      },
      operations,
      risks,
    };
  }
}

function buildRollbackRisks(
  auditEntry: PublicationImportAuditEntryDto,
  verifiedResources: readonly PublicationImportRollbackVerifiedResource[],
): readonly PublicationImportRollbackPlanRiskDto[] {
  const risks: PublicationImportRollbackPlanRiskDto[] = [];

  for (const resource of auditEntry.created) {
    const verifiedResource = verifiedResources.find(
      (value) => value.omekaItemId === resource.omekaItemId,
    );

    if (resource.omekaItemModified === undefined) {
      risks.push({
        code: "missingModificationBaseline",
        message: "Audit entry does not include Omeka item modification baseline.",
        omekaId: resource.omekaItemId,
        pnpuUuid: resource.pnpuUuid,
      });
    }

    if (verifiedResource?.itemExists !== true) {
      risks.push({
        code: "omekaItemMissing",
        message: "Omeka item is missing.",
        omekaId: resource.omekaItemId,
        pnpuUuid: resource.pnpuUuid,
      });
      continue;
    }

    if (verifiedResource.currentPnpuUuid !== resource.pnpuUuid) {
      risks.push({
        code: "pnpuUuidMismatch",
        message: "Omeka item pnpu:uuid does not match the audit manifest.",
        omekaId: resource.omekaItemId,
        pnpuUuid: resource.pnpuUuid,
      });
    }

    if (
      resource.omekaItemModified !== undefined &&
      verifiedResource.currentItemModified !== resource.omekaItemModified
    ) {
      risks.push({
        code: "resourceModifiedAfterImport",
        message: "Omeka item was modified after the import commit.",
        omekaId: resource.omekaItemId,
        pnpuUuid: resource.pnpuUuid,
      });
    }

    if (resource.omekaMediaId !== undefined && !verifiedResource.mediaExists) {
      risks.push({
        code: "omekaMediaMissing",
        message: "Omeka media is missing.",
        omekaId: resource.omekaMediaId,
        pnpuUuid: resource.pnpuUuid,
      });
    }
  }

  return risks;
}

function buildRollbackOperations(
  auditEntry: PublicationImportAuditEntryDto,
): readonly PublicationImportRollbackPlanOperationDto[] {
  const operations: PublicationImportRollbackPlanOperationDto[] = [];

  for (const resource of auditEntry.created) {
    if (resource.omekaMediaId !== undefined) {
      operations.push({
        type: "deleteDigitalResourceMedia",
        target: "Omeka S Media",
        omekaId: resource.omekaMediaId,
        pnpuUuid: resource.pnpuUuid,
      });
    }

    operations.push({
      type: "deletePublicationItem",
      target: "Omeka S Item",
      omekaId: resource.omekaItemId,
      pnpuUuid: resource.pnpuUuid,
    });
  }

  return operations;
}
