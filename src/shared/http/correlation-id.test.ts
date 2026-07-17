import { describe, expect, it } from "vitest";

import { getCorrelationIdHeaderName, resolveCorrelationId } from "./correlation-id";

describe("resolveCorrelationId", () => {
  it("reuses a valid incoming correlation id", () => {
    const headers = new Headers({
      [getCorrelationIdHeaderName()]: "pnpu-request-1",
    });

    expect(resolveCorrelationId(headers)).toBe("pnpu-request-1");
  });

  it("generates a correlation id when the incoming value is invalid", () => {
    const headers = new Headers({
      [getCorrelationIdHeaderName()]: "invalid value with spaces",
    });

    expect(resolveCorrelationId(headers)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
