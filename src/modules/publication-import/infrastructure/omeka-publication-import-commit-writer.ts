import {
  PublicationImportCommitCreatedResourceDto,
  PublicationImportDryRunCandidateDto,
} from "../application/dtos";
import { PublicationImportCommitWriter } from "../application/ports/publication-import-commit-writer";

import { ApplicationError } from "@/modules/catalog/application";

interface OmekaImportWriterConfig {
  readonly baseUrl: string;
  readonly keyIdentity: string;
  readonly keyCredential: string;
  readonly publicBaseUrl: string;
  readonly timeoutMs: number;
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type OmekaJsonObject = Readonly<Record<string, unknown>>;

export class OmekaPublicationImportCommitWriter implements PublicationImportCommitWriter {
  public constructor(
    private readonly config: OmekaImportWriterConfig,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  public async commit(
    candidates: readonly PublicationImportDryRunCandidateDto[],
  ): Promise<readonly PublicationImportCommitCreatedResourceDto[]> {
    const context = await this.loadContext();
    const created: PublicationImportCommitCreatedResourceDto[] = [];

    for (const candidate of candidates) {
      const publisherId = requireResourceId(
        context.itemIdByPnpuUuid,
        candidate.publisherAuthorityId,
        "publisherAuthorityId",
      );
      const contributorIds = candidate.contributorAuthorityIds.map((id) =>
        requireResourceId(context.itemIdByPnpuUuid, id, "contributorAuthorityIds"),
      );
      const subjectIds = candidate.subjects.map((id) =>
        requireResourceId(context.subjectIdByNotation, id, "subjects"),
      );
      const item = await this.postJson(
        "/api/items",
        this.buildPublicationPayload(candidate, context, publisherId, contributorIds, subjectIds),
      );
      const itemId = readOmekaId(item);
      const media = await this.postJson(
        "/api/media",
        this.buildMediaPayload(candidate, context, itemId),
      );

      created.push({
        row: candidate.row,
        pnpuUuid: candidate.pnpuUuid,
        omekaItemId: itemId,
        omekaMediaId: readOmekaId(media),
      });
    }

    return created;
  }

  private async loadContext(): Promise<{
    readonly itemIdByPnpuUuid: ReadonlyMap<string, number>;
    readonly propertyIdByTerm: ReadonlyMap<string, number>;
    readonly subjectIdByNotation: ReadonlyMap<string, number>;
    readonly templateIdByLabel: ReadonlyMap<string, number>;
  }> {
    const [items, properties, templates] = await Promise.all([
      this.listAll("/api/items"),
      this.listAll("/api/properties"),
      this.listAll("/api/resource_templates"),
    ]);

    return {
      itemIdByPnpuUuid: mapResourceLiteralToId(items, "pnpu:uuid"),
      propertyIdByTerm: mapTopLevelStringToId(properties, "o:term"),
      subjectIdByNotation: mapResourceLiteralToId(items, "skos:notation"),
      templateIdByLabel: mapTopLevelStringToId(templates, "o:label"),
    };
  }

  private buildPublicationPayload(
    candidate: PublicationImportDryRunCandidateDto,
    context: {
      readonly propertyIdByTerm: ReadonlyMap<string, number>;
      readonly templateIdByLabel: ReadonlyMap<string, number>;
    },
    publisherId: number,
    contributorIds: readonly number[],
    subjectIds: readonly number[],
  ): OmekaJsonObject {
    const property = (term: string): number =>
      requireResourceId(context.propertyIdByTerm, term, term);
    const values = [
      literal("pnpu:uuid", candidate.pnpuUuid, property),
      literal("dcterms:title", candidate.title, property),
      literal("dcterms:issued", candidate.publicationDate, property),
      literal("dcterms:language", candidate.language, property),
      literal("dcterms:type", candidate.typeOrGenre, property),
      literal("dcterms:format", candidate.formats[0] ?? "application/pdf", property),
      literal("dcterms:license", candidate.license, property),
      literal(
        "dcterms:identifier",
        buildPublicationIdentifier(this.config.publicBaseUrl, candidate.pnpuUuid),
        property,
      ),
      literal("bibo:isbn", candidate.isbn, property),
      optionalLiteral("bibo:doi", candidate.doi, property),
      resourceValue("dcterms:publisher", publisherId, property),
      ...contributorIds.map((id) => resourceValue("dcterms:creator", id, property)),
      ...subjectIds.map((id) => resourceValue("dcterms:subject", id, property)),
    ].filter((value): value is PropertyValue => value !== null);

    return {
      "o:is_public": true,
      "o:resource_template": {
        "o:id": requireResourceId(
          context.templateIdByLabel,
          "PNPU Publication",
          "PNPU Publication",
        ),
      },
      ...groupValues(values),
    };
  }

  private buildMediaPayload(
    candidate: PublicationImportDryRunCandidateDto,
    context: {
      readonly propertyIdByTerm: ReadonlyMap<string, number>;
      readonly templateIdByLabel: ReadonlyMap<string, number>;
    },
    itemId: number,
  ): OmekaJsonObject {
    const property = (term: string): number =>
      requireResourceId(context.propertyIdByTerm, term, term);
    const format = candidate.formats[0] ?? "application/pdf";

    return {
      "o:is_public": true,
      "o:item": { "o:id": itemId },
      "o:ingester": "html",
      "o:source": candidate.digitalResourceUrl,
      html: `<a href="${escapeHtml(candidate.digitalResourceUrl)}">${escapeHtml(candidate.title)}</a>`,
      "o:resource_template": {
        "o:id": requireResourceId(
          context.templateIdByLabel,
          "PNPU Digital Resource",
          "PNPU Digital Resource",
        ),
      },
      ...groupValues([
        literal("dcterms:format", format, property),
        literal("dcterms:language", candidate.language, property),
        literal("dcterms:license", candidate.license, property),
        literal("pnpu:resourceType", inferResourceType(format), property),
      ]),
    };
  }

  private async listAll(path: string): Promise<readonly OmekaJsonObject[]> {
    const values: OmekaJsonObject[] = [];

    for (let page = 1; page <= 100; page += 1) {
      const pageValues = await this.getJsonArray(path, {
        page: String(page),
        per_page: "100",
      });
      values.push(...pageValues);

      if (pageValues.length < 100) {
        return values;
      }
    }

    throw ApplicationError.serviceUnavailable("Omeka S pagination exceeded import limit.");
  }

  private async getJsonArray(
    path: string,
    query: Readonly<Record<string, string>>,
  ): Promise<readonly OmekaJsonObject[]> {
    const response = await this.fetchOmeka(path, { method: "GET", query });
    const payload: unknown = await response.json();

    if (!Array.isArray(payload) || !payload.every(isJsonObject)) {
      throw ApplicationError.serviceUnavailable("Omeka S returned an invalid JSON array.");
    }

    return payload;
  }

  private async postJson(path: string, payload: OmekaJsonObject): Promise<OmekaJsonObject> {
    const response = await this.fetchOmeka(path, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const responsePayload: unknown = await response.json();

    if (!isJsonObject(responsePayload)) {
      throw ApplicationError.serviceUnavailable("Omeka S returned an invalid JSON object.");
    }

    return responsePayload;
  }

  private async fetchOmeka(
    path: string,
    options: {
      readonly method: string;
      readonly body?: string;
      readonly headers?: HeadersInit;
      readonly query?: Readonly<Record<string, string>>;
    },
  ): Promise<Response> {
    const url = new URL(`${this.config.baseUrl}${path}`);
    url.searchParams.set("key_identity", this.config.keyIdentity);
    url.searchParams.set("key_credential", this.config.keyCredential);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }

    try {
      const headers = new Headers(options.headers);
      headers.set("Accept", "application/json");
      const response = await this.fetchFn(url, {
        method: options.method,
        headers,
        body: options.body,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw ApplicationError.serviceUnavailable("Omeka S returned an unexpected response.");
      }

      return response;
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw ApplicationError.serviceUnavailable("Omeka S is unavailable.");
    }
  }
}

interface PropertyValue {
  readonly term: string;
  readonly value: OmekaJsonObject;
}

export function readOmekaImportWriterConfig(
  environment: NodeJS.ProcessEnv = process.env,
): OmekaImportWriterConfig | null {
  const baseUrl = environment.PNPU_OMEKA_BASE_URL?.trim();
  const keyIdentity = environment.PNPU_OMEKA_KEY_IDENTITY?.trim();
  const keyCredential = environment.PNPU_OMEKA_KEY_CREDENTIAL?.trim();

  if (baseUrl === undefined || keyIdentity === undefined || keyCredential === undefined) {
    return null;
  }

  if (baseUrl.length === 0 || keyIdentity.length === 0 || keyCredential.length === 0) {
    return null;
  }

  return {
    baseUrl: new URL(baseUrl).toString().replace(/\/$/, ""),
    keyIdentity,
    keyCredential,
    publicBaseUrl: new URL(environment.PNPU_PUBLIC_BASE_URL ?? "https://pnpu.mes.gob.cu")
      .toString()
      .replace(/\/$/, ""),
    timeoutMs: readTimeout(environment.PNPU_OMEKA_TIMEOUT_MS),
  };
}

function readTimeout(value: string | undefined): number {
  if (value === undefined || value.trim().length === 0) {
    return 5_000;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 10_000) {
    throw ApplicationError.validation(
      "PNPU_OMEKA_TIMEOUT_MS must be an integer between 1 and 10000.",
    );
  }

  return parsedValue;
}

function literal(term: string, value: string, property: (term: string) => number): PropertyValue {
  return {
    term,
    value: {
      type: "literal",
      property_id: property(term),
      "@value": value,
    },
  };
}

function optionalLiteral(
  term: string,
  value: string | undefined,
  property: (term: string) => number,
): PropertyValue | null {
  return value === undefined || value.trim().length === 0 ? null : literal(term, value, property);
}

function resourceValue(
  term: string,
  id: number,
  property: (term: string) => number,
): PropertyValue {
  return {
    term,
    value: {
      type: "resource:item",
      property_id: property(term),
      value_resource_id: id,
    },
  };
}

function groupValues(values: readonly PropertyValue[]): Record<string, readonly OmekaJsonObject[]> {
  return values.reduce<Record<string, OmekaJsonObject[]>>((grouped, value) => {
    grouped[value.term] = [...(grouped[value.term] ?? []), value.value];
    return grouped;
  }, {});
}

function mapResourceLiteralToId(
  resources: readonly OmekaJsonObject[],
  term: string,
): ReadonlyMap<string, number> {
  const ids = new Map<string, number>();

  for (const resource of resources) {
    const id = readOmekaId(resource);
    const values = Array.isArray(resource[term]) ? resource[term] : [];

    for (const value of values) {
      if (isJsonObject(value) && typeof value["@value"] === "string") {
        ids.set(value["@value"].trim(), id);
      }
    }
  }

  return ids;
}

function mapTopLevelStringToId(
  resources: readonly OmekaJsonObject[],
  field: string,
): ReadonlyMap<string, number> {
  return new Map(
    resources
      .map((resource) => [resource[field], resource["o:id"]] as const)
      .filter(
        (entry): entry is readonly [string, number] =>
          typeof entry[0] === "string" && Number.isInteger(entry[1]),
      ),
  );
}

function requireResourceId(ids: ReadonlyMap<string, number>, key: string, field: string): number {
  const id = ids.get(key);

  if (id === undefined) {
    throw ApplicationError.validation(`Omeka import could not resolve ${field}: ${key}.`);
  }

  return id;
}

function readOmekaId(resource: OmekaJsonObject): number {
  const id = resource["o:id"];

  if (typeof id !== "number" || !Number.isInteger(id)) {
    throw ApplicationError.serviceUnavailable("Omeka S response does not include o:id.");
  }

  return id;
}

function buildPublicationIdentifier(publicBaseUrl: string, pnpuUuid: string): string {
  return `${publicBaseUrl}/publicaciones/${pnpuUuid}`;
}

function inferResourceType(format: string): string {
  const normalizedFormat = format.toLowerCase();

  if (normalizedFormat.includes("epub")) return "epub";
  if (normalizedFormat.includes("html")) return "html";
  if (normalizedFormat.includes("audio")) return "audio";
  if (normalizedFormat.includes("video")) return "video";

  return "pdf";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}

function isJsonObject(value: unknown): value is OmekaJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
