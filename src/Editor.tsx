import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SplitPane from "react-split-pane";
import CommandOpenHint from "./components/CommandOpenHint";
import type { DirectoryTreeHandle } from "./components/DirectoryTree";
import DirectoryTree from "./components/DirectoryTree";
import type { WysiwygEditorHandle } from "./components/WysiwygEditor";
import WysiwygEditor from "./components/WysiwygEditor";
import { useDirectoryTree } from "./hooks/useDirectoryTree";
import { useFileOperations } from "./hooks/useFileOperations";
import { useMarkdownContent } from "./hooks/useMarkdownContent";

const HIDDEN: React.CSSProperties = { display: "none" };
const VISIBLE: React.CSSProperties = {};

const Editor: React.FC = () => {
  const { dirPath, tree, handleOpenDirectory, updateDirChildren, refreshTree } =
    useDirectoryTree();
  const {
    markdown,
    setMarkdown,
    currentFilePath,
    saveStatus,
    handleFileClick,
    handleSave,
    resetContent,
  } = useMarkdownContent(refreshTree);
  const { handleCreate, handleRename, handleDelete } = useFileOperations(
    dirPath,
    refreshTree,
  );
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const treeRef = useRef<DirectoryTreeHandle>(null);
  const editorRef = useRef<WysiwygEditorHandle>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => {
      const next = !prev;

      requestAnimationFrame(() => {
        if (next) {
          treeRef.current?.focus();
        } else {
          editorRef.current?.focus();
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const onOpenDirectory = async () => {
    await handleOpenDirectory();
    resetContent();
  };

  const pane1Style = useMemo(
    () => (sidebarVisible ? VISIBLE : HIDDEN),
    [sidebarVisible],
  );
  const resizerStyle = useMemo(
    () => (sidebarVisible ? VISIBLE : HIDDEN),
    [sidebarVisible],
  );

  if (!dirPath) {
    return <CommandOpenHint handleOpenDirectory={onOpenDirectory} />;
  }

  return (
    <SplitPane
      split="vertical"
      minSize={sidebarVisible ? 100 : 0}
      defaultSize="20%"
      pane1Style={pane1Style}
      resizerStyle={resizerStyle}
      className="h-screen"
    >
      <DirectoryTree
        ref={treeRef}
        rootNode={tree}
        onFileClick={handleFileClick}
        onOpenDirectory={onOpenDirectory}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
        updateDirChildren={updateDirChildren}
      />
      <WysiwygEditor
        ref={editorRef}
        value={markdown}
        onChange={setMarkdown}
        onSave={handleSave}
        filePath={currentFilePath}
        saveStatus={saveStatus}
      />
    </SplitPane>
  );
};

export default Editor;
