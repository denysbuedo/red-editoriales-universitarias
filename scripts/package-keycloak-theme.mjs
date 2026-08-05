import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const themeName = "reduniv";
const version = "0.1.0";
const sourceDir = join(root, "infrastructure", "keycloak", "themes", themeName);
const artifactsDir = join(root, "artifacts");
const packageName = `${themeName}-keycloak-theme-${version}`;
const packagePath = join(artifactsDir, `${packageName}.tar.gz`);
const checksumPath = `${packagePath}.sha256`;

if (!existsSync(sourceDir)) {
  throw new Error(`Missing Keycloak theme source: ${sourceDir}`);
}

mkdirSync(artifactsDir, { recursive: true });
rmSync(packagePath, { force: true });

execFileSync("tar", ["-czf", packagePath, "-C", join(sourceDir, ".."), themeName], {
  cwd: root,
  stdio: "inherit",
});

const checksum = createHash("sha256").update(readFileSync(packagePath)).digest("hex");
writeFileSync(checksumPath, `${checksum}  ${basename(packagePath)}\n`);

console.log(`Created ${packagePath}`);
console.log(`Created ${checksumPath}`);
