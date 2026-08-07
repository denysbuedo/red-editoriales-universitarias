const baseUrl = readRequiredUrl("PNPU_PILOT_BASE_URL");
const publisherId = readRequiredText("PNPU_PILOT_PUBLISHER_ID");
const adminToken = process.env.PNPU_PILOT_IMPORT_TOKEN?.trim();
const bearerToken = process.env.PNPU_PILOT_BEARER_TOKEN?.trim();
const adminHeaders = readAdminHeaders();

const checks = [];

await checkJson("health/live", "/health/live", (payload) => {
  assert(payload.status === "ok", "health/live must report ok.");
});
await checkJson("health/ready", "/health/ready", (payload) => {
  assert(payload.status === "ready", "health/ready must report ready.");
});
await checkJson("health/catalog", "/health/catalog", (payload) => {
  assert(
    payload.status === "ready" || payload.status === "degraded",
    "health/catalog must report a known status.",
  );
  assert(payload.catalogRepository === "omeka", "catalog repository must be omeka for pilot.");
});
await check("admin page protection", "/admin/importaciones/publicaciones", {
  expectedStatuses: [200, 307, 403],
});
await checkJson(
  "editorial batch list",
  `/api/admin/publication-imports/batches?publisherId=${encodeURIComponent(publisherId)}`,
  (payload) => {
    assert(payload.meta?.apiVersion === "v1", "batch list must expose API metadata.");
    assert(Array.isArray(payload.data?.batches), "batch list must expose batches.");
    assert(payload.data?.publisherId === publisherId, "batch list must be scoped to publisher.");
  },
  adminHeaders,
);

const failed = checks.filter((checkResult) => !checkResult.ok);

console.log(`PNPU pilot import acceptance for ${baseUrl.toString()}`);
for (const checkResult of checks) {
  console.log(`[${checkResult.ok ? "OK" : "FAIL"}] ${checkResult.name} - ${checkResult.message}`);
}
console.log(`${checks.length - failed.length} OK, ${failed.length} FAIL.`);

if (failed.length > 0) {
  process.exitCode = 1;
}

async function checkJson(name, path, validate, headers = {}) {
  await check(name, path, {
    expectedStatuses: [200],
    headers,
    validate: async (response) => {
      const payload = await response.json();
      validate(payload);
    },
  });
}

async function check(name, path, options = {}) {
  const expectedStatuses = options.expectedStatuses ?? [200];

  try {
    const response = await fetch(new URL(path, baseUrl), {
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      redirect: "manual",
    });

    assert(
      expectedStatuses.includes(response.status),
      `expected HTTP ${expectedStatuses.join("/")} but got ${response.status}.`,
    );

    if (options.validate !== undefined) {
      await options.validate(response);
    }

    checks.push({
      message: `HTTP ${response.status}`,
      name,
      ok: true,
    });
  } catch (error) {
    checks.push({
      message: error instanceof Error ? error.message : "Unknown error.",
      name,
      ok: false,
    });
  }
}

function readRequiredUrl(name) {
  const value = readRequiredText(name);

  return new URL(value);
}

function readRequiredText(name) {
  const value = process.env[name]?.trim();

  if (value === undefined || value.length === 0) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(2);
  }

  return value;
}

function readAdminHeaders() {
  if (bearerToken !== undefined && bearerToken.length > 0) {
    return {
      Authorization: `Bearer ${bearerToken}`,
    };
  }

  if (adminToken !== undefined && adminToken.length > 0) {
    return {
      "X-PNPU-Admin-Token": adminToken,
    };
  }

  return {};
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
