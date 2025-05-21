import React from 'react';

type TreeNode = {
  name: string;
  path?: string;
  children?: TreeNode[];
};

type DirectoryTreeProps = {
  nodes: TreeNode[];
  onFileClick: (path: string) => void;
  onOpenDirectory: () => void;
  currentDirPath?: string | null;
};

const DirectoryTree: React.FC<DirectoryTreeProps> = ({ nodes, onFileClick, onOpenDirectory, currentDirPath }) => {
  const renderTree = (nodes: TreeNode[]) => {
    if (!nodes || nodes.length === 0) return <div style={{ color: '#aaa' }}>ファイルがありません</div>;
    return (
      <ul style={{ listStyle: 'none', paddingLeft: 16 }}>
        {nodes.map((node, idx) => (
          <li key={idx}>
            {node.path ? (
              <span
                style={{ cursor: 'pointer', color: '#007acc' }}
                onClick={() => onFileClick(node.path!)}
              >
                {node.name}
              </span>
            ) : (
              node.name
            )}
            {node.children && renderTree(node.children)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ width: 240, background: '#f4f4f4', borderRight: '1px solid #ddd', padding: '1rem', overflowY: 'auto' }}>
      <button onClick={onOpenDirectory} style={{ width: '100%', marginBottom: 12 }}>
        ディレクトリを開く
      </button>
      {currentDirPath && (
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 8 }}>{currentDirPath}</div>
      )}
      <h3 style={{ marginTop: 0 }}>ファイル</h3>
      {renderTree(nodes)}
    </div>
  );
};

export type { TreeNode };
export default DirectoryTree; 