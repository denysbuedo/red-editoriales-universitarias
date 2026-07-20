import path from "node:path";

import { createCatalogRepositoriesAsync } from "@/modules/catalog/infrastructure";

import { PublicationImportAuthoritiesService } from "../../application/services/publication-import-authorities-service";
import { PublicationImportCommitPlanService } from "../../application/services/publication-import-commit-plan-service";
import { PublicationImportDiagnosisService } from "../../application/services/publication-import-diagnosis-service";
import { PublicationImportDryRunService } from "../../application/services/publication-import-dry-run-service";
import { PublicationImportMappingPreviewService } from "../../application/services/publication-import-mapping-preview-service";
import {
  CatalogPublicationImportDuplicateLookup,
  PythonPublicationSpreadsheetDiagnosticsRunner,
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

function readPublicationImportOptions(): { readonly importRoot: string } {
  const importRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.PNPU_PUBLICATION_IMPORT_ROOT ?? "Readme",
  );

  return { importRoot };
}
