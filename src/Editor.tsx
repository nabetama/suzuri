import type React from "react";
import SplitPane from "react-split-pane";
import CommandOpenHint from "./components/CommandOpenHint";
import DirectoryTree from "./components/DirectoryTree";
import WysiwygEditor from "./components/WysiwygEditor";
import { useDirectoryTree } from "./hooks/useDirectoryTree";
import { useFileOperations } from "./hooks/useFileOperations";
import { useMarkdownContent } from "./hooks/useMarkdownContent";

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

  const onOpenDirectory = async () => {
    await handleOpenDirectory();
    resetContent();
  };

  if (!dirPath) {
    return <CommandOpenHint handleOpenDirectory={onOpenDirectory} />;
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
        onOpenDirectory={onOpenDirectory}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
        updateDirChildren={updateDirChildren}
      />
      <WysiwygEditor
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
