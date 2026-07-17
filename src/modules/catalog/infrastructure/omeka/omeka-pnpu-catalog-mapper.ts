import { Collection, Contributor, Publication, Publisher, Subject, University } from "../../domain";
import { OmekaCatalogSnapshot } from "./omeka-catalog-snapshot-loader";
import { readLinkedResourceIds, readOmekaId } from "./omeka-json-reader";
import { mapOmekaPublication } from "./omeka-pnpu-publication-mapper";
import {
  mapOmekaCollection,
  mapOmekaContributor,
  mapOmekaPublisher,
  mapOmekaSubject,
  mapOmekaUniversity,
} from "./omeka-pnpu-reference-mapper";
import { OmekaQualityReport, OmekaQualityReportSnapshot } from "./omeka-quality-report";
import { selectOmekaResourcesByKind } from "./omeka-resource-template-classifier";

export interface OmekaPnpuCatalog {
  readonly publications: readonly Publication[];
  readonly contributors: readonly Contributor[];
  readonly publishers: readonly Publisher[];
  readonly universities: readonly University[];
  readonly collections: readonly Collection[];
  readonly subjects: readonly Subject[];
  readonly quality: OmekaQualityReportSnapshot;
}

export function mapOmekaSnapshotToPnpuCatalog(snapshot: OmekaCatalogSnapshot): OmekaPnpuCatalog {
  const quality = new OmekaQualityReport();
  const subjectsByOmekaId = mapByOmekaId(
    selectOmekaResourcesByKind(snapshot.items, "subject"),
    (resource) => mapOmekaSubject(resource, quality),
  );
  const contributorsByOmekaId = mapByOmekaId(
    selectOmekaResourcesByKind(snapshot.items, "contributor"),
    (resource) => mapOmekaContributor(resource, quality),
  );
  const universitiesByOmekaId = mapByOmekaId(
    selectOmekaResourcesByKind(snapshot.items, "university"),
    (resource) => mapOmekaUniversity(resource, quality),
  );
  const publishersByOmekaId = mapByOmekaId(
    selectOmekaResourcesByKind(snapshot.items, "publisher"),
    (resource) =>
      mapOmekaPublisher(
        resource,
        {
          universitiesByOmekaId,
        },
        quality,
      ),
  );
  const collectionsByOmekaId = mapByOmekaId(
    selectOmekaResourcesByKind(snapshot.itemSets, "collection"),
    (resource) =>
      mapOmekaCollection(
        resource,
        {
          publishersByOmekaId,
          subjectsByOmekaId,
        },
        quality,
      ),
  );
  const mediaByItemOmekaId = groupMediaByItemOmekaId(snapshot.media);
  const publicationsByOmekaId = mapByOmekaId(
    selectOmekaResourcesByKind(snapshot.items, "publication"),
    (resource) =>
      mapOmekaPublication(
        resource,
        {
          publishersByOmekaId,
          contributorsByOmekaId,
          subjectsByOmekaId,
          collectionsByOmekaId,
          mediaByItemOmekaId,
        },
        quality,
      ),
  );

  for (const issue of snapshot.quality.issues) {
    if (issue.severity === "warning") {
      quality.warn(issue);
    } else {
      quality.reject(issue);
    }
  }

  return {
    publications: [...publicationsByOmekaId.values()],
    contributors: [...contributorsByOmekaId.values()],
    publishers: [...publishersByOmekaId.values()],
    universities: [...universitiesByOmekaId.values()],
    collections: [...collectionsByOmekaId.values()],
    subjects: [...subjectsByOmekaId.values()],
    quality: quality.snapshot(),
  };
}

function mapByOmekaId<T>(
  resources: readonly Record<string, unknown>[],
  mapper: (resource: Record<string, unknown>) => T | null,
): ReadonlyMap<number, T> {
  const mappedResources = new Map<number, T>();

  for (const resource of resources) {
    const omekaId = readOmekaId(resource);

    if (omekaId === null) {
      continue;
    }

    const mappedResource = mapper(resource);

    if (mappedResource !== null) {
      mappedResources.set(omekaId, mappedResource);
    }
  }

  return mappedResources;
}

function groupMediaByItemOmekaId(
  media: readonly Record<string, unknown>[],
): ReadonlyMap<number, readonly Record<string, unknown>[]> {
  const mediaByItemOmekaId = new Map<number, Record<string, unknown>[]>();

  for (const mediaResource of media) {
    const itemIds = readMediaItemIds(mediaResource);

    for (const itemId of itemIds) {
      mediaByItemOmekaId.set(itemId, [...(mediaByItemOmekaId.get(itemId) ?? []), mediaResource]);
    }
  }

  return mediaByItemOmekaId;
}

function readMediaItemIds(mediaResource: Record<string, unknown>): readonly number[] {
  const directItem = mediaResource["o:item"];
  const directItemId = isJsonObject(directItem) ? readOmekaId(directItem) : null;

  if (directItemId !== null) {
    return [directItemId];
  }

  return readLinkedResourceIds(mediaResource, "o:item");
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
