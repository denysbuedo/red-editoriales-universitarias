import { describe, expect, it, vi } from "vitest";

import { checkOmekaHealth } from "./omeka-health";

const config = {
  baseUrl: "https://omeka.example.edu",
  timeoutMs: 2000,
};

type FetchMock = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

describe("checkOmekaHealth", () => {
  it("returns available when Omeka responds with a valid item array", async () => {
    const fetchMock = vi.fn<FetchMock>().mockResolvedValue(Response.json([]));

    await expect(checkOmekaHealth(config, fetchMock)).resolves.toBe("available");
  });

  it("returns unavailable when Omeka request fails", async () => {
    const fetchMock = vi.fn<FetchMock>().mockRejectedValue(new Error("timeout"));

    await expect(checkOmekaHealth(config, fetchMock)).resolves.toBe("unavailable");
  });
});
