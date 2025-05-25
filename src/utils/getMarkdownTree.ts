import { DirEntry, readDir } from "@tauri-apps/plugin-fs";
import { TreeNode } from "../types/tree";

async function getMarkdownTree(parentPath: string): Promise<TreeNode[]> {
	const entries = await readDir(parentPath);
	const result = await Promise.all(
		entries.map(async (entry: DirEntry) => {
			const fullPath = `${parentPath}/${entry.name}`;
			if (entry.isDirectory) {
				const children = await getMarkdownTree(fullPath);
				if (children.length > 0) {
					return { name: entry.name, children };
				} else {
					return null;
				}
			} else if (entry.name.endsWith(".md")) {
				return { name: entry.name, path: fullPath };
			} else {
				return null;
			}
		}),
	);
	return result.filter(Boolean) as TreeNode[];
}

export default getMarkdownTree;
