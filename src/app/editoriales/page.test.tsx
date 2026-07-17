import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PublishersPage, { dynamic } from "./page";

describe("PublishersPage", () => {
  it("is dynamic because the directory depends on the active repository", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders the publisher directory page", async () => {
    const html = renderToStaticMarkup(await PublishersPage());

    expect(html).toContain("Editoriales universitarias");
    expect(html).toContain("Editorial Universidad de La Habana");
    expect(html).toContain("Editorial UH");
    expect(html).toContain("/editoriales/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03");
  });
});
