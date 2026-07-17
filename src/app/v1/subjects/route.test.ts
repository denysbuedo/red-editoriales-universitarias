import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /v1/subjects", () => {
  it("returns paginated subject authorities", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/subjects?page=1&pageSize=10");
    const response = await GET(request);

    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          identifier: "unesco:1203",
          preferredLabel: "Ciencia de los ordenadores",
          uri: "https://pnpu.mes.gob.cu/vocabularies/subjects/1203",
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
