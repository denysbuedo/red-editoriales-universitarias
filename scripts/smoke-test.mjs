const baseUrl = (process.env.PNPU_SMOKE_BASE_URL ?? "http://127.0.0.1:4307").replace(/\/$/, "");
const retryCount = Number.parseInt(process.env.PNPU_SMOKE_RETRIES ?? "20", 10);
const retryDelayMs = Number.parseInt(process.env.PNPU_SMOKE_RETRY_DELAY_MS ?? "500", 10);
const requestTimeoutMs = Number.parseInt(process.env.PNPU_SMOKE_REQUEST_TIMEOUT_MS ?? "5000", 10);

const requiredSecurityHeaders = [
  "content-security-policy",
  "permissions-policy",
  "referrer-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchWithRetry(path, init) {
  let lastError;

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    const controller = new globalThis.AbortController();
    const timeout = globalThis.setTimeout(() => {
      controller.abort();
    }, requestTimeoutMs);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      if (response.ok) {
        return response;
      }
      lastError = new Error(`Unexpected HTTP ${response.status} for ${path}`);
    } catch (error) {
      lastError = error;
    } finally {
      globalThis.clearTimeout(timeout);
    }

    await wait(retryDelayMs);
  }

  throw lastError;
}

async function assertHealth(path, expectedStatus) {
  const correlationId = `pnpu-smoke-${expectedStatus}`;
  const response = await fetchWithRetry(path, {
    headers: {
      "x-correlation-id": correlationId,
    },
  });
  const payload = await response.json();

  assert(payload.status === expectedStatus, `${path} returned unexpected status.`);
  assert(payload.service === "pnpu-portal", `${path} returned unexpected service.`);
  assert(payload.version === "0.1.0", `${path} returned unexpected version.`);
  assert("commitSha" in payload, `${path} did not return commitSha.`);
  assert(
    response.headers.get("x-correlation-id") === correlationId,
    `${path} did not preserve X-Correlation-Id.`,
  );

  for (const header of requiredSecurityHeaders) {
    assert(response.headers.has(header), `${path} is missing ${header}.`);
  }
}

async function assertText(path, expectedContent) {
  const response = await fetchWithRetry(path);
  const body = await response.text();

  assert(body.includes(expectedContent), `${path} does not contain ${expectedContent}.`);
}

async function assertMetrics() {
  const response = await fetchWithRetry("/metrics");
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  assert(
    contentType.includes("text/plain") && contentType.includes("version=0.0.4"),
    "/metrics returned an unexpected content type.",
  );
  assert(body.includes("pnpu_portal_build_info"), "/metrics is missing build info.");
  assert(
    body.includes("pnpu_portal_process_uptime_seconds"),
    "/metrics is missing process uptime.",
  );
}

async function assertJson(path, assertions) {
  const response = await fetchWithRetry(path);
  const payload = await response.json();

  assertions(payload, response);
}

async function assertJsonStatus(path, expectedStatus, expectedPayload, init) {
  const controller = new globalThis.AbortController();
  const timeout = globalThis.setTimeout(() => {
    controller.abort();
  }, requestTimeoutMs);

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }

  const payload = await response.json();

  assert(response.status === expectedStatus, `${path} returned HTTP ${response.status}.`);
  for (const [key, value] of Object.entries(expectedPayload)) {
    assert(payload[key] === value, `${path} returned unexpected ${key}.`);
  }

  return { payload, response };
}

async function assertCatalogApi() {
  const publicationId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05";
  const publisherId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03";
  const contributorId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01";
  const collectionId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08";
  const subjectIdentifier = "unesco:1203";
  const encodedSubjectIdentifier = "unesco%3A1203";

  await assertJson("/v1/publications?page=1&pageSize=10", (payload) => {
    assert(Array.isArray(payload.data), "/v1/publications did not return data array.");
    assert(payload.data.length === 1, "/v1/publications returned unexpected item count.");
    assert(
      payload.data[0].id === publicationId,
      "/v1/publications returned unexpected publication.",
    );
    assert(payload.pagination.total === 1, "/v1/publications returned unexpected total.");
    assert(payload.meta.apiVersion === "v1", "/v1/publications returned unexpected apiVersion.");
  });

  await assertJson("/v1/publications?q=gobierno&language=es&subject=ordenadores", (payload) => {
    assert(payload.data.length === 1, "/v1/publications filters returned unexpected count.");
    assert(payload.pagination.total === 1, "/v1/publications filters returned unexpected total.");
  });

  await assertJson(`/v1/publications/${publicationId}`, (payload) => {
    assert(payload.data.id === publicationId, "/v1/publications/{id} returned unexpected id.");
    assert(
      payload.data.identifiers[0].value === "9789590000003",
      "/v1/publications/{id} returned unexpected identifier.",
    );
  });

  await assertJson("/v1/publishers?page=1&pageSize=10", (payload) => {
    assert(Array.isArray(payload.data), "/v1/publishers did not return data array.");
    assert(payload.data.length === 1, "/v1/publishers returned unexpected item count.");
    assert(payload.data[0].id === publisherId, "/v1/publishers returned unexpected publisher.");
    assert(payload.pagination.total === 1, "/v1/publishers returned unexpected total.");
  });

  await assertJson(`/v1/publishers/${publisherId}`, (payload) => {
    assert(payload.data.id === publisherId, "/v1/publishers/{id} returned unexpected id.");
    assert(
      payload.data.university.id === "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c02",
      "/v1/publishers/{id} returned unexpected university.",
    );
  });

  await assertJson("/v1/collections?page=1&pageSize=10", (payload) => {
    assert(Array.isArray(payload.data), "/v1/collections did not return data array.");
    assert(payload.data.length === 1, "/v1/collections returned unexpected item count.");
    assert(payload.data[0].id === collectionId, "/v1/collections returned unexpected collection.");
    assert(payload.pagination.total === 1, "/v1/collections returned unexpected total.");
  });

  await assertJson(`/v1/collections/${collectionId}`, (payload) => {
    assert(payload.data.id === collectionId, "/v1/collections/{id} returned unexpected id.");
    assert(
      payload.data.publications[0].id === publicationId,
      "/v1/collections/{id} returned unexpected publication.",
    );
  });

  await assertJson("/v1/contributors?page=1&pageSize=10", (payload) => {
    assert(Array.isArray(payload.data), "/v1/contributors did not return data array.");
    assert(payload.data.length === 1, "/v1/contributors returned unexpected item count.");
    assert(
      payload.data[0].id === contributorId,
      "/v1/contributors returned unexpected contributor.",
    );
    assert(payload.pagination.total === 1, "/v1/contributors returned unexpected total.");
  });

  await assertJson(`/v1/contributors/${contributorId}`, (payload) => {
    assert(payload.data.id === contributorId, "/v1/contributors/{id} returned unexpected id.");
    assert(
      payload.data.publications[0].id === publicationId,
      "/v1/contributors/{id} returned unexpected publication.",
    );
  });

  await assertJson("/v1/subjects?page=1&pageSize=10", (payload) => {
    assert(Array.isArray(payload.data), "/v1/subjects did not return data array.");
    assert(payload.data.length === 1, "/v1/subjects returned unexpected item count.");
    assert(
      payload.data[0].identifier === subjectIdentifier,
      "/v1/subjects returned unexpected subject.",
    );
    assert(payload.pagination.total === 1, "/v1/subjects returned unexpected total.");
  });

  await assertJson(`/v1/subjects/${encodedSubjectIdentifier}`, (payload) => {
    assert(
      payload.data.identifier === subjectIdentifier,
      "/v1/subjects/{identifier} returned unexpected id.",
    );
    assert(
      payload.data.publications[0].id === publicationId,
      "/v1/subjects/{identifier} returned unexpected publication.",
    );
  });

  const correlationId = "pnpu-smoke-catalog-error";
  const { response } = await assertJsonStatus(
    "/v1/publications/not-a-uuid",
    422,
    {
      code: "PNPU-422",
      correlationId,
    },
    {
      headers: {
        "x-correlation-id": correlationId,
      },
    },
  );
  assert(
    response.headers.get("x-correlation-id") === correlationId,
    "/v1/publications/not-a-uuid did not preserve X-Correlation-Id.",
  );
}

async function main() {
  await assertHealth("/health/live", "ok");
  await assertHealth("/health/ready", "ready");
  await assertText("/version", '"version":"0.1.0"');
  await assertMetrics();
  await assertText("/openapi.yaml", "openapi: 3.1.0");
  await assertText("/robots.txt", "Sitemap:");
  await assertText("/sitemap.xml", "<urlset");
  await assertText("/sitemap.xml", "/publicaciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05");
  await assertText("/sitemap.xml", "/colecciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08");
  await assertText("/sitemap.xml", "/editoriales/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03");
  await assertText("/sitemap.xml", "/autores/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01");
  await assertText("/sitemap.xml", "/materias/unesco%3A1203");
  await assertText("/publicaciones", "Publicaciones universitarias");
  await assertText("/publicaciones", "ISBN: 9789590000003");
  await assertText("/publicaciones", "Ciencia de los ordenadores");
  await assertText("/publicaciones?q=gobierno&language=es&subject=ordenadores", "resultado");
  await assertText(
    "/publicaciones?q=gobierno&language=es&subject=ordenadores",
    "Arquitectura empresarial para universidades",
  );
  await assertText(
    "/publicaciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
    "Arquitectura empresarial para universidades",
  );
  await assertText(
    "/publicaciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
    "Gobierno, integración y sostenibilidad tecnológica",
  );
  await assertText(
    "/publicaciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
    "d41d8cd98f00b204e9800998ecf8427e",
  );
  await assertText("/publicaciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05", '"@type":"Book"');
  await assertText("/editoriales", "Editoriales universitarias");
  await assertText(
    "/editoriales/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03",
    "Editorial Universidad de La Habana",
  );
  await assertText("/editoriales/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03", "RNEU-UH");
  await assertText("/editoriales/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03", "editorial@uh.cu");
  await assertText("/editoriales/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03", '"@type":"Organization"');
  await assertText("/autores", "Autores y contribuyentes");
  await assertText("/autores", "Juana Perez Rodriguez");
  await assertText(
    "/autores/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01",
    "Arquitectura empresarial para universidades",
  );
  await assertText("/autores/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01", '"@type":"Person"');
  await assertText("/materias", "Materias del catálogo");
  await assertText("/materias", "Ciencia de los ordenadores");
  await assertText("/materias/unesco%3A1203", "Arquitectura empresarial para universidades");
  await assertText("/materias/unesco%3A1203", '"@type":"DefinedTerm"');
  await assertText("/colecciones", "Colecciones editoriales");
  await assertText("/colecciones", "Arquitectura y gobierno universitario");
  await assertText(
    "/colecciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08",
    "Arquitectura empresarial para universidades",
  );
  await assertText("/colecciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08", '"@type":"CollectionPage"');
  await assertCatalogApi();

  console.log(`Smoke tests passed for ${baseUrl}.`);
}

await main();
