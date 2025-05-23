import React, { useState, useEffect } from 'react';

const rootStyle: React.CSSProperties = {
  background: '#2c2c2c',
  color: '#727272',
  width: '100%',
  minWidth: 0,
  borderRight: '1px solid #ddd',
  padding: '0.5rem 0.5rem 0 0.5rem',
  overflowY: 'auto',
  height: '100%'
};

const rowBaseStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  color: '#727272',
  userSelect: 'none',
  transition: 'color 0.2s, background 0.2s',
  fontSize: '1.1rem',
  lineHeight: 1.8,
  padding: '2px 4px 2px 0.5rem',
  borderRadius: 4,
  cursor: 'pointer',
};
const rowHoverStyle: React.CSSProperties = {
  background: '#353535',
  color: '#fff',
};
const fileSpanStyle: React.CSSProperties = {
  paddingLeft: 20,
};

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
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({});
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        onOpenDirectory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenDirectory]);

  const toggleDir = (path: string) => {
    setOpenDirs(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTree = (nodes: TreeNode[], parentPath = '') => (
    <ul style={{ listStyle: 'none', paddingLeft: 12, margin: 0 }}>
      {nodes.map((node, idx) => {
        const fullPath = node.path || `${parentPath}/${node.name}`;
        if (node.children) {
          const isOpen = openDirs[fullPath] ?? false;
          return (
            <li key={fullPath} style={{ userSelect: 'none' }}>
              <span
                style={hovered === fullPath ? { ...rowBaseStyle, ...rowHoverStyle } : rowBaseStyle}
                onClick={() => toggleDir(fullPath)}
                onMouseEnter={() => setHovered(fullPath)}
                onMouseLeave={() => setHovered(null)}
              >
                <span style={{ width: 16, display: 'inline-block', textAlign: 'center' }}>
                  {isOpen ? '▼' : '▶'}
                </span>
                {node.name}
              </span>
              {isOpen && renderTree(node.children, fullPath)}
            </li>
          );
        } else {
          return (
            <li key={fullPath}>
              <span
                style={hovered === fullPath ? { ...rowBaseStyle, ...rowHoverStyle, ...fileSpanStyle } : { ...rowBaseStyle, ...fileSpanStyle }}
                onClick={() => onFileClick(fullPath)}
                onMouseEnter={() => setHovered(fullPath)}
                onMouseLeave={() => setHovered(null)}
              >
                {node.name}
              </span>
            </li>
          );
        }
      })}
    </ul>
  );

  return (
    <div style={rootStyle}>
      {currentDirPath && (
        <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: 8, padding: '0.5rem 0.2rem' }}>
          {currentDirPath.split('/').pop()}
        </div>
      )}
      {renderTree(nodes)}
    </div>
  );
};

export type { TreeNode };
export default DirectoryTree;