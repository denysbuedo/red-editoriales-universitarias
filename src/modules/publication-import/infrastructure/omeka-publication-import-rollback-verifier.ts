import { PublicationImportCommitCreatedResourceDto } from "../application/dtos";
import {
  PublicationImportRollbackVerifiedResource,
  PublicationImportRollbackVerifier,
} from "../application/ports/publication-import-rollback-verifier";

import { ApplicationError } from "@/modules/catalog/application";

interface OmekaImportRollbackVerifierConfig {
  readonly baseUrl: string;
  readonly keyIdentity: string;
  readonly keyCredential: string;
  readonly timeoutMs: number;
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type OmekaJsonObject = Readonly<Record<string, unknown>>;

export class OmekaPublicationImportRollbackVerifier implements PublicationImportRollbackVerifier {
  public constructor(
    private readonly config: OmekaImportRollbackVerifierConfig,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  public async verify(
    resources: readonly PublicationImportCommitCreatedResourceDto[],
  ): Promise<readonly PublicationImportRollbackVerifiedResource[]> {
    return Promise.all(
      resources.map(async (resource) => {
        const item = await this.getJson(`/api/items/${String(resource.omekaItemId)}`);
        const media =
          resource.omekaMediaId === undefined
            ? null
            : await this.getJson(`/api/media/${String(resource.omekaMediaId)}`);

        return {
          row: resource.row,
          pnpuUuid: resource.pnpuUuid,
          omekaItemId: resource.omekaItemId,
          currentItemModified: item === null ? undefined : readOptionalString(item, "o:modified"),
          currentPnpuUuid: item === null ? undefined : readLiteralValue(item, "pnpu:uuid"),
          itemExists: item !== null,
          mediaExists: resource.omekaMediaId === undefined || media !== null,
          omekaMediaId: resource.omekaMediaId,
          currentMediaModified:
            media === null ? undefined : readOptionalString(media, "o:modified"),
        };
      }),
    );
  }

  private async getJson(path: string): Promise<OmekaJsonObject | null> {
    const response = await this.fetchOmeka(path);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw ApplicationError.serviceUnavailable("Omeka S returned an unexpected response.");
    }

    const payload: unknown = await response.json();

    if (!isJsonObject(payload)) {
      throw ApplicationError.serviceUnavailable("Omeka S returned an invalid JSON object.");
    }

    return payload;
  }

  private async fetchOmeka(path: string): Promise<Response> {
    const url = new URL(`${this.config.baseUrl}${path}`);
    url.searchParams.set("key_identity", this.config.keyIdentity);
    url.searchParams.set("key_credential", this.config.keyCredential);

    try {
      return await this.fetchFn(url, {
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

function readLiteralValue(resource: OmekaJsonObject, term: string): string | undefined {
  const values = Array.isArray(resource[term]) ? resource[term] : [];

  for (const value of values) {
    if (isJsonObject(value) && typeof value["@value"] === "string") {
      return value["@value"];
    }
  }

  return undefined;
}

function readOptionalString(resource: OmekaJsonObject, field: string): string | undefined {
  const value = resource[field];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function isJsonObject(value: unknown): value is OmekaJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
