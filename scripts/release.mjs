#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const version = process.argv[2];

if (!version) {
  console.error("Usage: node scripts/release.mjs <version>");
  console.error("Example: pnpm release 0.3.0");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid version format: ${version}`);
  console.error("Expected format: X.Y.Z (e.g., 0.3.0)");
  process.exit(1);
}

const files = [
  {
    path: "package.json",
    update: (content) => content.replace(/"version":\s*"[^"]+"/, `"version": "${version}"`),
  },
  {
    path: "src-tauri/tauri.conf.json",
    update: (content) => content.replace(/"version":\s*"[^"]+"/, `"version": "${version}"`),
  },
  {
    path: "src-tauri/Cargo.toml",
    update: (content) => content.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`),
  },
];

console.log(`Updating version to ${version}...`);

for (const file of files) {
  const content = readFileSync(file.path, "utf-8");
  const updated = file.update(content);
  writeFileSync(file.path, updated);
  console.log(`  Updated ${file.path}`);
}

console.log("\nCreating commit and tag...");
execSync(`git add ${files.map((f) => f.path).join(" ")}`, { stdio: "inherit" });
execSync(`git commit -m "Bump version to v${version}"`, { stdio: "inherit" });
execSync(`git tag v${version}`, { stdio: "inherit" });

console.log(`\nDone! Created tag v${version}`);
console.log("\nTo push the release:");
console.log(`  git push origin main --tags`);
