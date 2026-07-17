import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /v1/publications", () => {
  it("returns a paginated publication summary response", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/publications?page=1&pageSize=10");
    const response = await GET(request);

    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
          title: "Arquitectura empresarial para universidades",
          subtitle: "Gobierno, integración y sostenibilidad tecnológica",
          publicationDate: "2026-07-14",
          language: "es",
          type: "book",
          license: "CC BY",
          primaryIdentifier: {
            type: "isbn",
            value: "9789590000003",
          },
          subjects: [
            {
              identifier: "unesco:1203",
              preferredLabel: "Ciencia de los ordenadores",
              uri: "https://pnpu.mes.gob.cu/vocabularies/subjects/1203",
            },
          ],
          keywords: ["arquitectura empresarial", "universidades", "gobierno de datos"],
          publisher: {
            id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03",
            officialName: "Editorial Universidad de La Habana",
            country: "CU",
          },
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
      links: {
        self: "https://pnpu.mes.gob.cu/v1/publications?page=1&pageSize=10",
      },
      meta: {
        apiVersion: "v1",
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns PNPU-422 for invalid pagination", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/publications?page=0", {
      headers: {
        "X-Correlation-Id": "request-1",
      },
    });
    const response = await GET(request);

    await expect(response.json()).resolves.toEqual({
      code: "PNPU-422",
      message: "Pagination page must be an integer greater than or equal to 1.",
      correlationId: "request-1",
    });
    expect(response.status).toBe(422);
    expect(response.headers.get("X-Correlation-Id")).toBe("request-1");
  });

  it("applies publication filters", async () => {
    const request = new Request(
      "https://pnpu.mes.gob.cu/v1/publications?q=gobierno&language=es&subject=ordenadores&publisherId=018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03&contributorId=018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01&collectionId=018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08&sort=titleAsc",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
          language: "es",
        },
      ],
      pagination: {
        total: 1,
      },
    });
  });

  it("returns PNPU-422 for invalid filters", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/publications?language=spa", {
      headers: {
        "X-Correlation-Id": "request-filter-1",
      },
    });
    const response = await GET(request);

    await expect(response.json()).resolves.toMatchObject({
      code: "PNPU-422",
      correlationId: "request-filter-1",
    });
    expect(response.status).toBe(422);
  });
});
