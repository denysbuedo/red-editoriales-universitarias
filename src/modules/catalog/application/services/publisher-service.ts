import { ApplicationError } from "../errors/application-error";
import { normalizePagination, PaginationInput, PaginatedResult } from "../pagination";
import { PublisherRepository } from "../ports";
import { DomainValidationError, PnpuUuid, Publisher } from "../../domain";

export class PublisherService {
  public constructor(private readonly publisherRepository: PublisherRepository) {}

  public async getPublisher(id: string): Promise<Publisher> {
    const publisherId = this.parsePublisherId(id);
    const publisher = await this.publisherRepository.findById(publisherId);

    if (publisher === null) {
      throw ApplicationError.notFound("Publisher not found.");
    }

    return publisher;
  }

  public async listPublishers(input: PaginationInput = {}): Promise<PaginatedResult<Publisher>> {
    return this.publisherRepository.list(normalizePagination(input));
  }

  private parsePublisherId(id: string): PnpuUuid {
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
