import {
  PublicationImportRollbackDeletedResourceDto,
  PublicationImportRollbackPlanOperationDto,
} from "../application/dtos";
import { PublicationImportRollbackExecutor } from "../application/ports/publication-import-rollback-executor";

import { ApplicationError } from "@/modules/catalog/application";

interface OmekaImportRollbackExecutorConfig {
  readonly baseUrl: string;
  readonly keyIdentity: string;
  readonly keyCredential: string;
  readonly timeoutMs: number;
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class OmekaPublicationImportRollbackExecutor implements PublicationImportRollbackExecutor {
  public constructor(
    private readonly config: OmekaImportRollbackExecutorConfig,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  public async execute(
    operations: readonly PublicationImportRollbackPlanOperationDto[],
  ): Promise<readonly PublicationImportRollbackDeletedResourceDto[]> {
    const deleted: PublicationImportRollbackDeletedResourceDto[] = [];

    for (const operation of operations) {
      await this.deleteResource(operation);
      deleted.push({
        type: operation.type === "deletePublicationItem" ? "item" : "media",
        omekaId: operation.omekaId,
        pnpuUuid: operation.pnpuUuid,
      });
    }

    return deleted;
  }

  private async deleteResource(
    operation: PublicationImportRollbackPlanOperationDto,
  ): Promise<void> {
    const path =
      operation.type === "deletePublicationItem"
        ? `/api/items/${String(operation.omekaId)}`
        : `/api/media/${String(operation.omekaId)}`;
    const response = await this.fetchOmeka(path);

    if (!response.ok && response.status !== 404) {
      throw ApplicationError.serviceUnavailable("Omeka S returned an unexpected response.");
    }
  }

  private async fetchOmeka(path: string): Promise<Response> {
    const url = new URL(`${this.config.baseUrl}${path}`);
    url.searchParams.set("key_identity", this.config.keyIdentity);
    url.searchParams.set("key_credential", this.config.keyCredential);

    try {
      return await this.fetchFn(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch {
      throw ApplicationError.serviceUnavailable("Omeka S is unavailable.");
    }
  }
}
