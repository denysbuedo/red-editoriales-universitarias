import manifest from "../schemas/omeka/pnpu-resource-templates.json" with { type: "json" };

const VOCABULARIES = [
  {
    prefix: "schema",
    namespaceUri: "https://schema.org/",
    label: "Schema.org",
    properties: [
      "name",
      "alternateName",
      "keywords",
      "url",
      "logo",
      "email",
      "telephone",
      "contactPoint",
      "parentOrganization",
      "addressLocality",
      "addressCountry",
      "roleName",
      "sameAs",
      "affiliation",
      "description",
      "nationality",
    ],
  },
  {
    prefix: "skos",
    namespaceUri: "http://www.w3.org/2004/02/skos/core#",
    label: "Simple Knowledge Organization System",
    properties: ["notation", "prefLabel", "broader", "related", "altLabel", "narrower", "definition"],
  },
  {
    prefix: "pnpu",
    namespaceUri: "https://pnpu.mes.gob.cu/ns#",
    label: "PNPU",
    properties: [
      "uuid",
      "publisherCode",
      "universityCode",
      "collectionCode",
      "editorialSeries",
      "resourceType",
      "fileSize",
      "checksum",
      "contributorRole",
      "accessLevel",
      "digitalAvailability",
      "qualityScore",
    ],
  },
];

const dryRun = process.argv.includes("--dry-run");
const baseUrl = normalizeRequiredUrl(process.env.PNPU_OMEKA_BASE_URL, "PNPU_OMEKA_BASE_URL");
const keyIdentity = readRequiredSecret("PNPU_OMEKA_KEY_IDENTITY");
const keyCredential = readRequiredSecret("PNPU_OMEKA_KEY_CREDENTIAL");
const timeoutMs = normalizeTimeout(process.env.PNPU_OMEKA_TIMEOUT_MS);

const context = {
  vocabularies: await listAll("/api/vocabularies"),
  properties: await listAll("/api/properties"),
  resourceTemplates: await listAll("/api/resource_templates"),
};

const actions = [];

await installVocabularies(context, actions);
context.vocabularies = await listAll("/api/vocabularies");
context.properties = await listAll("/api/properties");
await installResourceTemplates(context, actions);

console.log(
  JSON.stringify(
    {
      baseUrl,
      dryRun,
      actions,
    },
    null,
    2,
  ),
);

async function installVocabularies(context, actions) {
  const vocabularyPrefixes = new Set(context.vocabularies.map((vocabulary) => vocabulary["o:prefix"]));

  for (const vocabulary of VOCABULARIES) {
    if (vocabularyPrefixes.has(vocabulary.prefix)) {
      actions.push({ type: "vocabulary", prefix: vocabulary.prefix, status: "exists" });
      continue;
    }

    actions.push({ type: "vocabulary", prefix: vocabulary.prefix, status: dryRun ? "would_create" : "created" });

    if (dryRun) {
      continue;
    }

    await postJson("/api/vocabularies", {
      "o:namespace_uri": vocabulary.namespaceUri,
      "o:prefix": vocabulary.prefix,
      "o:label": vocabulary.label,
      "o:comment": `PNPU installation profile vocabulary subset for ${vocabulary.prefix}.`,
      "o:property": vocabulary.properties.map((property) => ({
        "o:local_name": property,
        "o:label": property,
        "o:comment": "",
      })),
    });
  }
}

async function installResourceTemplates(context, actions) {
  const propertyIdByTerm = new Map(
    context.properties
      .map((property) => [property["o:term"], property["o:id"]])
      .filter(([term, id]) => typeof term === "string" && Number.isInteger(id)),
  );
  const templateLabels = new Set(context.resourceTemplates.map((template) => template["o:label"]));

  for (const template of manifest.resourceTemplates) {
    if (templateLabels.has(template.label)) {
      actions.push({ type: "resource_template", label: template.label, status: "exists" });
      continue;
    }

    const missingTerms = template.properties
      .map((property) => property.term)
      .filter((term) => !propertyIdByTerm.has(term));

    if (missingTerms.length > 0) {
      actions.push({
        type: "resource_template",
        label: template.label,
        status: "blocked",
        missingProperties: missingTerms,
      });
      continue;
    }

    actions.push({
      type: "resource_template",
      label: template.label,
      status: dryRun ? "would_create" : "created",
    });

    if (dryRun) {
      continue;
    }

    await postJson("/api/resource_templates", {
      "o:label": template.label,
      "o:resource_template_property": template.properties.map((property) => ({
        "o:property": {
          "o:id": propertyIdByTerm.get(property.term),
        },
        "o:is_required": property.required,
        "o:is_private": false,
        "o:data_type": [],
      })),
    });
  }
}

async function listAll(path) {
  const pageSize = 100;
  const values = [];

  for (let page = 1; page <= 100; page += 1) {
    const pageValues = await getJsonArray(path, {
      page: String(page),
      per_page: String(pageSize),
    });
    values.push(...pageValues);

    if (pageValues.length < pageSize) {
      return values;
    }
  }

  throw new Error(`Omeka pagination exceeded limit for ${path}.`);
}

async function getJsonArray(path, query) {
  const response = await fetchOmeka(path, { method: "GET", query });
  const payload = await response.json();

  if (!Array.isArray(payload) || !payload.every(isJsonObject)) {
    throw new Error(`Omeka returned invalid JSON array for ${path}.`);
  }

  return payload;
}

async function postJson(path, payload) {
  const response = await fetchOmeka(path, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.json();
}

async function fetchOmeka(path, options) {
  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("key_identity", keyIdentity);
  url.searchParams.set("key_credential", keyCredential);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      body: options.body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Omeka returned HTTP ${response.status} for ${path}: ${body.slice(0, 500)}`);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeRequiredUrl(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }

  return new URL(value).toString().replace(/\/$/, "");
}

function readRequiredSecret(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }

  return value;
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

function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
