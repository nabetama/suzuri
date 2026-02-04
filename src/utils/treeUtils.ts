import type { TreeNode } from "../types/tree";

export function findNodeByPath(
  node: TreeNode,
  path: string,
): TreeNode | null {
  if (node.path === path) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }
  return null;
}
