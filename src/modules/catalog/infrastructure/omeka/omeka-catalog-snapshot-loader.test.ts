import { describe, expect, it } from "vitest";

import { OmekaApiClient, OmekaJsonObject } from "./omeka-api-client";
import { OmekaCatalogSnapshotLoader } from "./omeka-catalog-snapshot-loader";
import { OMEKA_PNPU_RESOURCE_TEMPLATES } from "./omeka-resource-template-classifier";

class FakeOmekaApiClient implements OmekaApiClient {
  public readonly itemRequests: { page: number; pageSize: number }[] = [];

  public constructor(
    private readonly items: readonly OmekaJsonObject[][] = [],
    private readonly itemSets: readonly OmekaJsonObject[][] = [],
    private readonly media: readonly OmekaJsonObject[][] = [],
    private readonly resourceTemplates: readonly OmekaJsonObject[][] = [],
  ) {}

  public listItems(request: { readonly page: number; readonly pageSize: number }) {
    this.itemRequests.push(request);
    return Promise.resolve(this.items[request.page - 1] ?? []);
  }

  public getItem(): Promise<OmekaJsonObject | null> {
    return Promise.resolve(null);
  }

  public listItemSets(request: { readonly page: number; readonly pageSize: number }) {
    return Promise.resolve(this.itemSets[request.page - 1] ?? []);
  }

  public listMedia(request: { readonly page: number; readonly pageSize: number }) {
    return Promise.resolve(this.media[request.page - 1] ?? []);
  }

  public listProperties() {
    return Promise.resolve([]);
  }

  public listResourceTemplates(request: { readonly page: number; readonly pageSize: number }) {
    return Promise.resolve(this.resourceTemplates[request.page - 1] ?? []);
  }

  public listVocabularies() {
    return Promise.resolve([]);
  }
}

function resource(id: number, templateLabel: string | null): OmekaJsonObject {
  return {
    "o:id": id,
    ...(templateLabel === null
      ? {}
      : {
          "o:resource_template": {
            "o:label": templateLabel,
          },
        }),
  };
}

function resourceWithTemplateId(id: number, templateId: number): OmekaJsonObject {
  return {
    "o:id": id,
    "o:resource_template": {
      "o:id": templateId,
    },
  };
}

function resourceTemplate(id: number, label: string): OmekaJsonObject {
  return {
    "o:id": id,
    "o:label": label,
  };
}

describe("OmekaCatalogSnapshotLoader", () => {
  it("loads paginated items, item sets and media into a classified snapshot", async () => {
    const client = new FakeOmekaApiClient(
      [
        [
          resource(1, OMEKA_PNPU_RESOURCE_TEMPLATES.publication),
          resource(2, OMEKA_PNPU_RESOURCE_TEMPLATES.contributor),
        ],
        [resource(3, "Other Template")],
      ],
      [[resource(10, OMEKA_PNPU_RESOURCE_TEMPLATES.collection)]],
      [[resource(20, null)]],
    );
    const loader = new OmekaCatalogSnapshotLoader(client, { pageSize: 2, maxPages: 5 });

    const snapshot = await loader.load();

    expect(snapshot.items).toHaveLength(3);
    expect(snapshot.itemSets).toHaveLength(1);
    expect(snapshot.media).toHaveLength(1);
    expect(snapshot.classifications.map((classification) => classification.kind)).toEqual([
      "publication",
      "contributor",
      "unknown",
      "collection",
      "unknown",
    ]);
    expect(snapshot.quality.warningCount).toBe(2);
    expect(client.itemRequests).toEqual([
      { page: 1, pageSize: 2 },
      { page: 2, pageSize: 2 },
    ]);
  });

  it("can suppress unknown template warnings", async () => {
    const client = new FakeOmekaApiClient([[resource(1, "Other Template")]]);
    const loader = new OmekaCatalogSnapshotLoader(client, {
      pageSize: 10,
      reportUnknownTemplates: false,
    });

    await expect(loader.load()).resolves.toMatchObject({
      quality: {
        warningCount: 0,
        rejectedCount: 0,
      },
    });
  });

  it("resolves resource template labels from Omeka template ids", async () => {
    const client = new FakeOmekaApiClient(
      [[resourceWithTemplateId(1, 10)]],
      [],
      [],
      [[resourceTemplate(10, OMEKA_PNPU_RESOURCE_TEMPLATES.publication)]],
    );
    const loader = new OmekaCatalogSnapshotLoader(client);

    const snapshot = await loader.load();

    expect(snapshot.items[0]?.["o:resource_template"]).toMatchObject({
      "o:id": 10,
      "o:label": "PNPU Publication",
    });
    expect(snapshot.classifications[0]).toMatchObject({
      kind: "publication",
      templateLabel: "PNPU Publication",
    });
  });

  it("rejects invalid loader options", () => {
    expect(() => new OmekaCatalogSnapshotLoader(new FakeOmekaApiClient(), { pageSize: 0 })).toThrow(
      "Omeka snapshot pageSize must be a positive integer.",
    );
    expect(() => new OmekaCatalogSnapshotLoader(new FakeOmekaApiClient(), { maxPages: 0 })).toThrow(
      "Omeka snapshot maxPages must be a positive integer.",
    );
  });

  it("fails when pagination does not converge before maxPages", async () => {
    const client = new FakeOmekaApiClient([
      [resource(1, OMEKA_PNPU_RESOURCE_TEMPLATES.publication)],
      [resource(2, OMEKA_PNPU_RESOURCE_TEMPLATES.publication)],
    ]);
    const loader = new OmekaCatalogSnapshotLoader(client, { pageSize: 1, maxPages: 2 });

    await expect(loader.load()).rejects.toMatchObject({
      code: "PNPU-503",
      message: "Omeka S pagination exceeded the configured limit.",
    });
  });
});
