import { describe, expect, it } from "vitest";
import { buildOmekaInstallationDiagnostics } from "./omeka-installation-diagnostics";
import { PNPU_OMEKA_INSTALLATION_PROFILE } from "./omeka-installation-profile";

describe("buildOmekaInstallationDiagnostics", () => {
  it("reports missing vocabularies, properties and templates", () => {
    const diagnostics = buildOmekaInstallationDiagnostics({
      vocabularies: [
        {
          prefix: "dcterms",
          namespaceUri: "http://purl.org/dc/terms/",
        },
      ],
      properties: [{ term: "dcterms:title" }],
      resourceTemplates: [],
    });

    expect(diagnostics.readyForPnpuMapping).toBe(false);
    expect(diagnostics.missingVocabularies).toContain("schema");
    expect(diagnostics.missingVocabularies).toContain("skos");
    expect(diagnostics.missingVocabularies).toContain("pnpu");
    expect(diagnostics.missingProperties).toContain("pnpu:uuid");
    const publicationTemplate = diagnostics.templates.find(
      (template) => template.label === "PNPU Publication",
    );

    expect(publicationTemplate).toBeDefined();
    expect(publicationTemplate?.present).toBe(false);
    expect(publicationTemplate?.missingProperties).toContain("pnpu:uuid");
    expect(publicationTemplate?.missingProperties).toContain("dcterms:title");
  });

  it("marks Omeka ready when the profile is fully present", () => {
    const properties = [
      ...new Set(
        PNPU_OMEKA_INSTALLATION_PROFILE.resourceTemplates.flatMap((template) =>
          template.properties.map((property) => property.term),
        ),
      ),
    ].map((term) => ({ term }));
    const resourceTemplates = PNPU_OMEKA_INSTALLATION_PROFILE.resourceTemplates.map((template) => ({
      label: template.label,
      propertyTerms: template.properties.map((property) => property.term),
    }));

    expect(
      buildOmekaInstallationDiagnostics({
        vocabularies: PNPU_OMEKA_INSTALLATION_PROFILE.vocabularies,
        properties,
        resourceTemplates,
      }),
    ).toMatchObject({
      missingVocabularies: [],
      missingProperties: [],
      readyForPnpuMapping: true,
    });
  });
});
