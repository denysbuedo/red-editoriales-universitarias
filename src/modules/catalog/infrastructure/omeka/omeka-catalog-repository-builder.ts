import {
  OmekaCatalogSnapshotLoader,
  OmekaCatalogSnapshotLoaderOptions,
} from "./omeka-catalog-snapshot-loader";
import { OmekaApiClient } from "./omeka-api-client";
import {
  createOmekaCatalogRepositories,
  OmekaCatalogRepositories,
} from "./omeka-catalog-repositories";
import { mapOmekaSnapshotToPnpuCatalog, OmekaPnpuCatalog } from "./omeka-pnpu-catalog-mapper";

export interface OmekaCatalogRepositoryBuildResult {
  readonly catalog: OmekaPnpuCatalog;
  readonly repositories: OmekaCatalogRepositories;
  readonly cache: OmekaCatalogRepositoryCacheStatus;
}

export interface OmekaCatalogRepositoryCacheOptions {
  readonly cacheKey?: string;
  readonly ttlMs?: number;
  readonly now?: () => number;
}

export interface OmekaCatalogRepositoryCacheStatus {
  readonly hit: boolean;
  readonly enabled: boolean;
  readonly refreshedAt: string;
  readonly expiresAt?: string;
}

export interface OmekaCatalogRepositoryCacheSnapshot {
  readonly enabled: boolean;
  readonly present: boolean;
  readonly fresh: boolean;
  readonly refreshedAt?: string;
  readonly expiresAt?: string;
}

export async function createOmekaCatalogRepositoriesFromApi(
  client: OmekaApiClient,
  options: OmekaCatalogSnapshotLoaderOptions & OmekaCatalogRepositoryCacheOptions = {},
): Promise<OmekaCatalogRepositoryBuildResult> {
  const now = options.now ?? Date.now;
  const cacheKey = options.cacheKey;
  const ttlMs = options.ttlMs ?? 0;

  if (cacheKey !== undefined && ttlMs > 0) {
    const cachedEntry = omekaCatalogRepositoryCache.get(cacheKey);

    if (cachedEntry !== undefined && cachedEntry.expiresAtEpochMs > now()) {
      return {
        ...cachedEntry.result,
        cache: {
          hit: true,
          enabled: true,
          refreshedAt: cachedEntry.result.cache.refreshedAt,
          expiresAt: new Date(cachedEntry.expiresAtEpochMs).toISOString(),
        },
      };
    }
  }

  const snapshot = await new OmekaCatalogSnapshotLoader(client, options).load();
  const catalog = mapOmekaSnapshotToPnpuCatalog(snapshot);
  const refreshedAtEpochMs = now();
  const result: OmekaCatalogRepositoryBuildResult = {
    catalog,
    repositories: createOmekaCatalogRepositories(catalog),
    cache: {
      hit: false,
      enabled: cacheKey !== undefined && ttlMs > 0,
      refreshedAt: new Date(refreshedAtEpochMs).toISOString(),
      expiresAt:
        cacheKey !== undefined && ttlMs > 0
          ? new Date(refreshedAtEpochMs + ttlMs).toISOString()
          : undefined,
    },
  };

  if (cacheKey !== undefined && ttlMs > 0) {
    omekaCatalogRepositoryCache.set(cacheKey, {
      expiresAtEpochMs: refreshedAtEpochMs + ttlMs,
      result,
    });
  }

  return result;
}

export function readOmekaCatalogRepositoryCacheSnapshot(
  options: OmekaCatalogRepositoryCacheOptions = {},
): OmekaCatalogRepositoryCacheSnapshot {
  const now = options.now ?? Date.now;
  const cacheKey = options.cacheKey;
  const ttlMs = options.ttlMs ?? 0;

  if (cacheKey === undefined || ttlMs <= 0) {
    return {
      enabled: false,
      present: false,
      fresh: false,
    };
  }

  const entry = omekaCatalogRepositoryCache.get(cacheKey);

  if (entry === undefined) {
    return {
      enabled: true,
      present: false,
      fresh: false,
    };
  }

  return {
    enabled: true,
    present: true,
    fresh: entry.expiresAtEpochMs > now(),
    refreshedAt: entry.result.cache.refreshedAt,
    expiresAt: new Date(entry.expiresAtEpochMs).toISOString(),
  };
}

export function invalidateOmekaCatalogRepositoryCache(cacheKey: string): boolean {
  return omekaCatalogRepositoryCache.delete(cacheKey);
}

interface OmekaCatalogRepositoryCacheEntry {
  readonly expiresAtEpochMs: number;
  readonly result: OmekaCatalogRepositoryBuildResult;
}

type OmekaCatalogRepositoryCacheGlobal = typeof globalThis & {
  __pnpuOmekaCatalogRepositoryCache?: Map<string, OmekaCatalogRepositoryCacheEntry>;
};

const omekaCatalogRepositoryCacheGlobal = globalThis as OmekaCatalogRepositoryCacheGlobal;
const omekaCatalogRepositoryCache =
  omekaCatalogRepositoryCacheGlobal.__pnpuOmekaCatalogRepositoryCache ??
  new Map<string, OmekaCatalogRepositoryCacheEntry>();

omekaCatalogRepositoryCacheGlobal.__pnpuOmekaCatalogRepositoryCache = omekaCatalogRepositoryCache;
