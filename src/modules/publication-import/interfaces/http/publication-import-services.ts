import path from "node:path";

import { createCatalogRepositoriesAsync } from "@/modules/catalog/infrastructure";

import { PublicationImportAuthoritiesService } from "../../application/services/publication-import-authorities-service";
import { PublicationImportAuditService } from "../../application/services/publication-import-audit-service";
import { PublicationImportCommitPlanService } from "../../application/services/publication-import-commit-plan-service";
import { PublicationImportCommitService } from "../../application/services/publication-import-commit-service";
import { PublicationImportDiagnosisService } from "../../application/services/publication-import-diagnosis-service";
import { PublicationImportDryRunService } from "../../application/services/publication-import-dry-run-service";
import { PublicationImportMappingPreviewService } from "../../application/services/publication-import-mapping-preview-service";
import { PublicationImportRollbackPlanService } from "../../application/services/publication-import-rollback-plan-service";
import { PublicationImportRollbackService } from "../../application/services/publication-import-rollback-service";
import {
  CatalogPublicationImportDuplicateLookup,
  FilePublicationImportAuditRepository,
  OmekaPublicationImportCommitWriter,
  OmekaPublicationImportRollbackExecutor,
  OmekaPublicationImportRollbackVerifier,
  PythonPublicationSpreadsheetDiagnosticsRunner,
  readOmekaImportWriterConfig,
} from "../../infrastructure";

export function createPublicationImportDiagnosisService(): PublicationImportDiagnosisService {
  return new PublicationImportDiagnosisService(
    new PythonPublicationSpreadsheetDiagnosticsRunner(),
    readPublicationImportOptions(),
  );
}

export function createPublicationImportMappingPreviewService(): PublicationImportMappingPreviewService {
  return new PublicationImportMappingPreviewService(
    new PythonPublicationSpreadsheetDiagnosticsRunner(),
    readPublicationImportOptions(),
  );
}

export function createPublicationImportDryRunService(): PublicationImportDryRunService {
  const options = readPublicationImportOptions();
  return new PublicationImportDryRunService(
    new PublicationImportMappingPreviewService(
      new PythonPublicationSpreadsheetDiagnosticsRunner(),
      options,
    ),
    options,
  );
}

export async function createPublicationImportCommitPlanService(): Promise<PublicationImportCommitPlanService> {
  const repositories = await createCatalogRepositoriesAsync();

  return new PublicationImportCommitPlanService(
    readPublicationImportOptions(),
    new CatalogPublicationImportDuplicateLookup(repositories.publicationRepository),
  );
}

export async function createPublicationImportCommitService(): Promise<PublicationImportCommitService> {
  if (process.env.PNPU_OMEKA_IMPORT_ENABLED !== "true") {
    throw new Error("PNPU_OMEKA_IMPORT_ENABLED must be true to commit imports.");
  }

  const writerConfig = readOmekaImportWriterConfig();

  if (writerConfig === null) {
    throw new Error("Omeka import writer is not configured.");
  }

  const repositories = await createCatalogRepositoriesAsync();
  const options = readPublicationImportOptions();
  const planService = new PublicationImportCommitPlanService(
    options,
    new CatalogPublicationImportDuplicateLookup(repositories.publicationRepository),
  );

  return new PublicationImportCommitService(
    planService,
    new OmekaPublicationImportCommitWriter(writerConfig),
    options,
    new FilePublicationImportAuditRepository(readPublicationImportAuditDirectory()),
  );
}

export async function createPublicationImportAuthoritiesService(): Promise<PublicationImportAuthoritiesService> {
  const repositories = await createCatalogRepositoriesAsync();

  return new PublicationImportAuthoritiesService(
    {
      contributorRepository: repositories.contributorRepository,
      publisherRepository: repositories.publisherRepository,
      subjectRepository: repositories.subjectRepository,
    },
    readPublicationImportOptions(),
  );
}

export function createPublicationImportAuditService(): PublicationImportAuditService {
  return new PublicationImportAuditService(
    new FilePublicationImportAuditRepository(readPublicationImportAuditDirectory()),
    readPublicationImportOptions(),
  );
}

export function createPublicationImportRollbackPlanService(): PublicationImportRollbackPlanService {
  const writerConfig = readOmekaImportWriterConfig();

  if (writerConfig === null) {
    throw new Error("Omeka rollback verifier is not configured.");
  }

  return new PublicationImportRollbackPlanService(
    new FilePublicationImportAuditRepository(readPublicationImportAuditDirectory()),
    new OmekaPublicationImportRollbackVerifier(writerConfig),
    readPublicationImportOptions(),
  );
}

export function createPublicationImportRollbackService(): PublicationImportRollbackService {
  if (process.env.PNPU_OMEKA_ROLLBACK_ENABLED !== "true") {
    throw new Error("PNPU_OMEKA_ROLLBACK_ENABLED must be true to rollback imports.");
  }

  const writerConfig = readOmekaImportWriterConfig();

  if (writerConfig === null) {
    throw new Error("Omeka rollback executor is not configured.");
  }

  const auditRepository = new FilePublicationImportAuditRepository(
    readPublicationImportAuditDirectory(),
  );
  const planService = new PublicationImportRollbackPlanService(
    auditRepository,
    new OmekaPublicationImportRollbackVerifier(writerConfig),
    readPublicationImportOptions(),
  );

  return new PublicationImportRollbackService(
    planService,
    new OmekaPublicationImportRollbackExecutor(writerConfig),
    auditRepository,
  );
}

function readPublicationImportOptions(): { readonly importRoot: string } {
  const importRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.PNPU_PUBLICATION_IMPORT_ROOT ?? "Readme",
  );

  return { importRoot };
}

function readPublicationImportAuditDirectory(): string {
  const configuredDirectory = process.env.PNPU_PUBLICATION_IMPORT_AUDIT_DIR ?? ".pnpu/import-audit";

  return path.isAbsolute(configuredDirectory)
    ? configuredDirectory
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredDirectory);
}
