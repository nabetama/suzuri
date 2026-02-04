import type { TreeNode } from "../types/tree";

export const sortTreeNodes = (nodes: TreeNode[]) => {
  return [...nodes].sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return (a.name || "").localeCompare(b.name || "", "ja", {
      numeric: true,
      sensitivity: "base",
    });
  });
};
