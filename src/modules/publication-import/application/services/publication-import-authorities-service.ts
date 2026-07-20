import {
  ContributorRepository,
  PublisherRepository,
  SubjectRepository,
} from "@/modules/catalog/application";

import { PublicationImportAuthoritiesDto } from "../dtos";
import { PublicationImportDiagnosisServiceOptions } from "./publication-import-diagnosis-service";

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

export class PublicationImportAuthoritiesService {
  public constructor(
    private readonly repositories: {
      readonly contributorRepository: ContributorRepository;
      readonly publisherRepository: PublisherRepository;
      readonly subjectRepository: SubjectRepository;
    },
    private readonly options: PublicationImportDiagnosisServiceOptions,
  ) {}

  public async listAuthorities(): Promise<PublicationImportAuthoritiesDto> {
    const [publishers, contributors, subjects] = await Promise.all([
      listAll((page) => this.repositories.publisherRepository.list({ page, pageSize: PAGE_SIZE })),
      listAll((page) =>
        this.repositories.contributorRepository.list({ page, pageSize: PAGE_SIZE }),
      ),
      listAll((page) => this.repositories.subjectRepository.list({ page, pageSize: PAGE_SIZE })),
    ]);

    return {
      generatedAt: (this.options.now?.() ?? new Date()).toISOString(),
      summary: {
        publishers: publishers.length,
        contributors: contributors.length,
        subjects: subjects.length,
      },
      publishers: publishers
        .map((publisher) => {
          const snapshot = publisher.snapshot();

          return {
            id: snapshot.id.value(),
            label: snapshot.officialName,
            acronym: snapshot.acronym,
            country: snapshot.country,
          };
        })
        .sort((left, right) => left.label.localeCompare(right.label, "es")),
      contributors: contributors
        .map((contributor) => {
          const snapshot = contributor.snapshot();

          return {
            id: snapshot.id.value(),
            label: snapshot.name,
            roles: snapshot.roles,
            affiliation: snapshot.affiliation,
            country: snapshot.country,
          };
        })
        .sort((left, right) => left.label.localeCompare(right.label, "es")),
      subjects: subjects
        .map((subject) => {
          const snapshot = subject.snapshot();

          return {
            id: snapshot.identifier,
            label: snapshot.preferredLabel,
            uri: snapshot.uri,
          };
        })
        .sort((left, right) => left.label.localeCompare(right.label, "es")),
    };
  }
}

async function listAll<T>(
  fetchPage: (page: number) => Promise<{
    readonly data: readonly T[];
    readonly pagination: {
      readonly totalPages: number;
    };
  }>,
): Promise<readonly T[]> {
  const values: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchPage(page);
    values.push(...result.data);

    if (page >= result.pagination.totalPages) {
      return values;
    }
  }

  return values;
}
