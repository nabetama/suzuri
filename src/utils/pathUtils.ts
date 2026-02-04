import type { TreeNode } from "../types/tree";

/**
 * 親ディレクトリの絶対パスを取得
 */
export function getParentPath(absPath: string): string {
  return absPath.split("/").slice(0, -1).join("/");
}

/**
 * パスからファイル名を取得
 */
export function getFileName(path: string): string {
  return path.split("/").pop() || "";
}

/**
 * ノードのフルパスを取得
 */
export function getNodeFullPath(
  node: TreeNode,
  currentDirPath?: string | null,
): string {
  return (
    node.path || (currentDirPath ? `${currentDirPath}/${node.name}` : node.name)
  );
}
