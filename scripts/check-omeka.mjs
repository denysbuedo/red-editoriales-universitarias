const REQUIRED_TEMPLATE_LABELS = [
  "PNPU Publication",
  "PNPU Contributor",
  "PNPU Publisher",
  "PNPU University",
  "PNPU Collection",
  "PNPU Subject",
  "PNPU Digital Resource",
];

const REQUIRED_VOCABULARIES = [
  "dcterms",
  "bibo",
  "foaf",
  "schema",
  "skos",
  "pnpu",
];

const REQUIRED_TEMPLATE_PROPERTIES = {
  "PNPU Publication": [
    "pnpu:uuid",
    "dcterms:title",
    "dcterms:alternative",
    "dcterms:abstract",
    "dcterms:issued",
    "dcterms:language",
    "dcterms:type",
    "dcterms:format",
    "dcterms:license",
    "dcterms:publisher",
    "dcterms:creator",
    "dcterms:contributor",
    "dcterms:identifier",
    "bibo:isbn",
    "bibo:doi",
    "dcterms:subject",
    "dcterms:isPartOf",
    "schema:keywords",
  ],
  "PNPU Contributor": [
    "pnpu:uuid",
    "foaf:name",
    "foaf:givenName",
    "foaf:familyName",
    "schema:roleName",
    "schema:sameAs",
    "schema:affiliation",
    "schema:description",
    "schema:nationality",
  ],
  "PNPU Publisher": [
    "pnpu:uuid",
    "schema:name",
    "dcterms:title",
    "schema:alternateName",
    "pnpu:publisherCode",
    "dcterms:description",
    "schema:parentOrganization",
    "schema:addressLocality",
    "schema:addressCountry",
    "schema:url",
    "schema:logo",
    "schema:email",
    "schema:telephone",
    "schema:contactPoint",
  ],
  "PNPU University": [
    "pnpu:uuid",
    "schema:name",
    "schema:alternateName",
    "pnpu:universityCode",
    "schema:addressLocality",
    "schema:addressCountry",
    "schema:url",
  ],
  "PNPU Collection": [
    "pnpu:uuid",
    "dcterms:title",
    "dcterms:publisher",
    "dcterms:description",
    "pnpu:collectionCode",
    "pnpu:editorialSeries",
    "dcterms:subject",
  ],
  "PNPU Subject": [
    "skos:notation",
    "dcterms:identifier",
    "skos:prefLabel",
    "schema:url",
    "skos:broader",
    "skos:related",
  ],
  "PNPU Digital Resource": [
    "pnpu:resourceType",
    "dcterms:format",
    "pnpu:fileSize",
    "pnpu:checksum",
    "dcterms:language",
    "dcterms:license",
  ],
};

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 100;

const baseUrl = normalizeBaseUrl(process.env.PNPU_OMEKA_BASE_URL);
const timeoutMs = normalizeTimeout(process.env.PNPU_OMEKA_TIMEOUT_MS);

if (baseUrl === null) {
  console.error("PNPU_OMEKA_BASE_URL is required. Example: http://127.0.0.1/omeka-s");
  process.exit(1);
}

try {
  const [items, itemSets, media, vocabularies, properties, resourceTemplates] = await Promise.all([
    loadAllPages("/api/items"),
    loadAllPages("/api/item_sets"),
    loadAllPages("/api/media"),
    loadAllPages("/api/vocabularies"),
    loadAllPages("/api/properties"),
    loadAllPages("/api/resource_templates"),
  ]);
  const resources = [...items, ...itemSets, ...media];
  const diagnostics = buildDiagnostics({
    items,
    itemSets,
    media,
    resources,
    vocabularies,
    properties,
    resourceTemplates,
  });

  console.log(JSON.stringify(diagnostics, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unknown Omeka diagnostic error.");
  process.exit(1);
}

async function loadAllPages(path) {
  const resources = [];

  for (let page = 1; page <= DEFAULT_MAX_PAGES; page += 1) {
    const pageResources = await fetchJsonArray(path, {
      page: String(page),
      per_page: String(DEFAULT_PAGE_SIZE),
    });
    resources.push(...pageResources);

    if (pageResources.length < DEFAULT_PAGE_SIZE) {
      return resources;
    }
  }

  throw new Error("Omeka pagination exceeded the configured diagnostic limit.");
}

async function fetchJsonArray(path, query) {
  const url = new URL(`${baseUrl}${path}`);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Omeka returned HTTP ${response.status} for ${url.pathname}.`);
    }

    const payload = await response.json();

    if (!Array.isArray(payload) || !payload.every(isJsonObject)) {
      throw new Error(`Omeka returned invalid JSON for ${url.pathname}.`);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function buildDiagnostics({
  items,
  itemSets,
  media,
  resources,
  vocabularies,
  properties,
  resourceTemplates,
}) {
  const templateCounts = Object.fromEntries(REQUIRED_TEMPLATE_LABELS.map((label) => [label, 0]));
  const unknownTemplates = new Set();
  let withoutTemplate = 0;
  const propertyTermById = new Map(
    properties
      .map((property) => [readOmekaId(property), readNonEmptyString(property["o:term"])])
      .filter(([id, term]) => id !== null && term !== null),
  );
  const installation = buildInstallationDiagnostics({
    vocabularies,
    properties,
    propertyTermById,
    resourceTemplates,
  });
  const templateLabelById = buildTemplateLabelById(resourceTemplates);

  for (const resource of resources) {
    const label = readTemplateLabel(resource, templateLabelById);

    if (label === null) {
      withoutTemplate += 1;
      continue;
    }

    if (Object.hasOwn(templateCounts, label)) {
      templateCounts[label] += 1;
    } else {
      unknownTemplates.add(label);
    }
  }

  return {
    baseUrl,
    status: "available",
    totals: {
      items: items.length,
      itemSets: itemSets.length,
      media: media.length,
      resources: resources.length,
    },
    pnpuTemplates: templateCounts,
    missingPnpuTemplates: REQUIRED_TEMPLATE_LABELS.filter((label) => templateCounts[label] === 0),
    installation,
    unknown: {
      total: resources.length - Object.values(templateCounts).reduce((total, count) => total + count, 0),
      withoutTemplate,
      templateLabels: [...unknownTemplates].sort((left, right) => left.localeCompare(right)),
    },
  };
}

function buildInstallationDiagnostics({
  vocabularies,
  properties,
  propertyTermById,
  resourceTemplates,
}) {
  const vocabularyPrefixes = new Set(vocabularies.map((vocabulary) => vocabulary["o:prefix"]));
  const propertyTerms = new Set(properties.map((property) => property["o:term"]));
  const resourceTemplateByLabel = new Map(
    resourceTemplates.map((template) => [readNonEmptyString(template["o:label"]), template]),
  );
  const requiredProperties = [
    ...new Set(Object.values(REQUIRED_TEMPLATE_PROPERTIES).flatMap((terms) => terms)),
  ];
  const templates = Object.entries(REQUIRED_TEMPLATE_PROPERTIES).map(([label, terms]) => {
    const template = resourceTemplateByLabel.get(label);
    const actualTerms =
      template === undefined ? [] : readTemplatePropertyTerms(template, propertyTermById);

    return {
      label,
      present: template !== undefined,
      missingProperties: terms.filter((term) => !actualTerms.includes(term)),
    };
  });

  return {
    missingVocabularies: REQUIRED_VOCABULARIES.filter((prefix) => !vocabularyPrefixes.has(prefix)),
    missingProperties: requiredProperties
      .filter((term) => !propertyTerms.has(term))
      .sort((left, right) => left.localeCompare(right)),
    templates,
    readyForPnpuMapping:
      templates.every((template) => template.present && template.missingProperties.length === 0) &&
      REQUIRED_VOCABULARIES.every((prefix) => vocabularyPrefixes.has(prefix)) &&
      requiredProperties.every((term) => propertyTerms.has(term)),
  };
}

function readTemplatePropertyTerms(template, propertyTermById) {
  const values = template["o:resource_template_property"];

  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => {
      const property = isJsonObject(value) ? value["o:property"] : null;
      const propertyId = isJsonObject(property) ? readOmekaId(property) : null;

      return propertyId === null ? null : propertyTermById.get(propertyId);
    })
    .filter((term) => typeof term === "string");
}

function buildTemplateLabelById(resourceTemplates) {
  return new Map(
    resourceTemplates
      .map((template) => [readOmekaId(template), readNonEmptyString(template["o:label"])])
      .filter(([id, label]) => id !== null && label !== null),
  );
}

function readTemplateLabel(resource, templateLabelById) {
  const template = resource["o:resource_template"];

  if (!isJsonObject(template)) {
    return null;
  }

  const directLabel = readNonEmptyString(template["o:label"]);

  if (directLabel !== null) {
    return directLabel;
  }

  const templateId = readOmekaId(template);

  return templateId === null ? null : (templateLabelById.get(templateId) ?? null);
}

function readOmekaId(resource) {
  if (!isJsonObject(resource)) {
    return null;
  }

  const value = resource["o:id"];

  return Number.isInteger(value) ? value : null;
}

function readNonEmptyString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function normalizeBaseUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return new URL(value).toString().replace(/\/$/, "");
}

function normalizeTimeout(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return 2000;
  }

  const timeout = Number(value);

  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 10000) {
    throw new Error("PNPU_OMEKA_TIMEOUT_MS must be an integer between 1 and 10000.");
  }

  return timeout;
}

function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
