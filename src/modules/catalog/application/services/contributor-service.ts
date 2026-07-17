import { Contributor, DomainValidationError, PnpuUuid, Publication } from "../../domain";
import { ApplicationError } from "../errors/application-error";
import { normalizePagination, PaginatedResult, PaginationInput } from "../pagination";
import { ContributorRepository, PublicationRepository } from "../ports";

export interface ContributorProfile {
  readonly contributor: Contributor;
  readonly publications: readonly Publication[];
}

export class ContributorService {
  public constructor(
    private readonly contributorRepository: ContributorRepository,
    private readonly publicationRepository: PublicationRepository,
  ) {}

  public async getContributor(id: string): Promise<ContributorProfile> {
    const contributorId = this.parseContributorId(id);
    const contributor = await this.contributorRepository.findById(contributorId);

    if (contributor === null) {
      throw ApplicationError.notFound("Contributor not found.");
    }

    const publications = await this.publicationRepository.list({
      page: 1,
      pageSize: 100,
      contributorId,
    });

    return {
      contributor,
      publications: publications.data,
    };
  }

  public async listContributors(
    input: PaginationInput = {},
  ): Promise<PaginatedResult<ContributorProfile>> {
    const contributors = await this.contributorRepository.list(normalizePagination(input));
    const profiles = await Promise.all(
      contributors.data.map(async (contributor) => {
        const publications = await this.publicationRepository.list({
          page: 1,
          pageSize: 100,
          contributorId: contributor.id(),
        });

        return {
          contributor,
          publications: publications.data,
        };
      }),
    );

    return {
      data: profiles,
      pagination: contributors.pagination,
    };
  }

  private parseContributorId(id: string): PnpuUuid {
    try {
      return PnpuUuid.create(id);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw ApplicationError.validation(error.message);
      }

      throw error;
    }
  }
}
