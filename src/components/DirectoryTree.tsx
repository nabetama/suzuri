import React, { useState, useEffect } from 'react';
import {
  rootStyle,
  rowBaseStyle,
  rowHoverStyle,
  fileSpanStyle,
  menuItemStyle,
  menuItemHoverStyle
} from './DirectoryTree.styles';

type TreeNode = {
  name: string;
  path?: string;
  children?: TreeNode[];
};

export enum DirMenuAction {
  NewFile = 'new_file',
  NewFolder = 'new_folder',
  Rename = 'rename',
  Delete = 'delete',
}

const DIR_MENU_ITEMS = [
  { key: DirMenuAction.NewFile, label: '新しいファイル' },
  { key: DirMenuAction.NewFolder, label: '新しいフォルダ' },
  { key: DirMenuAction.Rename, label: '名前の変更' },
  { key: DirMenuAction.Delete, label: '削除' },
];

const FILE_MENU_ITEMS = [
  { key: DirMenuAction.Rename, label: '名前の変更' },
  { key: DirMenuAction.Delete, label: '削除' },
];

type DirectoryTreeProps = {
  nodes: TreeNode[];
  onFileClick: (path: string) => void;
  onOpenDirectory: () => void;
  currentDirPath?: string | null;
  onCreateFile: (dirPath: string) => Promise<void>;
};

const DirectoryTree: React.FC<DirectoryTreeProps> = ({ nodes, onFileClick, onOpenDirectory, currentDirPath, onCreateFile }) => {
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<
    | { x: number; y: number; type: 'dir' | 'file'; path: string }
    | null
  >(null);
  const [menuHoverIdx, setMenuHoverIdx] = useState<number | null>(null);

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

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const toggleDir = (path: string) => {
    setOpenDirs(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // calculate position of context menu.
  const handleContextMenu = (
    e: React.MouseEvent,
    type: 'dir' | 'file',
    path: string
  ) => {
    // remove selection
    window.getSelection()?.removeAllRanges();
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, path });
  };

  const handleMenuClick = async (action: DirMenuAction) => {
    if (action === DirMenuAction.NewFile && contextMenu) {
      await onCreateFile(contextMenu.path);
      setContextMenu(null);
    }
    // TODO: implement other actions
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
                onContextMenu={e => handleContextMenu(e, 'dir', fullPath)}
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
                onContextMenu={e => handleContextMenu(e, 'file', fullPath)}
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
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#232323',
            color: '#fff',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            minWidth: 160,
            padding: '4px 0',
            fontSize: '1rem',
          }}
        >
          {contextMenu.type === 'dir' ? (
            <>
              {DIR_MENU_ITEMS.map((item, idx) => (
                <div
                  key={item.key}
                  style={menuHoverIdx === idx ? { ...menuItemStyle, ...menuItemHoverStyle } : menuItemStyle}
                  onMouseEnter={() => setMenuHoverIdx(idx)}
                  onMouseLeave={() => setMenuHoverIdx(null)}
                  onClick={() => handleMenuClick(item.key)}
                >
                  {item.label}
                </div>
              ))}
            </>
          ) : (
            <>
              {FILE_MENU_ITEMS.map((item, idx) => (
                <div
                  key={item.key}
                  style={menuHoverIdx === idx ? { ...menuItemStyle, ...menuItemHoverStyle } : menuItemStyle}
                  onMouseEnter={() => setMenuHoverIdx(idx)}
                  onMouseLeave={() => setMenuHoverIdx(null)}
                  onClick={() => handleMenuClick(item.key)}
                >
                  {item.label}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export type { TreeNode };
export default DirectoryTree;