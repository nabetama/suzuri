import { join } from "@tauri-apps/api/path";
import { message, open } from "@tauri-apps/plugin-dialog";
import {
  exists,
  mkdir,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { useCallback, useState } from "react";
import type { TreeNode } from "../types/tree";
import { getMarkdownTree } from "../utils/getMarkdownTree";
import { getParentPath } from "../utils/pathUtils";

export function useMarkdownTree() {
  const [markdown, setMarkdown] = useState("");
  const [dirPath, setDirPath] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const handleOpenDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (typeof selected === "string") {
      setDirPath(selected);
      const mdTree = await getMarkdownTree(selected);
      setTree(mdTree);
      setCurrentFilePath(null);
      setMarkdown("");
    }
  };

  const handleFileClick = async (absPath: string) => {
    const content = await readTextFile(absPath);
    setMarkdown(content);
    setCurrentFilePath(absPath);
    setSaveStatus("");
  };

  const handleSave = useCallback(async () => {
    if (currentFilePath) {
      await writeTextFile(currentFilePath, markdown);
      setSaveStatus("保存しました");
      setTimeout(() => setSaveStatus(""), 1500);
      if (dirPath) {
        setTree(await getMarkdownTree(dirPath));
      }
    }
  }, [currentFilePath, markdown, dirPath]);

  const handleCreate = async (
    parentAbsPath: string,
    name: string,
    isDir: boolean,
  ) => {
    if (!dirPath) return;

    if (!name.endsWith(".md")) {
      await message("The file name must end with .md.");
      return;
    }

    const absPath = await join(parentAbsPath, name);

    if (await exists(absPath)) {
      await message("The same file or directory already exists.");
      return;
    }

    if (isDir) {
      await mkdir(absPath, { recursive: true }).catch((err) => {
        console.error("Failed to create directory.", err);
      });
    } else {
      await writeTextFile(absPath, "", {
        createNew: true,
      }).catch((err) => {
        console.error("Failed to create file.", err);
      });
    }
    const mdTree = await getMarkdownTree(dirPath);
    setTree(mdTree);
  };

  const handleRename = async (oldAbsPath: string, newName: string) => {
    if (!dirPath) return;

    if (!newName.endsWith(".md")) {
      await message("The file name must end with .md.");
      return;
    }

    const parent = getParentPath(oldAbsPath);
    const newAbsPath = await join(parent, newName);

    if (await exists(newAbsPath)) {
      await message("The same file or directory already exists.");
      return;
    }

    await rename(oldAbsPath, newAbsPath);
    const mdTree = await getMarkdownTree(dirPath);
    setTree(mdTree);
  };

  const handleDelete = async (absPath: string, isDir: boolean) => {
    if (!dirPath) return;
    await remove(absPath, { recursive: isDir });
    const mdTree = await getMarkdownTree(dirPath);
    setTree(mdTree);
  };

  return {
    markdown,
    setMarkdown,
    dirPath,
    tree,
    currentFilePath,
    saveStatus,
    handleOpenDirectory,
    handleFileClick,
    handleSave,
    handleCreate,
    handleRename,
    handleDelete,
  };
}
