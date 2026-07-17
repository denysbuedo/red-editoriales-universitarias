import {
  ApplicationError,
  CollectionRepository,
  ContributorRepository,
  PublicationRepository,
  PublisherRepository,
  SubjectRepository,
} from "../application";
import {
  createSampleCatalogData,
  InMemoryCollectionRepository,
  InMemoryContributorRepository,
  InMemoryPublicationRepository,
  InMemoryPublisherRepository,
  InMemorySubjectRepository,
} from "./in-memory";
import {
  createOmekaCatalogRepositoriesFromApi,
  HttpOmekaApiClient,
  readOmekaConfig,
} from "./omeka";

export type CatalogRepositoryMode = "in-memory" | "omeka";

export interface CatalogRepositories {
  readonly contributorRepository: ContributorRepository;
  readonly collectionRepository: CollectionRepository;
  readonly publicationRepository: PublicationRepository;
  readonly publisherRepository: PublisherRepository;
  readonly subjectRepository: SubjectRepository;
  readonly mode: CatalogRepositoryMode;
}

interface CatalogRepositoryEnvironment {
  readonly [key: string]: string | undefined;
  readonly PNPU_CATALOG_REPOSITORY?: string;
  readonly PNPU_OMEKA_MAX_PAGES?: string;
  readonly PNPU_OMEKA_PAGE_SIZE?: string;
  readonly PNPU_OMEKA_CACHE_TTL_SECONDS?: string;
  readonly PNPU_OMEKA_REQUIRE_APPROVED_MAPPING?: string;
}

export function createCatalogRepositories(
  environment: CatalogRepositoryEnvironment = process.env,
): CatalogRepositories {
  const mode = readCatalogRepositoryMode(environment);

  if (mode === "omeka") {
    throw ApplicationError.validation(
      "Omeka catalog repository requires an approved Omeka-to-PNPU mapping before activation.",
    );
  }

  const sampleData = createSampleCatalogData();

  return {
    mode,
    collectionRepository: new InMemoryCollectionRepository(sampleData.collections),
    contributorRepository: new InMemoryContributorRepository(sampleData.contributors),
    publicationRepository: new InMemoryPublicationRepository(sampleData.publications),
    publisherRepository: new InMemoryPublisherRepository(sampleData.publishers),
    subjectRepository: new InMemorySubjectRepository(sampleData.subjects),
  };
}

export async function createCatalogRepositoriesAsync(
  environment: CatalogRepositoryEnvironment = process.env,
): Promise<CatalogRepositories> {
  const mode = readCatalogRepositoryMode(environment);

  if (mode === "in-memory") {
    return createCatalogRepositories(environment);
  }

  assertOmekaRepositoryActivation(environment);

  const config = readOmekaConfig(environment);

  if (config === null) {
    throw ApplicationError.validation(
      "PNPU_OMEKA_BASE_URL is required when PNPU_CATALOG_REPOSITORY is omeka.",
    );
  }

  const { catalog, repositories } = await createOmekaCatalogRepositoriesFromApi(
    new HttpOmekaApiClient(config),
    readOmekaCatalogRepositoryOptions(environment, config.baseUrl),
  );

  if (catalog.quality.rejectedCount > 0) {
    throw ApplicationError.serviceUnavailable(
      "Omeka S catalog contains PNPU mapping errors and cannot be used as active repository.",
    );
  }

  return {
    mode,
    collectionRepository: repositories.collections,
    contributorRepository: repositories.contributors,
    publicationRepository: repositories.publications,
    publisherRepository: repositories.publishers,
    subjectRepository: repositories.subjects,
  };
}

export function readCatalogRepositoryMode(
  environment: CatalogRepositoryEnvironment = process.env,
): CatalogRepositoryMode {
  const value = environment.PNPU_CATALOG_REPOSITORY?.trim();

  if (value === undefined || value.length === 0) {
    return "in-memory";
  }

  if (value === "in-memory" || value === "omeka") {
    return value;
  }

  throw ApplicationError.validation("PNPU_CATALOG_REPOSITORY must be in-memory or omeka.");
}

export function readOmekaCatalogRepositoryOptions(
  environment: CatalogRepositoryEnvironment,
  baseUrl: string,
): {
  readonly pageSize?: number;
  readonly maxPages?: number;
  readonly cacheKey: string;
  readonly ttlMs: number;
} {
  return {
    pageSize: readOptionalPositiveInteger(environment.PNPU_OMEKA_PAGE_SIZE, "PNPU_OMEKA_PAGE_SIZE"),
    maxPages: readOptionalPositiveInteger(environment.PNPU_OMEKA_MAX_PAGES, "PNPU_OMEKA_MAX_PAGES"),
    cacheKey: buildOmekaCatalogCacheKey(environment, baseUrl),
    ttlMs: readOptionalNonNegativeInteger(
      environment.PNPU_OMEKA_CACHE_TTL_SECONDS,
      "PNPU_OMEKA_CACHE_TTL_SECONDS",
    ),
  };
}

function assertOmekaRepositoryActivation(environment: CatalogRepositoryEnvironment): void {
  if (environment.PNPU_OMEKA_REQUIRE_APPROVED_MAPPING !== "true") {
    throw ApplicationError.validation(
      "Omeka catalog repository requires PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true before activation.",
    );
  }
}

function readOptionalPositiveInteger(value: string | undefined, name: string): number | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw ApplicationError.validation(`${name} must be a positive integer.`);
  }

  return parsedValue;
}

function readOptionalNonNegativeInteger(value: string | undefined, name: string): number {
  if (value === undefined || value.trim().length === 0) {
    return 60_000;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw ApplicationError.validation(`${name} must be a non-negative integer.`);
  }

  return parsedValue * 1_000;
}

function buildOmekaCatalogCacheKey(
  environment: CatalogRepositoryEnvironment,
  baseUrl: string,
): string {
  return [
    baseUrl,
    environment.PNPU_OMEKA_PAGE_SIZE?.trim() ?? "",
    environment.PNPU_OMEKA_MAX_PAGES?.trim() ?? "",
  ].join("|");
}
