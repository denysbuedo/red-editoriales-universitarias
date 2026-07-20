import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readinessPath = join(root, "docs", "release-0.1-readiness.md");
const document = readFileSync(readinessPath, "utf-8");

const requiredHeadings = [
  "# Release 0.1 - Readiness operativo",
  "## Objetivo",
  "## Alcance incluido",
  "## Fuera de alcance v0.1",
  "## Variables requeridas",
  "## Criterios de aceptacion",
  "## Pruebas de aceptacion manual",
  "## Decision de salida",
];

const requiredTerms = [
  "PNPU_CATALOG_REPOSITORY",
  "PNPU_OMEKA_BASE_URL",
  "PNPU_CATALOG_REFRESH_TOKEN",
  "PNPU_ADMIN_AUTH_MODE",
  "PNPU_ADMIN_REQUIRED_ROLE",
  "PNPU_ADMIN_IMPORT_READ_ROLE",
  "PNPU_ADMIN_IMPORT_WRITE_ROLE",
  "PNPU_ADMIN_IMPORT_ROLLBACK_ROLE",
  "PNPU_EDITORIAL_COORDINATOR_ROLE",
  "PNPU_EDITORIAL_METADATA_EDITOR_ROLE",
  "PNPU_EDITORIAL_REVIEWER_ROLE",
  "PNPU_EDITORIAL_VIEWER_ROLE",
  "PNPU_OIDC_ISSUER",
  "PNPU_OIDC_AUDIENCE",
  "PNPU_OIDC_CLIENT_ID",
  "npm run quality",
  "npm run build",
  "npm run smoke",
  "npm run acceptance:v0.1",
  "npm run package:release",
  "npm run package:validate",
  "docs/release-0.1-acceptance-report.md",
  "/health/live",
  "/health/ready",
  "/health/catalog",
  "/metrics",
  "/version",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const heading of requiredHeadings) {
  assert(document.includes(heading), `Release readiness is missing heading: ${heading}`);
}

for (const term of requiredTerms) {
  assert(document.includes(term), `Release readiness is missing required term: ${term}`);
}

const acceptanceItems = document
  .split(/\r?\n/u)
  .filter((line) => line.startsWith("- ") || /^\d+\. /u.test(line));

assert(
  acceptanceItems.length >= 40,
  `Release readiness must contain at least 40 checklist/acceptance items. Found ${acceptanceItems.length}.`,
);

console.log("Release readiness validation passed.");
