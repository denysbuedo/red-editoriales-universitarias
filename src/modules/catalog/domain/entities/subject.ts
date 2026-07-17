import { normalizeOptionalUrl, requireNonEmptyText } from "./domain-guards";

export interface SubjectProps {
  readonly identifier: string;
  readonly preferredLabel: string;
  readonly uri?: string;
  readonly broader?: string;
  readonly related?: readonly string[];
}

export class Subject {
  private constructor(private readonly props: SubjectProps) {}

  public static create(props: SubjectProps): Subject {
    return new Subject({
      identifier: requireNonEmptyText(props.identifier, "Subject identifier"),
      preferredLabel: requireNonEmptyText(props.preferredLabel, "Subject preferred label"),
      uri: normalizeOptionalUrl(props.uri, "Subject URI"),
      broader: normalizeOptionalUrl(props.broader, "Subject broader URI"),
      related: normalizeRelatedUris(props.related),
    });
  }

  public identifier(): string {
    return this.props.identifier;
  }

  public preferredLabel(): string {
    return this.props.preferredLabel;
  }

  public snapshot(): SubjectProps {
    return {
      ...this.props,
      related: this.props.related === undefined ? undefined : [...this.props.related],
    };
  }
}

function normalizeRelatedUris(
  related: readonly string[] | undefined,
): readonly string[] | undefined {
  if (related === undefined) {
    return undefined;
  }

  return [
    ...new Set(related.map((uri) => normalizeOptionalUrl(uri, "Subject related URI"))),
  ].filter((uri): uri is string => uri !== undefined);
}
