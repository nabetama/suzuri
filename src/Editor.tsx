import React, { useState } from 'react';
import { marked } from 'marked';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, DirEntry, readTextFile } from '@tauri-apps/plugin-fs';

// ツリー表示用の再帰コンポーネント
const Tree: React.FC<{ nodes: any[], onFileClick: (path: string) => void }> = ({ nodes, onFileClick }) => {
  if (!nodes || nodes.length === 0) return <div style={{ color: '#aaa' }}>ファイルがありません</div>;
  return (
    <ul style={{ listStyle: 'none', paddingLeft: 16 }}>
      {nodes.map((node, idx) => (
        <li key={idx}>
          {node.path ? (
            <span
              style={{ cursor: 'pointer', color: '#007acc' }}
              onClick={() => onFileClick(node.path)}
            >
              {node.name}
            </span>
          ) : (
            node.name
          )}
          {node.children && <Tree nodes={node.children} onFileClick={onFileClick} />}
        </li>
      ))}
    </ul>
  );
};

// .mdファイルのみを再帰的に取得しツリー構造に変換する関数
async function getMarkdownTree(parentPath: string): Promise<any[]> {
  const entries = await readDir(parentPath);
  const result = await Promise.all(entries.map(async (entry: DirEntry) => {
    const fullPath = `${parentPath}/${entry.name}`;
    if (entry.isDirectory) {
      // ディレクトリの場合、再帰的に探索
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
  return result.filter(Boolean);
}

const Editor: React.FC = () => {
  const [markdown, setMarkdown] = useState('');
  const [dirPath, setDirPath] = useState<string | null>(null);
  const [tree, setTree] = useState<any[]>([]);

  const handleOpenDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (typeof selected === 'string') {
      setDirPath(selected);
      const mdTree = await getMarkdownTree(selected);
      setTree(mdTree);
    }
  };

  const handleFileClick = async (path: string) => {
    const content = await readTextFile(path);
    setMarkdown(content);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* ディレクトリツリー */}
      <div style={{ width: 240, background: '#f4f4f4', borderRight: '1px solid #ddd', padding: '1rem', overflowY: 'auto' }}>
        <button onClick={handleOpenDirectory} style={{ width: '100%', marginBottom: 12 }}>
          ディレクトリを開く
        </button>
        {dirPath && (
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 8 }}>
            {dirPath}
          </div>
        )}
        <h3 style={{ marginTop: 0 }}>ファイル</h3>
        <Tree nodes={tree} onFileClick={handleFileClick} />
      </div>
      {/* エディタページ */}
      <div style={{ flex: 1, display: 'flex' }}>
        <textarea
          style={{ flex: 1, fontSize: '1rem', padding: '1rem', border: 'none', borderRight: '1px solid #eee', outline: 'none' }}
          value={markdown}
          onChange={e => setMarkdown(e.target.value)}
          placeholder="ここにMarkdownを入力してください"
        />
        <div
          style={{ flex: 1, padding: '1rem', background: '#f9f9f9', overflowY: 'auto' }}
          dangerouslySetInnerHTML={{ __html: marked(markdown) }}
        />
      </div>
    </div>
  );
};

export default Editor;
