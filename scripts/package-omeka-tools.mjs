import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { cp, readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const version = packageJson.version;
const artifactName = `pnpu-omeka-tools-${version}`;
const artifactsDir = join(root, "artifacts");
const stagingDir = join(artifactsDir, artifactName);
const packagePath = join(artifactsDir, `${artifactName}.tar.gz`);
const checksumPath = `${packagePath}.sha256`;

const toolPaths = [
  "scripts/check-omeka.mjs",
  "scripts/cleanup-omeka-sample.mjs",
  "scripts/deploy-omeka-tools.sh",
  "scripts/install-omeka-profile.mjs",
  "scripts/map-omeka-catalog.mjs",
  "scripts/seed-omeka-sample.mjs",
  "schemas/omeka",
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

async function copyRequired(relativePath) {
  const source = join(root, relativePath);

  if (!existsSync(source)) {
    throw new Error(`Missing required Omeka tools path: ${relativePath}`);
  }

  await cp(source, join(stagingDir, relativePath), { recursive: true });
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

function writeToolsPackageJson() {
  const toolsPackageJson = {
    name: artifactName,
    version,
    private: true,
    description: "Herramientas operativas PNPU para preparar Omeka S.",
    type: "module",
    scripts: {
      "omeka:check": "node scripts/check-omeka.mjs",
      "omeka:cleanup-sample": "node scripts/cleanup-omeka-sample.mjs",
      "omeka:install-profile": "node scripts/install-omeka-profile.mjs",
      "omeka:map": "node scripts/map-omeka-catalog.mjs",
      "omeka:seed-sample": "node scripts/seed-omeka-sample.mjs",
    },
    engines: packageJson.engines,
  };

  writeFileSync(join(stagingDir, "package.json"), `${JSON.stringify(toolsPackageJson, null, 2)}\n`);
}

async function main() {
  rmSync(stagingDir, { force: true, recursive: true });
  mkdirSync(stagingDir, { recursive: true });

  for (const relativePath of toolPaths) {
    await copyRequired(relativePath);
  }

  writeToolsPackageJson();

  const manifest = {
    name: artifactName,
    version,
    createdAt: new Date().toISOString(),
    commit: runGit(["rev-parse", "HEAD"]),
    node: packageJson.engines?.node,
    npm: packageJson.engines?.npm,
    files: await listFiles(stagingDir),
  };

  writeFileSync(join(stagingDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

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
