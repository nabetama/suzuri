import type { TreeNode } from "../types/tree";

export function useNodeFullPath(
  node: TreeNode,
  currentDirPath?: string | null,
) {
  return (
    node.path || (currentDirPath ? `${currentDirPath}/${node.name}` : node.name)
  );
}
