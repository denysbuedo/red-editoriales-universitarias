import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AboutPage from "./page";

describe("AboutPage", () => {
  it("renders the institutional scope page", () => {
    const html = renderToStaticMarkup(<AboutPage />);

    expect(html).toContain("Acerca de PNPU");
    expect(html).toContain("Qué integra");
    expect(html).toContain("Qué no es");
    expect(html).toContain("Omeka S");
    expect(html).toContain("/admin");
  });
});
