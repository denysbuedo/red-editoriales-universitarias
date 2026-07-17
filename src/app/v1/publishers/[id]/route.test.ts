import { describe, expect, it } from "vitest";

import { GET } from "./route";

const publisherId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03";

describe("GET /v1/publishers/{id}", () => {
  it("returns a publisher detail response", async () => {
    const request = new Request(`https://pnpu.mes.gob.cu/v1/publishers/${publisherId}`);
    const response = await GET(request, { params: Promise.resolve({ id: publisherId }) });

    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: publisherId,
        officialName: "Editorial Universidad de La Habana",
        acronym: "Editorial UH",
        publisherCode: "RNEU-UH",
        province: "La Habana",
        website: "https://www.uh.cu/editorial",
        country: "CU",
        university: {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c02",
          officialName: "Universidad de La Habana",
          acronym: "UH",
          province: "La Habana",
          country: "CU",
        },
        contactPoint: {
          email: "editorial@uh.cu",
          telephone: "+53 7 000 0000",
          url: "https://www.uh.cu/editorial",
        },
      },
      links: {
        self: `https://pnpu.mes.gob.cu/v1/publishers/${publisherId}`,
      },
      meta: {
        apiVersion: "v1",
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns PNPU-404 for missing publishers", async () => {
    const missingId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c09";
    const request = new Request(`https://pnpu.mes.gob.cu/v1/publishers/${missingId}`, {
      headers: {
        "X-Correlation-Id": "publisher-request-404",
      },
    });
    const response = await GET(request, { params: Promise.resolve({ id: missingId }) });

    await expect(response.json()).resolves.toEqual({
      code: "PNPU-404",
      message: "Publisher not found.",
      correlationId: "publisher-request-404",
    });
    expect(response.status).toBe(404);
  });

  it("returns PNPU-422 for invalid publisher identifiers", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/publishers/not-a-uuid");
    const response = await GET(request, { params: Promise.resolve({ id: "not-a-uuid" }) });
    const payload: unknown = await response.json();

    expect(payload).toMatchObject({
      code: "PNPU-422",
    });
    expect(response.status).toBe(422);
  });
});
