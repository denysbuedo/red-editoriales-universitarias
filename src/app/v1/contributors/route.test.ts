import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /v1/contributors", () => {
  it("returns paginated contributor authorities", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/contributors?page=1&pageSize=10");
    const response = await GET(request);

    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01",
          name: "Juana Perez Rodriguez",
          roles: ["author"],
          orcid: "https://orcid.org/0000-0002-1825-0097",
          affiliation: "Universidad de La Habana",
          publicationCount: 1,
        },
      ],
      pagination: {
        total: 1,
      },
    });
    expect(response.status).toBe(200);
  });
});
