import React, { useState } from 'react';
import { marked } from 'marked';
import { open } from '@tauri-apps/plugin-dialog';

// 仮のディレクトリツリーデータ
const mockTree = [
  {
    name: 'docs',
    children: [
      { name: 'intro.md' },
      { name: 'usage.md' },
      {
        name: 'guide',
        children: [
          { name: 'install.md' },
          { name: 'config.md' },
        ],
      },
    ],
  },
  {
    name: 'README.md',
  },
];

// ツリー表示用の再帰コンポーネント
const Tree: React.FC<{ nodes: any[] }> = ({ nodes }) => (
  <ul style={{ listStyle: 'none', paddingLeft: 16 }}>
    {nodes.map((node, idx) => (
      <li key={idx}>
        {node.name}
        {node.children && <Tree nodes={node.children} />}
      </li>
    ))}
  </ul>
);

const Editor: React.FC = () => {
  const [markdown, setMarkdown] = useState('');
  const [dirPath, setDirPath] = useState<string | null>(null);

  const handleOpenDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (typeof selected === 'string') {
      setDirPath(selected);
    }
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
        <Tree nodes={mockTree} />
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
