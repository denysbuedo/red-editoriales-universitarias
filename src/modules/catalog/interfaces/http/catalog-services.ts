import {
  CollectionService,
  ContributorService,
  PublicationService,
  PublisherService,
  SitemapService,
  SubjectService,
} from "../../application";
import { createCatalogRepositoriesAsync } from "../../infrastructure";
import { getRuntimeConfig } from "@/shared/config/runtime-config";

export async function createCatalogServices(): Promise<{
  readonly collectionService: CollectionService;
  readonly contributorService: ContributorService;
  readonly publicationService: PublicationService;
  readonly publisherService: PublisherService;
  readonly sitemapService: SitemapService;
  readonly subjectService: SubjectService;
}> {
  const {
    collectionRepository,
    contributorRepository,
    publicationRepository,
    publisherRepository,
    subjectRepository,
  } = await createCatalogRepositoriesAsync();

  return {
    collectionService: new CollectionService(collectionRepository, publicationRepository),
    contributorService: new ContributorService(contributorRepository, publicationRepository),
    publicationService: new PublicationService(publicationRepository),
    publisherService: new PublisherService(publisherRepository),
    subjectService: new SubjectService(subjectRepository, publicationRepository),
    sitemapService: new SitemapService(
      publicationRepository,
      collectionRepository,
      publisherRepository,
      contributorRepository,
      subjectRepository,
      {
        publicBaseUrl: getRuntimeConfig().publicBaseUrl,
      },
    ),
  };
}
