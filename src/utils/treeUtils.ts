import type { TreeNode } from "../types/tree";
import { sortTreeNodes } from "./sortTreeNodes";

export function findNodeByPath(node: TreeNode, path: string): TreeNode | null {
  if (node.path === path) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }
  return null;
}

export function mergeTree(
  oldNode: TreeNode | null,
  newNode: TreeNode,
): TreeNode {
  if (!oldNode || !newNode.isDir || !newNode.children) return newNode;

  const oldChildrenByPath = new Map<string, TreeNode>();
  if (oldNode.children) {
    for (const child of oldNode.children) {
      if (child.path) oldChildrenByPath.set(child.path, child);
    }
  }

  const mergedChildren = newNode.children.map((newChild) => {
    if (!newChild.isDir || !newChild.path) return newChild;
    const oldChild = oldChildrenByPath.get(newChild.path);
    if (!oldChild?.children) return newChild;

    return mergeTree(oldChild, { ...newChild, children: oldChild.children });
  });

  return { ...newNode, children: mergedChildren };
}

export type FlatNode = {
  path: string;
  isDir: boolean;
  parentPath: string | null;
};

export function flattenVisibleNodes(
  node: TreeNode,
  openDirs: Record<string, boolean>,
  parentPath: string | null = null,
): FlatNode[] {
  const result: FlatNode[] = [
    { path: node.path, isDir: node.isDir, parentPath },
  ];
  if (node.isDir && openDirs[node.path] && node.children) {
    for (const child of sortTreeNodes(node.children)) {
      result.push(...flattenVisibleNodes(child, openDirs, node.path));
    }
  }
  return result;
}
