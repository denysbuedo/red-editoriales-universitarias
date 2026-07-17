import { normalizeOptionalText, requireNonEmptyText, requireUrl } from "./domain-guards";
import { DomainValidationError } from "../errors/domain-validation-error";
import { LanguageCode } from "../value-objects";

export const RESOURCE_TYPES = [
  "pdf",
  "epub",
  "html",
  "mobi",
  "audio",
  "video",
  "externalLink",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface ResourceProps {
  readonly type: ResourceType;
  readonly url: string;
  readonly format: string;
  readonly fileSize?: number;
  readonly checksum?: string;
  readonly language?: LanguageCode;
  readonly license?: string;
}

export class Resource {
  private constructor(private readonly props: ResourceProps) {}

  public static create(props: ResourceProps): Resource {
    return new Resource({
      type: props.type,
      url: requireUrl(props.url, "Resource URL"),
      format: requireNonEmptyText(props.format, "Resource format"),
      fileSize: normalizeFileSize(props.fileSize),
      checksum: normalizeOptionalText(props.checksum),
      language: props.language,
      license: normalizeOptionalText(props.license),
    });
  }

  public type(): ResourceType {
    return this.props.type;
  }

  public url(): string {
    return this.props.url;
  }

  public format(): string {
    return this.props.format;
  }

  public snapshot(): ResourceProps {
    return { ...this.props };
  }
}

function normalizeFileSize(fileSize: number | undefined): number | undefined {
  if (fileSize === undefined) {
    return undefined;
  }

  if (!Number.isInteger(fileSize) || fileSize < 0) {
    throw new DomainValidationError("Resource file size must be a non-negative integer.");
  }

  return fileSize;
}
