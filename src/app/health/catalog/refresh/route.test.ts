import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /health/catalog/refresh", () => {
  it("does not refresh when the endpoint token is not configured", async () => {
    const previousToken = process.env.PNPU_CATALOG_REFRESH_TOKEN;
    delete process.env.PNPU_CATALOG_REFRESH_TOKEN;

    try {
      const response = await POST(new Request("https://pnpu.mes.gob.cu/health/catalog/refresh"));

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Catalog refresh endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_CATALOG_REFRESH_TOKEN = previousToken;
      }
    }
  });

  it("rejects an invalid refresh token", async () => {
    const previousToken = process.env.PNPU_CATALOG_REFRESH_TOKEN;
    process.env.PNPU_CATALOG_REFRESH_TOKEN = "expected-token";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/health/catalog/refresh", {
          method: "POST",
          headers: {
            "X-PNPU-Refresh-Token": "wrong-token",
          },
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-403",
        message: "Catalog refresh token is invalid.",
      });
      expect(response.status).toBe(403);
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_CATALOG_REFRESH_TOKEN;
      } else {
        process.env.PNPU_CATALOG_REFRESH_TOKEN = previousToken;
      }
    }
  });

  it("requires Omeka as the active catalog repository", async () => {
    const previousToken = process.env.PNPU_CATALOG_REFRESH_TOKEN;
    const previousRepository = process.env.PNPU_CATALOG_REPOSITORY;
    process.env.PNPU_CATALOG_REFRESH_TOKEN = "expected-token";
    process.env.PNPU_CATALOG_REPOSITORY = "in-memory";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/health/catalog/refresh", {
          method: "POST",
          headers: {
            "X-PNPU-Refresh-Token": "expected-token",
          },
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-409",
        message: "Catalog refresh requires the active Omeka repository.",
      });
      expect(response.status).toBe(409);
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_CATALOG_REFRESH_TOKEN;
      } else {
        process.env.PNPU_CATALOG_REFRESH_TOKEN = previousToken;
      }

      if (previousRepository === undefined) {
        delete process.env.PNPU_CATALOG_REPOSITORY;
      } else {
        process.env.PNPU_CATALOG_REPOSITORY = previousRepository;
      }
    }
  });
});
