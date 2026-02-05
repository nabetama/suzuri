#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const getCurrentVersion = () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  return pkg.version;
};

const validateVersion = (version) => /^\d+\.\d+\.\d+$/.test(version);

const updateFiles = (version) => {
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

  for (const file of files) {
    const content = readFileSync(file.path, "utf-8");
    const updated = file.update(content);
    writeFileSync(file.path, updated);
    console.log(`  Updated ${file.path}`);
  }

  return files.map((f) => f.path);
};

const main = async () => {
  const currentVersion = getCurrentVersion();
  console.log(`Current version: ${currentVersion}\n`);

  const version = await question("New version: ");

  if (!version.trim()) {
    console.log("Cancelled.");
    rl.close();
    return;
  }

  if (!validateVersion(version)) {
    console.error(`Invalid version format: ${version}`);
    console.error("Expected format: X.Y.Z (e.g., 0.3.0)");
    rl.close();
    process.exit(1);
  }

  console.log(`\nThis will:`);
  console.log(`  - Update version to ${version}`);
  console.log(`  - Create commit "Bump version to v${version}"`);
  console.log(`  - Create tag v${version}\n`);

  const confirm = await question("Release? [y/N]: ");

  if (confirm.toLowerCase() !== "y") {
    console.log("Cancelled.");
    rl.close();
    return;
  }

  console.log("\nUpdating files...");
  const files = updateFiles(version);

  console.log("\nCreating commit and tag...");
  execSync(`git add ${files.join(" ")}`, { stdio: "inherit" });
  execSync(`git commit -m "Bump version to v${version}"`, { stdio: "inherit" });
  execSync(`git tag v${version}`, { stdio: "inherit" });

  console.log(`\nDone! Created tag v${version}`);
  console.log("\nTo push the release:");
  console.log(`  git push origin main --tags`);

  rl.close();
};

main();
