const baseUrl = normalizeBaseUrl(process.env.PNPU_OMEKA_BASE_URL);
const timeoutMs = normalizeTimeout(process.env.PNPU_OMEKA_TIMEOUT_MS);

if (baseUrl === null) {
  console.error("PNPU_OMEKA_BASE_URL is required. Example: http://127.0.0.1/omeka-s");
  process.exit(1);
}

try {
  const [items, itemSets, media, resourceTemplates] = await Promise.all([
    loadAllPages("/api/items"),
    loadAllPages("/api/item_sets"),
    loadAllPages("/api/media"),
    loadAllPages("/api/resource_templates"),
  ]);
  const templateLabelById = buildTemplateLabelById(resourceTemplates);
  const classifications = [...items, ...itemSets, ...media].map((resource) =>
    classifyResource(resource, templateLabelById),
  );
  const summary = {
    baseUrl,
    source: {
      items: items.length,
      itemSets: itemSets.length,
      media: media.length,
    },
    recognizedTemplates: countBy(
      classifications
        .filter((classification) => classification.kind !== "unknown")
        .map((classification) => classification.templateLabel),
    ),
    unknownTemplates: countBy(
      classifications
        .filter((classification) => classification.kind === "unknown")
        .map((classification) => classification.templateLabel ?? "[no template]"),
    ),
    mappingReadiness: {
      canMapPublications: classifications.some(
        (classification) => classification.templateLabel === "PNPU Publication",
      ),
      canMapReferenceData: ["PNPU Subject", "PNPU Contributor", "PNPU Publisher", "PNPU University"].every(
        (templateLabel) =>
          classifications.some((classification) => classification.templateLabel === templateLabel),
      ),
    },
  };

  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unknown Omeka mapping diagnostic error.");
  process.exit(1);
}

async function loadAllPages(path) {
  const pageSize = 100;
  const resources = [];

  for (let page = 1; page <= 100; page += 1) {
    const pageResources = await fetchJsonArray(path, {
      page: String(page),
      per_page: String(pageSize),
    });
    resources.push(...pageResources);

    if (pageResources.length < pageSize) {
      return resources;
    }
  }

  throw new Error(`Omeka pagination exceeded the configured diagnostic limit for ${path}.`);
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

function classifyResource(resource, templateLabelById) {
  const templateLabel = readTemplateLabel(resource, templateLabelById);
  const knownTemplates = new Set([
    "PNPU Publication",
    "PNPU Contributor",
    "PNPU Publisher",
    "PNPU University",
    "PNPU Collection",
    "PNPU Subject",
    "PNPU Digital Resource",
  ]);

  return {
    kind: templateLabel !== null && knownTemplates.has(templateLabel) ? "known" : "unknown",
    templateLabel,
  };
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

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function normalizeBaseUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return new URL(value).toString().replace(/\/$/, "");
}

function normalizeTimeout(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return 5000;
  }

  const timeout = Number(value);

  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 10000) {
    throw new Error("PNPU_OMEKA_TIMEOUT_MS must be an integer between 1 and 10000.");
  }

  return timeout;
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

function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
