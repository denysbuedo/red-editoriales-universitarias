import { ApplicationError } from "../../application";
import { PageRequest } from "../../application/pagination";
import { OmekaConfig } from "./omeka-config";

export type OmekaJsonObject = Readonly<Record<string, unknown>>;

export type OmekaJsonArray = readonly OmekaJsonObject[];

export interface OmekaApiClient {
  listItems(request: PageRequest): Promise<OmekaJsonArray>;
  getItem(id: number): Promise<OmekaJsonObject | null>;
  listItemSets(request: PageRequest): Promise<OmekaJsonArray>;
  listMedia(request: PageRequest): Promise<OmekaJsonArray>;
  listProperties(request: PageRequest): Promise<OmekaJsonArray>;
  listResourceTemplates(request: PageRequest): Promise<OmekaJsonArray>;
  listVocabularies(request: PageRequest): Promise<OmekaJsonArray>;
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class HttpOmekaApiClient implements OmekaApiClient {
  public constructor(
    private readonly config: OmekaConfig,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  public async listItems(request: PageRequest): Promise<OmekaJsonArray> {
    return this.fetchJsonArray("/api/items", request);
  }

  public async getItem(id: number): Promise<OmekaJsonObject | null> {
    if (!Number.isInteger(id) || id < 1) {
      throw ApplicationError.validation("Omeka item id must be a positive integer.");
    }

    const response = await this.fetchOmeka(`/api/items/${String(id)}`);

    if (response.status === 404) {
      return null;
    }

    assertOk(response);
    return readJsonObject(response);
  }

  public async listItemSets(request: PageRequest): Promise<OmekaJsonArray> {
    return this.fetchJsonArray("/api/item_sets", request);
  }

  public async listMedia(request: PageRequest): Promise<OmekaJsonArray> {
    return this.fetchJsonArray("/api/media", request);
  }

  public async listProperties(request: PageRequest): Promise<OmekaJsonArray> {
    return this.fetchJsonArray("/api/properties", request);
  }

  public async listResourceTemplates(request: PageRequest): Promise<OmekaJsonArray> {
    return this.fetchJsonArray("/api/resource_templates", request);
  }

  public async listVocabularies(request: PageRequest): Promise<OmekaJsonArray> {
    return this.fetchJsonArray("/api/vocabularies", request);
  }

  private async fetchJsonArray(path: string, request: PageRequest): Promise<OmekaJsonArray> {
    const response = await this.fetchOmeka(path, {
      page: String(request.page),
      per_page: String(request.pageSize),
    });

    assertOk(response);
    return readJsonArray(response);
  }

  private async fetchOmeka(path: string, query: Record<string, string> = {}): Promise<Response> {
    const url = new URL(`${this.config.baseUrl}${path}`);

    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

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

function assertOk(response: Response): void {
  if (!response.ok) {
    throw ApplicationError.serviceUnavailable("Omeka S returned an unexpected response.");
  }
}

async function readJsonArray(response: Response): Promise<OmekaJsonArray> {
  const payload: unknown = await response.json();

  if (!Array.isArray(payload) || !payload.every(isJsonObject)) {
    throw ApplicationError.serviceUnavailable("Omeka S returned an invalid JSON array.");
  }

  return payload;
}

async function readJsonObject(response: Response): Promise<OmekaJsonObject> {
  const payload: unknown = await response.json();

  if (!isJsonObject(payload)) {
    throw ApplicationError.serviceUnavailable("Omeka S returned an invalid JSON object.");
  }

  return payload;
}

function isJsonObject(value: unknown): value is OmekaJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
