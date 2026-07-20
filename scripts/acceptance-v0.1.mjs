const baseUrl = (process.env.PNPU_ACCEPTANCE_BASE_URL ?? "http://127.0.0.1:4310").replace(
  /\/$/u,
  "",
);
const requestTimeoutMs = readInteger("PNPU_ACCEPTANCE_TIMEOUT_MS", 5000);
const requireOmeka = process.env.PNPU_ACCEPTANCE_REQUIRE_OMEKA === "true";
const refreshToken = process.env.PNPU_CATALOG_REFRESH_TOKEN?.trim();

const checks = [];

function record(name, status, details = "") {
  checks.push({ details, name, status });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchPath(path, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, requestTimeoutMs);

  try {
    return await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function runCheck(name, task) {
  try {
    const details = await task();
    record(name, "OK", details);
  } catch (error) {
    record(name, "FAIL", error instanceof Error ? error.message : "Unknown error.");
  }
}

async function readJson(path, init) {
  const response = await fetchPath(path, init);
  const payload = await response.json();

  assert(response.ok, `${path} returned HTTP ${response.status}.`);
  return payload;
}

async function readText(path) {
  const response = await fetchPath(path);
  const body = await response.text();

  assert(response.ok, `${path} returned HTTP ${response.status}.`);
  return body;
}

await runCheck("health/live", async () => {
  const payload = await readJson("/health/live");

  assert(payload.status === "ok", "/health/live did not return ok.");
  assert(payload.service === "pnpu-portal", "/health/live returned unexpected service.");
  assert(payload.version === "0.1.0", "/health/live returned unexpected version.");

  return "Portal process is alive.";
});

await runCheck("health/ready", async () => {
  const payload = await readJson("/health/ready");

  assert(payload.status === "ready", "/health/ready did not return ready.");
  assert(payload.service === "pnpu-portal", "/health/ready returned unexpected service.");

  return "Portal is ready.";
});

await runCheck("version", async () => {
  const payload = await readJson("/version");

  assert(payload.service === "pnpu-portal", "/version returned unexpected service.");
  assert(payload.version === "0.1.0", "/version returned unexpected version.");

  return "Version metadata is exposed.";
});

await runCheck("metrics", async () => {
  const body = await readText("/metrics");

  assert(body.includes("pnpu_portal_build_info"), "/metrics is missing build info.");
  assert(body.includes("pnpu_portal_process_uptime_seconds"), "/metrics is missing uptime.");

  return "Prometheus metrics are exposed.";
});

await runCheck("openapi", async () => {
  const body = await readText("/openapi.yaml");

  assert(body.includes("openapi: 3.1.0"), "OpenAPI contract is not 3.1.");
  assert(body.includes("/v1/publications:"), "OpenAPI is missing public publications endpoint.");
  assert(body.includes("/api/admin/auth/login:"), "OpenAPI is missing admin OIDC login.");

  return "OpenAPI contract is served.";
});

await runCheck("public catalog pages", async () => {
  const pages = ["/", "/publicaciones", "/editoriales", "/autores", "/materias", "/colecciones"];

  for (const page of pages) {
    const body = await readText(page);
    assert(body.includes("PNPU"), `${page} does not look like a PNPU page.`);
  }

  return `${pages.length} public pages responded.`;
});

await runCheck("public catalog API", async () => {
  const endpoints = [
    "/v1/publications?page=1&pageSize=10",
    "/v1/publishers?page=1&pageSize=10",
    "/v1/contributors?page=1&pageSize=10",
    "/v1/subjects?page=1&pageSize=10",
    "/v1/collections?page=1&pageSize=10",
  ];

  for (const endpoint of endpoints) {
    const payload = await readJson(endpoint);
    assert(Array.isArray(payload.data), `${endpoint} did not return data array.`);
    assert(payload.meta?.apiVersion === "v1", `${endpoint} returned unexpected apiVersion.`);
  }

  return `${endpoints.length} catalog endpoints responded.`;
});

await runCheck("catalog diagnostics", async () => {
  const payload = await readJson("/health/catalog");

  assert(typeof payload.status === "string", "/health/catalog is missing status.");
  assert("catalogRepository" in payload, "/health/catalog is missing catalogRepository.");

  if (requireOmeka) {
    assert(payload.catalogRepository === "omeka", "/health/catalog is not using Omeka repository.");
    assert(payload.omeka !== null, "/health/catalog is missing Omeka diagnostics.");
    assert(
      payload.omeka.installation?.readyForPnpuMapping === true,
      "/health/catalog reports Omeka PNPU mapping is not ready.",
    );
    assert(
      payload.omeka.snapshot?.unknown?.total === 0,
      "/health/catalog reports unknown Omeka templates.",
    );
    assert(
      payload.omeka.snapshot?.quality?.rejected === 0,
      "/health/catalog reports rejected catalog records.",
    );
  }

  return `Catalog repository: ${String(payload.catalogRepository)}.`;
});

await runCheck("catalog refresh protection", async () => {
  const response = await fetchPath("/health/catalog/refresh", {
    method: "POST",
  });

  assert(
    response.status === 403 || response.status === 503,
    `/health/catalog/refresh without token returned HTTP ${response.status}.`,
  );

  return "Refresh endpoint rejects unauthenticated requests.";
});

if (refreshToken !== undefined && refreshToken.length > 0) {
  await runCheck("catalog refresh authorized", async () => {
    const response = await fetchPath("/health/catalog/refresh", {
      headers: {
        "X-PNPU-Refresh-Token": refreshToken,
      },
      method: "POST",
    });

    assert(response.ok, `/health/catalog/refresh with token returned HTTP ${response.status}.`);

    return "Refresh endpoint accepted configured token.";
  });
}

await runCheck("admin page protection", async () => {
  const response = await fetchPath("/admin/importaciones/publicaciones");

  assert(
    response.status === 403,
    `/admin/importaciones/publicaciones without auth returned HTTP ${response.status}.`,
  );

  return "Admin import page requires authentication.";
});

await runCheck("admin OIDC login route", async () => {
  const response = await fetchPath(
    "/api/admin/auth/login?returnTo=/admin/importaciones/publicaciones",
    {
      redirect: "manual",
    },
  );

  assert(
    response.status === 307 || response.status === 503,
    `/api/admin/auth/login returned HTTP ${response.status}.`,
  );

  return response.status === 307
    ? "OIDC login is configured."
    : "OIDC login route exists but is not configured in this environment.";
});

await runCheck("admin logout route", async () => {
  const response = await fetchPath("/api/admin/auth/logout", {
    redirect: "manual",
  });

  assert(response.status === 307, `/api/admin/auth/logout returned HTTP ${response.status}.`);

  return "Logout clears local admin session.";
});

printReport();

const failures = checks.filter((check) => check.status === "FAIL");

if (failures.length > 0) {
  process.exitCode = 1;
}

function printReport() {
  console.log(`PNPU v0.1 acceptance report for ${baseUrl}`);
  console.log("");

  for (const check of checks) {
    console.log(`[${check.status}] ${check.name}${check.details ? ` - ${check.details}` : ""}`);
  }

  console.log("");
  console.log(
    `${String(checks.filter((check) => check.status === "OK").length)} OK, ${String(
      checks.filter((check) => check.status === "FAIL").length,
    )} FAIL.`,
  );
}

function readInteger(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}
