import { DomainValidationError } from "../errors/domain-validation-error";
import { Doi, Isbn, PnpuUuid } from "../value-objects";
import { requireNonEmptyText, requireUrl } from "./domain-guards";

export const IDENTIFIER_TYPES = ["isbn", "eisbn", "doi", "uri", "handle", "pnpuUuid"] as const;

export type IdentifierType = (typeof IDENTIFIER_TYPES)[number];

export interface IdentifierProps {
  readonly type: IdentifierType;
  readonly value: string;
}

export class Identifier {
  private constructor(private readonly props: IdentifierProps) {}

  public static create(type: IdentifierType, value: string): Identifier {
    return new Identifier({
      type,
      value: normalizeIdentifierValue(type, value),
    });
  }

  public type(): IdentifierType {
    return this.props.type;
  }

  public value(): string {
    return this.props.value;
  }

  public snapshot(): IdentifierProps {
    return { ...this.props };
  }
}

function normalizeIdentifierValue(type: IdentifierType, value: string): string {
  if (type === "isbn" || type === "eisbn") {
    return Isbn.create(value).value();
  }

  if (type === "doi") {
    return Doi.create(value).value();
  }

  if (type === "pnpuUuid") {
    return PnpuUuid.create(value).value();
  }

  if (type === "uri") {
    return requireUrl(value, "Identifier URI");
  }

  const normalizedHandle = requireNonEmptyText(value, "Identifier handle");

  if (!normalizedHandle.includes("/")) {
    throw new DomainValidationError(
      "Identifier handle must include a naming authority and local name.",
    );
  }

  return normalizedHandle;
}
