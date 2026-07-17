import {
  CollectionRepository,
  ContributorRepository,
  PublicationRepository,
  PublisherRepository,
  SubjectRepository,
} from "../../application";
import {
  InMemoryCollectionRepository,
  InMemoryContributorRepository,
  InMemoryPublicationRepository,
  InMemoryPublisherRepository,
  InMemorySubjectRepository,
} from "../in-memory";
import { OmekaPnpuCatalog } from "./omeka-pnpu-catalog-mapper";

export interface OmekaCatalogRepositories {
  readonly publications: PublicationRepository;
  readonly publishers: PublisherRepository;
  readonly contributors: ContributorRepository;
  readonly collections: CollectionRepository;
  readonly subjects: SubjectRepository;
}

export function createOmekaCatalogRepositories(
  catalog: OmekaPnpuCatalog,
): OmekaCatalogRepositories {
  return {
    publications: new InMemoryPublicationRepository(catalog.publications),
    publishers: new InMemoryPublisherRepository(catalog.publishers),
    contributors: new InMemoryContributorRepository(catalog.contributors),
    collections: new InMemoryCollectionRepository(catalog.collections),
    subjects: new InMemorySubjectRepository(catalog.subjects),
  };
}
