import { describe, expect, it } from "vitest";

import { ApplicationError } from "../../application";
import { readOmekaConfig } from "./omeka-config";

describe("readOmekaConfig", () => {
  it("returns null when Omeka is not configured", () => {
    expect(readOmekaConfig({})).toBeNull();
  });

  it("normalizes configured Omeka base URL and timeout", () => {
    expect(
      readOmekaConfig({
        PNPU_OMEKA_BASE_URL: "https://omeka.example.edu/",
        PNPU_OMEKA_TIMEOUT_MS: "3000",
      }),
    ).toEqual({
      baseUrl: "https://omeka.example.edu",
      timeoutMs: 3000,
    });
  });

  it("rejects invalid timeout values", () => {
    expect(() =>
      readOmekaConfig({
        PNPU_OMEKA_BASE_URL: "https://omeka.example.edu",
        PNPU_OMEKA_TIMEOUT_MS: "0",
      }),
    ).toThrow(ApplicationError);
  });
});
