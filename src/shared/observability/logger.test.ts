import { afterEach, describe, expect, it, vi } from "vitest";

import { areRequestLogsEnabled, shouldLog, writeStructuredLog } from "./logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enables request logs by default", () => {
    expect(areRequestLogsEnabled({})).toBe(true);
  });

  it("allows request logs to be disabled", () => {
    expect(areRequestLogsEnabled({ PNPU_ENABLE_REQUEST_LOGS: "false" })).toBe(false);
  });

  it("respects the configured log level", () => {
    expect(shouldLog("debug", { PNPU_LOG_LEVEL: "info" })).toBe(false);
    expect(shouldLog("error", { PNPU_LOG_LEVEL: "info" })).toBe(true);
  });

  it("writes structured JSON logs", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    writeStructuredLog(
      {
        level: "info",
        service: "pnpu-portal",
        event: "http.request",
        correlationId: "request-1",
        method: "GET",
        path: "/health/ready",
      },
      { PNPU_LOG_LEVEL: "info" },
    );

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(JSON.parse(String(consoleSpy.mock.calls[0]?.[0]))).toMatchObject({
      level: "info",
      service: "pnpu-portal",
      event: "http.request",
      correlationId: "request-1",
      method: "GET",
      path: "/health/ready",
    });
  });
});
