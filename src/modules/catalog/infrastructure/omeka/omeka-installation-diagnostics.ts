import {
  OmekaInstallationProfile,
  OmekaResourceTemplateRequirement,
  PNPU_OMEKA_INSTALLATION_PROFILE,
} from "./omeka-installation-profile";

export interface OmekaVocabularySummary {
  readonly prefix: string;
  readonly namespaceUri: string;
}

export interface OmekaPropertySummary {
  readonly term: string;
}

export interface OmekaResourceTemplateSummary {
  readonly label: string;
  readonly propertyTerms: readonly string[];
}

export interface OmekaInstallationSnapshot {
  readonly vocabularies: readonly OmekaVocabularySummary[];
  readonly properties: readonly OmekaPropertySummary[];
  readonly resourceTemplates: readonly OmekaResourceTemplateSummary[];
}

export interface OmekaTemplateDiagnostics {
  readonly label: string;
  readonly present: boolean;
  readonly missingProperties: readonly string[];
}

export interface OmekaInstallationDiagnostics {
  readonly missingVocabularies: readonly string[];
  readonly missingProperties: readonly string[];
  readonly templates: readonly OmekaTemplateDiagnostics[];
  readonly readyForPnpuMapping: boolean;
}

export function buildOmekaInstallationDiagnostics(
  snapshot: OmekaInstallationSnapshot,
  profile: OmekaInstallationProfile = PNPU_OMEKA_INSTALLATION_PROFILE,
): OmekaInstallationDiagnostics {
  const vocabularyPrefixes = new Set(snapshot.vocabularies.map((vocabulary) => vocabulary.prefix));
  const propertyTerms = new Set(snapshot.properties.map((property) => property.term));
  const templateByLabel = new Map(
    snapshot.resourceTemplates.map((template) => [template.label, template]),
  );
  const missingVocabularies = profile.vocabularies
    .filter((vocabulary) => !vocabularyPrefixes.has(vocabulary.prefix))
    .map((vocabulary) => vocabulary.prefix);
  const requiredPropertyTerms = new Set(
    profile.resourceTemplates.flatMap((template) =>
      template.properties.map((property) => property.term),
    ),
  );
  const missingProperties = [...requiredPropertyTerms]
    .filter((term) => !propertyTerms.has(term))
    .sort((left, right) => left.localeCompare(right));
  const templates = profile.resourceTemplates.map((template) =>
    evaluateTemplate(template, templateByLabel.get(template.label)),
  );

  return {
    missingVocabularies,
    missingProperties,
    templates,
    readyForPnpuMapping:
      missingVocabularies.length === 0 &&
      missingProperties.length === 0 &&
      templates.every((template) => template.present && template.missingProperties.length === 0),
  };
}

function evaluateTemplate(
  requirement: OmekaResourceTemplateRequirement,
  template: OmekaResourceTemplateSummary | undefined,
): OmekaTemplateDiagnostics {
  if (template === undefined) {
    return {
      label: requirement.label,
      present: false,
      missingProperties: requirement.properties.map((property) => property.term),
    };
  }

  const actualTerms = new Set(template.propertyTerms);

  return {
    label: requirement.label,
    present: true,
    missingProperties: requirement.properties
      .map((property) => property.term)
      .filter((term) => !actualTerms.has(term)),
  };
}
