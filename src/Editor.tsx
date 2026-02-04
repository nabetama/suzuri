import type React from "react";
import SplitPane from "react-split-pane";
import CommandOpenHint from "./components/CommandOpenHint";
import DirectoryTree from "./components/DirectoryTree";
import MarkdownEditor from "./components/MarkdownEditor";
import MarkdownPreview from "./components/MarkdownPreview";
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
