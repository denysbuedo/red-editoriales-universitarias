import { describe, expect, it } from "vitest";

import { DomainValidationError } from "../errors/domain-validation-error";
import { Doi, Isbn, LanguageCode, Orcid, PnpuUuid } from ".";

describe("PnpuUuid", () => {
  it("normalizes valid UUID v7 values", () => {
    const uuid = PnpuUuid.create(" 018F6E2D-7B58-7D61-9B7D-1F4C2F9A1C05 ");

    expect(uuid.value()).toBe("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05");
  });

  it("rejects non-v7 UUID values", () => {
    expect(() => PnpuUuid.create("550e8400-e29b-41d4-a716-446655440000")).toThrow(
      DomainValidationError,
    );
  });
});

describe("Isbn", () => {
  it("normalizes and accepts valid ISBN-13 values", () => {
    const isbn = Isbn.create("978-959-000-000-3");

    expect(isbn.value()).toBe("9789590000003");
  });

  it("normalizes and accepts valid ISBN-10 values with X check digit", () => {
    const isbn = Isbn.create("0-8044-2957-X");

    expect(isbn.value()).toBe("080442957X");
  });

  it("rejects ISBN values with invalid check digit", () => {
    expect(() => Isbn.create("9789590000001")).toThrow(DomainValidationError);
  });

  it("rejects empty ISBN values", () => {
    expect(() => Isbn.create(" - ")).toThrow(DomainValidationError);
  });
});

describe("Doi", () => {
  it("normalizes raw DOI values to resolvable DOI URIs", () => {
    const doi = Doi.create(" 10.1234/PNPU.Book.01 ");

    expect(doi.value()).toBe("https://doi.org/10.1234/pnpu.book.01");
  });

  it("normalizes DOI URI variants", () => {
    const doi = Doi.create("http://dx.doi.org/10.5555/ABC-123");

    expect(doi.value()).toBe("https://doi.org/10.5555/abc-123");
  });

  it("rejects malformed DOI values", () => {
    expect(() => Doi.create("pnpu/10.1234")).toThrow(DomainValidationError);
  });
});

describe("Orcid", () => {
  it("normalizes compact ORCID values to canonical URI format", () => {
    const orcid = Orcid.create("0000000218250097");

    expect(orcid.value()).toBe("https://orcid.org/0000-0002-1825-0097");
  });

  it("normalizes ORCID URI values", () => {
    const orcid = Orcid.create("https://orcid.org/0000-0002-1694-233X");

    expect(orcid.value()).toBe("https://orcid.org/0000-0002-1694-233X");
  });

  it("rejects ORCID values with invalid check digit", () => {
    expect(() => Orcid.create("0000-0002-1825-0098")).toThrow(DomainValidationError);
  });
});

describe("LanguageCode", () => {
  it("normalizes ISO 639-1 language codes", () => {
    const languageCode = LanguageCode.create(" ES ");

    expect(languageCode.value()).toBe("es");
  });

  it("rejects language codes outside the PNPU schema shape", () => {
    expect(() => LanguageCode.create("spa")).toThrow(DomainValidationError);
  });
});
