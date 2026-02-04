import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useRef, useState } from "react";
import type { TreeNode } from "../types/tree";
import { getMarkdownTree } from "../utils/getMarkdownTree";
import { findNodeByPath, mergeTree } from "../utils/treeUtils";

export function useDirectoryTree() {
  const [dirPath, setDirPath] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const treeRef = useRef<TreeNode | null>(null);

  const refreshTree = useCallback(async () => {
    if (dirPath) {
      const newTree = await getMarkdownTree(dirPath);
      const merged = mergeTree(treeRef.current, newTree);
      treeRef.current = merged;
      setTree(merged);
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
      treeRef.current = mdTree;
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
      const updated = { ...tree };
      treeRef.current = updated;
      setTree(updated);
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
