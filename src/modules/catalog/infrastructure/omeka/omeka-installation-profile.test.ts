import { describe, expect, it } from "vitest";
import manifest from "../../../../../schemas/omeka/pnpu-resource-templates.json";
import { PNPU_OMEKA_INSTALLATION_PROFILE } from "./omeka-installation-profile";

describe("PNPU_OMEKA_INSTALLATION_PROFILE", () => {
  it("matches the versioned Omeka resource template manifest", () => {
    expect(PNPU_OMEKA_INSTALLATION_PROFILE.resourceTemplates).toEqual(manifest.resourceTemplates);
  });
});
