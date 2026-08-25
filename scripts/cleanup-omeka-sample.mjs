import sample from "../schemas/omeka/pnpu-sample-catalog.json" with { type: "json" };

const dryRun = process.argv.includes("--dry-run") || process.env.PNPU_OMEKA_CLEANUP_DRY_RUN === "true";
const confirmed = process.env.PNPU_OMEKA_CLEANUP_CONFIRM === "delete-sample-data";
const baseUrl = normalizeRequiredUrl(process.env.PNPU_OMEKA_BASE_URL, "PNPU_OMEKA_BASE_URL");
const keyIdentity = readRequiredSecret("PNPU_OMEKA_KEY_IDENTITY");
const keyCredential = readRequiredSecret("PNPU_OMEKA_KEY_CREDENTIAL");
const timeoutMs = normalizeTimeout(process.env.PNPU_OMEKA_TIMEOUT_MS);

if (!dryRun && !confirmed) {
  throw new Error(
    "Refusing to delete Omeka sample data. Run with --dry-run first, then set PNPU_OMEKA_CLEANUP_CONFIRM=delete-sample-data.",
  );
}

const context = {
  items: await listAll("/api/items"),
  itemSets: await listAll("/api/item_sets"),
  media: await listAll("/api/media"),
};
const targets = planCleanup(context);
const actions = [];

for (const media of targets.media) {
  await deleteResource("media", "/api/media", media);
}

for (const item of targets.items) {
  await deleteResource("item", "/api/items", item);
}

for (const itemSet of targets.itemSets) {
  await deleteResource("item_set", "/api/item_sets", itemSet);
}

console.log(
  JSON.stringify(
    {
      baseUrl,
      dryRun,
      confirmed,
      summary: {
        media: targets.media.length,
        items: targets.items.length,
        itemSets: targets.itemSets.length,
      },
      actions,
    },
    null,
    2,
  ),
);

function planCleanup(cleanupContext) {
  const publicationTitles = new Set(
    sample.records.publications.map((publication) => publication.title),
  );
  const publicationIds = new Set(
    cleanupContext.items
      .filter((item) => isTemplate(item, "PNPU Publication"))
      .filter((item) => publicationTitles.has(readFirstLiteral(item, "dcterms:title")))
      .map(readOmekaId),
  );
  const media = cleanupContext.media.filter((resource) => {
    const parentItemId = readLinkedId(resource, "o:item");
    return parentItemId !== null && publicationIds.has(parentItemId);
  });
  const items = cleanupContext.items.filter(isSampleItem);
  const itemSets = cleanupContext.itemSets.filter(isSampleItemSet);

  return {
    media: sortById(media),
    items: sortByDeletionPriority(items),
    itemSets: sortById(itemSets),
  };
}

function isSampleItem(resource) {
  if (matchesTemplateAndLiteral(resource, "PNPU Publication", "dcterms:title", sampleTitles("publications"))) {
    return true;
  }

  if (matchesTemplateAndLiteral(resource, "PNPU Contributor", "foaf:name", sampleNames("contributors"))) {
    return true;
  }

  if (matchesTemplateAndLiteral(resource, "PNPU Subject", "skos:notation", sampleNotations())) {
    return true;
  }

  if (matchesTemplateAndLiteral(resource, "PNPU Publisher", "schema:name", sampleNames("publishers"))) {
    return true;
  }

  return matchesTemplateAndLiteral(resource, "PNPU University", "schema:name", sampleNames("universities"));
}

function isSampleItemSet(resource) {
  return matchesTemplateAndLiteral(resource, "PNPU Collection", "dcterms:title", sampleTitles("collections"));
}

function matchesTemplateAndLiteral(resource, templateLabel, term, values) {
  return isTemplate(resource, templateLabel) && values.has(readFirstLiteral(resource, term));
}

function sampleNames(kind) {
  return new Set(sample.records[kind].map((record) => record.name));
}

function sampleTitles(kind) {
  return new Set(sample.records[kind].map((record) => record.title));
}

function sampleNotations() {
  return new Set(sample.records.subjects.map((subject) => subject.notation));
}

function sortById(resources) {
  return [...resources].sort((left, right) => readOmekaId(left) - readOmekaId(right));
}

function sortByDeletionPriority(resources) {
  const priorityByTemplate = new Map([
    ["PNPU Publication", 1],
    ["PNPU Contributor", 2],
    ["PNPU Subject", 3],
    ["PNPU Publisher", 4],
    ["PNPU University", 5],
  ]);

  return [...resources].sort((left, right) => {
    const leftPriority = priorityByTemplate.get(readTemplateLabel(left) ?? "") ?? 99;
    const rightPriority = priorityByTemplate.get(readTemplateLabel(right) ?? "") ?? 99;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return readOmekaId(left) - readOmekaId(right);
  });
}

async function deleteResource(type, path, resource) {
  const id = readOmekaId(resource);
  actions.push({
    type,
    id,
    templateLabel: readTemplateLabel(resource),
    label: readResourceLabel(resource),
    status: dryRun ? "would_delete" : "deleted",
  });

  if (dryRun) {
    return;
  }

  await fetchOmeka(`${path}/${String(id)}`, { method: "DELETE" });
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
      headers: { Accept: "application/json" },
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

function isTemplate(resource, templateLabel) {
  return readTemplateLabel(resource) === templateLabel;
}

function readTemplateLabel(resource) {
  const template = resource["o:resource_template"];
  const label = isJsonObject(template) ? template["o:label"] : undefined;
  return typeof label === "string" ? label : null;
}

function readFirstLiteral(resource, term) {
  const values = Array.isArray(resource[term]) ? resource[term] : [];

  for (const value of values) {
    if (typeof value?.["@value"] === "string") {
      return value["@value"];
    }
  }

  return null;
}

function readLinkedId(resource, term) {
  const value = resource[term];

  if (isJsonObject(value) && Number.isInteger(value["o:id"])) {
    return value["o:id"];
  }

  const values = Array.isArray(value) ? value : [];

  for (const item of values) {
    if (Number.isInteger(item?.value_resource_id)) {
      return item.value_resource_id;
    }
  }

  return null;
}

function readResourceLabel(resource) {
  return (
    readFirstLiteral(resource, "dcterms:title") ??
    readFirstLiteral(resource, "schema:name") ??
    readFirstLiteral(resource, "foaf:name") ??
    readFirstLiteral(resource, "skos:prefLabel") ??
    readFirstLiteral(resource, "skos:notation") ??
    `Omeka #${String(readOmekaId(resource))}`
  );
}

function readOmekaId(resource) {
  const id = resource["o:id"];

  if (!Number.isInteger(id)) {
    throw new Error("Omeka response does not include an integer o:id.");
  }

  return id;
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
