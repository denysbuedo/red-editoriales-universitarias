import type { MetadataRoute } from "next";

import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { getRuntimeConfig } from "@/shared/config/runtime-config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const runtimeConfig = getRuntimeConfig();
  const { sitemapService } = await createCatalogServices();
  const [
    publicationEntries,
    collectionEntries,
    publisherEntries,
    contributorEntries,
    subjectEntries,
  ] = await Promise.all([
    sitemapService.listPublicationEntries(),
    sitemapService.listCollectionEntries(),
    sitemapService.listPublisherEntries(),
    sitemapService.listContributorEntries(),
    sitemapService.listSubjectEntries(),
  ]);
  const lastModified = "2026-07-15T00:00:00.000Z";

  return [
    {
      url: runtimeConfig.publicBaseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...publicationEntries.map((entry) => ({
      url: entry.url,
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...collectionEntries.map((entry) => ({
      url: entry.url,
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...publisherEntries.map((entry) => ({
      url: entry.url,
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...contributorEntries.map((entry) => ({
      url: entry.url,
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...subjectEntries.map((entry) => ({
      url: entry.url,
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
  ];
}
