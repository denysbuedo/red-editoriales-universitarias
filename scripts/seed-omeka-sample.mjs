import sample from "../schemas/omeka/pnpu-sample-catalog.json" with { type: "json" };

const dryRun = process.argv.includes("--dry-run");
const baseUrl = normalizeRequiredUrl(process.env.PNPU_OMEKA_BASE_URL, "PNPU_OMEKA_BASE_URL");
const keyIdentity = readRequiredSecret("PNPU_OMEKA_KEY_IDENTITY");
const keyCredential = readRequiredSecret("PNPU_OMEKA_KEY_CREDENTIAL");
const timeoutMs = normalizeTimeout(process.env.PNPU_OMEKA_TIMEOUT_MS);

const context = {
  properties: await listAll("/api/properties"),
  resourceTemplates: await listAll("/api/resource_templates"),
  items: await listAll("/api/items"),
  itemSets: await listAll("/api/item_sets"),
  media: await listAll("/api/media"),
};
const propertyIdByTerm = new Map(
  context.properties
    .map((property) => [property["o:term"], property["o:id"]])
    .filter(([term, id]) => typeof term === "string" && Number.isInteger(id)),
);
const templateIdByLabel = new Map(
  context.resourceTemplates
    .map((template) => [template["o:label"], template["o:id"]])
    .filter(([label, id]) => typeof label === "string" && Number.isInteger(id)),
);
const actions = [];
const universityIds = new Map();
const publisherIds = new Map();
const subjectIds = new Map();
const contributorIds = new Map();
const collectionIds = new Map();

assertProfileReady();

for (const university of sample.records.universities) {
  universityIds.set(
    university.key,
    await ensureItem(`university:${university.key}`, university.uuid, () =>
      itemPayload("PNPU University", [
        literal("pnpu:uuid", university.uuid),
        literal("schema:name", university.name),
        optionalLiteral("schema:alternateName", university.acronym),
        optionalLiteral("pnpu:universityCode", university.code),
        optionalLiteral("schema:addressLocality", university.province),
        literal("schema:addressCountry", university.country),
        optionalUri("schema:url", university.url),
      ]),
    ),
  );
}

for (const publisher of sample.records.publishers) {
  publisherIds.set(
    publisher.key,
    await ensureItem(`publisher:${publisher.key}`, publisher.uuid, () =>
      itemPayload("PNPU Publisher", [
        literal("pnpu:uuid", publisher.uuid),
        literal("schema:name", publisher.name),
        optionalLiteral("schema:alternateName", publisher.acronym),
        optionalLiteral("pnpu:publisherCode", publisher.code),
        optionalLiteral("dcterms:description", publisher.description),
        resourceValue("schema:parentOrganization", requireResolvedId(universityIds, publisher.universityKey)),
        optionalLiteral("schema:addressLocality", publisher.province),
        literal("schema:addressCountry", publisher.country),
        optionalUri("schema:url", publisher.url),
        optionalLiteral("schema:email", publisher.email),
        optionalLiteral("schema:telephone", publisher.telephone),
      ]),
    ),
  );
}

for (const subject of sample.records.subjects) {
  subjectIds.set(subject.key, await ensureSubject(subject));
}

for (const contributor of sample.records.contributors) {
  contributorIds.set(
    contributor.key,
    await ensureItem(`contributor:${contributor.key}`, contributor.uuid, () =>
      itemPayload("PNPU Contributor", [
        literal("pnpu:uuid", contributor.uuid),
        literal("foaf:name", contributor.name),
        optionalLiteral("foaf:givenName", contributor.givenName),
        optionalLiteral("foaf:familyName", contributor.familyName),
        literal("schema:roleName", contributor.role),
        optionalLiteral("schema:affiliation", contributor.affiliation),
        optionalLiteral("schema:description", contributor.description),
        optionalLiteral("schema:nationality", contributor.country),
      ]),
    ),
  );
}

for (const collection of sample.records.collections) {
  collectionIds.set(
    collection.key,
    await ensureItemSet(`collection:${collection.key}`, collection.uuid, () =>
      itemPayload("PNPU Collection", [
        literal("pnpu:uuid", collection.uuid),
        literal("dcterms:title", collection.title),
        resourceValue("dcterms:publisher", requireResolvedId(publisherIds, collection.publisherKey)),
        optionalLiteral("dcterms:description", collection.description),
        optionalLiteral("pnpu:collectionCode", collection.code),
        optionalLiteral("pnpu:editorialSeries", collection.series),
        ...collection.subjectKeys.map((subjectKey) =>
          resourceValue("dcterms:subject", requireResolvedId(subjectIds, subjectKey)),
        ),
      ]),
    ),
  );
}

for (const publication of sample.records.publications) {
  const collectionId = requireResolvedId(collectionIds, publication.collectionKey);
  const publicationId = await ensureItem(`publication:${publication.key}`, publication.uuid, () => ({
    ...itemPayload("PNPU Publication", [
      literal("pnpu:uuid", publication.uuid),
      literal("dcterms:title", publication.title),
      optionalLiteral("dcterms:alternative", publication.subtitle),
      optionalLiteral("dcterms:abstract", publication.abstract),
      literal("dcterms:issued", publication.issued),
      literal("dcterms:language", publication.language),
      literal("dcterms:type", publication.type),
      literal("dcterms:format", publication.format),
      optionalLiteral("dcterms:license", publication.license),
      literal("dcterms:identifier", publication.identifier),
      optionalLiteral("bibo:isbn", publication.isbn),
      optionalLiteral("bibo:doi", publication.doi),
      resourceValue("dcterms:publisher", requireResolvedId(publisherIds, publication.publisherKey)),
      ...publication.creatorKeys.map((contributorKey) =>
        resourceValue("dcterms:creator", requireResolvedId(contributorIds, contributorKey)),
      ),
      ...publication.contributorKeys.map((contributorKey) =>
        resourceValue("dcterms:contributor", requireResolvedId(contributorIds, contributorKey)),
      ),
      ...publication.subjectKeys.map((subjectKey) =>
        resourceValue("dcterms:subject", requireResolvedId(subjectIds, subjectKey)),
      ),
      resourceValue("dcterms:isPartOf", collectionId, "resource:itemset"),
      ...publication.keywords.map((keyword) => literal("schema:keywords", keyword)),
    ]),
    "o:item_set": [{ "o:id": collectionId }],
  }));
  await ensurePublicationMedia(publication, publicationId);
}

console.log(JSON.stringify({ baseUrl, dryRun, actions }, null, 2));

async function ensureSubject(subject) {
  const existing = findResourceByLiteral(context.items, "skos:notation", subject.notation);

  if (existing !== null) {
    actions.push({ type: "item", key: `subject:${subject.key}`, status: "exists", id: existing });
    return existing;
  }

  actions.push({ type: "item", key: `subject:${subject.key}`, status: dryRun ? "would_create" : "created" });

  if (dryRun) {
    return -stableNegativeId(subject.key);
  }

  const created = await postJson(
    "/api/items",
    itemPayload("PNPU Subject", [
      literal("skos:notation", subject.notation),
      literal("skos:prefLabel", subject.prefLabel),
      optionalUri("schema:url", subject.uri),
    ]),
  );
  const id = readOmekaId(created);
  context.items.push(created);
  return id;
}

async function ensureItem(key, uuid, payloadFactory) {
  const existing = findResourceByLiteral(context.items, "pnpu:uuid", uuid);

  if (existing !== null) {
    actions.push({ type: "item", key, status: "exists", id: existing });
    return existing;
  }

  actions.push({ type: "item", key, status: dryRun ? "would_create" : "created" });

  if (dryRun) {
    return -stableNegativeId(key);
  }

  const created = await postJson("/api/items", payloadFactory());
  const id = readOmekaId(created);
  context.items.push(created);
  return id;
}

async function ensureItemSet(key, uuid, payloadFactory) {
  const existing = findResourceByLiteral(context.itemSets, "pnpu:uuid", uuid);

  if (existing !== null) {
    actions.push({ type: "item_set", key, status: "exists", id: existing });
    return existing;
  }

  actions.push({ type: "item_set", key, status: dryRun ? "would_create" : "created" });

  if (dryRun) {
    return -stableNegativeId(key);
  }

  const created = await postJson("/api/item_sets", payloadFactory());
  const id = readOmekaId(created);
  context.itemSets.push(created);
  return id;
}

async function ensurePublicationMedia(publication, publicationId) {
  const existing = context.media.find((media) => {
    const item = media["o:item"];
    const source = media["o:source"];

    return isJsonObject(item) && item["o:id"] === publicationId && source === publication.media.url;
  });

  if (existing !== undefined) {
    actions.push({
      type: "media",
      key: `media:${publication.key}`,
      status: "exists",
      id: readOmekaId(existing),
    });
    return;
  }

  actions.push({ type: "media", key: `media:${publication.key}`, status: dryRun ? "would_create" : "created" });

  if (dryRun) {
    return;
  }

  const created = await postJson("/api/media", {
    "o:is_public": true,
    "o:item": { "o:id": publicationId },
    "o:ingester": "html",
    "o:source": publication.media.url,
    html: `<a href="${publication.media.url}">${publication.title}</a>`,
    "o:resource_template": { "o:id": requireTemplateId("PNPU Digital Resource") },
    "dcterms:format": [literalValue("dcterms:format", publication.media.format)],
    "dcterms:language": optionalValueArray(literalValue("dcterms:language", publication.media.language)),
    "dcterms:license": optionalValueArray(literalValue("dcterms:license", publication.media.license)),
    "pnpu:resourceType": [literalValue("pnpu:resourceType", publication.media.resourceType)],
  });
  context.media.push(created);
}

function itemPayload(templateLabel, values) {
  return {
    "o:is_public": true,
    "o:resource_template": { "o:id": requireTemplateId(templateLabel) },
    ...groupValues(values.filter((value) => value !== null)),
  };
}

function groupValues(values) {
  return values.reduce((grouped, value) => {
    grouped[value.term] = [...(grouped[value.term] ?? []), value.value];
    return grouped;
  }, {});
}

function literal(term, value) {
  return { term, value: literalValue(term, value) };
}

function optionalLiteral(term, value) {
  return hasText(value) ? literal(term, value) : null;
}

function optionalUri(term, value) {
  return hasText(value) ? uri(term, value) : null;
}

function uri(term, value) {
  return {
    term,
    value: {
      type: "uri",
      property_id: requirePropertyId(term),
      "@id": value,
      "o:label": value,
    },
  };
}

function resourceValue(term, id, type = "resource:item") {
  return {
    term,
    value: {
      type,
      property_id: requirePropertyId(term),
      value_resource_id: id,
    },
  };
}

function literalValue(term, value) {
  return {
    type: "literal",
    property_id: requirePropertyId(term),
    "@value": value,
  };
}

function optionalValueArray(value) {
  return hasText(value["@value"]) ? [value] : [];
}

function assertProfileReady() {
  const missingTemplates = [
    "PNPU University",
    "PNPU Publisher",
    "PNPU Subject",
    "PNPU Contributor",
    "PNPU Collection",
    "PNPU Publication",
    "PNPU Digital Resource",
  ].filter((templateLabel) => !templateIdByLabel.has(templateLabel));
  const missingProperties = [
    "pnpu:uuid",
    "schema:name",
    "schema:alternateName",
    "pnpu:universityCode",
    "schema:addressLocality",
    "schema:addressCountry",
    "schema:url",
    "schema:parentOrganization",
    "skos:notation",
    "skos:prefLabel",
    "foaf:name",
    "foaf:givenName",
    "foaf:familyName",
    "schema:roleName",
    "schema:affiliation",
    "schema:description",
    "schema:nationality",
    "dcterms:title",
    "dcterms:publisher",
    "dcterms:description",
    "dcterms:issued",
    "dcterms:language",
    "dcterms:type",
    "dcterms:format",
    "dcterms:license",
    "dcterms:identifier",
    "dcterms:creator",
    "dcterms:contributor",
    "dcterms:subject",
    "dcterms:isPartOf",
    "bibo:isbn",
    "bibo:doi",
    "schema:keywords",
    "pnpu:resourceType",
  ].filter((term) => !propertyIdByTerm.has(term));

  if (missingTemplates.length > 0 || missingProperties.length > 0) {
    throw new Error(
      `Omeka PNPU profile is not ready. Missing templates: ${missingTemplates.join(", ") || "none"}. Missing properties: ${missingProperties.join(", ") || "none"}. Run npm run omeka:install-profile first.`,
    );
  }
}

function findResourceByLiteral(resources, term, value) {
  for (const resource of resources) {
    const values = Array.isArray(resource[term]) ? resource[term] : [];

    if (values.some((item) => item?.["@value"] === value)) {
      return readOmekaId(resource);
    }
  }

  return null;
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
    headers: { "Content-Type": "application/json" },
  });
  const payloadResponse = await response.json();

  if (!isJsonObject(payloadResponse)) {
    throw new Error(`Omeka returned invalid JSON object for ${path}.`);
  }

  return payloadResponse;
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
      headers: { Accept: "application/json", ...options.headers },
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

function requireResolvedId(ids, key) {
  const id = ids.get(key);

  if (!Number.isInteger(id)) {
    throw new Error(`Sample catalog reference "${key}" could not be resolved.`);
  }

  return id;
}

function requireTemplateId(label) {
  const id = templateIdByLabel.get(label);

  if (!Number.isInteger(id)) {
    throw new Error(`Missing Omeka Resource Template "${label}".`);
  }

  return id;
}

function requirePropertyId(term) {
  const id = propertyIdByTerm.get(term);

  if (!Number.isInteger(id)) {
    throw new Error(`Missing Omeka property "${term}".`);
  }

  return id;
}

function readOmekaId(resource) {
  const id = resource["o:id"];

  if (!Number.isInteger(id)) {
    throw new Error("Omeka response does not include an integer o:id.");
  }

  return id;
}

function stableNegativeId(value) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
