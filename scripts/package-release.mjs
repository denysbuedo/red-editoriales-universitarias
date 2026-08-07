import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { cp, readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const packageLock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf-8"));
const version = packageJson.version;
const appName = packageJson.name;
const artifactName = `${appName}-${version}`;
const artifactsDir = join(root, "artifacts");
const stagingDir = join(artifactsDir, artifactName);
const packagePath = join(artifactsDir, `${artifactName}.tar.gz`);
const checksumPath = `${packagePath}.sha256`;

const runtimePaths = [
  ".next",
  "next.config.ts",
  "openapi/pnpu-portal.openapi.yml",
  "package.json",
  "package-lock.json",
  "public",
  "scripts/deploy-portal-artifact.sh",
  "scripts/health-check.sh",
  "scripts/check-publication-spreadsheet.py",
  "src/app/admin",
  "src/app/api/admin",
  "src/app/health/live/route.ts",
  "src/app/health/ready/route.ts",
  "src/app/metrics/route.ts",
  "src/app/openapi.yaml/route.ts",
  "src/app/publicaciones",
  "src/app/editoriales",
  "src/app/autores",
  "src/app/materias",
  "src/app/colecciones",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/v1",
  "src/app/vocabularies",
  "src/app/version/route.ts",
  "src/modules/catalog",
  "src/modules/publication-import",
  "src/proxy.ts",
  "src/shared/config/runtime-config.ts",
  "src/shared/http/correlation-id.ts",
  "src/shared/observability/logger.ts",
  "src/shared/observability/prometheus.ts",
  "src/shared/security/http-security-headers.ts",
  "src/shared/security/editorial-access.ts",
  "src/shared/seo/json-ld.tsx",
];

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function copyIfExists(relativePath) {
  const source = join(root, relativePath);
  if (!existsSync(source)) {
    return;
  }

  const destination = join(stagingDir, relativePath);
  await cp(source, destination, {
    recursive: true,
    filter: (path) => {
      const normalizedPath = path.replaceAll("\\", "/");
      return shouldIncludeRuntimePath(normalizedPath);
    },
  });
}

function shouldIncludeRuntimePath(path) {
  const normalizedPath = path.replaceAll("\\", "/");

  return (
    !normalizedPath.includes("/.next/cache") &&
    !normalizedPath.includes("/.next/dev") &&
    !normalizedPath.includes("/.next/turbopack") &&
    !/\.test\.[jt]sx?$/.test(normalizedPath)
  );
}

async function assertBuildOutputIsFresh() {
  const buildIdPath = join(root, ".next", "BUILD_ID");

  if (!existsSync(buildIdPath)) {
    throw new Error("Missing .next/BUILD_ID. Run npm run build before packaging.");
  }

  const buildTime = statSync(buildIdPath).mtimeMs;
  const stalePaths = [];

  for (const relativePath of runtimePaths.filter((path) => path !== ".next")) {
    const source = join(root, relativePath);

    if (!existsSync(source)) {
      continue;
    }

    const newestSourceTime = await newestModifiedTime(source);

    if (newestSourceTime > buildTime) {
      stalePaths.push(relativePath);
    }
  }

  if (stalePaths.length > 0) {
    throw new Error(
      `Build output is older than runtime sources. Run npm run build before packaging. Stale paths: ${stalePaths.join(", ")}`,
    );
  }
}

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory);
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    const relativePath = prefix ? `${prefix}/${entry}` : entry;
    const details = await stat(path);

    if (details.isDirectory()) {
      files.push(...(await listFiles(path, relativePath)));
    } else {
      files.push(relativePath);
    }
  }

  return files.sort();
}

async function newestModifiedTime(path) {
  if (!shouldIncludeRuntimePath(path)) {
    return 0;
  }

  const details = await stat(path);

  if (!details.isDirectory()) {
    return details.mtimeMs;
  }

  const entries = await readdir(path);
  const childTimes = await Promise.all(
    entries.map((entry) => newestModifiedTime(join(path, entry))),
  );

  return Math.max(details.mtimeMs, ...childTimes);
}

function buildSbom() {
  const packages = packageLock.packages ?? {};
  const components = Object.entries(packages)
    .filter(([path]) => path.startsWith("node_modules/"))
    .map(([path, metadata]) => ({
      type: "library",
      name: basename(path),
      version: metadata.version ?? "unknown",
      purl: metadata.version ? `pkg:npm/${basename(path)}@${metadata.version}` : undefined,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    version: 1,
    metadata: {
      component: {
        type: "application",
        name: appName,
        version,
      },
    },
    components,
  };
}

function writeRuntimePackageJson() {
  const runtimePackageJson = JSON.parse(JSON.stringify(packageJson));

  if (runtimePackageJson.scripts && typeof runtimePackageJson.scripts === "object") {
    delete runtimePackageJson.scripts.prepare;
  }

  writeFileSync(
    join(stagingDir, "package.json"),
    `${JSON.stringify(runtimePackageJson, null, 2)}\n`,
  );
}

async function main() {
  if (!existsSync(join(root, ".next"))) {
    throw new Error("Missing .next build output. Run npm run build before packaging.");
  }

  await assertBuildOutputIsFresh();

  rmSync(stagingDir, { force: true, recursive: true });
  mkdirSync(stagingDir, { recursive: true });

  for (const relativePath of runtimePaths) {
    await copyIfExists(relativePath);
  }

  writeRuntimePackageJson();

  const commit = runGit(["rev-parse", "HEAD"]);
  const shortLog = runGit(["log", "-10", "--pretty=format:- %h %s"]);
  const createdAt = new Date().toISOString();
  const files = await listFiles(stagingDir);

  const manifest = {
    name: appName,
    version,
    createdAt,
    commit,
    node: packageJson.engines?.node,
    npm: packageJson.engines?.npm,
    files,
  };

  writeFileSync(join(stagingDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(stagingDir, "sbom.cdx.json"), `${JSON.stringify(buildSbom(), null, 2)}\n`);
  writeFileSync(
    join(stagingDir, "CHANGELOG.md"),
    `# ${artifactName}\n\n${shortLog || "- Initial release artifact."}\n`,
  );

  rmSync(packagePath, { force: true });
  execFileSync("tar", ["-czf", packagePath, "-C", artifactsDir, artifactName], {
    cwd: root,
    stdio: "inherit",
  });

  const checksum = sha256(packagePath);
  writeFileSync(checksumPath, `${checksum}  ${basename(packagePath)}\n`);
  console.log(`Created ${packagePath}`);
  console.log(`Created ${checksumPath}`);
}

await main();
