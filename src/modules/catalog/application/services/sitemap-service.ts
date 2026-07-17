import { normalizePagination } from "../pagination";
import {
  CollectionRepository,
  ContributorRepository,
  PublicationRepository,
  PublisherRepository,
  SubjectRepository,
} from "../ports";

export interface SitemapEntry {
  readonly url: string;
  readonly changeFrequency: "daily" | "weekly" | "monthly";
  readonly priority: number;
}

export interface SitemapServiceConfig {
  readonly publicBaseUrl: string;
}

export class SitemapService {
  private readonly publicBaseUrl: string;

  public constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly publisherRepository: PublisherRepository,
    private readonly contributorRepository: ContributorRepository,
    private readonly subjectRepository: SubjectRepository,
    config: SitemapServiceConfig,
  ) {
    this.publicBaseUrl = config.publicBaseUrl.replace(/\/$/, "");
  }

  public async listPublicationEntries(): Promise<readonly SitemapEntry[]> {
    const publications = await this.publicationRepository.list(
      normalizePagination({ pageSize: 100 }),
    );

    return publications.data.map((publication) => ({
      url: `${this.publicBaseUrl}/publicaciones/${publication.id().value()}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  }

  public async listCollectionEntries(): Promise<readonly SitemapEntry[]> {
    const collections = await this.collectionRepository.list(
      normalizePagination({ pageSize: 100 }),
    );

    return collections.data.map((collection) => ({
      url: `${this.publicBaseUrl}/colecciones/${collection.id().value()}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  }

  public async listPublisherEntries(): Promise<readonly SitemapEntry[]> {
    const publishers = await this.publisherRepository.list(normalizePagination({ pageSize: 100 }));

    return publishers.data.map((publisher) => ({
      url: `${this.publicBaseUrl}/editoriales/${publisher.id().value()}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  }

  public async listContributorEntries(): Promise<readonly SitemapEntry[]> {
    const contributors = await this.contributorRepository.list(
      normalizePagination({ pageSize: 100 }),
    );

    return contributors.data.map((contributor) => ({
      url: `${this.publicBaseUrl}/autores/${contributor.id().value()}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  }

  public async listSubjectEntries(): Promise<readonly SitemapEntry[]> {
    const subjects = await this.subjectRepository.list(normalizePagination({ pageSize: 100 }));

    return subjects.data.map((subject) => ({
      url: `${this.publicBaseUrl}/materias/${encodeURIComponent(subject.identifier())}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  }
}
