import { ApplicationError } from "../../application";
import { OmekaApiClient, OmekaJsonObject } from "./omeka-api-client";
import {
  classifyOmekaResources,
  OmekaResourceClassification,
} from "./omeka-resource-template-classifier";
import { OmekaQualityReport, OmekaQualityReportSnapshot } from "./omeka-quality-report";

export interface OmekaCatalogSnapshotLoaderOptions {
  readonly pageSize?: number;
  readonly maxPages?: number;
  readonly reportUnknownTemplates?: boolean;
}

export interface OmekaCatalogSnapshot {
  readonly items: readonly OmekaJsonObject[];
  readonly itemSets: readonly OmekaJsonObject[];
  readonly media: readonly OmekaJsonObject[];
  readonly resourceTemplates: readonly OmekaJsonObject[];
  readonly classifications: readonly OmekaResourceClassification[];
  readonly quality: OmekaQualityReportSnapshot;
}

type OmekaListOperation = (request: {
  readonly page: number;
  readonly pageSize: number;
}) => Promise<readonly OmekaJsonObject[]>;

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 100;

export class OmekaCatalogSnapshotLoader {
  private readonly pageSize: number;
  private readonly maxPages: number;
  private readonly reportUnknownTemplates: boolean;

  public constructor(
    private readonly client: OmekaApiClient,
    options: OmekaCatalogSnapshotLoaderOptions = {},
  ) {
    this.pageSize = normalizePositiveInteger(options.pageSize ?? DEFAULT_PAGE_SIZE, "pageSize");
    this.maxPages = normalizePositiveInteger(options.maxPages ?? DEFAULT_MAX_PAGES, "maxPages");
    this.reportUnknownTemplates = options.reportUnknownTemplates ?? true;
  }

  public async load(): Promise<OmekaCatalogSnapshot> {
    const [rawItems, rawItemSets, rawMedia, resourceTemplates] = await Promise.all([
      this.loadAllPages((request) => this.client.listItems(request)),
      this.loadAllPages((request) => this.client.listItemSets(request)),
      this.loadAllPages((request) => this.client.listMedia(request)),
      this.loadAllPages((request) => this.client.listResourceTemplates(request)),
    ]);
    const templateLabelsById = buildTemplateLabelsById(resourceTemplates);
    const items = enrichResourceTemplateLabels(rawItems, templateLabelsById);
    const itemSets = enrichResourceTemplateLabels(rawItemSets, templateLabelsById);
    const media = enrichResourceTemplateLabels(rawMedia, templateLabelsById);
    const classifications = classifyOmekaResources([...items, ...itemSets, ...media]);
    const quality = new OmekaQualityReport();

    if (this.reportUnknownTemplates) {
      for (const classification of classifications) {
        if (classification.kind === "unknown") {
          quality.warn({
            code: "OMEKA_UNKNOWN_TEMPLATE",
            omekaId: classification.omekaId,
            templateLabel: classification.templateLabel,
            message:
              classification.templateLabel === null
                ? "Omeka resource does not declare a Resource Template."
                : "Omeka Resource Template is not part of the PNPU mapping proposal.",
          });
        }
      }
    }

    return {
      items,
      itemSets,
      media,
      resourceTemplates,
      classifications,
      quality: quality.snapshot(),
    };
  }

  private async loadAllPages(operation: OmekaListOperation): Promise<readonly OmekaJsonObject[]> {
    const resources: OmekaJsonObject[] = [];

    for (let page = 1; page <= this.maxPages; page += 1) {
      const pageItems = await operation({ page, pageSize: this.pageSize });
      resources.push(...pageItems);

      if (pageItems.length < this.pageSize) {
        return resources;
      }
    }

    throw ApplicationError.serviceUnavailable("Omeka S pagination exceeded the configured limit.");
  }
}

function buildTemplateLabelsById(
  templates: readonly OmekaJsonObject[],
): ReadonlyMap<number, string> {
  const labelsById = new Map<number, string>();

  for (const template of templates) {
    const id = readInteger(template["o:id"]);
    const label = readNonEmptyString(template["o:label"]);

    if (id !== null && label !== null) {
      labelsById.set(id, label);
    }
  }

  return labelsById;
}

function enrichResourceTemplateLabels(
  resources: readonly OmekaJsonObject[],
  labelsById: ReadonlyMap<number, string>,
): readonly OmekaJsonObject[] {
  return resources.map((resource) => {
    const template = resource["o:resource_template"];

    if (!isJsonObject(template) || readNonEmptyString(template["o:label"]) !== null) {
      return resource;
    }

    const templateId = readInteger(template["o:id"]);
    const label = templateId === null ? undefined : labelsById.get(templateId);

    if (label === undefined) {
      return resource;
    }

    return {
      ...resource,
      "o:resource_template": {
        ...template,
        "o:label": label,
      },
    };
  });
}

function normalizePositiveInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw ApplicationError.validation(`Omeka snapshot ${fieldName} must be a positive integer.`);
  }

  return value;
}

function readInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function isJsonObject(value: unknown): value is OmekaJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
