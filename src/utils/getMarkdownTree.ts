import { basename, join } from "@tauri-apps/api/path";
import { BaseDirectory, readDir } from "@tauri-apps/plugin-fs";
import type { TreeNode } from "../types/tree";

export async function getMarkdownTree(rootPath: string): Promise<TreeNode> {
  const entries = await readDir(rootPath, {
    baseDir: BaseDirectory.AppLocalData,
  });
  const children: TreeNode[] = [];

  for (const entry of entries) {
    const entryPath = await join(rootPath, entry.name);
    if (entry.isDirectory) {
      children.push(await getMarkdownTree(entryPath));
    } else {
      children.push({
        name: entry.name,
        path: entryPath,
      });
    }
  }

  return {
    name: await basename(rootPath),
    path: rootPath,
    children,
  };
}
