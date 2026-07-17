import { describe, expect, it } from "vitest";
import { OmekaApiClient, OmekaJsonObject } from "./omeka-api-client";
import {
  createOmekaCatalogRepositoriesFromApi,
  invalidateOmekaCatalogRepositoryCache,
  readOmekaCatalogRepositoryCacheSnapshot,
} from "./omeka-catalog-repository-builder";
import { createCompleteOmekaCatalogSnapshot } from "./omeka-test-fixtures";

class FakeOmekaApiClient implements OmekaApiClient {
  public itemListCalls = 0;

  public constructor(
    private readonly items: readonly OmekaJsonObject[],
    private readonly itemSets: readonly OmekaJsonObject[],
    private readonly media: readonly OmekaJsonObject[],
    private readonly resourceTemplates: readonly OmekaJsonObject[],
  ) {}

  public listItems(request: {
    readonly page: number;
    readonly pageSize: number;
  }): Promise<readonly OmekaJsonObject[]> {
    this.itemListCalls += 1;

    return Promise.resolve(page(this.items, request));
  }

  public getItem(id: number): Promise<OmekaJsonObject | null> {
    return Promise.resolve(this.items.find((item) => item["o:id"] === id) ?? null);
  }

  public listItemSets(request: {
    readonly page: number;
    readonly pageSize: number;
  }): Promise<readonly OmekaJsonObject[]> {
    return Promise.resolve(page(this.itemSets, request));
  }

  public listMedia(request: {
    readonly page: number;
    readonly pageSize: number;
  }): Promise<readonly OmekaJsonObject[]> {
    return Promise.resolve(page(this.media, request));
  }

  public listProperties(): Promise<readonly OmekaJsonObject[]> {
    return Promise.resolve([]);
  }

  public listResourceTemplates(request: {
    readonly page: number;
    readonly pageSize: number;
  }): Promise<readonly OmekaJsonObject[]> {
    return Promise.resolve(page(this.resourceTemplates, request));
  }

  public listVocabularies(): Promise<readonly OmekaJsonObject[]> {
    return Promise.resolve([]);
  }
}

describe("createOmekaCatalogRepositoriesFromApi", () => {
  it("builds application repositories from an Omeka API client", async () => {
    const snapshot = createCompleteOmekaCatalogSnapshot();
    const client = new FakeOmekaApiClient(
      snapshot.items,
      snapshot.itemSets,
      snapshot.media,
      snapshot.resourceTemplates,
    );
    const result = await createOmekaCatalogRepositoriesFromApi(client, {
      pageSize: 2,
      maxPages: 10,
    });
    const publications = await result.repositories.publications.list({
      page: 1,
      pageSize: 10,
    });

    expect(result.catalog.quality.rejectedCount).toBe(0);
    expect(result.cache).toMatchObject({
      enabled: false,
      hit: false,
    });
    expect(publications.pagination.total).toBe(1);
    expect(publications.data[0]?.title()).toBe("Gestion editorial universitaria");
  });

  it("reuses a cached Omeka catalog while TTL is valid", async () => {
    const snapshot = createCompleteOmekaCatalogSnapshot();
    const client = new FakeOmekaApiClient(
      snapshot.items,
      snapshot.itemSets,
      snapshot.media,
      snapshot.resourceTemplates,
    );
    const first = await createOmekaCatalogRepositoriesFromApi(client, {
      cacheKey: "omeka-cache-test",
      ttlMs: 60_000,
      now: () => 1_000,
    });
    const second = await createOmekaCatalogRepositoriesFromApi(client, {
      cacheKey: "omeka-cache-test",
      ttlMs: 60_000,
      now: () => 2_000,
    });

    expect(first.cache).toMatchObject({
      enabled: true,
      hit: false,
    });
    expect(second.cache).toMatchObject({
      enabled: true,
      hit: true,
      refreshedAt: first.cache.refreshedAt,
    });
    expect(client.itemListCalls).toBe(1);
  });

  it("refreshes a cached Omeka catalog after TTL expires", async () => {
    const snapshot = createCompleteOmekaCatalogSnapshot();
    const client = new FakeOmekaApiClient(
      snapshot.items,
      snapshot.itemSets,
      snapshot.media,
      snapshot.resourceTemplates,
    );

    await createOmekaCatalogRepositoriesFromApi(client, {
      cacheKey: "omeka-cache-expired-test",
      ttlMs: 1_000,
      now: () => 1_000,
    });
    const refreshed = await createOmekaCatalogRepositoriesFromApi(client, {
      cacheKey: "omeka-cache-expired-test",
      ttlMs: 1_000,
      now: () => 3_000,
    });

    expect(refreshed.cache.hit).toBe(false);
    expect(client.itemListCalls).toBe(2);
  });

  it("reports and invalidates Omeka catalog cache status", async () => {
    const snapshot = createCompleteOmekaCatalogSnapshot();
    const client = new FakeOmekaApiClient(
      snapshot.items,
      snapshot.itemSets,
      snapshot.media,
      snapshot.resourceTemplates,
    );
    const cacheKey = "omeka-cache-status-test";

    await createOmekaCatalogRepositoriesFromApi(client, {
      cacheKey,
      ttlMs: 60_000,
      now: () => 1_000,
    });

    expect(
      readOmekaCatalogRepositoryCacheSnapshot({
        cacheKey,
        ttlMs: 60_000,
        now: () => 2_000,
      }),
    ).toMatchObject({
      enabled: true,
      fresh: true,
      present: true,
    });
    expect(invalidateOmekaCatalogRepositoryCache(cacheKey)).toBe(true);
    expect(
      readOmekaCatalogRepositoryCacheSnapshot({
        cacheKey,
        ttlMs: 60_000,
      }),
    ).toMatchObject({
      enabled: true,
      fresh: false,
      present: false,
    });
  });
});

function page<T>(
  items: readonly T[],
  request: { readonly page: number; readonly pageSize: number },
): readonly T[] {
  const start = (request.page - 1) * request.pageSize;

  return items.slice(start, start + request.pageSize);
}
