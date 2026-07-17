import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

describe("GET /sitemap.xml", () => {
  it("includes home, publication and publisher URLs", async () => {
    const entries = await sitemap();

    expect(entries).toContainEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:4307",
        changeFrequency: "weekly",
        priority: 1,
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:4307/publicaciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:4307/colecciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08",
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:4307/editoriales/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03",
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:4307/autores/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01",
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:4307/materias/unesco%3A1203",
      }),
    );
  });
});
