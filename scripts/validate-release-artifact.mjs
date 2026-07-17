import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const artifactName = `${packageJson.name}-${packageJson.version}`;
const artifactsDir = join(root, "artifacts");
const packagePath = join(artifactsDir, `${artifactName}.tar.gz`);
const checksumPath = `${packagePath}.sha256`;
const stagingDir = join(artifactsDir, artifactName);

const requiredArchiveEntries = [
  `${artifactName}/manifest.json`,
  `${artifactName}/CHANGELOG.md`,
  `${artifactName}/sbom.cdx.json`,
  `${artifactName}/package.json`,
  `${artifactName}/package-lock.json`,
  `${artifactName}/next.config.ts`,
  `${artifactName}/openapi/pnpu-portal.openapi.yml`,
  `${artifactName}/scripts/health-check.sh`,
  `${artifactName}/src/app/health/live/route.ts`,
  `${artifactName}/src/app/health/ready/route.ts`,
  `${artifactName}/src/app/metrics/route.ts`,
  `${artifactName}/src/app/openapi.yaml/route.ts`,
  `${artifactName}/src/app/publicaciones/page.tsx`,
  `${artifactName}/src/app/publicaciones/[id]/page.tsx`,
  `${artifactName}/src/app/editoriales/page.tsx`,
  `${artifactName}/src/app/editoriales/[id]/page.tsx`,
  `${artifactName}/src/app/autores/page.tsx`,
  `${artifactName}/src/app/autores/[id]/page.tsx`,
  `${artifactName}/src/app/materias/page.tsx`,
  `${artifactName}/src/app/materias/[identifier]/page.tsx`,
  `${artifactName}/src/app/colecciones/page.tsx`,
  `${artifactName}/src/app/colecciones/[id]/page.tsx`,
  `${artifactName}/src/app/robots.ts`,
  `${artifactName}/src/app/sitemap.ts`,
  `${artifactName}/src/app/v1/publications/route.ts`,
  `${artifactName}/src/app/v1/publications/[id]/route.ts`,
  `${artifactName}/src/app/v1/publishers/route.ts`,
  `${artifactName}/src/app/v1/publishers/[id]/route.ts`,
  `${artifactName}/src/app/v1/contributors/route.ts`,
  `${artifactName}/src/app/v1/contributors/[id]/route.ts`,
  `${artifactName}/src/app/v1/subjects/route.ts`,
  `${artifactName}/src/app/v1/subjects/[identifier]/route.ts`,
  `${artifactName}/src/app/v1/collections/route.ts`,
  `${artifactName}/src/app/v1/collections/[id]/route.ts`,
  `${artifactName}/src/app/version/route.ts`,
  `${artifactName}/src/modules/catalog/application/index.ts`,
  `${artifactName}/src/modules/catalog/domain/index.ts`,
  `${artifactName}/src/modules/catalog/infrastructure/index.ts`,
  `${artifactName}/src/modules/catalog/interfaces/http/api-responses.ts`,
  `${artifactName}/src/proxy.ts`,
  `${artifactName}/src/shared/config/runtime-config.ts`,
  `${artifactName}/src/shared/http/correlation-id.ts`,
  `${artifactName}/src/shared/observability/logger.ts`,
  `${artifactName}/src/shared/observability/prometheus.ts`,
  `${artifactName}/src/shared/security/http-security-headers.ts`,
  `${artifactName}/src/shared/seo/json-ld.tsx`,
];

const forbiddenArchivePatterns = [
  /\.test\.[jt]sx?$/,
  /\/\.next\/cache\//,
  /\/\.next\/dev\//,
  /\/\.next\/turbopack\//,
  /\/node_modules\//,
  /\/\.env/,
];

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readChecksum() {
  return readFileSync(checksumPath, "utf-8").trim().split(/\s+/)[0];
}

function listArchiveEntries() {
  return execFileSync("tar", ["-tzf", packagePath], {
    cwd: root,
    encoding: "utf-8",
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(existsSync(packagePath), `Missing release package: ${packagePath}`);
  assert(existsSync(checksumPath), `Missing release checksum: ${checksumPath}`);

  const expectedChecksum = readChecksum();
  const actualChecksum = sha256(packagePath);
  assert(
    expectedChecksum === actualChecksum,
    `Checksum mismatch for ${basename(packagePath)}. Expected ${expectedChecksum}, got ${actualChecksum}.`,
  );

  const archiveEntries = listArchiveEntries();
  for (const requiredEntry of requiredArchiveEntries) {
    assert(
      archiveEntries.includes(requiredEntry),
      `Release package is missing required entry: ${requiredEntry}`,
    );
  }

  for (const entry of archiveEntries) {
    for (const pattern of forbiddenArchivePatterns) {
      assert(!pattern.test(entry), `Release package contains forbidden entry: ${entry}`);
    }
  }

  const manifest = JSON.parse(readFileSync(join(stagingDir, "manifest.json"), "utf-8"));
  assert(manifest.name === packageJson.name, "Manifest name does not match package.json.");
  assert(manifest.version === packageJson.version, "Manifest version does not match package.json.");
  assert(Array.isArray(manifest.files), "Manifest files must be an array.");
  assert(
    manifest.files.includes("src/app/sitemap.ts"),
    "Manifest files must include sitemap.xml route.",
  );
  assert(
    manifest.files.includes("src/app/v1/publications/route.ts"),
    "Manifest files must include publications route.",
  );
  assert(
    manifest.files.includes("src/modules/catalog/infrastructure/catalog-repository-factory.ts"),
    "Manifest files must include catalog repository factory.",
  );

  console.log(`Release artifact validation passed for ${basename(packagePath)}.`);
}

main();
