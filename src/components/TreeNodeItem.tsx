import React from "react";
import { TreeNode } from "../types/tree";
import { sortTreeNodes } from "../utils/sortTreeNodes";
import {
  fileSpanStyle,
  inputStyle,
  rowBaseStyle,
  rowHoverStyle,
} from "./DirectoryTree.styles";

type DirOrFile = "dir" | "file";

type TreeNodeItemProps = {
  node: TreeNode;
  parentPath: string;
  currentDirPath?: string | null;
  openDirs: Record<string, boolean>;
  hovered: string | null;
  editingNode: {
    type: 'new' | 'rename';
    parentPath?: string;
    targetPath?: string;
    isDir: boolean;
  } | null;
  inputValue: string;
  setHovered: (path: string | null) => void;
  toggleDir: (path: string) => void;
  handleContextMenu: (e: React.MouseEvent, type: DirOrFile, path: string) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputCancel: () => void;
  setInputValue: (v: string) => void;
  onFileClick: (path: string) => void;
};

const getRelativePath = (currentDirPath: string | null, fullPath: string) => {
  if (!currentDirPath) return fullPath;
  return fullPath.startsWith(currentDirPath)
    ? fullPath.slice(currentDirPath.length) || '/'
    : fullPath;
};

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  parentPath,
  currentDirPath,
  openDirs,
  hovered,
  editingNode,
  inputValue,
  setHovered,
  toggleDir,
  handleContextMenu,
  handleInputKeyDown,
  handleInputCancel,
  setInputValue,
  onFileClick,
}) => {
  const fullPath = node.path || `${parentPath}/${node.name}`;
  const relPath = getRelativePath(currentDirPath || null, fullPath);

  if (node.children) {
    const isOpen = openDirs[fullPath] ?? false;
    return (
      <li key={fullPath} style={{ userSelect: "none" }}>
        <span
          style={
            hovered === fullPath
              ? { ...rowBaseStyle, ...rowHoverStyle }
              : rowBaseStyle
          }
          onClick={() => toggleDir(fullPath)}
          onMouseEnter={() => setHovered(fullPath)}
          onMouseLeave={() => setHovered(null)}
          onContextMenu={(e) => handleContextMenu(e, "dir", relPath)}
        >
          <span style={{ width: 16, display: "inline-block", textAlign: "center" }}>
            {isOpen ? "▼" : "▶"}
          </span>
          {node.name}
        </span>
        {isOpen && (
          <ul style={{ listStyle: "none", paddingLeft: 12, margin: 0 }}>
            {sortTreeNodes(node.children).map(child => (
              <TreeNodeItem
                key={child.path || `${fullPath}/${child.name}`}
                node={child}
                parentPath={fullPath}
                currentDirPath={currentDirPath}
                openDirs={openDirs}
                hovered={hovered}
                editingNode={editingNode}
                inputValue={inputValue}
                setHovered={setHovered}
                toggleDir={toggleDir}
                handleContextMenu={handleContextMenu}
                handleInputKeyDown={handleInputKeyDown}
                handleInputCancel={handleInputCancel}
                setInputValue={setInputValue}
                onFileClick={onFileClick}
              />
            ))}
            {editingNode && editingNode.type === 'new' && editingNode.parentPath === relPath && (
              <li key={`new-input-${relPath}`}>
                <input
                  autoFocus
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onBlur={handleInputCancel}
                  style={inputStyle}
                  placeholder={editingNode.isDir ? "新しいフォルダ名" : "新しいファイル名"}
                />
              </li>
            )}
            {editingNode && editingNode.type === 'rename' && editingNode.targetPath === relPath && (
              <li key={`rename-input-${relPath}`}>
                <input
                  autoFocus
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onBlur={handleInputCancel}
                  style={inputStyle}
                />
              </li>
            )}
          </ul>
        )}
      </li>
    );
  } else {
    return (
      <li key={fullPath}>
        {editingNode && editingNode.type === 'rename' && editingNode.targetPath === relPath ? (
          <input
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputCancel}
            style={inputStyle}
          />
        ) : (
          <span
            style={
              hovered === fullPath
                ? { ...rowBaseStyle, ...rowHoverStyle, ...fileSpanStyle }
                : { ...rowBaseStyle, ...fileSpanStyle }
            }
            onClick={() => onFileClick(relPath)}
            onMouseEnter={() => setHovered(fullPath)}
            onMouseLeave={() => setHovered(null)}
            onContextMenu={(e) => handleContextMenu(e, "file", relPath)}
          >
            {node.name}
          </span>
        )}
      </li>
    );
  }
};

export default TreeNodeItem; 