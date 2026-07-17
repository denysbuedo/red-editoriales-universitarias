import { DomainValidationError } from "../errors/domain-validation-error";

const PNPU_UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class PnpuUuid {
  private constructor(private readonly normalizedValue: string) {}

  public static create(value: string): PnpuUuid {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue.length === 0) {
      throw new DomainValidationError("PNPU UUID is required.");
    }

    if (!PNPU_UUID_V7_PATTERN.test(normalizedValue)) {
      throw new DomainValidationError("PNPU UUID must be a valid UUID v7.");
    }

    return new PnpuUuid(normalizedValue);
  }

  public value(): string {
    return this.normalizedValue;
  }

  public equals(other: PnpuUuid): boolean {
    return this.normalizedValue === other.normalizedValue;
  }

  public toString(): string {
    return this.normalizedValue;
  }
}
