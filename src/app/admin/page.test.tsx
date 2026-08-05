import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AdminPage from "./page";

describe("AdminPage", () => {
  it("renders the protected administration index", () => {
    const html = renderToStaticMarkup(<AdminPage />);

    expect(html).toContain("Panel operativo PNPU");
    expect(html).toContain("/admin/importaciones/publicaciones");
  });
});
