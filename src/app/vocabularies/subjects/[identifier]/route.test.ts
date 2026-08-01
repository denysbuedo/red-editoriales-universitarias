import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /vocabularies/subjects/{identifier}", () => {
  it("redirects legacy subject vocabulary URLs to subject detail pages", async () => {
    const response = await GET(
      new Request("https://editorial.reduniv.edu.cu/vocabularies/subjects/37-01"),
      {
        params: Promise.resolve({ identifier: "37-01" }),
      },
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe(
      "https://editorial.reduniv.edu.cu/materias/37.01",
    );
  });

  it("keeps non-decimal identifiers unchanged", async () => {
    const response = await GET(
      new Request("https://editorial.reduniv.edu.cu/vocabularies/subjects/unesco%3A1203"),
      {
        params: Promise.resolve({ identifier: "unesco%3A1203" }),
      },
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe(
      "https://editorial.reduniv.edu.cu/materias/unesco%3A1203",
    );
  });
});
