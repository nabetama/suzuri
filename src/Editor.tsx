import React, { useState, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, DirEntry, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import DirectoryTree, { TreeNode } from './components/DirectoryTree';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownPreview from './components/MarkdownPreview';
import SplitPane from 'react-split-pane';
import './Editor.css';

async function getMarkdownTree(parentPath: string): Promise<TreeNode[]> {
  const entries = await readDir(parentPath);
  const result = await Promise.all(entries.map(async (entry: DirEntry) => {
    const fullPath = `${parentPath}/${entry.name}`;
    if (entry.isDirectory) {
      const children = await getMarkdownTree(fullPath);
      if (children.length > 0) {
        return { name: entry.name, children };
      } else {
        return null;
      }
    } else if (entry.name.endsWith('.md')) {
      return { name: entry.name, path: fullPath };
    } else {
      return null;
    }
  }));
  return result.filter(Boolean) as TreeNode[];
}

const Editor: React.FC = () => {
  const [markdown, setMarkdown] = useState('');
  const [dirPath, setDirPath] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const handleOpenDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (typeof selected === 'string') {
      setDirPath(selected);
      const mdTree = await getMarkdownTree(selected);
      setTree(mdTree);
      setCurrentFilePath(null);
      setMarkdown('');
    }
  };

  const handleFileClick = async (path: string) => {
    const content = await readTextFile(path);
    setMarkdown(content);
    setCurrentFilePath(path);
    setSaveStatus('');
  };

  const handleSave = useCallback(async () => {
    if (currentFilePath) {
      await writeTextFile(currentFilePath, markdown);
      setSaveStatus('保存しました');
      setTimeout(() => setSaveStatus(''), 1500);
    }
  }, [currentFilePath, markdown]);

  return (
    <SplitPane split="vertical" minSize={100} defaultSize="20%">
      <DirectoryTree
        nodes={tree}
        onFileClick={handleFileClick}
        onOpenDirectory={handleOpenDirectory}
        currentDirPath={dirPath}
      />
      <SplitPane split="vertical" minSize={100} defaultSize="50%">
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
