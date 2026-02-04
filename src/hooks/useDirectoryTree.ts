import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useState } from "react";
import type { TreeNode } from "../types/tree";
import { getMarkdownTree } from "../utils/getMarkdownTree";
import { findNodeByPath } from "../utils/treeUtils";

export function useDirectoryTree() {
  const [dirPath, setDirPath] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);

  const refreshTree = useCallback(async () => {
    if (dirPath) {
      setTree(await getMarkdownTree(dirPath));
    }
  }, [dirPath]);

  const handleOpenDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (typeof selected === "string") {
      setDirPath(selected);
      const mdTree = await getMarkdownTree(selected);
      setTree(mdTree);
    }
  };

  // 指定ディレクトリのchildrenだけを非同期で取得してtreeにセットする
  const updateDirChildren = async (targetDirPath: string) => {
    if (!tree) return;
    const dirNode = findNodeByPath(tree, targetDirPath);
    if (dirNode?.isDir) {
      const newNode = await getMarkdownTree(targetDirPath);
      dirNode.children = newNode.children;
      setTree({ ...tree });
    }
  };

  return {
    dirPath,
    tree,
    handleOpenDirectory,
    updateDirChildren,
    refreshTree,
  };
}
