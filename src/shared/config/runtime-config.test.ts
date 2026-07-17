import { describe, expect, it } from "vitest";

import { getRuntimeConfig } from "./runtime-config";

describe("getRuntimeConfig", () => {
  it("returns default runtime values", () => {
    expect(getRuntimeConfig({})).toEqual({
      serviceName: "pnpu-portal",
      version: "0.1.0",
      commitSha: null,
      publicBaseUrl: "http://127.0.0.1:4307",
    });
  });

  it("returns the configured commit sha", () => {
    expect(
      getRuntimeConfig({
        PNPU_COMMIT_SHA: "abc123",
      }).commitSha,
    ).toBe("abc123");
  });

  it("normalizes the configured public base URL", () => {
    expect(
      getRuntimeConfig({
        PNPU_PUBLIC_BASE_URL: "https://portal.example.test/",
      }).publicBaseUrl,
    ).toBe("https://portal.example.test");
  });

  it("rejects invalid public base URLs", () => {
    expect(() =>
      getRuntimeConfig({
        PNPU_PUBLIC_BASE_URL: "not a url",
      }),
    ).toThrow(TypeError);
  });
});
