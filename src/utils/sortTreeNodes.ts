import { TreeNode } from "../types/tree";

export function sortTreeNodes(nodes: TreeNode[]): TreeNode[] {
	return [...nodes].sort((a, b) => {
		const aIsDir = !!a.children;
		const bIsDir = !!b.children;
		if (aIsDir && !bIsDir) return -1;
		if (!aIsDir && bIsDir) return 1;
		return (a.name || "").localeCompare(b.name || "", "ja", {
			numeric: true,
			sensitivity: "base",
		});
	});
}
