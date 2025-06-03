import type React from "react";
import SplitPane from "react-split-pane";
import CommandOpenHint from "./components/CommandOpenHint";
import DirectoryTree from "./components/DirectoryTree";
import MarkdownEditor from "./components/MarkdownEditor";
import MarkdownPreview from "./components/MarkdownPreview";
import { useMarkdownTree } from "./hooks/useMarkdownTree";

const Editor: React.FC = () => {
  const {
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
  } = useMarkdownTree();

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
