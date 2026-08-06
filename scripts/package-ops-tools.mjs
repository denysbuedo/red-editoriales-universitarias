import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { cp, readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const version = packageJson.version;
const artifactName = `pnpu-ops-tools-${version}`;
const artifactsDir = join(root, "artifacts");
const stagingDir = join(artifactsDir, artifactName);
const packagePath = join(artifactsDir, `${artifactName}.tar.gz`);
const checksumPath = `${packagePath}.sha256`;

const toolPaths = [
  "scripts/backup-operational-state.sh",
  "scripts/configure-keycloak-editorial-user.sh",
  "scripts/deploy-keycloak-theme.sh",
  "scripts/deploy-omeka-tools.sh",
  "scripts/deploy-portal-artifact.sh",
  "scripts/health-check.sh",
  "docs/backup-operational-runbook.md",
  "docs/hardening-v0.1.md",
  "docs/production-baseline-v0.1.md",
  "docs/keycloak-reduniv-theme.md",
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
    throw new Error(`Missing required ops tools path: ${relativePath}`);
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

function writeReadme() {
  const content = `# ${artifactName}

Herramientas operativas PNPU para VM de portal/catalogo y VM de identidad.

## Contenido

- backup operativo minimo;
- despliegue de artefacto PNPU;
- despliegue de herramientas Omeka;
- despliegue de theme Keycloak;
- configuracion de usuarios editoriales Keycloak;
- health-check local;
- documentacion operativa de apoyo.

## Uso rapido

\`\`\`bash
tar -xzf ${artifactName}.tar.gz
cd ${artifactName}
sudo scripts/backup-operational-state.sh
\`\`\`

Los backups contienen secretos. No subirlos al repositorio.
`;

  writeFileSync(join(stagingDir, "README.md"), content);
}

async function main() {
  rmSync(stagingDir, { force: true, recursive: true });
  mkdirSync(stagingDir, { recursive: true });

  for (const relativePath of toolPaths) {
    await copyRequired(relativePath);
  }

  writeReadme();

  const manifest = {
    name: artifactName,
    version,
    createdAt: new Date().toISOString(),
    commit: runGit(["rev-parse", "HEAD"]),
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
