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
import type React from "react";
import { useCallback, useState } from "react";
import SplitPane from "react-split-pane";
import CommandOpenHint from "./components/CommandOpenHint";
import DirectoryTree from "./components/DirectoryTree";
import MarkdownEditor from "./components/MarkdownEditor";
import MarkdownPreview from "./components/MarkdownPreview";
import type { TreeNode } from "./types/tree";
import { getMarkdownTree } from "./utils/getMarkdownTree";
import { getParentPath } from "./utils/pathUtils";

const Editor: React.FC = () => {
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
    }
  }, [currentFilePath, markdown]);

  const handleCreate = async (
    parentAbsPath: string,
    name: string,
    isDir: boolean,
  ) => {
    if (!dirPath) return;
    const absPath = await join(parentAbsPath, name);

    if (await exists(absPath)) {
      message("The same file or directory already exists.");
      return;
    }

    if (isDir) {
      await mkdir(absPath, { recursive: true }).catch((err) => {
        message("Failed to create directory.", err);
      });
    } else {
      await writeTextFile(absPath, "", {
        createNew: true,
      }).catch((err) => {
        message("Failed to create file.", err);
      });
    }
    const mdTree = await getMarkdownTree(dirPath);
    setTree(mdTree);
  };

  const handleRename = async (oldAbsPath: string, newName: string) => {
    if (!dirPath) return;

    if (await exists(newName)) {
      message("The same file or directory already exists.");
      return;
    }

    const parent = getParentPath(oldAbsPath);
    const newAbsPath = await join(parent, newName);

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

  if (!dirPath) {
    return <CommandOpenHint handleOpenDirectory={handleOpenDirectory} />;
  }
  return (
    <SplitPane
      split="vertical"
      minSize={100}
      defaultSize="20%"
      className="h-screen"
    >
      <DirectoryTree
        rootNode={tree}
        onFileClick={handleFileClick}
        onOpenDirectory={handleOpenDirectory}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      <SplitPane
        split="vertical"
        minSize={100}
        defaultSize="50%"
        className="h-screen"
      >
        <MarkdownEditor
          value={markdown}
          onChange={setMarkdown}
          onSave={handleSave}
          filePath={currentFilePath}
          saveStatus={saveStatus}
        />
        <MarkdownPreview markdown={markdown} />
      </SplitPane>
    </SplitPane>
  );
};

export default Editor;
